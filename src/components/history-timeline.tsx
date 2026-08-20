import { ProjectDef, HistoryItem } from "@/lib/types"
import { DecisionBadge } from "./verdict-badge"
export function HistoryTimeline({ project, items }: { project: ProjectDef; items: HistoryItem[] }) {
  if (!items.length) return <div className="empty">No history yet.</div>
  return (
    <div className="timeline mt">
      {items.map((it, i) => {
        const decision = project.decisionField === "verdict" ? it.verdict : it.outcome
        return (
          <div className="tl" key={i}>
            <div className="flex center gap wrap">
              <span className="dim mono">round {it.round ?? i + 1} · {it.kind || "-"}</span>
              <DecisionBadge project={project} value={decision} />
              {it.confidence !== undefined && String(it.confidence).length ? <span className="tag">{it.confidence}%</span> : null}
              {it.category && it.category !== "none" ? <span className="tag">{it.category}</span> : null}
              {it.escalated === "true" ? <span className="tag">escalated</span> : null}
            </div>
            {(it.reason || it.rationale) ? <div className="muted mt8" style={{ fontSize: 13 }}>{it.reason || it.rationale}</div> : null}
            {it.note ? <div className="dim mt8" style={{ fontSize: 12 }}>note: {it.note}</div> : null}
          </div>
        )
      })}
    </div>
  )
}
