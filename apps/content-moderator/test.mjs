import { readFileSync } from "node:fs";
import { createClient, createAccount } from "genlayer-js";
import { testnetBradbury } from "genlayer-js/chains";
import { TransactionStatus } from "genlayer-js/types";
const PK = process.env.PRIVATE_KEY;
if (!PK) { throw new Error("PRIVATE_KEY missing. Run: node --env-file=.env test.mjs"); }
const source = readFileSync("contracts/moderator.py", "utf8");
const code = new TextEncoder().encode(source);
const RULES = "No spam or advertising. No scams, phishing, or requests for private keys or seed phrases. No hate speech or harassment. No violence or threats. APPROVE compliant content, FLAG borderline content, REMOVE clear violations.";
const HARMFUL = "FREE CRYPTO!! Send 1 ETH to 0xGiveaway and get 10 ETH back instantly! DM me your wallet seed phrase now to claim your reward!!!";
const BENIGN = "Hey everyone, I just published a free open-source tutorial on setting up a Python dev environment. Hope it helps someone getting started!";
const account = createAccount(PK);
const client = createClient({ chain: testnetBradbury, account });
const ME = String(account.address);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let failed = 0;
const pass = (n) => console.log("PASS -", n);
const fail = (n, extra) => { console.log("FAIL -", n, extra ?? ""); failed++; };
const read = (addr) => client.readContract({ address: addr, functionName: "get_state", args: [] });
const isRevert = (r) => (r === "FINISHED_WITH_ERROR" || r === "REVERTED" || r === "SUBMIT_TIMEOUT");
const isCollision = (e) => { const m = String(e?.message || e); return m.includes("consensus contract") || m.includes("EVM tx") || m.includes("-32005") || m.includes("capacity") || m.includes("fetch failed") || m.includes("timeout"); };
const CATS = ["spam", "harassment", "hate", "violence", "sexual", "self_harm", "other", "none"];
async function deploy(content, itemId, sourceUrl) {
  let h = null;
  for (let attempt = 1; attempt <= 25; attempt++) {
    try { h = await client.deployContract({ code, args: [RULES, content, itemId, sourceUrl, ME] }); break; }
    catch (e) { if (isCollision(e)) { await sleep(20000); continue; } throw e; }
  }
  if (!h) throw new Error("deploy submit failed after retries");
  await client.waitForTransactionReceipt({ hash: h, status: TransactionStatus.ACCEPTED, retries: 300 });
  const tx = await client.getTransaction({ hash: h });
  const addr = tx?.txDataDecoded?.contractAddress ?? tx?.recipient;
  if (!addr || tx?.txExecutionResultName !== "FINISHED_WITH_RETURN") throw new Error("deploy failed: " + tx?.txExecutionResultName);
  return addr;
}
async function call(addr, fn, args) {
  let h = null;
  for (let attempt = 1; attempt <= 25; attempt++) {
    try { h = await client.writeContract({ address: addr, functionName: fn, args, value: 0 }); break; }
    catch (e) { if (isCollision(e)) { await sleep(20000); continue; } return "REVERTED"; }
  }
  if (!h) return "SUBMIT_TIMEOUT";
  try { await client.waitForTransactionReceipt({ hash: h, status: TransactionStatus.ACCEPTED, retries: 300 }); }
  catch (e) { return "REVERTED"; }
  for (let i = 0; i < 120; i++) {
    const tx = await client.getTransaction({ hash: h });
    const r = tx?.txExecutionResultName;
    if (r && r !== "NOT_VOTED") return r;
    await sleep(5000);
  }
  return "NOT_VOTED";
}
async function waitLeaves(addr, fromStatus) {
  let s;
  for (let i = 0; i < 220; i++) { s = await read(addr); if (s?.status !== fromStatus) return s; await sleep(5000); }
  return s;
}
console.log("### T1: harmful content moderated (FLAG/REMOVE) ###");
const c1 = await deploy(HARMFUL, "item-harmful", "https://example.com/post/1");
console.log("contract:", c1);
console.log("moderate:", await call(c1, "moderate", []));
const s1 = await waitLeaves(c1, "pending");
console.log("verdict:", s1?.verdict, "| status:", s1?.status);
(s1?.status === "moderated" && (s1?.verdict === "REMOVE" || s1?.verdict === "FLAG")) ? pass("harmful flagged/removed") : fail("expected FLAG/REMOVE", JSON.stringify(s1));
console.log("### T2: enforce (creator) moderated -> enforced ###");
const e2 = await call(c1, "enforce", []);
const s2 = await waitLeaves(c1, "moderated");
(!isRevert(e2) && s2?.status === "enforced") ? pass("enforced") : fail("enforce failed", JSON.stringify({ e2, status: s2?.status }));
console.log("### T3: appeal (author) enforced FLAG/REMOVE -> appealed ###");
const a3 = await call(c1, "appeal", ["I believe this was mislabeled, please reconsider."]);
const s3 = await waitLeaves(c1, "enforced");
(!isRevert(a3) && s3?.status === "appealed") ? pass("appealed") : fail("appeal failed", JSON.stringify({ a3, status: s3?.status }));
console.log("### T4: resolve_appeal (creator) appealed -> resolved ###");
const r4 = await call(c1, "resolve_appeal", []);
const s4 = await waitLeaves(c1, "appealed");
(!isRevert(r4) && s4?.status === "resolved" && ["UPHELD", "OVERTURNED"].includes(String(s4?.appeal_outcome))) ? pass("appeal resolved (" + s4?.appeal_outcome + ")") : fail("resolve_appeal failed", JSON.stringify({ r4, status: s4?.status, outcome: s4?.appeal_outcome }));
console.log("### T5: double moderate reverts ###");
const r5 = await call(c1, "moderate", []);
isRevert(r5) ? pass("double moderate reverted") : fail("expected revert on double moderate", r5);
console.log("### T6: enforce before moderate reverts ###");
const c6 = await deploy(HARMFUL, "item-guard", "https://example.com/post/6");
const r6 = await call(c6, "enforce", []);
isRevert(r6) ? pass("early enforce reverted") : fail("expected revert on early enforce", r6);
console.log("### T7: appeal before enforce reverts ###");
console.log("moderate:", await call(c6, "moderate", []));
await waitLeaves(c6, "pending");
const r7 = await call(c6, "appeal", ["too early, not enforced yet"]);
isRevert(r7) ? pass("appeal before enforce reverted") : fail("expected revert on early appeal", r7);
console.log("### T8: empty appeal note reverts (enforced case) ###");
console.log("enforce:", await call(c6, "enforce", []));
await waitLeaves(c6, "moderated");
const r8 = await call(c6, "appeal", ["   "]);
isRevert(r8) ? pass("empty appeal note reverted") : fail("expected revert on empty note", r8);
console.log("### T9: appeal on APPROVE verdict reverts ###");
const c9 = await deploy(BENIGN, "item-benign", "https://example.com/post/9");
console.log("moderate:", await call(c9, "moderate", []));
const s9 = await waitLeaves(c9, "pending");
console.log("verdict:", s9?.verdict);
console.log("enforce:", await call(c9, "enforce", []));
await waitLeaves(c9, "moderated");
const r9 = await call(c9, "appeal", ["I disagree with the approval."]);
isRevert(r9) ? pass("appeal on APPROVE reverted") : fail("expected revert on APPROVE appeal", JSON.stringify({ r9, verdict: s9?.verdict }));
console.log("### T10: set_content after moderated reverts (3-arg) ###");
const r10 = await call(c1, "set_content", ["new content", "item-x", "https://example.com/x"]);
isRevert(r10) ? pass("late set_content reverted") : fail("expected revert on late set_content", r10);
console.log("### T11: verdict metadata present ###");
const m = await read(c1);
const conf = Number(m?.confidence);
const catOk = CATS.includes(String(m?.category));
const confOk = Number.isFinite(conf) && conf >= 0 && conf <= 100;
const flagsOk = (m?.escalated === "true" || m?.escalated === "false") && (m?.needs_review === "true" || m?.needs_review === "false");
(confOk && catOk && flagsOk) ? pass("metadata valid") : fail("metadata invalid", JSON.stringify({ confidence: m?.confidence, category: m?.category, escalated: m?.escalated, needs_review: m?.needs_review }));
console.log("=====================================");
console.log(failed === 0 ? "ALL MODERATOR TESTS PASSED" : (failed + " TEST(S) FAILED"));
process.exitCode = failed === 0 ? 0 : 1;
