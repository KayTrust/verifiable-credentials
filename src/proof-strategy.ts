import { UnsupportedProofTypeError } from "./erros";
import { ProofTypeEthereum } from "./proof-type-ethereum";
import { ProofTypeAttestationIntermediateStatus } from "./proof-type-intermediate-status";
import { ProofTypeSmartContract } from "./proof-type-smart-contract";

class ProofStrategy {

    private proofType: {[key: string]: any};

    constructor(proofObject: Array<any> | Object) {
        const proofs = Array.isArray(proofObject) ? proofObject : [proofObject];
        for (const proof of proofs) {
            if(proof?.type === ProofTypeEthereum.PROOF_TYPE) this.proofType = proof;
            else if (proof?.type === ProofTypeAttestationIntermediateStatus.PROOF_TYPE) this.proofType = proof;
            else if (proof?.type === ProofTypeSmartContract.PROOF_TYPE) this.proofType = proof;
        }
        if(!this.proofType) throw new UnsupportedProofTypeError('unsupported proof type');
    }

    getProofType() {
        return this.proofType;
    }
}

export default ProofStrategy;