"use client"
import { useState } from "react"
import { useWallet } from "@/hooks/use-wallet"
import { short } from "@/lib/format"
import { Wallet, X, AlertTriangle } from "lucide-react"
export function WalletButton() {
  const { wallets, address, connecting, error, connect, disconnect, wrongNetwork, ensureNetwork } = useWallet()
  const [open, setOpen] = useState(false)
  async function pick(w: any) {
    try { await connect(w); setOpen(false) } catch {}
  }
  if (address) {
    return (
      <div className="wallet-box">
        {wrongNetwork ? (
          <button className="btn warnbtn" onClick={() => ensureNetwork()}><AlertTriangle size={14} /> Switch to Bradbury</button>
        ) : null}
        <div className="wallet-pill">
          <span className="dot" />
          <span className="mono">{short(address, 4)}</span>
          <button className="btn icon ghost" title="Disconnect" onClick={disconnect}><X size={14} /></button>
        </div>
      </div>
    )
  }
  return (
    <>
      <button className="btn primary" onClick={() => setOpen(true)}><Wallet size={14} /> Connect Wallet</button>
      {open ? (
        <div className="modal-overlay" onClick={() => setOpen(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="flex between center"><b>Connect a wallet</b><button className="btn icon ghost" onClick={() => setOpen(false)}><X size={16} /></button></div>
            <div className="dim" style={{ fontSize: 12, marginTop: 4 }}>Detected wallets on this device</div>
            <div className="wallet-list mt">
              {wallets.length ? wallets.map((w) => (
                <button key={w.info.uuid} className="wallet-opt" disabled={connecting} onClick={() => pick(w)}>
                  {w.info.icon ? <img src={w.info.icon} alt="" width={22} height={22} /> : <span className="wallet-fallback"><Wallet size={14} /></span>}
                  <span>{w.info.name}</span>
                </button>
              )) : <div className="empty">No wallet detected. Install MetaMask, OKX, or Rabby, or open this page inside a wallet browser.</div>}
            </div>
            {error ? <div className="mt" style={{ color: "var(--bad)", fontSize: 12.5 }}>{error}</div> : null}
          </div>
        </div>
      ) : null}
    </>
  )
}
