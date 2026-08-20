"use client"
import { useState, useEffect } from "react"
import { useApp } from "@/components/providers"
import { getProject } from "@/lib/projects"
import { useCases } from "@/hooks/use-cases"
import { KpiCard } from "@/components/kpi-card"
import { CasePanel } from "@/components/case-panel"
import { DecisionBadge } from "@/components/verdict-badge"
import { StatusDot } from "@/components/status-dot"
import { AddContract } from "@/components/add-contract"
import { short } from "@/lib/format"
import { Activity, ShieldAlert, Gauge, ListChecks, RefreshCw } from "lucide-react"
export default function Overview() {
  const { projectId } = useApp()
  const project = getProject(projectId)
  const { cases, loading, lastSync, refresh } = useCases(projectId)
  const [selected, setSelected] = useState<string | null>(null)
  useEffect(() => { setSelected(null) }, [projectId])
  const field = project.decisionField
  const decided = cases.filter((c) => c.state && (field === "verdict" ? c.state.verdict : c.state.outcome))
  const total = cases.length
  const counts: Record<string, number> = {}
  for (const c of decided) { const v = String((field === "verdict" ? c.state!.verdict : c.state!.outcome) || "").toUpperCase(); counts[v] = (counts[v] || 0) + 1 }
  const confVals = cases.map((c) => Number(c.state?.confidence)).filter((n) => Number.isFinite(n))
  const avgConf = confVals.length ? Math.round(confVals.reduce((a, b) => a + b, 0) / confVals.length) : null
  const escalated = cases.filter((c) => c.state?.escalated === "true").length
  const review = cases.filter((c) => c.state?.needs_review === "true").length
  const online = cases.some((c) => c.state)
  const selectedCase = cases.find((c) => c.address === selected) || decided[0] || cases[0]
  const primary = project.decisions[0]?.value
  return (
    <>
      <div className="topbar">
        <div>
          <h1 className="h1"><StatusDot tone={online ? "ok" : "bad"} /> {project.name}</h1>
          <div className="sub">{project.tagline} · {total} tracked case{total === 1 ? "" : "s"}</div>
        </div>
        <div className="flex gap center">
          <span className="chip"><span className={"dot" + (online ? "" : " bad")} /> {online ? "Live" : "Offline"} · Bradbury</span>
          <button className="btn" onClick={refresh}><RefreshCw size={14} /> Refresh</button>
        </div>
      </div>
      <div className="grid kpis">
        <KpiCard icon={<ListChecks size={14} />} label="Tracked cases" value={loading && !total ? "…" : total} meta={lastSync ? "synced " + new Date(lastSync).toLocaleTimeString() : "syncing…"} />
        <KpiCard icon={<Activity size={14} />} label={project.decisions.map((d) => d.label).join(" / ")} value={<span className="flex gap wrap">{project.decisions.map((d) => <span key={d.value} className={"badge " + d.tone}>{counts[d.value] || 0}</span>)}</span>} meta={decided.length + " decided of " + total} />
        {field === "verdict"
          ? <KpiCard icon={<Gauge size={14} />} label="Avg confidence" value={avgConf === null ? "—" : avgConf + "%"} meta="across tracked cases" />
          : <KpiCard icon={<Gauge size={14} />} label={primary + " rate"} value={decided.length ? Math.round(((counts[primary] || 0) / decided.length) * 100) + "%" : "—"} meta={(counts[primary] || 0) + " " + primary} />}
        {field === "verdict"
          ? <KpiCard icon={<ShieldAlert size={14} />} label="Needs review" value={review} meta={escalated + " escalated"} />
          : <KpiCard icon={<ShieldAlert size={14} />} label="Decided" value={decided.length} meta={(total - decided.length) + " pending"} />}
      </div>
      <div className="split mt">
        <div className="card">
          <div className="flex between center wrap gap"><b>Cases</b><AddContract projectId={projectId} onAdded={refresh} /></div>
          <div className="grid mt" style={{ gap: 10 }}>
            {loading && !cases.length ? [0, 1, 2].map((i) => <div key={i} className="sk" style={{ height: 60 }} />) : null}
            {!loading && !cases.length ? <div className="empty"><div className="big">No cases tracked</div>Add a contract address to start.</div> : null}
            {cases.map((c) => {
              const dv = field === "verdict" ? c.state?.verdict : c.state?.outcome
              const isSel = selectedCase?.address === c.address
              return (
                <div key={c.address} className={"rowitem" + (isSel ? " active" : "")} onClick={() => setSelected(c.address)}>
                  <StatusDot tone={c.error ? "bad" : c.state ? "ok" : "warn"} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="mono">{short(c.address, 6)}</div>
                    <div className="dim" style={{ fontSize: 12 }}>{c.state?.status || (c.error ? "error" : "loading…")}</div>
                  </div>
                  <DecisionBadge project={project} value={dv} />
                </div>
              )
            })}
          </div>
        </div>
        <CasePanel project={project} tc={selectedCase} />
      </div>
    </>
  )
}
