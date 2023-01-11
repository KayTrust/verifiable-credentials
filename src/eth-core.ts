import { Utils } from './utils';
import { Contract } from 'web3-eth-contract';
import { ethers } from 'ethers';
import { CantEstimatedGas, ContractAddressRequired, InsufficientBalance } from './erros';
const Web3 = require('web3');
const constants = require('./constants');

export class EthCore {

    public readonly chainId: number | string | undefined;
    public readonly gasLimitMultiplier: number;
    public readonly gasPrice: number;
    public web3Instance: {[key: string]: any};
    public web3WsInstance: {[key: string]: any};
    private privateKey: string;

    /**
     * @constructor
     * @param host Connection URL to Blockchain node
     * @param privateKey Private key for transactions
     * @param headers Optional headers that are sent to the Blockchain node
     * @param timeout Timeout for the connection
     */
    constructor(host: string, privateKey?: string, headers: [{ name?: string, value?: string }] = [{}], options: Record<string, any> = {}) {
        if (!options.timeout) options.timeout = constants.DEFAULT_TIMEOUT;
        this.gasLimitMultiplier = options.gasLimitMultiplier || 2;
        this.gasPrice = options.gasPrice || 0;
        this.chainId = options.chainId;
        this.web3Instance = new Web3(new Web3.providers.HttpProvider(host, { timeout: options.timeout, headers }));
        this.web3Instance.eth.handleRevert = true;
        if (!privateKey) console.info('no private key present, using a random generated');
        this.privateKey = privateKey ? Utils.formatPrivateKey(privateKey) : Utils.generatePrivateKey();
    }

    /**
     * @description Update the headers for the web3js instance
     * @param headers 
     */
    updateHeaders(headers: {name: string, value: string}[]): void {
        this.web3Instance.currentProvider.headers = headers;
    }

    /**
     * @description Returns the current private key
     */
    getPrivateKey(): string {
        return this.privateKey;
    }

    /**
     * @description Returns the address of the private key established
     */
    getAddress(): string {
        return Utils.privateToAddress(this.privateKey);
    }

    /**
     * @description Returns a smart contract instance
     * @param abi Contract Application Binary Interface
     * @param contractAddress Address of the contract to instantiate
     */
    getInstanceContract(abi: object, contractAddress: string): Contract {
        if (!contractAddress) throw new ContractAddressRequired('a contract address is required');
        return new this.web3Instance.eth.Contract(abi, contractAddress);
    }

    /**
     * @description Sends a signed transaction from the execution of a function of a contract
     * @param toContract Address of the contract which will run the function
     * @param methodToExecute Reference of the method to execute. Required to get first using "getInstanceContract"
     * @param gasLimitMultiplier Multiplying factor to set the gas limit
     */
    async sendTransaction(toContract: string, methodToExecute: {[key: string]: any}, value: number = 0): Promise<{[key: string]: any}> {
        const address = Utils.privateToAddress(this.privateKey);
        const totalTransactionsAddress = await this.web3Instance.eth.getTransactionCount(address);
        const data = methodToExecute.encodeABI();
        const gasEstimated = await this.estimateGas(address, data, toContract);
        const gasLimit = Math.round(gasEstimated * this.gasLimitMultiplier);
        const cost = Math.round((gasLimit * this.gasPrice) + value);
        const balance = await this.web3Instance.eth.getBalance(address);
        if(balance < cost) {
            throw new InsufficientBalance(`Gas Price: ${this.gasPrice}\nGas Cost: ${cost}\nBalance: ${balance}`);
        }
        const rawTx: any = {
            from: address,
            gasPrice: Utils.toHex(this.gasPrice),
            gasLimit: Utils.toHex(gasLimit),
            nonce: Utils.toHex(totalTransactionsAddress),
            data,
            to: toContract,
            value: Utils.toHex(value)
        };
        if(this.chainId) rawTx.chainId = this.chainId;
        const receipt = await this.sendRawTransaction(rawTx);
        return receipt;
    }

    public async estimateGas(from: string, data: string, to: string): Promise<any> {
        try {
            return await this.web3Instance.eth.estimateGas({ from, data, to });
        } catch (error) {
            throw new CantEstimatedGas(error.message);
        }
    }

    /**
     * @description Sign and send a transaction object
     * @param rawTx Transaction object
     */
    private async sendRawTransaction(rawTx: object): Promise<{[key: string]: any}> {
        const signedTx = await this.signTransaction(rawTx);
        const txHash = await Utils.waitForEventName(() => this.web3Instance.eth.sendSignedTransaction(signedTx), 'transactionHash');
        const receipt = await this.waitForTransactionReceipt(txHash);
        console.info(JSON.stringify(receipt, null, ' '));
        return receipt;
    }

    /**
     * @description Sign a transaction object
     * @param rawTx 
     */
    async signTransaction(rawTx: object): Promise<string> {
        const wallet = new ethers.Wallet(this.privateKey);
        return await wallet.signTransaction(rawTx);
    }

    /**
     * @description Wait for the transaction receipt
     * @param txHash Transaction hash
     * @param _tries Number of attempts to obtain the transaction receipt
     */
    waitForTransactionReceipt(txHash: string, _tries = 30): Promise<{[key: string]: any}> {
        return new Promise((resolve, reject) => {
            var tries = _tries;
            var interval = setInterval(() => {
            this.web3Instance.eth.getTransactionReceipt(
                txHash,
                (error: Error, txReceipt?: {[key: string]: any}) => {
                    if (error) {
                        clearInterval(interval);
                        reject(error);
                    } else {
                        if (txReceipt && txReceipt['transactionHash'] == txHash && txReceipt['blockNumber']) {
                            clearInterval(interval);
                            resolve(txReceipt);
                        } else if (tries > 0) {
                            tries--;
                        } else {
                            clearInterval(interval);
                            reject(txReceipt);
                        }
                    }
                }
            )}, 1000);
        });
    }

    /**
     * @description Get the network identifier
     */
    async getNetworkId(): Promise<string> {
        return await this.web3Instance.eth.net.getId();
    }
}