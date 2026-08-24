import { createClient } from "genlayer-js"
import { testnetBradbury } from "genlayer-js/chains"
import { TransactionStatus } from "genlayer-js/types"
let _read: any = null
function readClient() {
  if (!_read) _read = createClient({ chain: testnetBradbury as any })
  return _read
}
export async function readState(address: string): Promise<any> {
  const p = readClient().readContract({ address, functionName: "get_state", args: [] })
  const t = new Promise((_r, rej) => setTimeout(() => rej(new Error("read timeout")), 15000))
  return Promise.race([p, t])
}
export function makeWriteClient(account: string, provider: any) {
  return createClient({ chain: testnetBradbury as any, account: account as any, provider })
}
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))
function retriable(m: string) {
  return /-32005|capacity|rate limit|exceeds defined limit|consensus contract|evm tx|NOT_VOTED|timeout|timed out/i.test(String(m || ""))
}
function sig(s: any) {
  try { return JSON.stringify(s, (_k, v) => (typeof v === "bigint" ? v.toString() : v)) } catch { return String(s) }
}
export async function sendWrite(client: any, address: string, functionName: string, args: any[] = [], opts: { waitMs?: number; pollMs?: number } = {}): Promise<string> {
  const waitMs = opts.waitMs ?? 180000
  const pollMs = opts.pollMs ?? 5000
  let before = ""
  try { before = sig(await readState(address)) } catch {}
  let hash: string
  try {
    hash = (await client.writeContract({ address, functionName, args, value: 0 })) as string
  } catch (e: any) {
    const msg = String(e && e.message ? e.message : e)
    if (retriable(msg)) throw new Error("Network busy (GenLayer consensus). Please tap " + functionName + " again.")
    throw e
  }
  client.waitForTransactionReceipt({ hash, status: TransactionStatus.ACCEPTED, retries: 200 }).catch(() => {})
  const deadline = Date.now() + waitMs
  while (Date.now() < deadline) {
    await sleep(pollMs)
    let now = ""
    try { now = sig(await readState(address)) } catch { continue }
    if (now && now !== before) return hash
  }
  throw new Error("Submitted " + hash.slice(0, 10) + "\u2026 — consensus still finalizing. Refresh in ~1 min.")
}
