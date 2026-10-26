# cheqd SDK quickstart

Go from nothing to a created and resolved `did:cheqd` DID on testnet with [`@cheqd/sdk`](https://github.com/cheqd/sdk), with your wallet funded from the [cheqd Studio testnet faucet](https://docs.cheqd.io/product/network/tools/testnet-faucet). Works from a terminal, VS Code or a coding agent such as Claude Code.

## Before you start

- Node 22 or later.
- A [cheqd Studio](https://studio.cheqd.net/) account on the Basic or Build plan (new accounts get a 30-day Basic trial), and an [API key](https://docs.cheqd.io/product/getting-started/studio/api-keys) from it. The faucet needs the key.

## Quick start

```bash
npm install
cp .env.example .env       # then set STUDIO_API_KEY
npm run 01:wallet          # creates a testnet mnemonic in .env and prints its cheqd1… address
npm run 02:fund            # Studio faucet funds that address (FUND_AMOUNT_CHEQ, default 10,000)
npm run 03:balance -- --wait
npm run 04:create-did
npm run 05:resolve
```

`npm run journey` runs steps 1 to 5 in one go. To go further: `npm run 06:create-resource`, `npm run 07:update-did`, and `npm run 08:deactivate-did -- --confirm` (permanent).

## Start a new project from this one

```bash
node bin/create-cheqd-sdk-app.mjs ../my-cheqd-app
```

This copies the scripts, `AGENTS.md`, `CLAUDE.md` and the Claude Code skill. It never copies `.env` or `.did.json`.

## What is here

| Path | What |
|---|---|
| `src/01…08-*.ts`, `src/sdk.ts`, `src/config.ts` | The journey, testnet only |
| `src/alt/studio-rest.ts` | The same outcomes through the cheqd Studio REST API (`npx tsx src/alt/studio-rest.ts`) |
| `AGENTS.md` / `CLAUDE.md` | Instructions for coding agents, including SDK behaviour the docs don't cover yet |
| `.claude/skills/cheqd-sdk-quickstart/` | Claude Code skill that runs the journey |
| `bin/create-cheqd-sdk-app.mjs` | Scaffolds a clean copy |

## Safety

Testnet only: `src/config.ts` refuses to run against mainnet. `.env` (your mnemonic and API key) and `.did.json` (your DID's private key) are gitignored; never commit or share them.

## Docs

- [Setup the cheqd SDK](https://docs.cheqd.io/product/advanced/sdk/setup-the-cheqd-sdk)
- [Testnet Faucet](https://docs.cheqd.io/product/network/tools/testnet-faucet)
- [Choosing an SDK](https://docs.cheqd.io/product/sdk/understanding-sdks)

## Licence

[Apache 2.0](LICENSE)
