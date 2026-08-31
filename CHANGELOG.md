# Changelog

## v1.3.0 — Reviewer fixes (resubmission) — 2026-08-31

### Fixed
- **Strict consensus-result gating** (`src/lib/genlayer.ts`): success is accepted ONLY for `FINISHED` / `FINISHED_WITH_RETURN`. `FINISHED_WITH_ERROR`, `NOT_VOTED`, `UNDETERMINED`, `LEADER_TIMEOUT`, any `*_WITH_ERROR`, and unknown/absent results are treated as failure. No optimistic UI; the tx hash is preserved on error. Added `classifyExecution()` and `SUCCESS_RESULTS`.
- **Payable single-argument stake validated before wallet** (`src/lib/actions.ts`): `parseStakeWei()` rejects empty / zero / negative / fractional amounts before `writeContract`. `stake(side)` is a single-argument payable call; the amount is passed only via tx `value` (> 0).
- **Escrow lifecycle** (`src/app/escrow/page.tsx`): `PENDING` is no longer labeled as confirmed.
- **Address consistency**: `tests/smoke.onchain.mjs` now targets the current Prediction Market `0x3d17bD6d87563cB172E7C634341fBc8A14574035` (was stale `0x72f6...`).

### Tests / build
- 60/60 passing (`vitest run`); production build passes (`next build`).
- New unit tests: `classifyExecution` (success/failure/pending), `parseStakeWei`, `stake.validate`, `stake.value`.

### On-chain proof (Testnet Bradbury, PM instance 0x8D0c1f6b433f12a937081f7f1FbBDC3Fd51B41B1)
| Action | Expected | Result | Tx |
| --- | --- | --- | --- |
| stake(value=0) | revert | FINISHED_WITH_ERROR | https://explorer-bradbury.genlayer.com/tx/0x397f21e174d5b59170c40108f4cc56ea842857c1b15cc21a39ee031d6af894df |
| stake(YES, value>0) | recorded | FINISHED_WITH_RETURN | https://explorer-bradbury.genlayer.com/tx/0x90253b2970cd2d2ff0fd7b2451305b28af42590733969684d05e00f0e3311485 |
| claim before settle | revert | reverted | https://explorer-bradbury.genlayer.com/tx/0x3a77877ef6fb216b1f75ca6e2ec87d3ddb7330f2e4eca82a254f58a967f52ff6 |
| dispute before resolve | revert | reverted | https://explorer-bradbury.genlayer.com/tx/0x2080382c3c2952842022174fd3a8913e18a7ae43749c89eff847bef2ab94b5f4 |
| void | voided | FINISHED_WITH_RETURN | https://explorer-bradbury.genlayer.com/tx/0x34d63ce2d94767500458c2b8d66b2eee3df12e05a2a1863cbdcfb2b49b1e7b22 |
| refund 1:1 | payout=stake | FINISHED_WITH_RETURN | https://explorer-bradbury.genlayer.com/tx/0x89a8c4a523512ad31c088ba8ca35e2d7c446d68e2615f8b3c5f6ca6d5e128adb |
| double refund | revert | reverted | https://explorer-bradbury.genlayer.com/tx/0xb14778bf16655213ad6fd6b8c497aca63d04bd6ab94875e0bb7473b6000193ef |
| re-void | revert | reverted | https://explorer-bradbury.genlayer.com/tx/0xf32b0042e531bf49c7642a40fdb1b3bc5f807c7bf2414fe766c5d4eaa68774d9 |

Multi-Source Oracle `update`: https://explorer-bradbury.genlayer.com/tx/0x5c3f94b50f9dc8c705f12bec8b5d37fffc3e0ef379eb44b2402c366cf2258c72 (status 7 = FINALIZED).

### Deployed addresses
- Prediction Market: `0x3d17bD6d87563cB172E7C634341fBc8A14574035`
- Multi-Source Oracle: `0x2Ab508Bb9Be84ea4ea8388b9b8872017729a2C82`
- Content Moderator: `0x235F51b11b9F96d6673df37553Ef58373c4324F9`
