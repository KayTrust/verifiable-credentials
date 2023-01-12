import { ProofType } from './proof-type';

export class Verifier {

    private verifiers: {[key: string]: ProofType} = {};

    /**
     * @constructor
     * @param verifier Proof type object
     */
    constructor(verifier?: ProofType) {
        if (verifier) this.addVerifier(verifier);
    }

    /**
     * @description Add a new type of proof type verifier
     * @param verifier Proof type object
     * @param overwrite Flag to overwrite or not an existing value
     */
    addVerifier(verifier: ProofType, overwrite = false): void {
        if (!overwrite && this.verifiers?.[verifier.proofType]) {
            console.warn('this verifier is already registered. if you want to overwrite it use "overwrite" to true');
            return;
        }
        this.verifiers[verifier.proofType] = verifier;
    }

    /**
     * @description Ger the list of proof type verifiers
     */
    getVerifiers(): {[key: string]: ProofType} {
        return this.verifiers;
    }

    /**
     * @description Delete a proof type verifier
     * @param verifier Verifier to delete
     */
    deleteVerifier(verifier: ProofType | string): void {
        const proofType = typeof verifier === 'string' ? verifier : verifier.proofType;
        delete this.verifiers[proofType];
    }
}