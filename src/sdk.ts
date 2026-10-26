import { readFileSync } from 'node:fs';
import {
	CheqdNetwork,
	DIDModule,
	ResourceModule,
	createCheqdSDK,
	createCosmosPayerWallet,
	type AbstractCheqdSDKModule,
	type ISignInputs,
} from '@cheqd/sdk';
import { config, requireMnemonic } from './config.js';

/** SDK instance plus the fee-payer address, using the mnemonic in .env. */
export async function getSdk() {
	const wallet = await createCosmosPayerWallet(requireMnemonic());
	const [{ address: feePayer }] = await wallet.getAccounts();
	const sdk = await createCheqdSDK({
		// The cast is needed for the types to line up; see AGENTS.md.
		modules: [DIDModule as unknown as AbstractCheqdSDKModule, ResourceModule as unknown as AbstractCheqdSDKModule],
		rpcUrl: config.rpcUrl,
		network: config.network as CheqdNetwork,
		wallet,
	});
	return { sdk, feePayer };
}

/** The DID created by step 04 and the Ed25519 key that controls it. */
export function loadDid(): { did: string; publicKey: string; privateKey: string } {
	try {
		return JSON.parse(readFileSync('.did.json', 'utf8'));
	} catch {
		throw new Error('.did.json not found. Run `npm run 04:create-did` first.');
	}
}

export function signInputsFor(did: string, privateKeyBase64: string, fragment = 'key-1'): ISignInputs[] {
	// keyType is optional for DID transactions but resource transactions throw "Unsupported signature type: undefined" without it.
	return [{ verificationMethodId: `${did}#${fragment}`, keyType: 'Ed25519', privateKeyHex: Buffer.from(privateKeyBase64, 'base64').toString('hex') }];
}

/** Optional trailing parameters of the *Tx methods must be passed explicitly: see AGENTS.md gotcha 1. */
export const NO_OPTIONS = [undefined, undefined, undefined, undefined] as const;
