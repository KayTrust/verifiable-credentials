
import { ABI_VR } from './constants';
import { EthCore } from './eth-core';
import { Utils } from './utils';

export class VerificationRegistry {

    contractInstance: {[key: string]: any};
    contractAddress: string;
    private ethereum: EthCore;

    /**
     * @constructor
     * @param ethCore EthCore instance
     * @param contractAddress Address of the verificaton registry
     */
    constructor(ethCore: EthCore, contractAddress: string) {
        this.ethereum = ethCore;
        this.contractAddress = contractAddress;
        this.contractInstance = this.ethereum.getInstanceContract(ABI_VR, this.contractAddress);
    }

    getAccreditMethod(data: any, validDays = 30): {[key: string]: any} {
        const hash = Utils.calculateHash(data);
        return this.contractInstance.methods.verify(hash, validDays);
    }
}