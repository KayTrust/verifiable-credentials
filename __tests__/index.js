jasmine.DEFAULT_TIMEOUT_INTERVAL = 20000;
const { ProofTypeEthereum } = require('../lib/proof-type-ethereum');
const { EthCore } = require('../lib/eth-core');
const { VerificationRegistry } = require('../lib/verification-registry');
const { IdentityManager } = require('../lib/identity-manager');
const { Verifier } = require('../lib/verifier');
const { Credential } = require('../lib/credential');

const node = '[NODE_URL]';
const privateKey = '[YOUR_PRIVATE_KEY]';
const headers = [{}]; // example: [{ name: 'Authorization', value: `Bearer ${rpcToken}` }];
const issuer = '[YOUR_ISSUER_DID]';
const CONTRACTS = {
    mumbai: {
        identityManager: '[ADDRESS]',
        verificationRegistry: '[ADDRESS]',
        proxyX: '[ADDRESS]'
    }
};

let proofTypeEthereum = null;
let ethCore = null;

describe('Credentials management', () => {

    beforeAll(() => {
        const ethCoreProps = {
            host: node,
            privateKey: privateKey,
            headers: headers,
            options: {chainId: 80001, gasPrice: '95000000000'}
        };
        ethCore = new EthCore(ethCoreProps);
        verificationRegistry = new VerificationRegistry(ethCore, CONTRACTS.mumbai.verificationRegistry);
        identityManager = new IdentityManager(ethCore, CONTRACTS.mumbai.identityManager);
        proofTypeEthereum = new ProofTypeEthereum(ethCore, { identityManager: CONTRACTS.mumbai.identityManager, verificationRegistry: CONTRACTS.mumbai.verificationRegistry, validDays: 0 });
    });

    it('should validate proof type', () => {
        const verifiers = new Verifier(proofTypeEthereum);
        const credentialObj = new Credential("{\"credentialSubject\":{\"name\":\"Jerson Miranda\",\"@id\":\"did:ev:bmM8YE5vpmntRLWrMV4n5YMYBUSE5xzwYK6nU\"},\"issuanceDate\":\"2023-01-11T18:19:19.026Z\",\"issuer\":\"did:ev:bmM8YE5vpmntRLWrMV4n5YMYBUSE5xzwYK6nU\",\"proof\":{\"contractAddress\":\"0xEC42B9716cDb5d2471186F7B75C4570fdfB9F469\",\"networkId\":80001,\"type\":\"EthereumAttestationRegistry2019\"}}");
        return expect(credentialObj.verifyProof(verifiers)).resolves.toBeTruthy();
	});

    it('should generate a proof type for a creadential', () => {
        const issuanceDate = new Date().toISOString();
        const credential = { credentialSubject: { name: 'Jerson Miranda', '@id': issuer }, issuanceDate, issuer };
		return expect(proofTypeEthereum.generateProof(credential)).resolves.toBeDefined();
	});
});