"use client"
import { useState } from "react"
import { toast } from "sonner"
import { useWallet } from "@/hooks/use-wallet"
import { sendWriteEx, makeWriteClient, readState } from "@/lib/genlayer"
import { short, txUrl } from "@/lib/format"
import { Zap } from "lucide-react"
import { ACTIONS, canDo, phaseOk, whyNot, type ActionDef } from "@/lib/actions"
export function ActionsPanel({ projectId, address, onDone, state }: { projectId: string; address: string; onDone?: () => void; state?: any }) {
  const { address: acct, active, wrongNetwork, writeClient, ensureNetwork } = useWallet()
  const [openFn, setOpenFn] = useState<string | null>(null)
  const [form, setForm] = useState<Record<string, string>>({})
  const [busy, setBusy] = useState<string | null>(null)
  const [lastHash, setLastHash] = useState<string | null>(null)
  const [phase, setPhase] = useState<string>("")
  const allActions = ACTIONS[projectId] || []
  if (!allActions.length) return null
  const actions = allActions.filter((a) => phaseOk(a, state))
  async function waitForStateChange(prevKey: string, hash: string, tid: any, label: string) {
    for (let i = 0; i < 240; i++) {
      let ns: any = null
      try { ns = await readState(address) } catch {}
      if (ns && JSON.stringify({ status: ns.status || "", history: ns.history || "" }) !== prevKey) {
        setPhase("finished")
        const opts: any = { id: tid, description: hash ? short(hash, 8) : "confirmed on-chain" }
        if (hash) opts.action = { label: "Explorer", onClick: () => window.open(txUrl(hash), "_blank") }
        toast.success(label + " confirmed", opts)
        return true
      }
      await new Promise((r) => setTimeout(r, 4000))
    }
    return false
  }
  async function run(a: ActionDef) {
    if (!acct) { toast.error("Connect a wallet first"); return }
    const _blocked = !canDo(a, state, acct)
    if (_blocked) { toast.error(whyNot(a, state, acct)); return }
    if (!active) { toast.error("Connect a wallet first"); return }; try { let cid = String(await active.provider.request({ method: "eth_chainId" })).toLowerCase(); if (cid !== "0x107d") { toast.error("Switching to GenLayer Bradbury..."); await ensureNetwork(); cid = String(await active.provider.request({ method: "eth_chainId" })).toLowerCase() }; if (cid !== "0x107d") { toast.error("Wrong network - switch to Bradbury to continue"); return } } catch (ne) { toast.error("Network check failed"); return }
    const client = makeWriteClient(acct, active.provider)
    const args = a.build ? a.build(form) : []
    const value = a.value ? a.value(form) : BigInt(0)
    setBusy(a.fn)
    const tid = toast.loading(a.label + " \u2014 awaiting consensus\u2026")
    const prevKey = JSON.stringify({ status: (state && state.status) || "", history: (state && state.history) || "" })
    let sentHash: string | null = null
    try {
      setLastHash(null); setPhase("")
      const res = await sendWriteEx(client, address, a.fn, args, value, (h) => { sentHash = h; setLastHash(h); setPhase("waiting"); toast.loading(a.label + " - tx " + short(h, 8) + " - waiting for consensus...", { id: tid, description: "Submitted on-chain. Consensus can take a few minutes.", action: { label: "Explorer", onClick: () => window.open(txUrl(h), "_blank") } }) })
      setOpenFn(null); setForm({})
      if (res.confirmed) {
        setPhase("finished")
        toast.success(a.label + " confirmed", { id: tid, description: short(res.hash, 8), action: { label: "Explorer", onClick: () => window.open(txUrl(res.hash), "_blank") } })
        setBusy("__sync__")
        await waitForStateChange(prevKey, res.hash, tid, a.label)
      } else {
        setPhase("waiting")
        toast.loading(a.label + " submitted - finalizing on-chain...", { id: tid, description: "Tx " + short(res.hash, 8) + " sent. Result appears after consensus.", action: { label: "Explorer", onClick: () => window.open(txUrl(res.hash), "_blank") } })
        setBusy("__sync__")
        const ok = await waitForStateChange(prevKey, res.hash, tid, a.label)
        if (!ok) { setPhase("waiting"); toast.message(a.label + " - still finalizing", { id: tid, description: "Tx " + short(res.hash, 8) + " is on-chain. Use Refresh in a moment; the result appears once consensus completes.", action: { label: "Explorer", onClick: () => window.open(txUrl(res.hash), "_blank") } }) }
      }
      if (onDone) onDone()
    } catch (e: any) {
      const msg = String(e && e.message ? e.message : e)
      const execError = /execution not successful/i.test(msg)
      const ambiguous = !!(e && e.ambiguous)
      if (sentHash && !execError) {
        setPhase("waiting")
        setOpenFn(null); setForm({})
        toast.loading(a.label + " submitted - still finalizing (network busy)", { id: tid, description: "Tx " + short(sentHash, 8) + " is on-chain. Tap Explorer to track; the dashboard updates automatically.", action: { label: "Explorer", onClick: () => window.open(txUrl(sentHash as string), "_blank") } })
        setBusy("__sync__")
        const ok = await waitForStateChange(prevKey, sentHash as string, tid, a.label)
        if (!ok) { toast.message(a.label + " - still finalizing", { id: tid, description: "Tx " + short(sentHash as string, 8) + " is on-chain. Use Refresh shortly to see the result.", action: { label: "Explorer", onClick: () => window.open(txUrl(sentHash as string), "_blank") } }) }
        if (onDone) onDone()
      } else if (ambiguous && !execError) {
        setPhase("waiting")
        setOpenFn(null); setForm({})
        toast.loading(a.label + " submitted - confirming on-chain...", { id: tid, description: "Network response was lost, but the transaction may already be on-chain. Reconciling from state\u2026" })
        setBusy("__sync__")
        const ok = await waitForStateChange(prevKey, "", tid, a.label)
        if (!ok) { setPhase(""); toast.message(a.label + " - not confirmed yet", { id: tid, description: "Network was busy and no state change was detected. Tap the action again to retry, or use Refresh if it may still be finalizing." }) }
        if (onDone) onDone()
      } else {
        setPhase("error")
        toast.error(a.label + " failed", { id: tid, description: msg.slice(0, 140) })
      }
    } finally { setBusy(null) }
  }
  function click(a: ActionDef) {
    if (a.fields && a.fields.length) { setOpenFn(openFn === a.fn ? null : a.fn); return }
    run(a)
  }
  const activeDef = openFn ? actions.find((x) => x.fn === openFn) : null
  return (
    <div className="mt actions">
      {lastHash ? <div className="tag mono mt8" style={{ display: "inline-flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}><span>{(phase === "finished" ? "finished" : phase === "error" ? "failed (tx sent)" : "waiting for consensus...") + " - tx "}</span><a href={txUrl(lastHash)} target="_blank" rel="noreferrer">{short(lastHash, 8)}</a></div> : null}
      <div className="flex between center"><div className="dim" style={{ fontSize: 12 }}>Actions</div>{busy === "__sync__" ? <span className="dim" style={{ fontSize: 11.5 }}>syncing next step, please wait...</span> : null}{!acct ? <span className="dim" style={{ fontSize: 11.5 }}>connect wallet to act</span> : wrongNetwork ? <span style={{ color: "var(--warn)", fontSize: 11.5 }}>wrong network</span> : null}</div>
      <div className="flex gap wrap mt8">{!actions.length ? <span className="dim" style={{ fontSize: 11.5 }}>No actions available for your wallet in this phase</span> : null}
        {actions.map((a) => (
          <button key={a.fn} className={"btn" + (a.tone === "ok" ? " primary" : "")} disabled={busy !== null || !canDo(a, state, acct)} title={canDo(a, state, acct) ? "" : whyNot(a, state, acct)} onClick={() => click(a)}>
            <Zap size={13} /> {busy === a.fn ? "\u2026" : a.label}
          </button>
        ))}
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
