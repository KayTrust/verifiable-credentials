import { ProofType } from './proof-type';
import { EthCore } from './eth-core';
import { IdentityManager } from './identity-manager';
import { VerificationRegistry } from './verification-registry';
import { ProofTypeSmartContract } from './proof-type-smart-contract';

export class ProofTypeEthereum implements ProofType {

    readonly proofType = 'EthereumAttestationRegistry2019';
    private proofTypeSmartContract: ProofTypeSmartContract;
    static PROOF_TYPE: string = 'EthereumAttestationRegistry2019';

    /**
     * @constructor
     * @param ethCore EthCore instance for ethereum communication
     * @param options Options to configure the contracts used to validate the proof type
     * @param options.identityManager Contract instance or address of the identity manager
     * @param options.verificationRegistry Contract instance or address of the verification registry
     * @param options.validDays Number of days of validity that the credited data will be
     */
    constructor(ethCore: EthCore, options: { identityManager: IdentityManager | string, verificationRegistry: VerificationRegistry | string, validDays?: number }) {
        this.proofTypeSmartContract = new ProofTypeSmartContract(ethCore, options);
        this.proofTypeSmartContract.proofType = this.proofType;
    }

    /**
     * @description Generate a valid proof for the verifiable object
     * @param verifiableObject Credential or presentation to generate its proof
     * @param issuer Did of who accredits the information
     * @param validDays Number of days of validity that the credited data will be. 0 means never expires
     * @param gasLimitMultiplier Value for gaslimit multiplier
     * @param gasPrice Value for gasPrice
     */
    generateProof(verifiableObject: { [key: string]: any }, validDays = this.proofTypeSmartContract.validDays): Promise<any> {
        return this.proofTypeSmartContract.generateProof(verifiableObject, validDays);
    }

    /**
     * @description Verify that the proof of a verifiable object is valid
     * @param verifiableObject Credential or presentation to verfiy its proof
     */
     verifyProof(verifiableObject: { [key: string]: any }): Promise<boolean> {
        return this.proofTypeSmartContract.verifyProof(verifiableObject);
    }

    /**
     * @description Revoke the proof of a verifiable object
     * @param verifiableObject Credential or presentation to revoke its proof
     */
    revokeProof(verifiableObject: { [key: string]: any }): Promise<boolean> {
        return this.proofTypeSmartContract.revokeProof(verifiableObject);
    }

}