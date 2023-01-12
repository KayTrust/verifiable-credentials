import { DIDDocument } from "./did-document";
import { DIDDocumentEV } from "./did-document-ev";
import { UnsupportedProofTypeError } from "./erros";

class DIDStrategy {

    private attesterObj: DIDDocument;

    constructor(did: string) {
        const didMethod = did.split(':')[1];
        if(DIDDocumentEV.DID_METHOD.includes(didMethod)) this.attesterObj = new DIDDocumentEV(did);
        else throw new UnsupportedProofTypeError('unsupported proof type');
    }

    getAttesterObj() {
        return this.attesterObj;
    }
}

export default DIDStrategy;