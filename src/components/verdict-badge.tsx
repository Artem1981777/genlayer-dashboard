import { ProjectDef } from "@/lib/types"
export function DecisionBadge({ project, value, lg }: { project: ProjectDef; value?: string; lg?: boolean }) {
  const v = String(value || "").toUpperCase()
  const def = project.decisions.find((d) => d.value === v)
  const tone = def?.tone || "muted"
  const label = def?.label || (v ? v : "Pending")
  return <span className={"badge " + tone + (lg ? " lg" : "")}>{label}</span>
}
