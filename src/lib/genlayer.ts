import { createClient } from "genlayer-js"
import { testnetBradbury } from "genlayer-js/chains"
let _client: any = null
function client() {
  if (!_client) _client = createClient({ chain: testnetBradbury as any })
  return _client
}
export async function readState(address: string): Promise<any> {
  return client().readContract({ address, functionName: "get_state", args: [] })
}
