import { createClient } from "genlayer-js"
import { testnetBradbury } from "genlayer-js/chains"
import { TransactionStatus } from "genlayer-js/types"
let _read: any = null
function readClient() {
  if (!_read) _read = createClient({ chain: testnetBradbury as any })
  return _read
}
export async function readState(address: string): Promise<any> {
  const p = readClient().readContract({ address, functionName: "get_state", args: [], stateStatus: "accepted" })
  const t = new Promise((_r, rej) => setTimeout(() => rej(new Error("read timeout")), 15000))
  return Promise.race([p, t])
}
export function makeWriteClient(account: string, provider: any) {
  return createClient({ chain: testnetBradbury as any, account: account as any, provider })
}
// Node-side rejections that PROVE the tx was NOT accepted -> safe to auto-resubmit.
function safeResubmit(m: string) {
  return /-32005|capacity|at capacity|rate limit|429|too many requests|exceeds defined limit|retry in/i.test(String(m || ""))
}
// Transport/response-loss errors: the tx MAY already be on-chain -> never blind-resubmit,
// but always safe to keep POLLING (reads are idempotent).
function ambiguousTransport(m: string) {
  return /failed to fetch|fetch failed|unknown rpc error|load failed|networkerror|network error|network request failed|econn|socket|hang up|connection|reset|aborted|502|503|504|timeout|timed out/i.test(String(m || ""))
}
// Anything we can safely retry while POLLING a known tx hash.
function pollRetriable(m: string) {
  return safeResubmit(m) || ambiguousTransport(m) || /NOT_VOTED|consensus contract|evm tx/i.test(String(m || ""))
}
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))
// Retry helper. By default only retries when we KNOW the tx was not accepted (safeResubmit),
// so we never accidentally double-send a write. Pass a custom predicate for read/poll paths.
async function robust<T>(label: string, fn: () => Promise<T>, tries = 40, baseMs = 1500, canRetry: (m: string) => boolean = safeResubmit): Promise<T> {
  let last: any = null
  for (let i = 0; i < tries; i++) {
    try { return await fn() } catch (e: any) {
      const msg = String(e && e.message ? e.message : e)
      if (!canRetry(msg)) throw e
      last = e
      const m = /retry in ~?(\d+)ms/i.exec(msg)
      const wait = m ? Math.min(6000, parseInt(m[1], 10) + 150) : Math.min(6000, baseMs + i * 300)
      await sleep(wait)
    }
  }
  throw last || new Error(label + " failed after retries")
}
async function pollResult(client: any, hash: string): Promise<string> {
  for (let i = 0; i < 40; i++) {
    let rn = ""
    try {
      const receipt: any = await client.waitForTransactionReceipt({ hash, status: TransactionStatus.ACCEPTED, interval: 5000, retries: 12, fullTransaction: true })
      rn = String((receipt && (receipt.txExecutionResultName || receipt.execution_result)) || "").toUpperCase()
    } catch (e: any) {
      const msg = String(e && e.message ? e.message : e)
      if (!pollRetriable(msg)) throw e
      await sleep(3000)
      continue
    }
    if (!rn || rn === "NOT_VOTED" || rn === "PENDING") { await sleep(4000); continue }
    return rn
  }
  return ""
}
export type WriteResult = { hash: string; result: string; confirmed: boolean }
export async function sendWriteEx(client: any, address: string, functionName: string, args: any[] = [], value: bigint = BigInt(0), onHash?: (h: string) => void): Promise<WriteResult> {
  let hash = ""
  try {
    // robust only auto-retries safeResubmit (node explicitly not-accepted) -> no double-send risk.
    hash = await robust("submit " + functionName, async () => (await client.writeContract({ address, functionName, args, value })) as string)
  } catch (e: any) {
    const msg = String(e && e.message ? e.message : e)
    if (safeResubmit(msg)) {
      // Node was at capacity for every attempt; tx never landed -> safe for the user to retry.
      throw new Error("Network busy (GenLayer consensus). Please tap " + functionName + " again.")
    }
    if (ambiguousTransport(msg)) {
      // Response was lost but the tx may already be on-chain. Signal the caller to reconcile
      // from on-chain state instead of blind-resubmitting (which could double-send).
      const err: any = new Error("Submitted, but the network response was lost. Reconciling from on-chain state\u2026")
      err.ambiguous = true
      throw err
    }
    // Genuine error (revert, insufficient funds, invalid args, wrong network, etc.).
    throw new Error(msg)
  }
  try { if (onHash) onHash(hash) } catch {}
  const rn = await pollResult(client, hash)
  if (rn.includes("ERROR") || rn === "UNDETERMINED") throw new Error("On-chain execution not successful (" + (rn || "unknown") + ")")
  const confirmed = rn.startsWith("FINISHED")
  return { hash, result: rn || "PENDING", confirmed }
}
export async function sendWrite(client: any, address: string, functionName: string, args: any[] = [], value: bigint = BigInt(0), onHash?: (h: string) => void): Promise<string> {
  const r = await sendWriteEx(client, address, functionName, args, value, onHash)
  return r.hash
}
