"use client"
import { useCallback, useEffect, useMemo, useSyncExternalStore } from "react"
import { startDiscovery, getProviders, subscribe as subProviders, findByUuid, Eip6963Provider } from "@/lib/wallet"
import { makeWriteClient } from "@/lib/genlayer"
const CHAIN_HEX = "0x107d"
const CHAIN_ID = 4221
const LS_KEY = "gl-wallet-uuid"
const BRADBURY_PARAMS = { chainId: CHAIN_HEX, chainName: "GenLayer Testnet Bradbury", nativeCurrency: { name: "GEN", symbol: "GEN", decimals: 18 }, rpcUrls: ["https://rpc-bradbury.genlayer.com"], blockExplorerUrls: ["https://explorer-bradbury.genlayer.com"] }
type WState = { active: Eip6963Provider | null; address: string | null; chainId: number | null; connecting: boolean; error: string | null }
let ws: WState = { active: null, address: null, chainId: null, connecting: false, error: null }
const subs = new Set<() => void>()
function set(p: Partial<WState>) { ws = { ...ws, ...p }; subs.forEach((cb) => cb()) }
function subscribeConn(cb: () => void) { subs.add(cb); return () => { subs.delete(cb) } }
function snapshot() { return ws }
let bound: any = null
function bind(w: Eip6963Provider) {
  if (bound === w.provider) return
  bound = w.provider
  w.provider.on && w.provider.on("accountsChanged", (accs: string[]) => {
    if (accs && accs.length) set({ address: accs[0] })
    else { set({ active: null, address: null }); try { localStorage.removeItem(LS_KEY) } catch {} }
  })
  w.provider.on && w.provider.on("chainChanged", (cid: string) => set({ chainId: parseInt(cid, 16) }))
}
async function ensureNetwork(prov: any) {
  const cid = await prov.request({ method: "eth_chainId" })
  if (cid === CHAIN_HEX) { set({ chainId: CHAIN_ID }); return }
  try { await prov.request({ method: "wallet_switchEthereumChain", params: [{ chainId: CHAIN_HEX }] }) }
  catch (e: any) {
    if (e && (e.code === 4902 || e.code === -32603)) await prov.request({ method: "wallet_addEthereumChain", params: [BRADBURY_PARAMS] })
    else throw e
  }
  set({ chainId: CHAIN_ID })
}
async function connect(w: Eip6963Provider) {
  set({ connecting: true, error: null })
  try {
    const accs: string[] = await w.provider.request({ method: "eth_requestAccounts" })
    await ensureNetwork(w.provider)
    bind(w)
    set({ active: w, address: accs && accs.length ? accs[0] : null })
    try { localStorage.setItem(LS_KEY, w.info.uuid) } catch {}
  } catch (e: any) { set({ error: String(e && e.message ? e.message : e) }); throw e }
  finally { set({ connecting: false }) }
}
function disconnect() { set({ active: null, address: null, chainId: null }); try { localStorage.removeItem(LS_KEY) } catch {} }
let triedResume = false
function tryResume() {
  if (triedResume || ws.active) return
  let saved: string | null = null
  try { saved = localStorage.getItem(LS_KEY) } catch {}
  if (!saved) return
  const w = findByUuid(saved)
  if (!w) return
  triedResume = true
  w.provider.request({ method: "eth_accounts" }).then((accs: string[]) => {
    if (accs && accs.length) {
      bind(w); set({ active: w, address: accs[0] })
      w.provider.request({ method: "eth_chainId" }).then((cid: string) => set({ chainId: parseInt(cid, 16) })).catch(() => {})
    }
  }).catch(() => {})
}
const emptyProviders: Eip6963Provider[] = []
export function useWallet() {
  const conn = useSyncExternalStore(subscribeConn, snapshot, snapshot)
  const wallets = useSyncExternalStore(subProviders, getProviders, () => emptyProviders)
  useEffect(() => { startDiscovery() }, [])
  useEffect(() => { tryResume() }, [wallets])
  const doConnect = useCallback((w: Eip6963Provider) => connect(w), [])
  const wrongNetwork = conn.chainId !== null && conn.chainId !== CHAIN_ID
  const writeClient = useMemo(() => (conn.active && conn.address && !wrongNetwork ? makeWriteClient(conn.address, conn.active.provider) : null), [conn.active, conn.address, wrongNetwork])
  return { wallets, address: conn.address, active: conn.active, chainId: conn.chainId, connecting: conn.connecting, error: conn.error, wrongNetwork, connect: doConnect, disconnect, ensureNetwork: () => conn.active ? ensureNetwork(conn.active.provider) : Promise.resolve(), writeClient }
}
