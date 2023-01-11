export interface ProofType {
    proofType: string;
    generateProof(verifiableObject: {[key: string]: any}): Promise<{[key: string]: any}>;
    verifyProof(verifiableObject: {[key: string]: any}): Promise<boolean>;
}