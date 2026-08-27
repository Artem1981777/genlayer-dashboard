# GenLayer Consensus Console

Interactive multi-contract dApp on GenLayer Testnet Bradbury. A thin browser client that submits real inputs to three deployed Intelligent Contracts and reads their on-chain state. Every consensus-critical decision (moderation verdicts, market outcomes, oracle values) is computed and stored on-chain by the contracts; the frontend never decides anything.

Live app: https://artem1981777.github.io/genlayer-dashboard/

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

- stake(side): payable; takes ONE side argument (YES or NO) and requires a positive value
- resolve(): creator only; resolves from cited web sources
- dispute(reason): on a resolved market
- resolve_dispute(): creator only, on a disputed market
- settle(): creator only; resolved market with a YES or NO outcome
- claim(): after settlement

### Multi-Source Oracle
Source: apps/multi-source-oracle/contracts/oracle.py

- update(key): public; aggregates a median BTC/USD from 3 independent sources (Coinbase, CoinGecko, Kraken) with tolerance and max-spread guards
- register_feed / remove_feed: owner only

## Live contracts (Testnet Bradbury)

- Prediction Market (open): 0xd5fbdf280d1726079d3741B4E18BaD656851A34d
- Content Moderator (interactive, pending): 0x16cD8F92DEdDBdF27E7bc8c53633C61Dbb352307
- Multi-Source Oracle: 0xfdE0d2cBD651FC3E7c14fFEc7D981A05E2969DCC

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

40 tests, no mocks (vitest):

- src/lib/actions.test.ts: 25 unit tests for role/phase visibility across all three contracts, plus whyNot messages
- src/lib/projects.test.ts and src/lib/store.test.ts: config and tracked-contract store
- src/lib/genlayer.test.ts and src/lib/live-moderator.test.ts: live get_state reads against deployed contracts

Run: npm install, then npm test, then npm run build

## On-chain proof

- Successful Stake: https://explorer-bradbury.genlayer.com/tx/0x996e9e349164a28f61826561485b2e33317708586f4202365c6d6da7c53d5f4a
- Successful Stake: https://explorer-bradbury.genlayer.com/tx/0x8311614e2fde0c813a68c4b3e08aecd847c52819cb81dffd42f5fa5545e9c070
