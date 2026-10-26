// The same outcomes as steps 04 to 06, through cheqd Studio's REST API instead of the SDK.
// Studio custodies the keys and pays the fees from the customer's own testnet payment account.
import { config, requireStudioApiKey } from '../config.js';

const key = requireStudioApiKey();
async function call(method: string, path: string, body?: unknown) {
	const res = await fetch(`${config.studioApiUrl}${path}`, {
		method,
		headers: { 'content-type': 'application/json', 'x-api-key': key },
		body: body === undefined ? undefined : JSON.stringify(body),
	});
	const text = await res.text();
	let json: any = text;
	try { json = JSON.parse(text); } catch { /* keep text */ }
	console.log(`${method} ${path} -> ${res.status}`);
	if (!res.ok) throw new Error(`${method} ${path} failed ${res.status}: ${text.slice(0, 500)}`);
	return json;
}

const created = await call('POST', '/did/create', {
	network: 'testnet',
	identifierFormatType: 'uuid',
	options: { verificationMethodType: 'Ed25519VerificationKey2020' },
});
const did: string = created.did;
console.log('Created', did);

const resolved = await call('GET', `/did/search/${encodeURIComponent(did)}`);
if (resolved.didDocument?.id !== did) throw new Error('Resolve mismatch');
console.log('Resolved via Studio');

const data = Buffer.from(JSON.stringify({ hello: 'cheqd', via: 'studio' })).toString('base64');
const resource = await call('POST', `/resource/create/${encodeURIComponent(did)}`, {
	name: 'example-note', type: 'TextDocument', encoding: 'base64', data,
});
console.log('Created resource', JSON.stringify(resource).slice(0, 300));
