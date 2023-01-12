import { ProofType } from './proof-type';
import { Utils } from './utils';
import { Verifier } from './verifier';
const CryptoJS = require('crypto-js');

export class VerifiableObject {

    verifiableObject: {[key: string]: any};
    protected proofType: ProofType;
    private verifiableObjectString: string;

    /**
     * @constructor
     * @param verifiableObject Verifiable object: Credential or Presentation
     * @param validator Function to validate the object structure
     */
    constructor(verifiableObject: object | string, validator: Function) {
        this.verifiableObject = typeof verifiableObject === 'string' ? JSON.parse(verifiableObject) : verifiableObject;
        if (!validator(this.verifiableObject)) throw new InvalidStructure('invalid verifiable object structure');
        if (typeof verifiableObject === 'string') this.verifiableObjectString = verifiableObject;
    }

    /**
     * @description Returns the credential in string format
     */
    toString(): string {
        return JSON.stringify(this.verifiableObjectString || JSON.stringify(this.verifiableObject));
    }

    /**
     * @description Returns the issuer of the credential if exists
     */
    getIssuer(): string | null {
        return this.verifiableObject?.issuer ?? null;
    }

    /**
     * @description Returns the ID located at the root of the verifiable object
     */
    getId(): string {
        const id = this.verifiableObject?.id || this.verifiableObject?.['@id'] || '0x' + CryptoJS.SHA256(this.toString()).toString(CryptoJS.enc.Hex);
        return id;
    }

    findProof(proofObject: any) {
        const proofs = Array.isArray(proofObject) ? proofObject : [proofObject];
        for (const proof of proofs) {
            if(proof?.type === 'EthereumAttestationRegistry2019' || proof?.type === this.proofType || proof?.type === 'SmartContract') return proof;
        }
        return null;
    }

    /**
     * @description Validate the proof of a verifiable object
     * @param verifier Verifiers object with supported proof types
     */
    verifyProof(verifier?: Verifier): Promise<boolean> {
        if (!verifier && !this.proofType) throw new RequiredProofTypeOrVerifier('required parameter of type Verifier or at least have created the object passing a proof type in its creation (constructor, create or createFromClaims)');
        if (this.proofType) {
            return this.proofType.verifyProof(this.verifiableObject);
        } else if (verifier) {
            const verifiers = verifier.getVerifiers();
            if (verifiers[this.verifiableObject?.proof?.type]) return verifiers[this.verifiableObject.proof.type].verifyProof(this.verifiableObject);
        }
        throw new UnsupportedProofType('no verifier found that supports that type of proof');
    }

    /**
     * @description Check the validity dates of the verifiable object
     */
    verifyDates(): boolean {
        const { issuanceDate, expirationDate } = this.verifiableObject;
        if (!issuanceDate) {
            console.warn('verifiable object requires issuance date');
            return false;
        }
        return expirationDate ? Utils.isNowBetweenDates(issuanceDate, expirationDate) : Utils.isNowSameOrAfterDate(issuanceDate);
    }
}

export class InvalidStructure extends Error {
    constructor(message?: string) {
        super(message);
        Object.setPrototypeOf(this, new.target.prototype);
        this.name = InvalidStructure.name;
    }
}

export class UnsupportedProofType extends Error {
    constructor(message?: string) {
        super(message);
        Object.setPrototypeOf(this, new.target.prototype);
        this.name = UnsupportedProofType.name;
    }
}

export class RequiredProofTypeOrVerifier extends Error {
    constructor(message?: string) {
        super(message);
        Object.setPrototypeOf(this, new.target.prototype);
        this.name = RequiredProofTypeOrVerifier.name;
    }
}