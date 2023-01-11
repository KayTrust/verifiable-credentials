import { InvalidExp, InvalidIat, InvalidMnid, InvalidPrivateKey, InvalidPublicKey, UnsupportedAlgorithmJwt } from "./erros";
const EthLib = require('eth-lib');
const Web3Utils = require('web3-utils');
const mnid = require('mnid');
const EC = require('elliptic').ec;
const ec = new EC('secp256k1');
const CryptoJS = require('crypto-js');
const sigFormatter = require('ecdsa-sig-formatter');
const elliptic = require('elliptic');
const secp256k1 = new elliptic.ec('secp256k1');
const keccak256 = require('js-sha3').keccak256;

export class Utils {

    private static validateIatTime(iat: number, marginError: number): boolean {
        const currentTime = (Date.now()) / 1000;
        return currentTime >= iat - marginError;
    }

    private static validateExpTime(exp: number): boolean {
        const currentTime = (Date.now()) / 1000;
        return currentTime <= exp || exp === 0;
    }

    /**
	 * @description Validates a JWT
	 * @param {string} tokenSigned - Token jwt to validate
	 * @param {number} marginError - Time in miliseconds as margin error for iat
	 * @return {object}
	 */
	static validateJwt(tokenSigned: string, marginError: number = 30000): { isValid?: boolean, payloadJwt: object } {
		const tokenParts = tokenSigned.split('.');
		const header = JSON.parse(Utils.decodeBase64url(CryptoJS.enc.Base64.parse(tokenParts[0])));
		const tokenPayload = JSON.parse(Utils.decodeBase64url(CryptoJS.enc.Base64.parse(tokenParts[1])));
        const isValidIat = Utils.validateIatTime(tokenPayload.iat, marginError);
        const isValidExp = Utils.validateExpTime(tokenPayload.exp);

        if(!isValidIat) throw new InvalidIat("JWT used before issued");
        if(!isValidExp) throw new InvalidExp("JWT Expired");

		if (header.alg === 'ES256K') {
			//Sign token
			const signingInputHash = Buffer.from(CryptoJS.SHA256(`${tokenParts[0]}.${tokenParts[1]}`).toString(), 'hex');
			//prepare the public key
			const publicKeyObject = ec.keyFromPublic(`04${tokenPayload.iss}`, 'hex');
			//Signature
			const joseSignature = tokenParts[2];
			const derSignature = sigFormatter.joseToDer(joseSignature, 'ES256');
			// verify the token
			const isValid = publicKeyObject.verify(signingInputHash, derSignature);
			// Get content of the jwt
			const base64 = tokenSigned.split('.')[1];
			const payloadJwt = JSON.parse(Buffer.from(base64, 'base64').toString('utf8'));
			return { isValid, payloadJwt };
		} else if (header.alg === 'HS256') {
			// Get content of the jwt
			const base64 = tokenSigned.split('.')[1];
			const payloadJwt = JSON.parse(Buffer.from(base64, 'base64').toString('utf8'));
			return { payloadJwt };
		} else {
			throw new UnsupportedAlgorithmJwt('supported algorithm: ES256K and HS256');
		}
	}

    /**
     * @description Crreate a JWT (JSON web token)
     * @param rawPrivateKey Private key to sign the JWT
     * @param sub Claim identifies the principal that is the subject of the JWT
     * @param audience Claim identifies the recipients that the JWT is intended for
     * @param params Optional params to set in the JWT
     */
    static createJwt(rawPrivateKey: string, sub?: string, audience?: string, params = {}) {
        let bufferKey;
        // prepare the private key
        if (!rawPrivateKey) {
            throw 'a private key is required';
        }
        if (rawPrivateKey.length === 66) {
            rawPrivateKey = rawPrivateKey.slice(2);
        }
        bufferKey = Buffer.from(rawPrivateKey, 'hex');
        const date = Math.floor(new Date().getTime() / 1000);
        const privateKeyObject = ec.keyFromPrivate(bufferKey);
        const pubPoint = privateKeyObject.getPublic();
        const x = pubPoint.getX();
        const y = pubPoint.getY();
        const rawPublicKey = `${x.toString('hex')}${y.toString('hex')}`;
        const tokenPayload = {
            'sub': sub || Utils.privateToAddress(rawPrivateKey),
            'iss': rawPublicKey,
            'iat': date,
            'exp': date + 50 * 60 * 60,
            'aud': audience,
            ...params
        };
        const header = {
            'alg': 'ES256K',
            'typ': 'JWT'
        };
        const stringifiedHeader = CryptoJS.enc.Utf8.parse(JSON.stringify(header));
        const encodedHeader = Utils.base64url(stringifiedHeader);
        const stringifiedData = CryptoJS.enc.Utf8.parse(JSON.stringify(tokenPayload));
        const encodedData = Utils.base64url(stringifiedData);
        //Token unsigned
        const token = `${encodedHeader}.${encodedData}`;
        //Sign token
        const signingInputHash = Buffer.from(CryptoJS.SHA256(token).toString(), 'hex');
        // make sure the required parameters are provided
        if (!signingInputHash) {
            throw 'a signing input hash and private key are all required';
        }
        // calculate the signature
        const signatureObject = privateKeyObject.sign(signingInputHash);
        const derSignature = Buffer.from(signatureObject.toDER());
        const joseSignature = sigFormatter.derToJose(derSignature, 'ES256');
        const tokenSigned = `${token}.${joseSignature}`;
        return tokenSigned;
    }

    /**
     * @description Encode in base64 format
     * @param source Value to encode
     */
    static base64url(source: any) {
        // Encode in classical base64
        let encodedSource = CryptoJS.enc.Base64.stringify(source);
        // Remove padding equal characters
        encodedSource = encodedSource.replace(/=+$/, '');
        // Replace characters according to base64url specifications
        encodedSource = encodedSource.replace(/\+/g, '-');
        encodedSource = encodedSource.replace(/\//g, '_');
        return encodedSource;
    }

    /**
     * @description Convert a base64 to string
     * @param {string} source - Base64 to convert
     * @return {string}
     */
    static decodeBase64url(source: string): string {
        return CryptoJS.enc.Utf8.stringify(source);
    }

    /**
     * @description Convert an address to mnid format
     * @param address Address to convert
     */
    // async createMnid(address: string): Promise<string> {
    //     const networkId = await Utils.getNetworkId();
    //     const network = Utils.numberToHex(networkId);
    //     return mnid.encode({ network, address });
    // }

    /**
     * @description Returns the network and address of a mnid
     * @param mnidToDecode Mnid to decode
     */
    static decodeMnid(mnidToDecode: string): {network: string, address: string} {
        if (!mnid.isMNID(mnidToDecode)) throw new InvalidMnid(`invalid mnid ${mnidToDecode}`);
        return mnid.decode(mnidToDecode);
    }
    
    /**
     * @description Validate if a given value is a mnid
     * @param value Value to validate as mnid
     */
    static isMnid(value: string): boolean {
        return mnid.isMNID(value);
    }

    /**
     * @description Convert a given value to hexadecimal
     * @param value Value to convert
     */
    static toHex(value: any): string {
        return Web3Utils.toHex(value);
    }

    /**
     * @description Converts a value to Hexadecimal
     * @param value Value to convert to Hex
     * @param length Length of the output
     */
    static asciiToHex(value: string, length: number): string {
        return Web3Utils.asciiToHex(value, length);
    }

    /**
     * @description Convert a given number to hexadecimal
     * @param value Number to convert
     */
    static numberToHex(value: number | string): string {
        return Web3Utils.numberToHex(value);
    }

    /**
     * @description Calculate a hash from a data
     * @param data Data to calculate its hash
     */
    static calculateHash(data: any): string {
        const dataString = typeof data === 'string' ? data : JSON.stringify(data);
        return '0x' + CryptoJS.SHA256(dataString).toString(CryptoJS.enc.Hex);
    }

    /**
     * @description Get the equivalent address of the private key
     * @param privateKey Private key to get its public address
     */
    static privateToAddress(privateKey: string): string {
        return EthLib.Account.fromPrivate(privateKey).address;
    }

    /**
     * @description Returns the address corresponding to the public key
     * @param publicKeyInput Public key
     */
    static publicToAddress(publicKeyInput: string): string {
        if (publicKeyInput.length !== 128) throw new InvalidPublicKey('invalid public key length: required 128');
        const hashOfPublicKey = keccak256(Buffer.from(publicKeyInput, 'hex'));
        const ethAddressBuffer = Buffer.from(hashOfPublicKey, 'hex');
        const ethAddress = ethAddressBuffer.slice(-20).toString('hex');
        const ethAddressWithPrefix = `0x${ethAddress}`;
        return ethAddressWithPrefix;
    }

    /**
     * @description Format the private key to the correct length
     * @param privateKey Private key to validate its format
     */
    static formatPrivateKey(privateKey: string): string {
        if (privateKey.length === 66 && privateKey.startsWith('0x')) return privateKey;
        if (privateKey.length === 64 && !privateKey.startsWith('0x')) return `0x${privateKey}`;
        throw new InvalidPrivateKey('invalid private key format. 64 or 66 length required. Example 0x123abc... or 123abc...');
    }

    /**
     * @description Generate a random private key
     */
    static generatePrivateKey(): string {
        let privateKey;
        let privateKeyJwk;
        do {
            const seed = Utils.generateObjectId();
            privateKey = Utils.calculateHash(seed);
            privateKeyJwk = Utils.privateToJwk(privateKey);
        } while (privateKeyJwk.x.length !== 64 || privateKeyJwk.y.length !== 64);
        return privateKey;
    }

    /**
     * @description Generate a random hexadecimal
     */
    static generateObjectId(): string {
        var timestamp = ((new Date().getTime() / 1000) | 0).toString(16);
        return (
            timestamp +
            'xxxxxxxxxxxxxxxx'
                .replace(/[x]/g, function () {
                    return ((Math.random() * 16) | 0).toString(16);
                })
                .toLowerCase()
        );
    }

    /**
     * @description Get the JSON web key that represents a cryptographic key
     * @param privatekeyInput Private key
     */
    static privateToJwk(privatekeyInput: string) {
        if (privatekeyInput && privatekeyInput.length == 66 && privatekeyInput.startsWith('0x')) {
            let bufferKey = Buffer.from(privatekeyInput.slice(2), 'hex');
            let ecKey = secp256k1.keyFromPrivate(bufferKey);
            let pubPoint = ecKey.getPublic();
            let x = pubPoint.getX();
            let y = pubPoint.getY();
        return {
            kty: 'EC',
            crv: 'ES256K',
            x: x.toString('hex'),
            y: y.toString('hex'),
            use: 'enc'
        };
        } else {
          throw new InvalidPrivateKey('invalid private key or the length does not correspond to a private key');
        }
    }

    /**
     * @description Execute a function and wait until an event is called
     * @param fx Function to execute
     * @param eventName Event name to wait
     */
    static waitForEventName(fx: Function, eventName: string): Promise<string> {
        return new Promise((resolve, reject) => {
            fx()
            .once(eventName, (hash: string) => {
                resolve(hash)
            })
            .on('error', (error: Error) => {
                reject(error)
            });
        });
    }

    /**
     * @description Filters an ABI to get a specific ABI only with certain events names
     * @param abi ABI to filter
     * @param eventName List of event name to filter
     */
    static getABIEvent(abi: any, eventName: string[] = []) {
        return abi.filter((item: any) => item.type === 'event' && eventName.includes(item.name));
    }
}