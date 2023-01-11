import { EthCore } from './eth-core';
import { DIDDocumentEV } from './did-document-ev';
import { IdentityManager } from './identity-manager';
import { VerificationRegistry } from './verification-registry';
import { NotAccreditedError } from './erros';
import { ProofType } from './proof-type';
import { Utils } from './utils';

export class ProofTypeAttestationIntermediateStatus implements ProofType {

    validDays = 30;
    proofType = 'EthereumAttestationRegistryIntermediateStatus2021';
    private ethereum: EthCore;
    private verificationRegistry: VerificationRegistry;
    private identityManager: IdentityManager;
    static PROOF_TYPE: string = 'EthereumAttestationRegistryIntermediateStatus2021';

    /**
     * @constructor
     * @param ethCore EthCore instance for ethereum communication
     * @param options Options to configure the contracts used to validate the proof type
     * @param options.identityManager Contract instance or address of the identity manager
     * @param options.verificationRegistry Contract instance or address of the verification registry
     * @param options.validDays Number of days of validity that the credited data will be
     */
    constructor(ethCore: EthCore, options: { identityManager: IdentityManager | string, verificationRegistry: VerificationRegistry | string, validDays?: number }) {
        const { identityManager, verificationRegistry, validDays } = options || {};
        this.ethereum = ethCore;
        this.verificationRegistry = verificationRegistry instanceof VerificationRegistry ? verificationRegistry : new VerificationRegistry(this.ethereum, verificationRegistry);
        this.identityManager = identityManager instanceof IdentityManager ? identityManager : new IdentityManager(this.ethereum, identityManager);
        if (validDays !== undefined && validDays !== null) this.validDays = validDays;
    }

    /**
     * @description Generate a valid proof for the verifiable object
     * @param verifiableObject Credential or presentation to generate its proof
     * @param issuer Did of who accredits the information
     * @param validDays Number of days of validity that the credited data will be. 0 means never expires
     */
    async generateProof(verifiableObject: { [key: string]: any }, validDays = this.validDays): Promise<any> {
        const networkId = await this.ethereum.getNetworkId();
        const proof = {
            contractAddress: this.verificationRegistry.contractAddress,
            networkId,
            type: this.proofType
        };
        let verifiableObjectCopy = JSON.parse(JSON.stringify(verifiableObject));
        verifiableObjectCopy['proof'] = proof;
        verifiableObjectCopy = JSON.parse(JSON.stringify(verifiableObjectCopy));
        const intermediateStatus = {
            'hash': Utils.calculateHash(verifiableObjectCopy),
            'status': Status.valid
        };
        const transactionData = this.verificationRegistry.getAccreditMethod(intermediateStatus, validDays).encodeABI();
        const issuerDidEv = new DIDDocumentEV(verifiableObject?.issuer || verifiableObject?.holder);
        const isAccredited = await this.identityManager.forwardTo(issuerDidEv.getAddress(), this.verificationRegistry.contractAddress, transactionData, 0);
        if (!isAccredited.status) throw new NotAccreditedError('the information could not be accredited');
        return verifiableObjectCopy;
    }

    verifyProof(): Promise<any> {
        throw new Error('Method not implemented.');
    }
}

export enum Status {
    valid = 'Valid',
    revoked = 'Revoked'
}