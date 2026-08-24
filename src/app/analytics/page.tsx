"use client"
import { useApp } from "@/components/providers"
import { getProject } from "@/lib/projects"
import { useCases } from "@/hooks/use-cases"
import { StatusDot } from "@/components/status-dot"
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts"
const TONE: Record<string, string> = { ok: "#4fe08b", warn: "#f2cf5b", bad: "#ff7b7b", muted: "#b6ff6c" }
export default function Analytics() {
  const { projectId } = useApp()
  const project = getProject(projectId)
  const { cases, loading } = useCases(projectId)
  if (project.kind === "oracle") {
    let feeds: any = {}
    try { feeds = JSON.parse(((cases[0] && cases[0].state) as any)?.feeds || "{}") } catch {}
    const keys = Object.keys(feeds)
    const srcData = keys.map((k) => ({ name: k, sources: (feeds[k] && feeds[k].sources ? feeds[k].sources.length : 0) }))
    const totalSources = srcData.reduce((n, d) => n + d.sources, 0)
    return (
      <>
        <div className="topbar"><div><h1 className="h1"><StatusDot /> Analytics</h1><div className="sub">{project.name} · feeds & sources</div></div></div>
        <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fit,minmax(300px,1fr))" }}>
          <div className="card">
            <b>Sources per feed</b>
            <div style={{ height: 280 }} className="mt">
              <ResponsiveContainer>
                <BarChart data={srcData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#232b3d" />
                  <XAxis dataKey="name" stroke="#94a0ba" fontSize={12} />
                  <YAxis allowDecimals={false} stroke="#94a0ba" fontSize={12} />
                  <Tooltip contentStyle={{ background: "#141a27", border: "1px solid #232b3d", borderRadius: 12, color: "#eef2f9" }} />
                  <Bar dataKey="sources" fill="#5ad1ff" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            {!srcData.length ? <div className="empty">No feeds registered.</div> : null}
          </div>
          <div className="card">
            <b>Feed summary</b>
            <div className="flex gap wrap mt"><span className="tag">{keys.length} feeds</span><span className="tag">{totalSources} sources</span></div>
            <div className="grid mt" style={{ gap: 8 }}>
              {keys.map((k) => <div key={k} className="rowitem"><StatusDot tone="ok" /><div style={{ flex: 1, minWidth: 0 }}><b className="mono">{k}</b><div className="dim" style={{ fontSize: 12 }}>tol {feeds[k] && feeds[k].tolerance_bps} bps · max spread {feeds[k] && feeds[k].max_spread_bps} bps · {feeds[k] && feeds[k].decimals} dec</div></div></div>)}
            </div>
          </div>
        </div>
        {loading ? <div className="dim mt">syncing…</div> : null}
      </>
    )
  }

  const field = project.decisionField
  const dist = project.decisions.map((d) => ({
    name: d.label,
    value: cases.filter((c) => String((field === "verdict" ? c.state?.verdict : c.state?.outcome) || "").toUpperCase() === d.value).length,
    color: TONE[d.tone],
  }))
  const confData = cases.filter((c) => Number.isFinite(Number(c.state?.confidence)) && String(c.state?.confidence || "").length)
    .map((c, i) => ({ name: "#" + (i + 1), confidence: Number(c.state?.confidence) }))
  return (
    <>
      <div className="topbar">
        <div><h1 className="h1"><StatusDot /> Analytics</h1><div className="sub">{project.name} · distribution & confidence</div></div>
      </div>
      <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fit,minmax(300px,1fr))" }}>
        <div className="card">
          <b>Decision distribution</b>
          <div style={{ height: 280 }} className="mt">
            <ResponsiveContainer>
              <PieChart>
                <Pie data={dist} dataKey="value" nameKey="name" innerRadius={60} outerRadius={100} paddingAngle={3}>
                  {dist.map((d, i) => <Cell key={i} fill={d.color} stroke="none" />)}
                </Pie>
                <Tooltip contentStyle={{ background: "#141a27", border: "1px solid #232b3d", borderRadius: 12, color: "#eef2f9" }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex gap wrap">{dist.map((d) => <span key={d.name} className="tag"><span style={{ width: 8, height: 8, borderRadius: 8, background: d.color, display: "inline-block" }} /> {d.name}: {d.value}</span>)}</div>
        </div>
        <div className="card">
          <b>{field === "verdict" ? "Confidence per case" : "Decisions"}</b>
          <div style={{ height: 280 }} className="mt">
            <ResponsiveContainer>
              <BarChart data={confData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#232b3d" />
                <XAxis dataKey="name" stroke="#94a0ba" fontSize={12} />
                <YAxis domain={[0, 100]} stroke="#94a0ba" fontSize={12} />
                <Tooltip contentStyle={{ background: "#141a27", border: "1px solid #232b3d", borderRadius: 12, color: "#eef2f9" }} />
                <Bar dataKey="confidence" fill="#b6ff6c" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          {!confData.length ? <div className="empty">No confidence data for this project.</div> : null}
        </div>
      </div>
      {loading ? <div className="dim mt">syncing…</div> : null}
    </>
  )
}
