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
  const t = new Promise<any>((_r, rej) => setTimeout(() => rej(new Error("read timeout")), 30000))
  return Promise.race([p, t])
}

export function makeWriteClient(account: string, provider: any) {
  return createClient({ chain: testnetBradbury as any, account: account as any, provider })
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

function safeResubmit(m: string) {
  return /-32005|capacity|at capacity|rate limit|429|too many requests|exceeds defined limit|retry in/i.test(String(m || ""))
}
function ambiguousTransport(m: string) {
  return /failed to fetch|fetch failed|unknown rpc error|load failed|networkerror|network error|network request failed|econn|socket|hang up|connection|reset|aborted|502|503|504|timeout|timed out/i.test(String(m || ""))
}
function pollRetriable(m: string) {
  const s = String(m || "")
  return safeResubmit(s) || ambiguousTransport(s) || /not_voted|consensus contract|evm tx|pending|proposing|committing|revealing|not found|no receipt|receipt/i.test(s)
}

async function robust<T>(label: string, fn: () => Promise<T>, tries = 8, baseMs = 1500): Promise<T> {
  let last: any = null
  for (let i = 0; i < tries; i++) {
    try { return await fn() } catch (e: any) {
      const msg = String(e && e.message ? e.message : e)
      if (!safeResubmit(msg)) throw e
      last = e
      const m = /retry in ~?(\d+)ms/i.exec(msg)
      const wait = m ? Math.min(6000, parseInt(m[1], 10) + 150) : Math.min(6000, baseMs + i * 400)
      await sleep(wait)
    }
  }
  throw last || new Error(label + " failed after retries")
}

const STATUS_BY_CODE: Record<string, string> = { "0": "UNINITIALIZED", "1": "PENDING", "2": "PROPOSING", "3": "COMMITTING", "4": "REVEALING", "5": "ACCEPTED", "6": "UNDETERMINED", "7": "FINALIZED", "8": "CANCELED", "13": "LEADER_TIMEOUT" }

function statusName(tx: any): string {
  if (!tx) return ""
  const raw = tx.statusName ?? tx.status ?? tx.statusCode
  if (raw === undefined || raw === null) return ""
  if (typeof raw === "number") return STATUS_BY_CODE[String(raw)] || String(raw)
  const s = String(raw)
  return /^\d+$/.test(s) ? (STATUS_BY_CODE[s] || s) : s.toUpperCase()
}

function execName(tx: any): string {
  if (!tx) return ""
  return String(tx.txExecutionResultName ?? tx.tx_execution_result_name ?? tx.execution_result ?? "").toUpperCase()
}

// ---- STRICT result classification (pure, unit-tested, no mocks) ----
// genlayer-js execution results: NOT_VOTED, FINISHED_WITH_RETURN, FINISHED_WITH_ERROR.
// Success ONLY for FINISHED / FINISHED_WITH_RETURN. A pure transport/timeout with no
// consensus answer is PENDING (never a false success). Everything else is a failure.
export const SUCCESS_RESULTS: ReadonlySet<string> = new Set(["FINISHED", "FINISHED_WITH_RETURN"])
export type ExecClass = "success" | "pending" | "failure"
export function classifyExecution(resultName: string): ExecClass {
  const s = String(resultName || "").toUpperCase()
  if (SUCCESS_RESULTS.has(s)) return "success"
  if (s === "PENDING") return "pending"
  return "failure"
}

// Confirms via the DIRECT RPC read client (never the wallet provider).
// HARD 30s deadline: always resolves. Transport errors -> PENDING (UI already has the hash).
async function confirmByReceipt(hash: string): Promise<string> {
  const rc = readClient()
  const deadline = Date.now() + 30000
  let transient = 0
  while (Date.now() < deadline) {
    try {
      const receipt: any = await rc.waitForTransactionReceipt({ hash, status: TransactionStatus.ACCEPTED, interval: 3000, retries: 8, fullTransaction: false })
      return execName(receipt)
    } catch (e: any) {
      const msg = String(e && e.message ? e.message : e)
      try {
        const tx: any = await rc.getTransaction({ hash })
        const st = statusName(tx)
        if (st === "ACCEPTED" || st === "FINALIZED") return execName(tx)
        if (st === "UNDETERMINED") return "UNDETERMINED"
        if (st === "LEADER_TIMEOUT") return "LEADER_TIMEOUT"
      } catch {}
      transient++
      if (ambiguousTransport(msg)) return "PENDING"
      if (pollRetriable(msg) && transient <= 6 && Date.now() < deadline) { await sleep(3000); continue }
      throw e
    }
  }
  return "PENDING"
}

export type WriteResult = { hash: string; result: string; confirmed: boolean }

export async function sendWriteEx(client: any, address: string, functionName: string, args: any[] = [], value: bigint = BigInt(0), onHash?: (h: string) => void): Promise<WriteResult> {
  let hash = ""
  try {
    hash = await robust("submit " + functionName, async () => (await client.writeContract({ address, functionName, args, value })) as string)
  } catch (e: any) {
    const msg = String(e && e.message ? e.message : e)
    if (safeResubmit(msg)) throw new Error("Network busy (GenLayer consensus). Please tap " + functionName + " again.")
    if (ambiguousTransport(msg)) { const err: any = new Error("Network response was interrupted while submitting " + functionName + "."); err.ambiguous = true; throw err }
    throw new Error(msg)
  }
  try { if (onHash) onHash(hash) } catch {}

  let rn = "PENDING"
  try { rn = await confirmByReceipt(hash) } catch { rn = "PENDING" }

  const cls = classifyExecution(rn)
  if (cls === "success") return { hash, result: rn.toUpperCase(), confirmed: true }
  if (cls === "pending") return { hash, result: "PENDING", confirmed: false }

  const err: any = new Error("On-chain execution not successful (" + (rn ? rn.toUpperCase() : "UNKNOWN_RESULT") + ")")
  err.hash = hash
  err.result = rn ? rn.toUpperCase() : "UNKNOWN_RESULT"
  throw err
}

export async function sendWrite(client: any, address: string, functionName: string, args: any[] = [], value: bigint = BigInt(0), onHash?: (h: string) => void): Promise<string> {
  const r = await sendWriteEx(client, address, functionName, args, value, onHash)
  return r.hash
}
