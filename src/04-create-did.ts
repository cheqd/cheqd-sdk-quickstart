import { existsSync, writeFileSync } from 'node:fs';
import {
	CheqdNetwork,
	DIDModule,
	MethodSpecificIdAlgo,
	ResourceModule,
	VerificationMethods,
	createCheqdSDK,
	createDidPayload,
	createDidVerificationMethod,
	createKeyPairBase64,
	createVerificationKeys,
	checkBalance,
	createCosmosPayerWallet,
	type AbstractCheqdSDKModule,
	type ISignInputs,
} from '@cheqd/sdk';
import { config, requireMnemonic } from './config.js';

// .did.json holds the only copy of the DID's private key; never overwrite it by accident.
if (existsSync('.did.json') && !process.argv.includes('--new')) {
	throw new Error('.did.json already exists. Re-run with --new to create another DID (this replaces the saved key).');
}

const wallet = await createCosmosPayerWallet(requireMnemonic());
const [{ address: feePayer }] = await wallet.getAccounts();

const balances = await checkBalance(feePayer, config.rpcUrl);
if (!balances.some((b) => b.denom === config.denom && BigInt(b.amount) > 0n)) {
	throw new Error(`${feePayer} has no ${config.denom}. Run npm run 02:fund, then npm run 03:balance -- --wait.`);
}

const sdk = await createCheqdSDK({
	modules: [DIDModule as unknown as AbstractCheqdSDKModule, ResourceModule as unknown as AbstractCheqdSDKModule],
	rpcUrl: config.rpcUrl,
	network: config.network as CheqdNetwork,
	wallet,
});

// The DID's own Ed25519 key is separate from the Cosmos fee-payer wallet.
const keyPair = createKeyPairBase64();
const keys = createVerificationKeys(keyPair.publicKey, MethodSpecificIdAlgo.Base58, 'key-1', config.network);
const methods = createDidVerificationMethod([VerificationMethods.Ed255192020], [keys]);
const didPayload = createDidPayload(methods, [keys]);

const signInputs: ISignInputs[] = [
	{
		verificationMethodId: didPayload.verificationMethod![0].id,
		privateKeyHex: Buffer.from(keyPair.privateKey, 'base64').toString('hex'),
	},
];

// Pass every optional parameter explicitly. The SDK appends its own context object as the final argument,
// so omitting trailing optionals makes it land in the `fee` slot and the call dies with
// "Cannot read properties of undefined (reading 'sdk')". TypeScript does not catch this.
// Order: signInputs, didPayload, address, fee, memo, versionId, feeOptions
const result = await sdk.createDidDocTx(signInputs, didPayload, feePayer, undefined, undefined, undefined, undefined);
if (result.code !== 0) throw new Error(`createDidDocTx failed: code ${result.code}: ${result.rawLog}`);

console.log(`Created ${didPayload.id} in tx ${result.transactionHash} (gas used ${result.gasUsed})`);
// Keep the DID's private key so the DID can be updated or deactivated later. Gitignored.
writeFileSync('.did.json', JSON.stringify({ did: didPayload.id, ...keyPair }, null, 2), { mode: 0o600 });
console.log('Saved DID and key to .did.json. Next: npm run 05:resolve');
