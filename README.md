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
| `.agents/skills/cheqd-sdk-quickstart/` | Agent skill that runs the journey (`.claude/skills/` links to it for Claude Code) |
| `.gemini/settings.json` | Makes Gemini CLI read `AGENTS.md` |
| `bin/create-cheqd-sdk-app.mjs` | Scaffolds a clean copy |

## Use with a coding agent

Open the project in your agent and ask it to "create a cheqd DID on testnet". It reads the instructions and the skill from these files:

| Agent | Instructions | Skill |
|---|---|---|
| Claude Code | `CLAUDE.md`, which imports `AGENTS.md` | `.claude/skills/` |
| OpenAI Codex (CLI, IDE, app) | `AGENTS.md` | `.agents/skills/` |
| Cursor | `AGENTS.md` | `.agents/skills/` |
| GitHub Copilot (VS Code agent mode, CLI, cloud agent) | `AGENTS.md` | `.agents/skills/` |
| Gemini CLI | `AGENTS.md`, via `.gemini/settings.json` | `.agents/skills/` |
| Other agents that read `AGENTS.md` | `AGENTS.md` | Ask it to follow `.agents/skills/cheqd-sdk-quickstart/SKILL.md` |

Each agent stops at `02:fund` if `STUDIO_API_KEY` is missing and prints how to get one: you create the cheqd Studio account yourself.

**Cloud agents** (Codex cloud, Copilot cloud agent, Jules) run in a remote sandbox, so:

- Allow outbound access to `rpc.cheqd.network`, `studio-api.cheqd.net` and `resolver.cheqd.net`. Codex cloud turns internet access off during the agent phase by default, and Copilot's firewall only allows a default list of hosts.
- Give the agent `STUDIO_API_KEY` as an environment variable it can read while it works. Codex cloud removes *secrets* before the agent phase, so set it as an environment variable there, or run `npm run 01:wallet && npm run 02:fund` in the setup script.
- The wallet mnemonic and `.did.json` live only in that sandbox. They are fine for a testnet demo, but you cannot update or deactivate the DID later unless you keep them.

**ChatGPT** (the chat app) cannot run this project, because it has no shell on your machine. Use Codex, which comes with ChatGPT plans, instead.

## Safety

Testnet only: `src/config.ts` refuses to run against mainnet. `.env` (your mnemonic and API key) and `.did.json` (your DID's private key) are gitignored; never commit or share them.

## Docs

- [Setup the cheqd SDK](https://docs.cheqd.io/product/advanced/sdk/setup-the-cheqd-sdk)
- [Testnet Faucet](https://docs.cheqd.io/product/network/tools/testnet-faucet)
- [Choosing an SDK](https://docs.cheqd.io/product/sdk/understanding-sdks)

## Licence

[Apache 2.0](LICENSE)
