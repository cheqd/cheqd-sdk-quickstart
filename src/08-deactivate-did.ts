import { getSdk, loadDid, signInputsFor } from './sdk.js';

// Deactivation is permanent. Require an explicit flag.
if (!process.argv.includes('--confirm')) {
	console.error('Deactivation cannot be undone. Re-run with: npm run 08:deactivate-did -- --confirm');
	process.exit(2);
}
const { sdk, feePayer } = await getSdk();
const { did, privateKey } = loadDid();
const current = (await sdk.queryDidDoc(did)).didDocument;
if (!current) throw new Error(`${did} not found`);

const result = await sdk.deactivateDidDocTx(signInputsFor(did, privateKey), current, feePayer, undefined, undefined, undefined, undefined);
if (result.code !== 0) throw new Error(`deactivateDidDocTx failed: code ${result.code}: ${result.rawLog}`);
console.log(`Deactivated ${did} in tx ${result.transactionHash}`);

const after = await sdk.queryDidDoc(did);
console.log(`didDocumentMetadata.deactivated = ${after.didDocumentMetadata?.deactivated}`);
