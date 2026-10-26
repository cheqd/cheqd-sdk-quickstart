import { CheqdNetwork } from '@cheqd/sdk';

try {
	process.loadEnvFile('.env');
} catch {
	// .env is optional; step 01 creates it
}

// Verified 2026-10-14 against /status: rpc.cheqd.network -> cheqd-testnet-6,
// rpc.cheqd.net -> cheqd-mainnet-1. The .network and .net domains differ by network.
export const NETWORKS = {
	testnet: { network: CheqdNetwork.Testnet, rpcUrl: 'https://rpc.cheqd.network', denom: 'ncheq' },
	mainnet: { network: CheqdNetwork.Mainnet, rpcUrl: 'https://rpc.cheqd.net', denom: 'ncheq' },
} as const;

const name = (process.env.CHEQD_NETWORK ?? 'testnet') as keyof typeof NETWORKS;
if (!(name in NETWORKS)) throw new Error(`CHEQD_NETWORK must be testnet or mainnet, got "${name}"`);
if (name === 'mainnet') throw new Error('This project is testnet-only. Refusing to run against mainnet.');

export const config = {
	...NETWORKS[name],
	rpcUrl: process.env.CHEQD_RPC_URL ?? NETWORKS[name].rpcUrl,
	resolverUrl: 'https://resolver.cheqd.net/1.0/identifiers',
	studioApiUrl: process.env.STUDIO_API_URL ?? 'https://studio-api.cheqd.net',
};

export function requireMnemonic(): string {
	const m = process.env.CHEQD_MNEMONIC;
	if (!m) throw new Error('CHEQD_MNEMONIC is not set. Run `npm run 01:wallet` first.');
	return m;
}

export function requireStudioApiKey(): string {
	const k = process.env.STUDIO_API_KEY;
	if (!k) throw new Error('STUDIO_API_KEY is not set. Create an API key in cheqd Studio and add it to .env.');
	return k;
}
