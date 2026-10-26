---
name: cheqd-sdk-quickstart
description: Get a developer from nothing to a created and resolved did:cheqd DID on testnet with @cheqd/sdk, funded through cheqd Studio. Use when the user wants to start building on cheqd, create a DID or DID-Linked Resource with the SDK, or fund a cheqd testnet wallet.
---

# cheqd SDK quickstart (testnet only)

Read `AGENTS.md` in the project root first: it holds the rules, the commands and the SDK gotchas that the public docs omit.

## Procedure

1. Check preconditions: Node >= 22 (`node -v`), `npm install` done, `.env` exists with `STUDIO_API_KEY` set. Never print the key or the mnemonic. If `STUDIO_API_KEY` is empty, stop and ask the user to add it to `.env` themselves.
2. Run `npm run typecheck`. Do not continue on failure.
3. Run `npm run journey` (wallet, fund, balance, create DID, resolve). If funding returns 401/403/429, stop and report the status and body.
4. Report the resolved DID and the transaction hash. Do not claim success without the line `Resolved did:cheqd:testnet:...`.
5. Optional follow-ups, each after the previous succeeded: `npm run 06:create-resource`, `npm run 07:update-did`. `npm run 08:deactivate-did -- --confirm` is permanent: only run it if the user asks.

## Do not

- Use mainnet, or edit `src/config.ts` to allow it.
- Call `sdk.*Tx` methods with fewer arguments than the full signature (see AGENTS.md gotcha 1).
- Retry funding in a loop.
