"use client"
import { ProjectDef, TrackedCase } from "@/lib/types"
import { parseHistory, short, addrUrl } from "@/lib/format"
import { ConfidenceGauge } from "./confidence-gauge"
import { DecisionBadge } from "./verdict-badge"
import { HistoryTimeline } from "./history-timeline"
import { CopyButton } from "./copy-button"
import { ExternalLink } from "lucide-react"
import { ActionsPanel } from "./actions-panel"
export function CasePanel({ project, tc, onRefresh }: { project: ProjectDef; tc?: TrackedCase; onRefresh?: () => void }) {
  if (!tc) return <div className="card"><div className="empty"><div className="big">Select a case</div>Pick a contract on the left to inspect it.</div></div>
  const s = tc.state || {}
  const decision = project.decisionField === "verdict" ? s.verdict : s.outcome
  const conf = Number(s.confidence)
  const hasConf = Number.isFinite(conf) && String(s.confidence || "").length > 0
  const tone = project.decisions.find((d) => d.value === String(decision || "").toUpperCase())?.tone || "muted"
  const toneColor = tone === "ok" ? "#4fe08b" : tone === "bad" ? "#ff7b7b" : tone === "warn" ? "#f2cf5b" : "#b6ff6c"
  const hist = parseHistory(s.history)
  return (
    <div className="card">
      <div className="flex between center wrap gap">
        <div className="flex center gap">
          <a className="tag mono" href={addrUrl(tc.address)} target="_blank" rel="noreferrer">{short(tc.address, 6)} <ExternalLink size={12} /></a>
          <CopyButton text={tc.address} title="Copy address" />
        </div>
        <span className="tag">{s.status || "unknown"}</span>
      </div>
      {tc.error ? <div className="empty" style={{ color: "#ff7b7b" }}>Failed to read: {tc.error}</div> : (
        <>
          <div className="flex gap wrap mt center">
            {project.decisionField === "verdict" && hasConf ? <ConfidenceGauge value={conf} tone={toneColor} /> : null}
            <div style={{ flex: 1, minWidth: 220 }}>
              <DecisionBadge project={project} value={decision} lg />
              <div className="flex gap wrap mt8">
                {s.category && s.category !== "none" ? <span className="tag">{s.category}</span> : null}
                {s.escalated === "true" ? <span className="tag">escalated</span> : null}
                {s.needs_review === "true" ? <span className="tag">needs review</span> : null}
              </div>
              <div className="muted mt" style={{ fontSize: 13.5 }}>{s.reason || s.rationale || "—"}</div>
            </div>
          </div>
          {(s.rules || s.question) ? <div className="mt"><div className="dim" style={{ fontSize: 12 }}>{project.decisionField === "verdict" ? "Rules" : "Question"}</div><div style={{ fontSize: 13.5 }}>{s.rules || s.question}</div></div> : null}
          {s.content ? <div className="mt"><div className="dim" style={{ fontSize: 12 }}>Content</div><div className="mono" style={{ fontSize: 12.5, maxHeight: 140, overflow: "auto" }}>{s.content}</div></div> : null}
          <div className="mt"><div className="dim" style={{ fontSize: 12 }}>History</div><HistoryTimeline project={project} items={hist} /></div>
          <ActionsPanel projectId={project.id} address={tc.address} onDone={onRefresh} state={s} />
        </>
      )}
    </div>
  )
}
