
import { DIDDocumentEV } from './did-document-ev';
import { IssuerOrHolderRequiredError, NotAccreditedError, UnsupportedProofTypeError } from './erros';
import { EthCore } from './eth-core';
import { IdentityManager } from './identity-manager';
import ProofStrategy from './proof-strategy';
import { ProofType } from './proof-type';
import { VerificationRegistry } from './verification-registry';

export class ProofTypeSmartContract implements ProofType {

    validDays = 30;
    proofType = 'SmartContract';
    private ethereum: EthCore;
    private verificationRegistry: VerificationRegistry;
    private identityManager: IdentityManager;
    static PROOF_TYPE: string = 'SmartContract';

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
        const serializedVerifiableObj = JSON.stringify(verifiableObjectCopy);
        const transactionData = this.verificationRegistry.getAccreditMethod(serializedVerifiableObj, validDays).encodeABI();
        const issuerDidEv = new DIDDocumentEV(verifiableObject?.issuer || verifiableObject?.holder);
        const isAccredited = await this.identityManager.forwardTo(issuerDidEv.getAddress(), this.verificationRegistry.contractAddress, transactionData, 0);
        if (!isAccredited.status) throw new NotAccreditedError('the information could not be accredited');
        return serializedVerifiableObj;
    }
    
    async verifyProof(verifiableObject: { [key: string]: any; }): Promise<boolean> {
        const proof = (new ProofStrategy(verifiableObject?.proof)).getProofType();
        if (proof?.type !== this.proofType) throw new UnsupportedProofTypeError('unsupported proof type');
        if (!verifiableObject?.issuer && !verifiableObject?.holder) throw new IssuerOrHolderRequiredError('the issuer or holder is required');
        const issuer = verifiableObject?.issuer || verifiableObject?.holder;
        const acreditation = await this.verificationRegistry.verify(verifiableObject, issuer);
        return acreditation.valid;
    }
}