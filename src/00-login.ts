import { spawn } from 'node:child_process';
import { createHash, randomBytes } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { createServer } from 'node:http';
import { hostname } from 'node:os';
import { config } from './config.js';

// Signs in to cheqd Studio (or signs up) in the browser, creates a Studio API key and saves it to .env as
// STUDIO_API_KEY. The key never appears in the terminal. Uses OAuth authorisation code with PKCE against cheqd's
// LogTo, through a "Native" application that redirects to this machine.
const loginEndpoint = process.env.CHEQD_LOGIN_ENDPOINT ?? 'https://service-auth.cheqd.net';
const clientId = process.env.CHEQD_LOGIN_APP_ID ?? '';
const port = Number(process.env.CHEQD_LOGIN_PORT ?? 47123);
const redirectUri = `http://127.0.0.1:${port}/callback`;
const signUp = process.argv.includes('--signup');
const force = process.argv.includes('--force');
const noBrowser = process.argv.includes('--no-browser');
const timeoutMs = 5 * 60 * 1000;

if (process.env.STUDIO_API_KEY && !force) {
	console.log('STUDIO_API_KEY is already set in .env. Run `npm run 00:login -- --force` to replace it.');
	process.exit(0);
}
if (!clientId) {
	console.error(`Browser login is not configured (CHEQD_LOGIN_APP_ID is empty). Get a key by hand instead:
  1. Sign up at https://studio.cheqd.net/ with Google, GitHub or an email address.
  2. Open https://studio.cheqd.net/developers (user menu > API Keys) and create a key.
  3. Add it to .env as STUDIO_API_KEY=...`);
	process.exit(2);
}

const base64url = (buf: Buffer) => buf.toString('base64url');
const verifier = base64url(randomBytes(32));
const challenge = base64url(createHash('sha256').update(verifier).digest());
const state = base64url(randomBytes(16));

const authUrl = new URL('/oidc/auth', loginEndpoint);
authUrl.search = new URLSearchParams({
	client_id: clientId,
	redirect_uri: redirectUri,
	response_type: 'code',
	scope: 'openid profile email roles',
	code_challenge: challenge,
	code_challenge_method: 'S256',
	state,
	...(signUp ? { first_screen: 'register' } : {}),
}).toString();

const code = await waitForCode();
const idToken = await exchangeCode(code);
const apiKey = await createApiKey(idToken);
saveApiKey(apiKey);
console.log('Saved a new cheqd Studio API key to .env as STUDIO_API_KEY.');
console.log('\nNext: npm run 01:wallet, then npm run 02:fund');

function waitForCode(): Promise<string> {
	return new Promise((resolve, reject) => {
		const server = createServer((req, res) => {
			const url = new URL(req.url ?? '/', redirectUri);
			if (url.pathname !== '/callback') {
				res.writeHead(404).end();
				return;
			}
			const error = url.searchParams.get('error');
			const returnedCode = url.searchParams.get('code');
			const ok = !error && returnedCode && url.searchParams.get('state') === state;
			res.writeHead(ok ? 200 : 400, { 'content-type': 'text/plain; charset=utf-8' }).end(
				ok
					? 'Signed in to cheqd Studio. You can close this tab and return to your terminal.'
					: 'Sign-in failed. Return to your terminal for details.'
			);
			clearTimeout(timer);
			server.close();
			if (ok) resolve(returnedCode);
			else
				reject(
					new Error(
						error
							? `Sign-in failed: ${error} ${url.searchParams.get('error_description') ?? ''}`
							: 'Sign-in failed: state mismatch'
					)
				);
		});
		const timer = setTimeout(() => {
			server.close();
			reject(new Error('Timed out after 5 minutes waiting for the browser sign-in.'));
		}, timeoutMs);
		server.on('error', reject);
		server.listen(port, '127.0.0.1', () => {
			console.log(`Opening your browser to ${signUp ? 'sign up for' : 'sign in to'} cheqd Studio.`);
			console.log(`If it does not open, visit:\n\n  ${authUrl}\n`);
			if (!noBrowser) openBrowser(authUrl.toString());
		});
	});
}

function openBrowser(url: string) {
	const [cmd, args] =
		process.platform === 'darwin'
			? ['open', [url]]
			: process.platform === 'win32'
				? ['cmd', ['/c', 'start', '""', url]]
				: ['xdg-open', [url]];
	try {
		spawn(cmd, args, { stdio: 'ignore', detached: true }).on('error', () => {}).unref();
	} catch {
		// the URL is printed above
	}
}

async function exchangeCode(authCode: string): Promise<string> {
	const res = await fetch(new URL('/oidc/token', loginEndpoint), {
		method: 'POST',
		headers: { 'content-type': 'application/x-www-form-urlencoded' },
		body: new URLSearchParams({
			grant_type: 'authorization_code',
			code: authCode,
			redirect_uri: redirectUri,
			client_id: clientId,
			code_verifier: verifier,
		}),
	});
	const body = (await res.json().catch(() => ({}))) as { id_token?: string; error?: string; error_description?: string };
	if (!res.ok || !body.id_token) {
		throw new Error(`Token exchange failed (${res.status}): ${body.error ?? ''} ${body.error_description ?? ''}`);
	}
	return body.id_token;
}

// A new account is set up by Studio a few seconds after sign-up, so retry while Studio does not know the user yet.
async function createApiKey(token: string): Promise<string> {
	const deadline = Date.now() + 90_000;
	for (;;) {
		const res = await fetch(`${config.studioApiUrl}/admin/api-key/create`, {
			method: 'POST',
			headers: { 'content-type': 'application/json', authorization: `Bearer ${token}` },
			body: JSON.stringify({ name: `cheqd-sdk-quickstart (${hostname()})` }),
		});
		const text = await res.text();
		if (res.ok) {
			const { apiKey } = JSON.parse(text) as { apiKey?: string };
			if (!apiKey) throw new Error('Studio created a key but did not return it.');
			return apiKey;
		}
		const settingUp = res.status === 500 && text.includes('not found in internal storage');
		if (settingUp && Date.now() < deadline) {
			console.log('Waiting for cheqd Studio to finish setting up the new account...');
			await new Promise((r) => setTimeout(r, 3000));
			continue;
		}
		const hint =
			res.status === 401 || res.status === 403
				? ' Your account may not be allowed to create API keys yet. Check https://studio.cheqd.net/developers.'
				: '';
		throw new Error(`Studio could not create an API key (${res.status}).${hint} ${text}`);
	}
}

function saveApiKey(key: string) {
	if (!existsSync('.env')) writeFileSync('.env', readFileSync('.env.example', 'utf8'));
	const env = readFileSync('.env', 'utf8');
	const line = `STUDIO_API_KEY="${key}"`;
	writeFileSync(
		'.env',
		/^STUDIO_API_KEY=.*$/m.test(env) ? env.replace(/^STUDIO_API_KEY=.*$/m, line) : `${env.trimEnd()}\n${line}\n`
	);
}
