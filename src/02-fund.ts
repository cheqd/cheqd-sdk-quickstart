import { createCosmosPayerWallet } from '@cheqd/sdk';
import { config, requireMnemonic, requireStudioApiKey } from './config.js';

const wallet = await createCosmosPayerWallet(requireMnemonic());
const [{ address }] = await wallet.getAccounts();

// Studio funds any valid cheqd testnet address, not only the customer's own payment account.
// Without an amount Studio sends 10,000 CHEQ; FUND_AMOUNT_CHEQ overrides it. Every request counts against the
// Studio account's monthly quota (100,000 CHEQ by default).
const amount = Number(process.env.FUND_AMOUNT_CHEQ ?? 10000);
const res = await fetch(`${config.studioApiUrl}/account/faucet`, {
	method: 'POST',
	headers: { 'content-type': 'application/json', 'x-api-key': requireStudioApiKey() },
	body: JSON.stringify({ address, amount }),
});
const text = await res.text();
let body: unknown = text;
try {
	body = JSON.parse(text);
} catch {
	// leave as text
}

if (res.status === 429) {
	console.error(`Rate limited. Retry after ${res.headers.get('retry-after') ?? '?'}s.`, body);
	process.exit(3);
}
if (!res.ok) {
	console.error(`Studio faucet returned ${res.status}:`, body);
	process.exit(1);
}
console.log(`Funded ${address} via ${config.studioApiUrl}`);
console.log(body);
console.log('Next: npm run 03:balance -- --wait');
