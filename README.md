# ◆ GenLayer Builder Dashboard

One dashboard to track, operate, and **prove** GenLayer Intelligent Contracts — live on Testnet Bradbury (chain 4221). Two builder projects, one UI.

**Live:** https://artem1981777.github.io/genlayer-dashboard/

## What it is

A control room for my GenLayer builder projects. It reads on-chain contract state in real time and lets you run contract actions straight from the browser with any injected wallet — no CLI needed. Both projects below are tracked and operated from this single interface.

## Projects tracked

| Project | What it does | Repo | Latest contract |
| --- | --- | --- | --- |
| Content Moderator | Self-calibrating AI content moderation with appeals | [repo](https://github.com/Artem1981777/genlayer-content-moderator) · [apps/content-moderator](https://github.com/Artem1981777/genlayer-dashboard/tree/main/apps/content-moderator) | [0x235F…24F9](https://explorer-bradbury.genlayer.com/address/0x235F51b11b9F96d6673df37553Ef58373c4324F9) |
| Prediction Market | Web-evidenced resolver with disputes | [repo](https://github.com/Artem1981777/genlayer-prediction-market) · [apps/prediction-market](https://github.com/Artem1981777/genlayer-dashboard/tree/main/apps/prediction-market) | [0x72f6…3914](https://explorer-bradbury.genlayer.com/address/0x72f6BE503a8319A40515641536C1d74378623914) |

## Features

- Multi-wallet Connect via EIP-6963 — OKX, Rabby, MetaMask, Coinbase, Trust, and any injected provider
- Auto network handling — switches to GenLayer Bradbury (4221) and auto-adds it if missing
- Wrong-network protection — every write re-checks chainId and blocks accidental tx on other networks
- Live state — polls get_state and renders decisions, confidence, and history
- Actions from the UI — moderate, enforce, appeal, resolve, settle, stake, claim, and more, with toasts and Explorer links
- Analytics view with charts

## Live proof — real on-chain actions from the UI

Every transaction below was executed **from the dashboard UI**, signed by an **external wallet** `0xdc67…7FBD` (not the deploy key) — exactly how a judge would use it. All finalized by GenLayer consensus (5/5 validators revealed, result=1).

| # | Action | Contract | Transaction |
| --- | --- | --- | --- |
| 1 | moderate | Content Moderator | [0x74b242…f982a](https://explorer-bradbury.genlayer.com/tx/0x74b242b3292f2a190db8420ffc416baf30287e70426cd59f9db51976945f982a) |
| 2 | enforce | Content Moderator | [0xcc6da1…dfbb11](https://explorer-bradbury.genlayer.com/tx/0xcc6da1a9e48ee011eade9314bfba187ebe5e51f671df5d2b71df70a935dfbb11) |
| 3 | resolve_appeal | Content Moderator | [0xfd102a…c7c03f](https://explorer-bradbury.genlayer.com/tx/0xfd102a321ec860f88d5443db1f3cf36b9423fc0373a6e3dbacc704ce5ac7c03f) |
| 4 | stake (YES) | Prediction Market | [0x3acd32…2429e0](https://explorer-bradbury.genlayer.com/tx/0x3acd32b5f1f3b3afaedb13e10f431b241e980c91d533120ed71f63165d2429e0) |
| 5 | resolve | Content Moderator | [0x00716c…377dbf](https://explorer-bradbury.genlayer.com/tx/0x00716c8057deb4a6b8a0aad4ee2fa9a34a326956193c24bd7242ca6265377dbf) |
| 6 | settle | Content Moderator | [0xe4a295…3069c](https://explorer-bradbury.genlayer.com/tx/0xe4a295ce8175d5fdfa20c4993e780068c137b375c9e232eef0880c24abe3069c) |
| 7 | claim | Prediction Market | [0x7ec391…0c2e26](https://explorer-bradbury.genlayer.com/tx/0x7ec3910212f62e8f9b2f76d749c0a70f9ba7d4220d6de09e11e46d02e70c2e26) |

## The projects in depth

### 1. Content Moderator — self-calibrating AI moderation

An Intelligent Contract that judges user content against a natural-language rules policy using GenLayer's LLM-powered validators. It returns a verdict — Approve, Flag, or Remove — with a confidence score and a written rationale, and supports a full appeal loop so decisions can be re-examined on-chain.

**How the contract works**

- `ingest(url)` — fetch the live page at the URL under consensus and store it as the content to moderate (author = tx signer); the rules policy is set at deploy
- `moderate` — validators read the content, apply the rules, and reach consensus on a verdict + confidence
- `enforce` — apply the moderation outcome as the contract's active state
- `appeal(note)` — submit a reasoned appeal against the current verdict
- `resolve_appeal` — validators re-evaluate the case in light of the appeal and finalize
- `reverify_source` — re-fetch the source URL and confirm the stored content still matches
- Views: `read_content`, `verify_content`, `get_state`

**Lifecycle**

1. Deploy with a rules policy
2. `ingest(url)` → fetch + store the live content
3. `moderate` → verdict + confidence + rationale
4. `enforce` the outcome
5. `appeal(note)` if contested
6. `resolve_appeal` → final decision

**Deployments (Bradbury)**

| Version | Address |
| --- | --- |
| v0.5.0 (latest) | [0x235F51b1…4324F9](https://explorer-bradbury.genlayer.com/address/0x235F51b11b9F96d6673df37553Ef58373c4324F9) |
| v0.4.0 | [0x30Bb0bc6…F77EB7](https://explorer-bradbury.genlayer.com/address/0x30Bb0bc6dA84d377C339949DDfF2d87539F77EB7) |
| v0.3.0 | [0xbf844361…C17fC5](https://explorer-bradbury.genlayer.com/address/0xbf844361E8d9CD30a11ff4b6Fe7E715413C17fC5) |
| v0.2.0 | [0xDB04fa7B…0D7C64](https://explorer-bradbury.genlayer.com/address/0xDB04fa7B220F34D222168f8708bCb350300D7C64) |
| v0.1.0 | [0x237fD615…1370DC](https://explorer-bradbury.genlayer.com/address/0x237fD615062d9C952659DC357eaA94B8Be1370DC) |

**On-chain evidence:** moderate, enforce, resolve_appeal, resolve, and settle — see rows 1, 2, 3, 5, 6 in the Live proof table above.

Repo: https://github.com/Artem1981777/genlayer-content-moderator · Demo: https://artem1981777.github.io/genlayer-content-moderator/

### 2. Prediction Market — web-evidenced resolver with disputes

An Intelligent Contract for binary (YES/NO) prediction markets that resolves outcomes from real web evidence. Validators fetch and agree on sources, participants stake on either side, and a dispute path lets a wrong resolution be challenged before settlement and payout.

**How the contract works**

- `add_source` — attach a web source used as evidence for resolution
- `stake(side, amount)` — stake on YES or NO with an integer amount
- `resolve()` — validators read the sources and agree on the outcome
- `dispute(reason)` — challenge the resolved outcome with a reason
- `resolve_dispute()` — creator finalizes the disputed outcome
- `settle()` — creator locks the final outcome for payouts
- `claim()` — winning stakers claim their payout
- Views: `get_state`, `verify_question`, `verify_rules`

**Lifecycle**

1. Deploy with a market question + rules
2. `add_source` (evidence)
3. `stake` YES / NO
4. `resolve` → outcome from web evidence
5. `dispute(reason)` → `resolve_dispute` (if challenged)
6. `settle` → `claim`

**Deployments (Bradbury)**

| Version | Address |
| --- | --- |
| v0.4.0 (latest) | [0x72f6BE50…623914](https://explorer-bradbury.genlayer.com/address/0x72f6BE503a8319A40515641536C1d74378623914) |
| v0.3.0 | [0x86d36795…C289C8ba](https://explorer-bradbury.genlayer.com/address/0x86d36795b66c29A7445945585a4C9f09C289C8ba) |
| v0.2.0 | [0x5853abFE…0314C969](https://explorer-bradbury.genlayer.com/address/0x5853abFE0CBF83ac65cd3DACFB35Bb1B0314C969) |

**On-chain evidence**

- stake (YES) — [0x3acd32…2429e0](https://explorer-bradbury.genlayer.com/tx/0x3acd32b5f1f3b3afaedb13e10f431b241e980c91d533120ed71f63165d2429e0)
- claim — [0x7ec391…0c2e26](https://explorer-bradbury.genlayer.com/tx/0x7ec3910212f62e8f9b2f76d749c0a70f9ba7d4220d6de09e11e46d02e70c2e26)
- resolve (outcome YES) — [0x1fb267…d3200](https://explorer-bradbury.genlayer.com/tx/0x1fb267f316feb19911b363e1baef11cb32238746b42974cc16b509b47e0d3200)
- dispute — [0x666d9f…9db3c9](https://explorer-bradbury.genlayer.com/tx/0x666d9f1344a6177d3dbadff00b6cc75bbd0dad5b9197b041596d59b1b79db3c9)

Repo: https://github.com/Artem1981777/genlayer-prediction-market

## Repository layout

This is a monorepo. The dashboard UI lives at the root; each tracked project's full source is vendored under apps/ via git subtree.

    genlayer-dashboard/
      src/                      # dashboard UI (Next.js)
      apps/
        content-moderator/      # Content Moderator contract + tooling
        prediction-market/      # Prediction Market contract + tooling

## Tech stack

Next.js 15 · React 19 · genlayer-js · viem · framer-motion · recharts · sonner · Tailwind CSS 4

## Run locally

    npm install
    npm run dev

Then open http://localhost:3000/genlayer-dashboard/

## Deploy (GitHub Pages)

    npm run build

Publish the static out/ folder to the gh-pages branch.

## Network — GenLayer Testnet Bradbury

- Chain ID: 4221 (0x107d)
- RPC: https://rpc-bradbury.genlayer.com
- Explorer: https://explorer-bradbury.genlayer.com
- Faucet: https://testnet-faucet.genlayer.foundation

---

Built by Artem1981777 for the GenLayer Foundation Builder track.

## v0.6.0 — Content Moderator upgrade

- Multi-axis verdict with per-category axis_scores, severity, and prompt-injection detection.
- Staked appeals: fund_pool, appeal (author stakes GEN), resolve_appeal (refund+bonus on overturn, forfeit on uphold).
- Live v0.6.0 contract with full on-chain lifecycle: 0x16C0747A98dCa576Fd1A495DD5FA2be0E1333192 (Bradbury).


---

## Submission Evidence — Project: GenLayer Consensus Console (dashboard)

Portal submission #710849D6-D48E-46C7-96F4-5BB92C4F5CFC · Pending review · Category: Projects (Builder)

### Final evidence set (correct)
- GitHub Repo: https://github.com/Artem1981777/genlayer-dashboard
- Live demo: https://artem1981777.github.io/genlayer-dashboard/
- Contract — Content Moderator: https://explorer-bradbury.genlayer.com/address/0x235F51b11b9F96d6673df37553Ef58373c4324F9
- Contract — Prediction Market: https://explorer-bradbury.genlayer.com/address/0x72f6BE503a8319A40515641536C1d74378623914
- Contract — Multi-Source Oracle: https://explorer-bradbury.genlayer.com/address/0x9a87961693FF753de5AeBcfD72D861BD21C9d0A4
- Live proof tx (Update feed from UI): https://explorer-bradbury.genlayer.com/tx/0xab8bc4c61ba1786edb2ee3d43e048412bcdc52aafc4efc17c35d67f72c1a5676

### Accepted by portal
- https://github.com/Artem1981777/genlayer-dashboard
- https://explorer-bradbury.genlayer.com/address/0x72f6BE503a8319A40515641536C1d74378623914
- https://explorer-bradbury.genlayer.com/tx/0xab8bc4c61ba1786edb2ee3d43e048412bcdc52aafc4efc17c35d67f72c1a5676

### To add
- https://explorer-bradbury.genlayer.com/address/0x235F51b11b9F96d6673df37553Ef58373c4324F9 (moderator — type GenLayer Explorer Contract)
- https://explorer-bradbury.genlayer.com/address/0x9a87961693FF753de5AeBcfD72D861BD21C9d0A4 (oracle — type GenLayer Explorer Contract)
- https://artem1981777.github.io/genlayer-dashboard/ (live — type URL LINK)

### Remove (belongs to escrow, different project)
- https://explorer-bradbury.genlayer.com/tx/0x8587b750b2ddb3f81efd886c66d14d131128f78339397e1eeba3f2dc68f00fbf
- https://explorer-bradbury.genlayer.com/tx/0xb81bb8aef18cab6fb90a465ba2eff1d0dae9edcc53b9ee4963de912f622da675 (added twice)
- https://explorer-bradbury.genlayer.com/address/0x679f4657d126Aa973A070E59654b6B8c37EaA7c0

### Rejected by portal
- https://github.com/Artem1981777/genlayer-escrow-dapp — "This URL has already been submitted" (escrow repo already used earlier)


## Steward Review — Fixes (Aug 26, 2026)

Submission #710849 (Projects · Builder). Steward Pavel Kolosov requested two changes; both addressed and redeployed.

### 1. Accepted-receipt lifecycle
The write path now awaits and verifies an accepted receipt before refreshing state: `writeContract` -> `await waitForTransactionReceipt(status = ACCEPTED)` -> verify `txExecutionResult` (FINISHED) -> only then re-read `get_state` (`stateStatus = "accepted"`). Implemented in `src/lib/genlayer.ts` (`sendWrite`, `readState`) and live in the deployed app.

### 2. Contract source for every advertised action
Each advertised action maps to a real method on the deployed contract, verified on-chain via `readContract`:

- Oracle `0x9a87961693FF753de5AeBcfD72D861BD21C9d0A4` -> `update`
- Prediction `0x72f6BE503a8319A40515641536C1d74378623914` -> `stake, resolve, dispute, resolve_dispute, settle, claim`
- Moderator `0x235F51b11b9F96d6673df37553Ef58373c4324F9` -> `moderate, enforce, appeal, resolve_appeal`

### Evidence links
Contract sources (in this repo):

- Oracle: https://github.com/Artem1981777/genlayer-dashboard/blob/main/apps/multi-source-oracle/contracts/oracle.py
- Prediction: https://github.com/Artem1981777/genlayer-dashboard/blob/main/apps/prediction-market/contracts/prediction_market.py
- Moderator: https://github.com/Artem1981777/genlayer-dashboard/blob/main/apps/content-moderator/contracts/moderator.py

On-chain & app:

- Live app: https://artem1981777.github.io/genlayer-dashboard/
- Prediction contract (explorer): https://explorer-bradbury.genlayer.com/address/0x72f6BE503a8319A40515641536C1d74378623914
- Oracle `update` tx: https://explorer-bradbury.genlayer.com/tx/0xab8bc4c61ba1786edb2ee3d43e048412bcdc52aafc4efc17c35d67f72c1a5676
- Repository: https://github.com/Artem1981777/genlayer-dashboard

