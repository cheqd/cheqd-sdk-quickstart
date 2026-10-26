import { appendFileSync, existsSync, readFileSync, writeFileSync } from 'node:fs';
import { DirectSecp256k1HdWallet } from '@cosmjs/proto-signing';
import './config.js'; // side effect: loads .env

// Reuse the existing mnemonic if there is one; never overwrite it.
let mnemonic = process.env.CHEQD_MNEMONIC;
if (!mnemonic) {
	const wallet = await DirectSecp256k1HdWallet.generate(24, { prefix: 'cheqd' });
	mnemonic = wallet.mnemonic;
	if (!existsSync('.env')) writeFileSync('.env', readFileSync('.env.example', 'utf8'));
	const env = readFileSync('.env', 'utf8');
	if (/^CHEQD_MNEMONIC=.+$/m.test(env)) throw new Error('.env already has a mnemonic; refusing to overwrite');
	writeFileSync('.env', env.replace(/^CHEQD_MNEMONIC=.*$/m, `CHEQD_MNEMONIC="${mnemonic}"`));
	console.log('Generated a new testnet mnemonic and saved it to .env (gitignored).');
}

const wallet = await DirectSecp256k1HdWallet.fromMnemonic(mnemonic, { prefix: 'cheqd' });
const [account] = await wallet.getAccounts();
console.log(`Address: ${account.address}`);
console.log('\nNext: npm run 02:fund (needs STUDIO_API_KEY in .env)');
