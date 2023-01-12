import { VerifiableObject } from './verifiable-object';
import { ProofType } from './proof-type';
import { Utils } from './utils';
import { CredentialRequired } from './erros';
const RULE_CREDENTIAL = { $and: ['credentialSubject'], $or: ['issuanceDate', '@type', 'type'] };

export class Credential extends VerifiableObject {

    /**
     * @constructor
     * @param credential Verifiable credential
     */
    constructor(credential: string | object) {
        super(credential, Credential.hasValidSructure);
    }

    /**
     * @description Create a verifiable credential according to claims
     * @param credentialData Information required to create a credential
     * @param credentialData.issuer Identity responsible for issuing the credential
     * @param credentialData.credentialSubject Each of the claims to include in the credential
     * @param credentialData.typeCredential Type of credential to create
     * @param credentialData.id Credential identifier
     * @param credentialData.proofType Proof type used to acredit the credential
     * @param credentialData.issuanceDate Credential issue date. ISO 8601 format
     * @param credentialData.expirationDate Credential expiration date. ISO 8601 format
     */
    static async createFromClaims(credentialData: { issuer: string, credentialSubject?: {[key: string]: any}, typeCredential?: string | string[], id?: string, proofType?: ProofType, issuanceDate?: string, expirationDate?: string }): Promise<Credential> {
        if (!credentialData?.credentialSubject?.['@id'] && !credentialData?.credentialSubject?.id) console.warn('credentialSubject without @id or id');
        let type = null;
        const defaultTypeCredential = 'VerifiableCredential';
        if (credentialData?.typeCredential) {
            type = Array.isArray(credentialData.typeCredential) ? [defaultTypeCredential, ...credentialData.typeCredential] : defaultTypeCredential;
        }
        let credential: {[key: string]: any} = {
            '@context': 'https://www.w3.org/2018/credentials/v1',
            '@id': credentialData?.id || Utils.generateObjectId(),
            '@type': type || defaultTypeCredential,
            credentialSubject: credentialData?.credentialSubject ?? {},
            issuer: credentialData.issuer
        };
        if (credentialData.issuanceDate) credential['issuanceDate'] = credentialData.issuanceDate;
        if (credentialData.expirationDate) credential['expirationDate'] = credentialData.expirationDate;
        if (credentialData?.proofType) credential = await credentialData.proofType.generateProof(credential);
        const credentialObj = new Credential(credential);
        if (credentialData?.proofType) credentialObj.proofType = credentialData.proofType;
        return credentialObj;
    }

    /**
     * @description Returns the subject id of the credential ('@id' or id in credentialSubject)
     */
    getSubjectId() {
        return this.verifiableObject.credentialSubject['@id'] || this.verifiableObject.credentialSubject.id;
    }

    /**
     * @description Returns an array with the credential types
     */
    getType(): string[] {
        const type = this.verifiableObject?.type || this.verifiableObject?.['@type'] || 'VerifiableCredential';
        return Array.isArray(type) ? type : [type];
    }

    /**
     * @description Gets the credential object instance for a given input
     * @param credential Credential to get its object instance
     */
    static getCredentialObject(credential: string | object | Credential) {
        return credential instanceof Credential ? credential : new Credential(credential);
    }

    /**
     * @description Validate the internal structure of a credential
     * @param credential Verifiable credential to validate its structure
     */
    static hasValidSructure(credential: object): boolean {
        if (!credential || !(credential instanceof Object)) throw new CredentialRequired('credential object is required');
        return Utils.validateKeys(RULE_CREDENTIAL, credential);
    }
}