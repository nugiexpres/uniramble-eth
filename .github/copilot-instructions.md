## Quick orientation for AI coding agents

This repo is a Yarn workspaces monorepo derived from Scaffold-ETH 2. Focus areas:

- packages/hardhat — smart contracts, Hardhat config (`hardhat.config.ts`), deployments in `packages/hardhat/deploy` (see `00_deploy_your_contract_hardhat.ts`).
- packages/nextjs — Next.js 14 TypeScript frontend. Network + RPC config in `packages/nextjs/scaffold.config.ts`.
- packages/envio — Envio indexer generator and indexer runtime (`se-integration/*`, `generated/`).
- docs/ — high-level design, integration notes and troubleshooting.

How pieces interact (big picture)

- Contracts live in `packages/hardhat/contracts`. Deployments generate ABIs/addresses that are consumed by the frontend (`packages/nextjs/contracts/deployedContracts.ts`) and the Envio indexer.
- `hardhat`'s `deploy` task triggers `generateTsAbis` to keep TypeScript ABIs in sync.
- Envio's se-integration reads `deployedContracts.ts` and generates `config.yaml`, `schema.graphql`, and `src/EventHandlers.ts` for the indexer.

Essential commands (run from repo root)

```bash
# install
yarn install

# start local chain (Hardhat node)
yarn chain

# deploy contracts
yarn deploy

# start frontend (Next dev)
yarn start

# run hardhat tests
yarn hardhat:test
```

Project conventions and guardrails

- Use root scripts when possible — they delegate to workspace targets (e.g. `yarn deploy` runs `@se-2/hardhat` deploy).
- Keep secrets out of the repo: default API keys exist as fallbacks in code; always prefer env vars (ALCHEMY, ETHERSCAN, NEXT_PUBLIC_*).
- Deployment order matters: many contracts depend on prior addresses. Mirror the order in `00_deploy_your_contract_hardhat.ts`.
- After changing contracts or deploy scripts, regenerate ABIs/TS types (`yarn deploy` or `generateTsAbis`) and run the dev stack smoke test: `yarn chain` + `yarn deploy` + `yarn start`.

Key files to inspect first

- `packages/hardhat/hardhat.config.ts` — networks, named accounts, deploy hooks.
- `packages/hardhat/deploy/00_deploy_your_contract_hardhat.ts` — canonical deploy flow and role/config notes.
- `packages/nextjs/scaffold.config.ts` — frontend networks, polling, RPC overrides.
- `packages/nextjs/contracts/deployedContracts.ts` — single source-of-truth for addresses/ABIs consumed by Envio and the frontend.
- `packages/envio/se-integration/*` — parser + generators that produce indexer artifacts.

Common patterns an AI should follow

- When editing deploy scripts, preserve deployment order and `autoMine`/`delay` logic (rate-limit handling for Monad Testnet).
- Use `hre.deployments.get("Name")` pattern for reading deployed addresses.
- Update `deployedContracts.ts` (or run deploy flow) whenever contract names/ABIs change so Envio generator stays correct.

If anything here is unclear or you want examples (deploy script edits, Envio mapping, or frontend-contract call patterns), tell me which area to expand and I'll add short, focused examples.