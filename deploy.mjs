import { readFileSync } from "fs"
import { createClient, createAccount } from "genlayer-js"
import { testnetBradbury } from "genlayer-js/chains"
import { TransactionStatus } from "genlayer-js/types"
const PK = process.env.PK
if (!PK) { console.error("Set PK first: export PK=0xYOUR_PRIVATE_KEY"); process.exit(1) }
const code = new Uint8Array(readFileSync("apps/prediction-market/contracts/prediction_market.py"))
const account = createAccount(PK)
const client = createClient({ chain: testnetBradbury, account })
try { await client.initializeConsensusSmartContract() } catch (e) { console.log("initConsensus skipped:", String(e && e.message ? e.message : e)) }
const args = ["Does the GenLayer documentation describe Optimistic Democracy as its consensus mechanism?", "Answer YES if a loaded source states GenLayer uses Optimistic Democracy for consensus; NO if a source states it does not; UNRESOLVED if no loaded source addresses it.", "https://docs.genlayer.com/", "https://docs.genlayer.com/understand-genlayer-protocol/core-concepts/optimistic-democracy", "", "pm-live-1"]
const hash = await client.deployContract({ account, code, args })
console.log("deploy tx:", hash)
const receipt = await client.waitForTransactionReceipt({ hash, status: TransactionStatus.ACCEPTED, interval: 5000, retries: 200, fullTransaction: true })
console.log("result:", receipt && (receipt.txExecutionResultName || receipt.execution_result))
const addr = (receipt && receipt.data && (receipt.data.contract_address || receipt.data.contractAddress || receipt.data.address)) || receipt.contract_address || receipt.contractAddress
console.log("NEW_ADDRESS:", addr)
if (!addr) console.log("receipt json:", JSON.stringify(receipt).slice(0, 1500))
