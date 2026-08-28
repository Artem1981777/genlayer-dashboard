# GenLayer Consensus Console

Interactive multi-contract dApp on GenLayer Testnet Bradbury. A thin browser client that submits real inputs to three deployed Intelligent Contracts and reads their on-chain state. Every consensus-critical decision (moderation verdicts, market outcomes, oracle values) is computed and stored on-chain by the contracts; the frontend never decides anything.

Live app: <https://artem1981777.github.io/genlayer-dashboard/>

## Intelligent Contracts

### Content Moderator
Source: apps/content-moderator/contracts/moderator.py

Validators reason over a natural-language policy via a custom equivalence-principle prompt and produce an on-chain verdict with category, confidence and rationale.

- moderate(): open to any caller while status is pending
- enforce(): creator only, after moderation
- appeal(note): content author only, when a FLAG or REMOVE verdict is enforced
- resolve_appeal(): creator only, on an appealed case

### Prediction Market
Source: apps/prediction-market/contracts/prediction_market.py

- stake(side): payable; takes ONE side argument (YES or NO) and requires a strictly positive value
- resolve(): creator only; resolves from cited web sources
- dispute(reason): gated — resolved market only, non-empty reason, and the caller must actually hold a stake in this market; max 2 dispute rounds
- resolve_dispute(): creator only, on a disputed market
- settle(): creator only; resolved market with a YES or NO outcome
- void(): creator only; only while status is open and the outcome is not yet a definite YES/NO -> moves the market to voided
- claim(): gated — settled market only, requires the caller's winning stake > 0, pays a pari-mutuel payout, single-use (anti-double-claim)
- refund(): voided market only; returns each staker's full position 1:1 via emit_transfer(value=u256(...), on="finalized"), single-use (anti-double-refund)

### Multi-Source Oracle
Source: apps/multi-source-oracle/contracts/oracle.py

- update(key): public; aggregates a median BTC/USD from 3 independent sources (Coinbase, CoinGecko, Kraken). Every publication-critical field — success flag, decimals, spread (bps), source count and sample provenance — is validator-checked or derived only from validated data, so nothing is published unless the validators independently agree. Deterministic, no LLM. Guards: tolerance 200 bps, max spread 500 bps
- register_feed / remove_feed: owner only

## Live contracts (Testnet Bradbury)

- Prediction Market: 0xdE2C020445cC5627Fa7E36b3f12FBcb5f781F70F
- Content Moderator: 0xc87881c7223e1d47Bf13EBDC50ADFaA0d0EFC4dC
- Content Moderator (portal-registered revision): 0x235f51b11b9f96d6673df37553ef58373c4324f9
- Multi-Source Oracle: 0x8D0d10E81fE03E418F575A9040494A94D2013a67

## Write lifecycle

Every action follows the same strict path in src/lib/genlayer.ts:

1. writeContract with functionName, args and value
2. await waitForTransactionReceipt with status ACCEPTED
3. verify the execution result is FINISHED or FINISHED_WITH_RETURN, and throw on any *ERROR* / NOT_VOTED / UNDETERMINED
4. only then re-read get_state with stateStatus accepted

Transient network, capacity and rate-limit errors are softened to a retriable Network busy, tap again message; execution errors are never hidden.

## Role- and phase-aware actions

Action buttons render only when the action is actually executable for the connected wallet in the current contract phase (creator-only, author-only and phase gates). A reviewer never sees a dead button or an error toast. The gating logic is a pure module: src/lib/actions.ts.

## Tech stack

- Next.js 15 (static export) + React 19
- genlayer-js + viem, EIP-6963 wallet discovery
- Tailwind CSS 4
- Deployed to GitHub Pages (gh-pages branch)

## Tests

40 unit tests, no mocks (vitest):

- src/lib/actions.test.ts: 25 unit tests for role/phase visibility across all three contracts, plus whyNot messages
- src/lib/projects.test.ts and src/lib/store.test.ts: config and tracked-contract store
- src/lib/genlayer.test.ts and src/lib/live-moderator.test.ts: live get_state reads against deployed contracts

Deterministic on-chain payable + gating tests (no LLM): apps/prediction-market/test-payable.mjs — 8 checks: zero-value stake reverts, claim-before-settle reverts, dispute-before-resolve reverts, payable stake recorded, void (open -> voided), refund 1:1, double-refund reverts, re-void reverts.

Run: npm install, then npm test, then npm run build

## On-chain proof

Payable path (stake -> void -> refund, 1:1):
- Stake (payable, positive value): <https://explorer-bradbury.genlayer.com/tx/0x6e60e4b9fb093010c6df26873f6e31b38f692bd1c033a47f33212be72cb4c0c6>
- Void (open -> voided): <https://explorer-bradbury.genlayer.com/tx/0x0723f61bf6ccc432517befb98e89170f040762867c6934f5a5ffdef01dc33026>
- Refund (payout == stake): <https://explorer-bradbury.genlayer.com/tx/0x90d456a0204286248e10fd703548450a506ecaf3ab9c7ef00240b3850bf11d52>

Oracle:
- Update (round 2, btc_usd=80404.66, spread 3 bps, ACCEPTED): <https://explorer-bradbury.genlayer.com/tx/0xefc533f5359633a9c5eb441bff63be24d9ba01552393198a5188be1f9efaeba2>

Deployments:
- Prediction Market deploy: <https://explorer-bradbury.genlayer.com/tx/0x98b5ed21603aabfac25c495d675a8890891427c8576d831f7c95eafc94ab86f9>
- Content Moderator deploy: <https://explorer-bradbury.genlayer.com/tx/0xa05d3619563ce7ca31f01b34f3f82f89e868c4a4131d5896513339ec6f001867>


## AI Escrow Arbiter

Interactive AI-adjudicated escrow, available in the dashboard at the /escrow route.

Live dApp: <https://artem1981777.github.io/genlayer-dashboard/escrow/>
Contract source: embedded in src/lib/escrow.ts (ESCROW_SOURCE), deployed fresh from the browser per escrow.

Instead of a human middleman, a validator-consensed AI decides whether held funds are released to the seller or refunded to the buyer, based on the escrow terms and the evidence submitted on-chain. The frontend is a full Web3 dApp: EIP-6963 wallet connection, automatic network switch to Testnet Bradbury, browser deployment, funding, evidence submission, AI resolution and payout — every step an on-chain transaction.

Contract methods:
- __init__(seller, amount_wei, terms): the deployer becomes the buyer
- fund(): payable, buyer only, requires value == amount; CREATED -> FUNDED
- submit_evidence(content): buyer or seller, append-only, while FUNDED
- resolve(): runs the AI arbiter; validators reach consensus on a RELEASE or REFUND verdict with a written reason; FUNDED -> RESOLVED
- payout(): releases held funds to the seller (RELEASE) or buyer (REFUND); replay-safe; RESOLVED -> PAID
- get_state / get_status / get_evidence: read-only views

Lifecycle: CREATED -> fund -> FUNDED -> submit evidence -> resolve (AI verdict) -> RESOLVED -> payout -> PAID.

How to use: connect a wallet, click "Create escrow (deploy)", then fund -> submit evidence -> resolve (AI) -> payout. Transient AI-consensus reverts on testnet are retried automatically, and the action buttons never lock up.

### Live escrow contracts (Testnet Bradbury)
- Portal-registered escrow: 0x6f33FF874366aEd9B071505Ffa1057072b8FC37C
- Demo escrow (full-cycle run): 0xf1f03acdC836d7A5747C87A280f04b0bC63c3457

### On-chain proof (full lifecycle, all accepted)
- Deploy: <https://explorer-bradbury.genlayer.com/tx/0x941a8ce197d15fa21fc04c86039c061f63c42129a388ec515c85f707d3afcecb>
- Fund: <https://explorer-bradbury.genlayer.com/tx/0x4312b3564f114952d95c6e28724748130b33c3d16103383fa2187e48f8877b4d>
- Evidence: <https://explorer-bradbury.genlayer.com/tx/0x95e04ee1053836ac43c5e0e110faa8ab57b97774741b08fd8c01590c1535cdcd>
- Resolve (AI verdict): <https://explorer-bradbury.genlayer.com/tx/0x20972b579e6be3b7684951ee542ed99a2d851ee8a1fb05e17ff71890afbe842d>
- Payout (PAID): <https://explorer-bradbury.genlayer.com/tx/0x3de6b50ec807f43a569c29c870a273f5658b41cf9cdad4f5c3e454df65e74ba7>
