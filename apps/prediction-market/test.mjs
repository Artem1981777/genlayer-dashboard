import { readFileSync } from "node:fs";
import { createClient, createAccount } from "genlayer-js";
import { testnetBradbury } from "genlayer-js/chains";
import { TransactionStatus } from "genlayer-js/types";
const PK = process.env.PRIVATE_KEY;
if (!PK) { throw new Error("PRIVATE_KEY missing. Run: node --env-file=.env test.mjs"); }
const source = readFileSync("contracts/prediction_market.py", "utf8");
const code = new TextEncoder().encode(source);
const QUESTION = "According to the cited sources, has Ethereum completed 'The Merge' and now runs on Proof-of-Stake?";
const RULES = "Resolve YES if the evidence clearly states Ethereum completed The Merge and uses Proof-of-Stake. Resolve NO if it clearly states it has not. Otherwise UNRESOLVED.";
const GOOD1 = "https://en.wikipedia.org/wiki/The_Merge";
const GOOD2 = "https://en.wikipedia.org/wiki/Ethereum";
const STAKE = 1000000000000000n;
const account = createAccount(PK);
const client = createClient({ chain: testnetBradbury, account });
const ME = String(account.address).toLowerCase();
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let failed = 0;
const pass = (n) => console.log("PASS -", n);
const fail = (n, extra) => { console.log("FAIL -", n, extra ?? ""); failed++; };
const isRevert = (r) => (r === "FINISHED_WITH_ERROR" || r === "REVERTED" || r === "SUBMIT_TIMEOUT");
function isTransient(e){ let m=""; try{ m=(e&&(e.shortMessage||e.message||""))+" "+(e&&e.details||""); }catch(x){ m=String(e);} return ["fetch failed","ECONNABORTED","ECONNRESET","capacity","-32005","timeout","socket","consensus contract","EVM tx"].some(s=>m.indexOf(s)>=0); }
async function robust(label,fn,tries){ const T=tries||60; for(let i=1;i<=T;i++){ try{ return await fn(); } catch(e){ if(isTransient(e)&&i<T){ console.log(label+" transient, retry "+i); await sleep(3500); continue; } throw e; } } }
const read = (addr) => robust("read", () => client.readContract({ address: addr, functionName: "get_state", args: [] }));
async function deploy(s1,s2,s3,marketId){
  const h = await robust("deploy", () => client.deployContract({ code, args: [QUESTION, RULES, s1, s2, s3, marketId] }));
  await robust("deploy-wait", () => client.waitForTransactionReceipt({ hash: h, status: TransactionStatus.ACCEPTED, retries: 300 }));
  const tx = await robust("deploy-tx", () => client.getTransaction({ hash: h }));
  const addr = tx?.txDataDecoded?.contractAddress ?? tx?.recipient;
  if (!addr || tx?.txExecutionResultName !== "FINISHED_WITH_RETURN") throw new Error("deploy failed: " + tx?.txExecutionResultName);
  return addr;
}
async function call(addr, fn, args, value){
  let h = null;
  try { h = await robust(fn + " submit", () => client.writeContract({ address: addr, functionName: fn, args, value: value || 0n })); }
  catch (e) { return "REVERTED"; }
  if (!h) return "SUBMIT_TIMEOUT";
  try { await robust(fn + " wait", () => client.waitForTransactionReceipt({ hash: h, status: TransactionStatus.ACCEPTED, retries: 300 })); }
  catch (e) { return "REVERTED"; }
  for (let i = 0; i < 120; i++) {
    const tx = await robust(fn + " res", () => client.getTransaction({ hash: h }));
    const r = tx?.txExecutionResultName;
    if (r && r !== "NOT_VOTED") return r;
    await sleep(5000);
  }
  return "NOT_VOTED";
}
async function waitLeaves(addr, fromStatus){ let s; for(let i=0;i<220;i++){ s=await read(addr); if(s?.status!==fromStatus) return s; await sleep(5000);} return s; }
function myPos(s){ let p={}; try{ p=JSON.parse(s.positions);}catch(x){} for(const k of Object.keys(p)){ if(k.toLowerCase()===ME) return p[k]; } return null; }
function myClaim(s){ let c={}; try{ c=JSON.parse(s.claims);}catch(x){} for(const k of Object.keys(c)){ if(k.toLowerCase()===ME) return c[k]; } return null; }
console.log("### Full AI lifecycle: stake -> resolve -> dispute -> resolve_dispute -> settle -> claim ###");
const c1 = await deploy(GOOD1, GOOD2, "", "eth-merge-lifecycle");
console.log("market:", c1);
console.log("### T1: stake YES records position ###");
const t1 = await call(c1, "stake", ["YES"], STAKE);
const s1 = await read(c1);
const p1 = myPos(s1);
(!isRevert(t1) && p1 && Number(p1.YES) === Number(STAKE)) ? pass("stake recorded") : fail("stake not recorded", JSON.stringify({ t1, p1 }));
console.log("### T2: resolve -> resolved YES ###");
const t2 = await call(c1, "resolve", []);
const s2 = await waitLeaves(c1, "open");
(!isRevert(t2) && s2?.status === "resolved" && s2?.outcome === "YES") ? pass("resolved YES") : fail("expected resolved YES", JSON.stringify({ t2, status: s2?.status, outcome: s2?.outcome }));
console.log("### T3: participant dispute -> disputed ###");
const t3 = await call(c1, "dispute", ["Please re-check the cited sources before settlement."]);
const s3 = await waitLeaves(c1, "resolved");
(!isRevert(t3) && s3?.status === "disputed") ? pass("disputed") : fail("dispute failed", JSON.stringify({ t3, status: s3?.status }));
console.log("### T4: resolve_dispute -> resolved ###");
const t4 = await call(c1, "resolve_dispute", []);
const s4 = await waitLeaves(c1, "disputed");
(!isRevert(t4) && s4?.status === "resolved") ? pass("dispute resolved (outcome=" + (s4?.dispute_outcome ?? "?") + ")") : fail("resolve_dispute failed", JSON.stringify({ t4, status: s4?.status }));
console.log("### T5: settle -> settled ###");
const t5 = await call(c1, "settle", []);
const s5 = await read(c1);
(!isRevert(t5) && s5?.status === "settled" && s5?.winning_side === "YES") ? pass("settled") : fail("settle failed", JSON.stringify({ t5, status: s5?.status, win: s5?.winning_side }));
console.log("### T6: claim -> payout, claimed ###");
const t6 = await call(c1, "claim", [], 0n);
const s6 = await read(c1);
const cl6 = myClaim(s6);
(!isRevert(t6) && cl6 && cl6.claimed === true && Number(cl6.payout) > 0) ? pass("claim paid (" + (cl6 && cl6.payout) + ")") : fail("claim failed", JSON.stringify({ t6, cl6 }));
console.log("### T7: double claim reverts ###");
const t7 = await call(c1, "claim", [], 0n);
isRevert(t7) ? pass("double claim reverted") : fail("expected revert on double claim", t7);
console.log("### Gating market ###");
const c2 = await deploy(GOOD1, "", "", "eth-merge-gating");
console.log("### T8: zero-value stake reverts ###");
const t8 = await call(c2, "stake", ["YES"], 0n);
isRevert(t8) ? pass("zero-value stake reverted") : fail("expected revert on zero-value stake", t8);
console.log("### T9: claim before settle reverts ###");
const t9 = await call(c2, "claim", [], 0n);
isRevert(t9) ? pass("early claim reverted") : fail("expected revert on early claim", t9);
console.log("### T10: dispute before resolve reverts ###");
const t10 = await call(c2, "dispute", ["too early"], 0n);
isRevert(t10) ? pass("early dispute reverted") : fail("expected revert on early dispute", t10);
console.log("### T11: non-participant dispute reverts (resolved, never staked) ###");
const t11r = await call(c2, "resolve", []);
const s11 = await waitLeaves(c2, "open");
const okResolved = s11?.status === "resolved";
const t11 = okResolved ? await call(c2, "dispute", ["I did not stake but want to dispute."]) : "SKIP";
(okResolved && isRevert(t11)) ? pass("non-participant dispute reverted") : fail("expected revert on non-participant dispute", JSON.stringify({ t11r, status: s11?.status, t11 }));
console.log("### T12: empty dispute reason reverts ###");
const t12 = okResolved ? await call(c2, "dispute", ["   "]) : "SKIP";
(okResolved && isRevert(t12)) ? pass("empty dispute reason reverted") : fail("expected revert on empty reason", t12);
console.log("### T13: resolve without source reverts ###");
const c3 = await deploy("", "", "", "eth-merge-nosource");
const t13 = await call(c3, "resolve", []);
isRevert(t13) ? pass("resolve without source reverted") : fail("expected revert without source", t13);
console.log("### T14: non-http source rejected ###");
const t14 = await call(c3, "add_source", ["ftp://evil.example/x"]);
isRevert(t14) ? pass("non-http source rejected") : fail("expected revert on bad URL", t14);
console.log("=====================================");
console.log(failed === 0 ? "ALL PM LIFECYCLE/GATING TESTS PASSED" : (failed + " TEST(S) FAILED"));
process.exitCode = failed === 0 ? 0 : 1;
