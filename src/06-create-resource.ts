import { randomUUID } from 'node:crypto';
import { getSdk, loadDid, signInputsFor } from './sdk.js';

const { sdk, feePayer } = await getSdk();
const { did, privateKey } = loadDid();
const collectionId = did.split(':').pop()!; // the DID's method-specific id

// A DID-Linked Resource is a versioned blob stored on-ledger under a DID.
const resourceId = randomUUID();
const payload = {
	collectionId,
	id: resourceId,
	name: 'example-note',
	version: '1.0.0',
	resourceType: 'TextDocument',
	data: new TextEncoder().encode(JSON.stringify({ hello: 'cheqd', createdBy: 'cheqd-sdk-quickstart' })),
};

// Order: signInputs, resourcePayload, address, fee, memo, feeOptions (then the SDK adds its context).
const result = await sdk.createLinkedResourceTx(signInputsFor(did, privateKey), payload, feePayer, undefined, undefined, undefined);
if (result.code !== 0) throw new Error(`createLinkedResourceTx failed: code ${result.code}: ${result.rawLog}`);
console.log(`Created resource ${resourceId} in tx ${result.transactionHash} (gas used ${result.gasUsed})`);

const read = await sdk.queryLinkedResource(collectionId, resourceId);
const text = new TextDecoder().decode(read.resource?.data);
if (!text.includes('cheqd')) throw new Error(`Read-back mismatch: ${text}`);
console.log(`Read back: ${text}`);
