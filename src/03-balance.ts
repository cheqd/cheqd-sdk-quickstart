import { checkBalance, createCosmosPayerWallet } from '@cheqd/sdk';
import { config, requireMnemonic } from './config.js';

const wallet = await createCosmosPayerWallet(requireMnemonic());
const [{ address }] = await wallet.getAccounts();
const wait = process.argv.includes('--wait');

for (;;) {
	const balances = await checkBalance(address, config.rpcUrl);
	const ncheq = BigInt(balances.find((b) => b.denom === config.denom)?.amount ?? '0');
	console.log(`${address}: ${ncheq} ${config.denom} (${Number(ncheq) / 1e9} CHEQ)`);
	if (ncheq > 0n) break;
	if (!wait) {
		console.error(`Balance is zero. Run npm run 02:fund, or re-run with --wait to poll.`);
		process.exit(2);
	}
	await new Promise((r) => setTimeout(r, 5000));
}
