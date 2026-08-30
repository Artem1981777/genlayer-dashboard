import { readFileSync, writeFileSync } from "node:fs";
import { createClient, createAccount } from "genlayer-js";
import { testnetBradbury } from "genlayer-js/chains";
import { TransactionStatus } from "genlayer-js/types";
const PRIVATE_KEY = process.env.PRIVATE_KEY;
if (!PRIVATE_KEY) { throw new Error("PRIVATE_KEY not found. Run from apps/multi-source-oracle: node --env-file=../../.env deploy.mjs"); }
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
function retryMsOf(e){ const m = e && (e.code===-32005?e:(e.cause&&e.cause.code===-32005?e.cause:null)); if(!m) return 0; const d=m.data||(e.cause&&e.cause.data); const ra=d&&d.retryAfterMs; return ra&&ra>0?ra:1500; }
async function withRetry(label, fn){ for(let a=1;a<=8;a++){ try{ return await fn(); } catch(e){ const w=retryMsOf(e); if(w>0&&a<8){ console.log(label+" throttled (-32005), retry "+a+" in "+w+"ms"); await sleep(w+500); continue; } throw e; } } }
const source = readFileSync("contracts/oracle.py","utf8");
const code = new TextEncoder().encode(source);
const account = createAccount(PRIVATE_KEY);
const client = createClient({ chain: testnetBradbury, account });
try { await client.initializeConsensusSmartContract(); console.log("consensus init ok"); } catch(e){ console.log("consensus init skipped:", e&&e.message?e.message:String(e)); }
console.log("Deploying MultiSourceOracle...");
const txHash = await withRetry("deploy", () => client.deployContract({ code, args: [] }));
console.log("deploy tx:", txHash);
await client.waitForTransactionReceipt({ hash: txHash, status: TransactionStatus.ACCEPTED, retries: 300 });
const tx = await client.getTransaction({ hash: txHash });
const address = tx?.txDataDecoded?.contractAddress ?? tx?.recipient;
console.log("=== DEPLOY RESULT ===");
console.log("statusName:", tx?.statusName);
console.log("txExecutionResultName:", tx?.txExecutionResultName);
console.log("contract address:", address);
const ok = (tx?.txExecutionResultName==="FINISHED"||tx?.txExecutionResultName==="FINISHED_WITH_RETURN");
console.log(ok?">>> CLEAN DEPLOY OK":("!!! WARNING: execution not clean -> "+tx?.txExecutionResultName));
writeFileSync("contract.txt", String(address));
writeFileSync("deploy-tx.txt", String(txHash));
console.log("saved address -> contract.txt");
console.log("Explorer: https://explorer-bradbury.genlayer.com/address/"+String(address));
