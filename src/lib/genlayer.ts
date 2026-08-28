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
function retriable(m: string) {
  return /-32005|capacity|rate limit|exceeds defined limit|consensus contract|evm tx|NOT_VOTED|timeout|timed out|network|fetch failed|502|503|504|econn|socket|hang up/i.test(String(m || ""))
}
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))
async function robust<T>(label: string, fn: () => Promise<T>, tries = 40, baseMs = 1500): Promise<T> {
  let last: any = null
  for (let i = 0; i < tries; i++) {
    try { return await fn() } catch (e: any) {
      const msg = String(e && e.message ? e.message : e)
      if (!retriable(msg)) throw e
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
      if (!retriable(msg)) throw e
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
    hash = await robust("submit " + functionName, async () => (await client.writeContract({ address, functionName, args, value })) as string)
  } catch (e: any) {
    const msg = String(e && e.message ? e.message : e)
    throw new Error(retriable(msg) ? ("Network busy (GenLayer consensus). Please tap " + functionName + " again.") : msg)
  }
  try { if (onHash) onHash(hash) } catch {}
  const rn = await pollResult(client, hash)
  if (rn.includes("ERROR") || rn === "UNDETERMINED") throw new Error("On-chain execution not successful (" + (rn || "unknown") + ")")
  const confirmed = rn === "FINISHED" || rn === "FINISHED_WITH_RETURN"
  return { hash, result: rn || "PENDING", confirmed }
}
export async function sendWrite(client: any, address: string, functionName: string, args: any[] = [], value: bigint = BigInt(0), onHash?: (h: string) => void): Promise<string> {
  const r = await sendWriteEx(client, address, functionName, args, value, onHash)
  return r.hash
}
