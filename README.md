# KayTrust Open Source SDK - Verifiable Credentials

## How to create a verifiable credential (VC):

### Step 1:
Define claims of the VC

```typescript
const issuer = '[YOUR_ISSUER_DID]'; // example: did:abc:xxxxxxxxxx
const subject = '[SUBJECT_DID]'; // example: did:abc:xxxxxxxxxx
const issuanceDate = new Date().toISOString();
const credential = { 
    credentialSubject: { 
        '@id': subject,
        name: 'Jerson Miranda'
    }, 
    issuanceDate, 
    issuer 
};
```

### Step 2:
Import EthCore class and instance

```typescript
const node = "[URL_BLOCKCHAIN_NODE]";
const privateKey = "[YOUR_PRIVATE_KEY]";
const headers = [{}];
const ethCore = new EthCore(node, privateKey, headers, {chainId: "[CHAIN_ID]", gasPrice: "[GAS_PRICE]"});
```
### Step 3:
Import ProofTypeEthereum class and instance

```typescript
const proofTypeEthereum = new ProofTypeEthereum(ethCore, { identityManager: "[IDENTITY_MANAGE_ADDRESS]", verificationRegistry: "[VERIFICATION_REGISTRY_ADDRESS]", validDays: 0 });
const credentialWithProof = proofTypeEthereum.generateProof(credential);
console.log(credentialWithProof);

/*
"{\"credentialSubject\":{\"name\":\"Jerson Miranda\",\"@id\":\"did:ev:bmM8YE5vpmntRLWrMV4n5YMYBUSE5xzwYK6nU\"},\"issuanceDate\":\"2023-01-11T18:19:19.026Z\",\"issuer\":\"did:ev:bmM8YE5vpmntRLWrMV4n5YMYBUSE5xzwYK6nU\",\"proof\":{\"contractAddress\":\"0xEC42B9716cDb5d2471186F7B75C4570fdfB9F469\",\"networkId\":80001,\"type\":\"EthereumAttestationRegistry2019\"}}"
*/
```