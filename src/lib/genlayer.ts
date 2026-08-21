import { createClient } from "genlayer-js"
import { testnetBradbury } from "genlayer-js/chains"
import { TransactionStatus } from "genlayer-js/types"
let _read: any = null
function readClient() {
  if (!_read) _read = createClient({ chain: testnetBradbury as any })
  return _read
}
export async function readState(address: string): Promise<any> {
  return readClient().readContract({ address, functionName: "get_state", args: [] })
}
export function makeWriteClient(account: string, provider: any) {
  return createClient({ chain: testnetBradbury as any, account: account as any, provider })
}
export async function sendWrite(client: any, address: string, functionName: string, args: any[] = []): Promise<string> {
  const hash = await client.writeContract({ address, functionName, args, value: 0 })
  await client.waitForTransactionReceipt({ hash, status: TransactionStatus.ACCEPTED, retries: 200 })
  return hash as string
}
