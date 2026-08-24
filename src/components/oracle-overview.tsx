"use client"
import { ProjectDef, TrackedCase } from "@/lib/types"
import { KpiCard } from "./kpi-card"
import { StatusDot } from "./status-dot"
import { short, addrUrl } from "@/lib/format"
import { RefreshCw, Database, Layers, Gauge, ListChecks, ExternalLink } from "lucide-react"
function parseJson(x: any) { try { return typeof x === "string" ? JSON.parse(x) : (x || null) } catch { return null } }
export function OracleOverview({ project, cases, loading, lastSync, refresh }: { project: ProjectDef; cases: TrackedCase[]; loading: boolean; lastSync: number | null; refresh: () => void }) {
  const tc = cases[0]
  const s: any = tc?.state || {}
  const feeds: any = parseJson(s.feeds) || {}
  const values: any = parseJson(s.values) || {}
  const history: any[] = parseJson(s.history) || []
  const keys = Object.keys(feeds)
  const totalSources = keys.reduce((n, k) => n + ((feeds[k] && feeds[k].sources ? feeds[k].sources.length : 0)), 0)
  const valued = Object.keys(values).length
  const online = !!tc && !!tc.state
  return (
    <>
      <div className="topbar">
        <div>
          <h1 className="h1"><StatusDot tone={online ? "ok" : (tc && tc.error ? "bad" : "warn")} /> {project.name}</h1>
          <div className="sub">{project.tagline} · {keys.length} feed{keys.length === 1 ? "" : "s"} tracked</div>
        </div>
        <div className="flex gap center">
          <span className="chip"><span className={"dot" + (online ? "" : " bad")} /> {online ? "Live" : "Offline"} · Bradbury</span>
          <button className="btn" onClick={refresh}><RefreshCw size={14} /> Refresh</button>
        </div>
      </div>
      <div className="grid kpis">
        <KpiCard icon={<Database size={14} />} label="Registered feeds" value={loading && !keys.length ? "…" : keys.length} meta={lastSync ? "synced " + new Date(lastSync).toLocaleTimeString() : "syncing…"} />
        <KpiCard icon={<Layers size={14} />} label="Data sources" value={totalSources} meta="across all feeds" />
        <KpiCard icon={<Gauge size={14} />} label="Published values" value={valued} meta={valued ? "on-chain medians" : "awaiting consensus"} />
        <KpiCard icon={<ListChecks size={14} />} label="Owner" value={s.owner ? short(s.owner, 4) : "—"} meta="feed admin" />
      </div>
      <div className="split mt">
        <div className="card">
          <div className="flex between center wrap gap"><b>Feeds</b>{tc ? <a className="tag mono" href={addrUrl(tc.address)} target="_blank" rel="noreferrer">{short(tc.address, 6)} <ExternalLink size={12} /></a> : null}</div>
          <div className="grid mt" style={{ gap: 10 }}>
            {loading && !keys.length ? [0, 1].map((i) => <div key={i} className="sk" style={{ height: 60 }} />) : null}
            {!loading && tc && tc.error ? <div className="empty" style={{ color: "#ff7b7b" }}>Failed to read: {tc.error}</div> : null}
            {!loading && !keys.length && !(tc && tc.error) ? <div className="empty"><div className="big">No feeds</div>No feeds registered yet.</div> : null}
            {keys.map((k) => {
              const f = feeds[k] || {}
              const v = values[k]
              const vt = v && typeof v === "object" ? v : null
              const valueStr = vt && (vt.value !== undefined && vt.value !== null) ? String(vt.value) : (typeof v === "string" && v ? v : null)
              const spread = vt && vt.spread_bps !== undefined ? vt.spread_bps : null
              return (
                <div key={k} className="rowitem" style={{ alignItems: "flex-start" }}>
                  <StatusDot tone={valueStr ? "ok" : "warn"} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="flex between center wrap gap"><b className="mono">{k}</b><span className="tag">{valueStr ? valueStr : "awaiting consensus"}</span></div>
                    <div className="dim" style={{ fontSize: 12, marginTop: 4 }}>{f.question || "—"}</div>
                    <div className="flex gap wrap" style={{ marginTop: 6 }}>
                      <span className="tag">{(f.sources ? f.sources.length : 0)} sources</span>
                      <span className="tag">tol {f.tolerance_bps != null ? f.tolerance_bps : "—"} bps</span>
                      <span className="tag">max spread {f.max_spread_bps != null ? f.max_spread_bps : "—"} bps</span>
                      <span className="tag">{f.decimals != null ? f.decimals : "—"} dec</span>
                      {spread != null ? <span className="tag">spread {spread} bps</span> : null}
                    </div>
                    {f.sources && f.sources.length ? <div className="dim mono" style={{ fontSize: 11, marginTop: 6, wordBreak: "break-all" }}>{f.sources.join("  ·  ")}</div> : null}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
        <div className="card">
          <div className="flex between center wrap gap"><b>Activity</b><span className="tag">{history.length} event{history.length === 1 ? "" : "s"}</span></div>
          <div className="grid mt" style={{ gap: 8 }}>
            {history.length ? history.slice().reverse().map((h, i) => (
              <div key={i} className="rowitem" style={{ alignItems: "flex-start" }}>
                <StatusDot tone="ok" />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="flex gap wrap center"><b>{h.kind || "event"}</b>{h.feed ? <span className="tag mono">{h.feed}</span> : null}{h.round != null ? <span className="dim" style={{ fontSize: 12 }}>round {h.round}</span> : null}</div>
                  {h.note ? <div className="dim" style={{ fontSize: 12, marginTop: 4 }}>{h.note}</div> : null}
                  {h.by ? <div className="dim mono" style={{ fontSize: 11, marginTop: 4 }}>{short(h.by, 6)}</div> : null}
                </div>
              </div>
            )) : <div className="empty">No activity yet.</div>}
          </div>
        </div>
      </div>
    </>
  )
}
