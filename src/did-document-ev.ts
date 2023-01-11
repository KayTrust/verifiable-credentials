import { DIDDocument } from './did-document';
import { Utils } from './utils';

export class DIDDocumentEV implements DIDDocument {
    
    private proxyAddress: string;
    private networkId: string;
    private did: string;
    static DID_METHOD: string = 'did:ev:';

    /**
     * @constructor
     * @param did Identity identifer
     */
    constructor(did: string) {
        if (!did) throw new DidRequired('did not present in parameters');
        this.did = did;
        this.proxyAddress = this.didToProxyAddress(this.did);
    }

    /**
     * @description Returns the proxy address obtained from the DID
     */
    getAddress(): string {
        return this.proxyAddress;
    }

    getNetWorkId(): string {
        return this.networkId;
    }

    /**
     * @description Get the proxy address from a DID
     * @param did DID from where the proxy address will be obtained
     */
    private didToProxyAddress(did: string): string {
        if (did.startsWith(DIDDocumentEV.DID_METHOD)) {
            const mnid = did.split(':')[2];
            const networkObject = Utils.decodeMnid(mnid);
            this.proxyAddress = networkObject.address;
            this.networkId = networkObject.network;
            return this.proxyAddress;
        } else if (did.startsWith('0x') && did.length === 42) {
            console.warn(`address received: ${did}, should be a DID`);
            return did;
        }
        throw new DidNotRecognized('did not recognized, required format: did:ev:[mnid]');
    }
}

export class DidRequired extends Error {
    constructor(message?: string) {
        super(message);
        Object.setPrototypeOf(this, new.target.prototype);
        this.name = DidRequired.name;
    }
}

export class DidNotRecognized extends Error {
    constructor(message?: string) {
        super(message);
        Object.setPrototypeOf(this, new.target.prototype);
        this.name = DidNotRecognized.name;
    }
}