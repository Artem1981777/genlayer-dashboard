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
function retriable(m: string) {
  return /-32005|capacity|rate limit|exceeds defined limit|consensus contract|evm tx|NOT_VOTED|timeout|timed out/i.test(String(m || ""))
}
export async function sendWrite(client: any, address: string, functionName: string, args: any[] = []): Promise<string> {
  try {
    const hash = (await client.writeContract({ address, functionName, args, value: 0 })) as string
    client.waitForTransactionReceipt({ hash, status: TransactionStatus.ACCEPTED, retries: 200 }).catch(() => {})
    return hash
  } catch (e: any) {
    const msg = String(e && e.message ? e.message : e)
    throw new Error(retriable(msg) ? ("Network busy (GenLayer consensus). Please tap " + functionName + " again.") : msg)
  }
}
