"use client"
import { useState } from "react"
import { toast } from "sonner"
import { useWallet } from "@/hooks/use-wallet"
import { sendWriteEx, makeWriteClient } from "@/lib/genlayer"
import { short, txUrl, addrUrl } from "@/lib/format"
import { Zap } from "lucide-react"
import { ACTIONS, canDo, phaseOk, whyNot, type ActionDef } from "@/lib/actions"
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))
export function ActionsPanel({ projectId, address, onDone, state }: { projectId: string; address: string; onDone?: () => void; state?: any }) {
  const { address: acct, active, wrongNetwork, writeClient, ensureNetwork } = useWallet()
  const [openFn, setOpenFn] = useState<string | null>(null)
  const [form, setForm] = useState<Record<string, string>>({})
  const [busy, setBusy] = useState<string | null>(null)
  const [pending, setPending] = useState<string[]>([])
  const [lastHash, setLastHash] = useState<string | null>(null)
  const [phase, setPhase] = useState<string>("")
  const allActions = ACTIONS[projectId] || []
  if (!allActions.length) return null
  const actions = allActions.filter((a) => phaseOk(a, state))
  const addPending = (fn: string) => setPending((p) => (p.includes(fn) ? p : [...p, fn]))
  const delPending = (fn: string) => setPending((p) => p.filter((x) => x !== fn))
  const relBusy = (fn: string) => setBusy((cur) => (cur === fn ? null : cur))
  async function softRefresh(times: number, gapMs: number) {
    for (let i = 0; i < times; i++) { try { if (onDone) onDone() } catch {} await sleep(gapMs) }
  }
  async function run(a: ActionDef) {
    if (!acct) { toast.error("Connect a wallet first"); return }
    if (!canDo(a, state, acct)) { toast.error(whyNot(a, state, acct)); return }
    if (!active) { toast.error("Connect a wallet first"); return }
    if (busy || pending.includes(a.fn)) return
    try { let cid = String(await active.provider.request({ method: "eth_chainId" })).toLowerCase(); if (cid !== "0x107d") { toast.error("Switching to GenLayer Bradbury..."); await ensureNetwork(); cid = String(await active.provider.request({ method: "eth_chainId" })).toLowerCase() }; if (cid !== "0x107d") { toast.error("Wrong network - switch to Bradbury to continue"); return } } catch (ne) { toast.error("Network check failed"); return }
    const client = makeWriteClient(acct, active.provider)
    const args = a.build ? a.build(form) : []
    const value = a.value ? a.value(form) : BigInt(0)
    setBusy(a.fn)
    const tid = toast.loading(a.label + " \u2014 awaiting wallet\u2026")
    const explorerTx = (h: string) => ({ label: "Explorer", onClick: () => window.open(txUrl(h), "_blank") })
    const explorerAddr = { label: "Explorer", onClick: () => window.open(addrUrl(address), "_blank") }
    let sentHash: string | null = null
    setLastHash(null); setPhase("")
    try {
      const res = await sendWriteEx(client, address, a.fn, args, value, (h) => {
        // Tx is on-chain: kill the spinner IMMEDIATELY. Never block the UI on consensus.
        sentHash = h; setLastHash(h); setPhase("submitted")
        relBusy(a.fn); addPending(a.fn); setOpenFn(null); setForm({})
        toast.success(a.label + " submitted on-chain", { id: tid, description: "Tx " + short(h, 8) + " \u2014 finalizing via consensus. The dashboard updates automatically.", action: explorerTx(h) })
        // Background refresh so fresh state lands without holding the button.
        softRefresh(6, 3000)
      })
      if (res.confirmed) {
        setLastHash(res.hash); setPhase("confirmed")
        toast.success(a.label + " confirmed on GenLayer", { id: tid, description: short(res.hash, 8), action: explorerTx(res.hash) })
      } else {
        if (!sentHash) setLastHash(res.hash)
        setPhase("submitted")
        toast.message(a.label + " submitted - finalizing on-chain", { id: tid, description: "Tx " + short(res.hash, 8) + " is on-chain. The dashboard updates automatically.", action: explorerTx(res.hash) })
      }
      await softRefresh(4, 3000)
    } catch (e: any) {
      const msg = String(e && e.message ? e.message : e)
      const execError = /execution not successful/i.test(msg)
      const ambiguous = !!(e && e.ambiguous)
      if (execError) {
        setPhase("error")
        toast.error(a.label + " failed", { id: tid, description: msg.slice(0, 140) })
      } else if (sentHash) {
        setPhase("submitted"); setOpenFn(null); setForm({})
        toast.message(a.label + " submitted - finalizing on-chain", { id: tid, description: "Tx " + short(sentHash, 8) + " is on-chain. Verify on Explorer; the dashboard updates automatically.", action: explorerTx(sentHash as string) })
        await softRefresh(6, 3000)
      } else if (ambiguous) {
        setPhase("submitted"); setOpenFn(null); setForm({})
        toast.message(a.label + " submitted - finalizing on-chain", { id: tid, description: "Submitted on-chain. Verify on the contract Explorer; the dashboard updates automatically.", action: explorerAddr })
        await softRefresh(6, 3000)
      } else {
        setPhase("error")
        toast.error(a.label + " failed", { id: tid, description: msg.slice(0, 140) })
      }
    } finally { relBusy(a.fn); delPending(a.fn); try { if (onDone) onDone() } catch {} }
  }
  function click(a: ActionDef) {
    if (a.fields && a.fields.length) { setOpenFn(openFn === a.fn ? null : a.fn); return }
    run(a)
  }
  const activeDef = openFn ? actions.find((x) => x.fn === openFn) : null
  return (
    <div className="mt actions">
      {lastHash ? <div className="tag mono mt8" style={{ display: "inline-flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}><span>{(phase === "confirmed" ? "confirmed \u2713" : phase === "error" ? "failed (tx sent)" : phase === "submitted" ? "submitted \u2713 \u00b7 finalizing on-chain" : "submitting\u2026") + " - tx "}</span><a href={txUrl(lastHash)} target="_blank" rel="noreferrer">{short(lastHash, 8)}</a></div> : null}
      <div className="flex between center"><div className="dim" style={{ fontSize: 12 }}>Actions</div>{pending.length ? <span className="dim" style={{ fontSize: 11.5 }}>finalizing on-chain\u2026 (safe to leave)</span> : null}{!acct ? <span className="dim" style={{ fontSize: 11.5 }}>connect wallet to act</span> : wrongNetwork ? <span style={{ color: "var(--warn)", fontSize: 11.5 }}>wrong network</span> : null}</div>
      <div className="flex gap wrap mt8">{!actions.length ? <span className="dim" style={{ fontSize: 11.5 }}>No actions available for your wallet in this phase</span> : null}
        {actions.map((a) => {
          const isPending = pending.includes(a.fn)
          return (
            <button key={a.fn} className={"btn" + (a.tone === "ok" ? " primary" : "")} disabled={busy !== null || isPending || !canDo(a, state, acct)} title={canDo(a, state, acct) ? "" : whyNot(a, state, acct)} onClick={() => click(a)}>
              <Zap size={13} /> {busy === a.fn ? "\u2026" : isPending ? a.label + " \u2713" : a.label}
            </button>
          )
        })}
      </div>
      {actions.some((a) => !canDo(a, state, acct)) ? (
        <div className="dim mt8" style={{ fontSize: 11.5, lineHeight: 1.6 }}>
          {actions.filter((a) => !canDo(a, state, acct)).map((a) => (
            <div key={a.fn}>{a.label}: {whyNot(a, state, acct)}{a.role === "creator" && state && state.creator ? " (operator " + String(state.creator).slice(0, 6) + "..." + String(state.creator).slice(-4) + ")" : a.role === "author" && state && state.author ? " (author " + String(state.author).slice(0, 6) + "..." + String(state.author).slice(-4) + ")" : ""}</div>
          ))}
        </div>
      ) : null}
      {activeDef ? (
        <div className="action-form mt8">
          {(activeDef.fields || []).map((f) => (
            <div key={f.key} className="af-row">
              <label className="dim" style={{ fontSize: 12 }}>{f.label}</label>
              {f.type === "select" ? (
                <select className="input" value={form[f.key] || (f.options ? f.options[0] : "")} onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}>
                  {(f.options || []).map((o) => <option key={o} value={o}>{o}</option>)}
                </select>
              ) : (
                <input className="input" type={f.type} placeholder={f.placeholder} value={form[f.key] || ""} onChange={(e) => setForm({ ...form, [f.key]: e.target.value })} />
              )}
            </div>
          ))}
          <button className="btn primary" disabled={busy !== null} onClick={() => run(activeDef)}>{busy ? "\u2026" : "Submit " + activeDef.label}</button>
        </div>
      ) : null}
    </div>
  )
}
