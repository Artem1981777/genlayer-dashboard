"use client"
export type Eip6963Info = { uuid: string; name: string; icon: string; rdns: string }
export type Eip6963Provider = { info: Eip6963Info; provider: any }
type Listener = () => void
const state: { list: Eip6963Provider[]; subs: Set<Listener>; started: boolean } = { list: [], subs: new Set(), started: false }
function emit() { state.subs.forEach((cb) => cb()) }
function handleAnnounce(ev: any) {
  const detail = ev && ev.detail
  if (!detail || !detail.info || !detail.info.uuid) return
  if (state.list.some((p) => p.info.uuid === detail.info.uuid)) return
  state.list = [...state.list, detail]
  emit()
}
export function startDiscovery() {
  if (typeof window === "undefined" || state.started) return
  state.started = true
  window.addEventListener("eip6963:announceProvider", handleAnnounce as any)
  window.dispatchEvent(new Event("eip6963:requestProvider"))
  const eth = (window as any).ethereum
  if (eth && !state.list.length) {
    const many = Array.isArray(eth.providers) ? eth.providers : [eth]
    const injected: Eip6963Provider[] = []
    for (const p of many) {
      const name = p.isRabby ? "Rabby" : (p.isOkxWallet || p.isOKExWallet) ? "OKX Wallet" : p.isCoinbaseWallet ? "Coinbase Wallet" : (p.isTrust || p.isTrustWallet) ? "Trust Wallet" : p.isMetaMask ? "MetaMask" : "Injected Wallet"
      injected.push({ info: { uuid: "injected:" + name, name, icon: "", rdns: "injected." + name }, provider: p })
    }
    if (injected.length) { state.list = [...state.list, ...injected]; emit() }
  }
}
export function getProviders() { return state.list }
export function subscribe(cb: Listener) { state.subs.add(cb); return () => { state.subs.delete(cb) } }
export function findByUuid(uuid: string) { return state.list.find((p) => p.info.uuid === uuid) || null }
