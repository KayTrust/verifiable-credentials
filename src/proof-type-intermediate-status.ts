import { EthCore } from './eth-core';
import { DIDDocumentEV } from './did-document-ev';
import { IdentityManager } from './identity-manager';
import { VerificationRegistry } from './verification-registry';
import { IssuerOrHolderRequiredError, NotAccreditedError, UnsupportedProofTypeError } from './erros';
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

    /**
     * @description Verify that the proof of a verifiable object is valid
     * @param verifiableObject Credential or presentation to verfiy its proof
     */
     async verifyProof(verifiableObject: { [key: string]: any }): Promise<boolean> {
        if (verifiableObject?.proof?.type !== this.proofType) throw new UnsupportedProofTypeError('unsupported proof type');
        if (!verifiableObject?.issuer && !verifiableObject?.holder) throw new IssuerOrHolderRequiredError('the issuer or holder is required');
        const issuer = verifiableObject?.issuer || verifiableObject?.holder;
        let intermediateStatus = {
            'hash': Utils.calculateHash(verifiableObject),
            'status': Status.revoked
        };
        let acreditation = await this.verificationRegistry.verify(intermediateStatus, issuer);
        if (acreditation.valid) return false;
        intermediateStatus.status = Status.valid;
        acreditation = await this.verificationRegistry.verify(intermediateStatus, issuer);
        return acreditation.valid;
    }

    /**
     * @description Revoke the proof of a verifiable object
     * @param verifiableObject Credential or presentation to revoke its proof
     */
    async revokeProof(verifiableObject: { [key: string]: any }): Promise<boolean> {
        if (verifiableObject?.proof?.type !== this.proofType) throw new UnsupportedProofTypeError('unsupported proof type');
        if (!verifiableObject?.issuer && !verifiableObject?.holder) throw new IssuerOrHolderRequiredError('the issuer or holder is required');
        const issuerDidEv = new DIDDocumentEV(verifiableObject?.issuer || verifiableObject?.holder);
        const intermediateStatus = {
            'hash': Utils.calculateHash(verifiableObject),
            'status': Status.revoked
        };
        const transactionData = this.verificationRegistry.getAccreditMethod(intermediateStatus, 0).encodeABI();
        const addressVerificationRegistry = verifiableObject?.proof?.contractAddress || this.verificationRegistry.contractAddress;
        const isRevoked = await this.identityManager.forwardTo(issuerDidEv.getAddress(), addressVerificationRegistry, transactionData, 0);
        return isRevoked.status;
    }
}

export enum Status {
    valid = 'Valid',
    revoked = 'Revoked'
}