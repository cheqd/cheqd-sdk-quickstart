import { getSdk, loadDid, signInputsFor } from './sdk.js';

const { sdk, feePayer } = await getSdk();
const { did, privateKey } = loadDid();

// Updates replace the whole document, so start from the current one and add a service endpoint.
const current = (await sdk.queryDidDoc(did)).didDocument;
if (!current) throw new Error(`${did} not found on ${sdk.options.rpcUrl}`);
const service = { id: `${did}#website`, type: 'LinkedDomains', serviceEndpoint: ['https://example.com'] };
const next = { ...current, service: [...(current.service ?? []).filter((s) => s.id !== service.id), service] };

// Order: signInputs, didPayload, address, fee, memo, versionId, feeOptions
const result = await sdk.updateDidDocTx(signInputsFor(did, privateKey), next, feePayer, undefined, undefined, undefined, undefined);
if (result.code !== 0) throw new Error(`updateDidDocTx failed: code ${result.code}: ${result.rawLog}`);
console.log(`Updated ${did} in tx ${result.transactionHash} (gas used ${result.gasUsed})`);

const after = (await sdk.queryDidDoc(did)).didDocument;
if (!after?.service?.some((s) => s.id === service.id)) throw new Error('Service not present after update');
console.log('Read back: service #website present');
