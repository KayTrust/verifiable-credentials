import { EthCore } from './eth-core';
import { ABI_IM } from './constants';
import { CapabilityRequired } from './erros';
import { Utils } from './utils';

const abiDecoder = require('abi-decoder');

export class IdentityManager {

    contractInstance: {[key: string]: any};
    contractAddress: string;
    private ethereum: EthCore;

    /**
     * @constructor
     * @param ethCore EthCore instance required to interact with the smart contracts
     * @param contractAddress Contract adddress of the identity manager
     */
    constructor(ethCore: EthCore, contractAddress: string) {
        this.ethereum = ethCore;
        this.contractAddress = contractAddress;
        this.contractInstance = this.ethereum.getInstanceContract(ABI_IM, this.contractAddress);
    }

    // /**
    //  * @description Create a new identity
    //  */
    //  async deployIdentity(): Promise<string> {
    //     const methodToExecute = this.contractInstance.methods.createIdentity(Utils.asciiToHex('admin', 16), Utils.asciiToHex('profile', 16), '', '', '');
    //     const receipt = await this.ethereum.sendTransaction(this.contractAddress, methodToExecute);
    //     const proxyAddress = this.getProxyAddressFromLogs(receipt.logs);
    //     return proxyAddress;
    // }

    /**
     * @description Validate if a device has a certain permission (cap) on an identity
     * @param identity Identity on which to verify
     * @param device Device to validate
     * @param capability Permission to verify
     */
     async hasCap(identity: string, device: string, capability: string): Promise<boolean> {
        return await this.contractInstance.methods.hasCap(identity, device, capability).call();
    }

    /**
     * @description Forward a transaction through the current contract
     * @param identity Identity where the transaction will be carried out
     * @param destination Destination of the transaction
     * @param value Amount of ethers to send
     * @param data Bytecode of the transaction to execute
     * @param gasLimitMultiplier Multiplying factor to set the gas limit
     */
    async forwardTo(identity: string, destination: string, data: string, value: number = 0): Promise<any> {
        const addressPrivateKey = this.ethereum.getAddress();
        const hasCap = await this.hasCap(identity, addressPrivateKey, 'fw');
        if (!hasCap) throw new CapabilityRequired('required capability fw');
        const methodToExecute = this.contractInstance.methods.forwardTo(identity, destination, value, data);
        const receipt = await this.ethereum.sendTransaction(this.contractAddress, methodToExecute, value);
        return receipt;
    }

    // private getProxyAddressFromLogs(logs: {[key: string]: any}[]): string {
    //     const abiEvents = Utils.getABIEvent(ABI_IM, ['IdentityCreated']);
    //     abiDecoder.addABI(abiEvents);
    //     const logsFiltered = abiDecoder.decodeLogs(logs).filter(Boolean);
    //     const proxyAddress = logsFiltered
    //         .find((log: {[key: string]: any}) => log.name === 'IdentityCreated')?.events
    //         .find((event: {[key: string]: any}) => event.name === 'proxy')?.value;
    //     return proxyAddress;
    // }
}