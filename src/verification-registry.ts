
import { ABI_VR } from './constants';
import DIDStrategy from './did-strategy';
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

    async verify(data: any, attester: string): Promise<{valid: boolean, iat: number, exp: number}> {
        const attesterObj = (new DIDStrategy(attester)).getAttesterObj();
        const hash = Utils.calculateHash(data);
        const dates = await this.contractInstance.methods.verifications(hash, attesterObj.getAddress()).call();
        const isAccredited = parseInt(dates.iat) === 0 ? false : (parseInt(dates.exp) === 0 ? true : (dates.exp * 1000) >= Date.now());
        return { valid: isAccredited, iat: dates.iat, exp: dates.exp };
    }

    /**
     * @description Revoke a data in the contract
     * @param data Data to be revoked
     */
    async revoke(data: any): Promise<boolean> {
        const methodToExecute = this.getRevokeMethod(data);
        const receipt = await this.ethereum.sendTransaction(this.contractAddress, methodToExecute);
        return receipt.status;
    }

    getRevokeMethod(data: any): {[key: string]: any} {
        const hash = Utils.calculateHash(data);
        return this.contractInstance.methods.revoke(hash);
    }
}