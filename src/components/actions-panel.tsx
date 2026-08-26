"use client"
import { useState } from "react"
import { toast } from "sonner"
import { useWallet } from "@/hooks/use-wallet"
import { sendWrite, makeWriteClient } from "@/lib/genlayer"
import { short, txUrl } from "@/lib/format"
import { Zap } from "lucide-react"
type Field = { key: string; label: string; type: "text" | "number" | "select"; options?: string[]; placeholder?: string }
type ActionDef = { fn: string; label: string; tone?: "ok" | "bad" | "warn"; fields?: Field[]; build?: (v: Record<string, string>) => any[]; value?: (v: Record<string, string>) => bigint; role?: "creator" | "author"; phase?: (st: any) => boolean }
const isCreator = (st: any, acct?: string | null) => !!(acct && st && st.creator && String(acct).toLowerCase() === String(st.creator).toLowerCase())
const isAuthor = (st: any, acct?: string | null) => !!(acct && st && st.author && String(acct).toLowerCase() === String(st.author).toLowerCase())
const roleOk = (a: ActionDef, st: any, acct?: string | null) => a.role === "creator" ? isCreator(st, acct) : a.role === "author" ? isAuthor(st, acct) : true
const phaseOk = (a: ActionDef, st: any) => a.phase ? !!a.phase(st) : true
const canDo = (a: ActionDef, st: any, acct?: string | null) => phaseOk(a, st) && roleOk(a, st, acct)
const whyNot = (a: ActionDef, st: any, acct?: string | null) => !phaseOk(a, st) ? "Not available in the current phase" : (a.role === "creator" ? "Only the market creator can do this" : a.role === "author" ? "Only the content author can do this" : "Not available for your wallet")
const ACTIONS: Record<string, ActionDef[]> = {
  prediction: [
    { fn: "stake", label: "Stake", tone: "ok", fields: [ { key: "side", label: "Side", type: "select", options: ["YES", "NO"] }, { key: "amount", label: "Amount (wei)", type: "number", placeholder: "100" } ], build: (v) => [v.side || "YES"], value: (v) => BigInt(Math.max(1, Math.floor(Number(v.amount || "1")))), phase: (st) => st && st.status === "open" },
    { fn: "resolve", label: "Resolve", role: "creator", phase: (st) => st && st.status === "open" },
    { fn: "dispute", label: "Dispute", tone: "warn", fields: [ { key: "reason", label: "Reason", type: "text", placeholder: "Requesting re-review of the cited sources" } ], build: (v) => [v.reason || ""], phase: (st) => st && st.status === "resolved" },
    { fn: "resolve_dispute", label: "Resolve dispute", role: "creator", phase: (st) => st && st.status === "disputed" },
    { fn: "settle", label: "Settle", role: "creator", phase: (st) => st && st.status === "resolved" && (st.outcome === "YES" || st.outcome === "NO") },
    { fn: "claim", label: "Claim", tone: "ok", phase: (st) => st && st.status === "settled" },
  ],
  moderator: [
    { fn: "moderate", label: "Moderate", tone: "ok", phase: (st) => st && st.status === "pending" },
    { fn: "enforce", label: "Enforce", tone: "warn", role: "creator", phase: (st) => st && st.status === "moderated" },
    { fn: "appeal", label: "Appeal", tone: "warn", fields: [ { key: "note", label: "Note", type: "text", placeholder: "Why you disagree with the verdict" } ], build: (v) => [v.note || ""], role: "author", phase: (st) => st && st.status === "enforced" && (st.verdict === "FLAG" || st.verdict === "REMOVE") },
    { fn: "resolve_appeal", label: "Resolve appeal", role: "creator", phase: (st) => st && st.status === "appealed" },
  ],
  oracle: [
    { fn: "update", label: "Update feed", tone: "ok", fields: [ { key: "key", label: "Feed key", type: "text", placeholder: "btc_usd" } ], build: (v) => [v.key || "btc_usd"], phase: (st) => { try { const f = st && st.feeds ? JSON.parse(st.feeds) : null; return !!(f && Object.keys(f).length) } catch { return false } } },
  ],
}
export function ActionsPanel({ projectId, address, onDone, state }: { projectId: string; address: string; onDone?: () => void; state?: any }) {
  const { address: acct, active, wrongNetwork, writeClient, ensureNetwork } = useWallet()
  const [openFn, setOpenFn] = useState<string | null>(null)
  const [form, setForm] = useState<Record<string, string>>({})
  const [busy, setBusy] = useState<string | null>(null)
  const allActions = ACTIONS[projectId] || []
  if (!allActions.length) return null
  const actions = allActions.filter((a) => canDo(a, state, acct))
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
    try {
      const hash = await sendWrite(client, address, a.fn, args, value)
      toast.success(a.label + " confirmed", { id: tid, description: short(hash, 8), action: { label: "Explorer", onClick: () => window.open(txUrl(hash), "_blank") } })
      setOpenFn(null); setForm({})
      if (onDone) onDone()
    } catch (e: any) {
      toast.error(a.label + " failed", { id: tid, description: String(e && e.message ? e.message : e).slice(0, 140) })
    } finally { setBusy(null) }
  }
  function click(a: ActionDef) {
    if (a.fields && a.fields.length) { setOpenFn(openFn === a.fn ? null : a.fn); return }
    run(a)
  }
  const activeDef = openFn ? actions.find((x) => x.fn === openFn) : null
  return (
    <div className="mt actions">
      <div className="flex between center"><div className="dim" style={{ fontSize: 12 }}>Actions</div>{!acct ? <span className="dim" style={{ fontSize: 11.5 }}>connect wallet to act</span> : wrongNetwork ? <span style={{ color: "var(--warn)", fontSize: 11.5 }}>wrong network</span> : null}</div>
      <div className="flex gap wrap mt8">{!actions.length ? <span className="dim" style={{ fontSize: 11.5 }}>No actions available for your wallet in this phase</span> : null}
        {actions.map((a) => (
          <button key={a.fn} className={"btn" + (a.tone === "ok" ? " primary" : "")} disabled={busy !== null} onClick={() => click(a)}>
            <Zap size={13} /> {busy === a.fn ? "\u2026" : a.label}
          </button>
        ))}
      </div>
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
