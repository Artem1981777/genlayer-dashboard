import { readFileSync } from "node:fs";
import { createClient, createAccount } from "genlayer-js";
import { testnetBradbury } from "genlayer-js/chains";

const PRIVATE_KEY = process.env.PRIVATE_KEY;
if (!PRIVATE_KEY) { throw new Error("PRIVATE_KEY not found"); }
const ADDRESS = readFileSync("contract.txt", "utf8").trim();
console.log("PM:", ADDRESS);
const account = createAccount(PRIVATE_KEY);
const client = createClient({ chain: testnetBradbury, account });
const ME = String(account.address).toLowerCase();
const STAKE = 1000000000000000;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
function retryMsOf(e) {
  const c = e && (e.code === -32005 ? e : (e.cause && e.cause.code === -32005 ? e.cause : null));
  if (!c) return 0;
  const d = c.data || (e.cause && e.cause.data);
  const ra = d && d.retryAfterMs;
  return ra && ra > 0 ? ra : 2000;
}
function isTransient(e) {
  let m = "";
  try { m = (e && (e.shortMessage || e.message || "")) + " " + (e && e.details || ""); } catch (x) { m = String(e); }
  return m.indexOf("fetch failed") >= 0 || m.indexOf("ECONNABORTED") >= 0 || m.indexOf("ECONNRESET") >= 0 || m.indexOf("capacity") >= 0 || m.indexOf("-32005") >= 0 || m.indexOf("timeout") >= 0 || m.indexOf("socket") >= 0;
}
async function robust(label, fn, tries) {
  const T = tries || 60;
  for (let i = 1; i <= T; i++) {
    try { return await fn(); }
    catch (e) {
      if (isTransient(e) && i < T) { const w = retryMsOf(e) || 3000; console.log(label + " transient, retry " + i + " in " + w + "ms"); await sleep(w + 500); continue; }
      throw e;
    }
  }
}
async function state(tag) {
  const s = await robust(tag + " read", () => client.readContract({ address: ADDRESS, functionName: "get_state", args: [] }));
  console.log(tag + " | status=" + s.status + " yes_pool=" + s.yes_pool + " no_pool=" + s.no_pool + " claims=" + s.claims);
  return s;
}
async function waitFor(tag, pred, maxPolls, gapMs) {
  const N = maxPolls || 40; const g = gapMs || 15000;
  for (let i = 1; i <= N; i++) { const s = await state(tag + " p" + i); if (pred(s)) return s; await sleep(g); }
  throw new Error(tag + " timeout");
}
function myClaim(s) {
  let c = {};
  try { c = JSON.parse(s.claims); } catch (x) { c = {}; }
  for (const k of Object.keys(c)) { if (k.toLowerCase() === ME) return c[k]; }
  return null;
}

let s = await state("INIT");

if (s.status === "open") {
  console.log("status open; observing for in-flight void up to ~3min...");
  let landed = false;
  for (let i = 1; i <= 12; i++) { await sleep(15000); s = await state("obs" + i); if (s.status !== "open") { landed = true; break; } }
  if (!landed) {
    console.log("no in-flight void landed; sending fresh void");
    try { const hv = await robust("void send", () => client.writeContract({ address: ADDRESS, functionName: "void", args: [], value: 0n })); console.log("void tx:", hv); }
    catch (e) { console.log("void send note:", e && e.message ? e.message : String(e)); }
    s = await waitFor("void-wait", (x) => x.status === "voided", 40, 15000);
  }
}

s = await state("PRE-REFUND");
if (s.status === "voided" && !myClaim(s)) {
  console.log("sending refund");
  try { const hr = await robust("refund send", () => client.writeContract({ address: ADDRESS, functionName: "refund", args: [], value: 0n })); console.log("refund tx:", hr); }
  catch (e) { console.log("refund send note:", e && e.message ? e.message : String(e)); }
  s = await waitFor("refund-wait", (x) => !!myClaim(x), 40, 15000);
}

const rec = myClaim(s);
console.log("=== RESUME RESULT ===");
console.log("final status:", s.status);
console.log("my refund record:", JSON.stringify(rec));
const ok = s.status === "voided" && rec && rec.claimed === true && Number(rec.payout) === STAKE;
console.log(ok ? ">>> LIFECYCLE OK: staked, voided, refunded 1:1" : "!!! CHECK FAILED");
