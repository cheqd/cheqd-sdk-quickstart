import { readFileSync } from 'node:fs';
import { config } from './config.js';

const did = process.argv[2] ?? JSON.parse(readFileSync('.did.json', 'utf8')).did;
// Ask for the full resolution result (didDocument + metadata) rather than the bare document.
const res = await fetch(`${config.resolverUrl}/${did}`, {
	headers: { accept: 'application/ld+json;profile="https://w3id.org/did-resolution"' },
	redirect: 'follow',
});
if (!res.ok) throw new Error(`Resolver returned ${res.status} for ${did}: ${await res.text()}`);
const body = (await res.json()) as { didDocument?: { id?: string }; didDocumentMetadata?: { deactivated?: boolean; versionId?: string } };
if (body.didDocument?.id !== did) throw new Error(`Resolved id mismatch for ${did}: ${JSON.stringify(body).slice(0, 300)}`);
const m = body.didDocumentMetadata;
console.log(`Resolved ${did} (version ${m?.versionId ?? '?'}${m?.deactivated ? ', DEACTIVATED' : ''})`);
