#!/usr/bin/env node
// Scaffolds a testnet-only @cheqd/sdk project: scripts, AGENTS.md/CLAUDE.md and a Claude Code skill.
// Usage: node bin/create-cheqd-sdk-app.mjs <target-dir>
import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const target = resolve(process.argv[2] ?? '');
if (!process.argv[2]) {
	console.error('Usage: create-cheqd-sdk-app <target-dir>');
	process.exit(2);
}
if (existsSync(target) && readdirSync(target).length > 0) {
	console.error(`${target} is not empty; refusing to overwrite.`);
	process.exit(1);
}
mkdirSync(target, { recursive: true });

// Copy everything the generated project needs; never secrets, state or probes.
const include = ['AGENTS.md', 'CLAUDE.md', 'README.md', 'tsconfig.json', '.gitignore', '.env.example', '.agents', '.claude', '.gemini'];
// verbatimSymlinks keeps .claude/skills pointing at .agents/skills relatively, not at this checkout
for (const f of include) cpSync(join(root, f), join(target, f), { recursive: true, verbatimSymlinks: true });
cpSync(join(root, 'src'), join(target, 'src'), { recursive: true, filter: (p) => !p.includes(`${join('src', 'tools')}`) });

// Take dependency versions from this repo's package.json so they stay in step with what was tested.
const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));
pkg.name = target.split('/').pop();
writeFileSync(join(target, 'package.json'), JSON.stringify(pkg, null, 2) + '\n');

console.log(`Created ${target}\n\nNext:\n  cd ${target}\n  npm install\n  cp .env.example .env   # set STUDIO_API_KEY\n  npm run journey`);
