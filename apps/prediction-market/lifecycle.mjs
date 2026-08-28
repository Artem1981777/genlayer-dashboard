import { readFileSync } from "node:fs";
import { createClient, createAccount } from "genlayer-js";
import { testnetBradbury } from "genlayer-js/chains";
import { TransactionStatus } from "genlayer-js/types";

const PRIVATE_KEY = process.env.PRIVATE_KEY;
if (!PRIVATE_KEY) { throw new Error("PRIVATE_KEY not found"); }
const ADDRESS = readFileSync("contract.txt", "utf8").trim();
console.log("PM:", ADDRESS);

const account = createAccount(PRIVATE_KEY);
const client = createClient({ chain: testnetBradbury, account });

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
function retryMsOf(e) {
  const c = e && (e.code === -32005 ? e : (e.cause && e.cause.code === -32005 ? e.cause : null));
  if (!c) return 0;
  const d = c.data || (e.cause && e.cause.data);
  const ra = d && d.retryAfterMs;
  return ra && ra > 0 ? ra : 1800;
}
async function send(label, fn) {
  for (let i = 1; i <= 8; i++) {
    try { return await fn(); }
    catch (e) {
      const w = retryMsOf(e);
      if (w > 0 && i < 8) { console.log(label + " throttled, retry " + i + " in " + w + "ms"); await sleep(w + 500); continue; }
      throw e;
    }
  }
}
async function waitTx(label, hash) {
  console.log(label + " tx:", hash);
  await client.waitForTransactionReceipt({ hash, status: TransactionStatus.ACCEPTED, retries: 300 });
  const tx = await client.getTransaction({ hash });
  console.log(label + " ->", tx?.statusName, tx?.txExecutionResultName);
  return tx;
}
async function state(tag) {
  const s = await client.readContract({ address: ADDRESS, functionName: "get_state", args: [] });
  console.log(tag + " | status=" + s.status + " outcome=" + JSON.stringify(s.outcome) + " yes_pool=" + s.yes_pool + " no_pool=" + s.no_pool + " positions=" + s.positions + " claims=" + s.claims);
  return s;
}

await state("INIT");

const STAKE = 1000000000000000n;
const h1 = await send("stake", () => client.writeContract({ address: ADDRESS, functionName: "stake", args: ["YES"], value: STAKE }));
await waitTx("stake", h1);
await state("AFTER-STAKE");

const h2 = await send("void", () => client.writeContract({ address: ADDRESS, functionName: "void", args: [], value: 0n }));
await waitTx("void", h2);
await state("AFTER-VOID");

const h3 = await send("refund", () => client.writeContract({ address: ADDRESS, functionName: "refund", args: [], value: 0n }));
await waitTx("refund", h3);
const s = await state("AFTER-REFUND");

console.log("=== LIFECYCLE PROOF (stake -> void -> refund) ===");
console.log("stake tx:", h1);
console.log("void tx:", h2);
console.log("refund tx:", h3);
const claims = JSON.parse(s.claims);
const vals = Object.values(claims);
const refunded = vals.find((v) => v && v.claimed === true && Number(v.payout) === Number(STAKE));
const ok = s.status === "voided" && !!refunded;
console.log("refund record:", JSON.stringify(refunded));
console.log(ok ? ">>> LIFECYCLE OK: staked, voided, refunded 1:1" : "!!! LIFECYCLE CHECK FAILED");
