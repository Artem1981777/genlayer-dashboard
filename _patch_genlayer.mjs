import { readFileSync, writeFileSync } from "node:fs";
const p = "src/lib/genlayer.ts";
let s = readFileSync(p, "utf8");
if (!s.includes("MODERATOR_SOURCE")) s = s.replace('import { TransactionStatus } from "genlayer-js/types"', 'import { TransactionStatus } from "genlayer-js/types"\nimport { MODERATOR_SOURCE } from "./moderator-source"');
if (!s.includes("export async function deployCase")) s += '\nexport async function deployCase(account: string, provider: any, args: any[]): Promise<{ hash: string; address: string }> {\n  const client = createClient({ chain: testnetBradbury as any, account: account as any, provider })\n  const code = new TextEncoder().encode(MODERATOR_SOURCE)\n  const hash = (await client.deployContract({ code, args })) as string\n  await client.waitForTransactionReceipt({ hash, status: TransactionStatus.ACCEPTED, interval: 5000, retries: 200, fullTransaction: true })\n  const tx: any = await client.getTransaction({ hash })\n  const address = (tx && tx.txDataDecoded ? tx.txDataDecoded.contractAddress : undefined) || (tx && tx.recipient)\n  if (!address) throw new Error("Deploy did not return a contract address")\n  return { hash, address }\n}\n';
writeFileSync(p, s);
console.log("GENLAYER_PATCHED_OK");
