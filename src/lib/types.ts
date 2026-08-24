export type ProjectId = "moderator" | "prediction" | "oracle"
export type Tone = "ok" | "warn" | "bad" | "muted"
export type HistoryItem = {
  round?: number; kind?: string; by?: string; note?: string
  verdict?: string; confidence?: string | number; category?: string
  escalated?: string; needs_review?: string; reason?: string
  outcome?: string; rationale?: string
}
export type CaseState = Record<string, any> & { status?: string; history?: string }
export type TrackedCase = { address: string; projectId: string; state?: CaseState; error?: string; loading?: boolean }
export type Decision = { value: string; label: string; tone: Tone }
export type ProjectDef = {
  id: ProjectId; name: string; tagline: string; icon: string; accent: string
  repo: string; demo: string; decisionField: "verdict" | "outcome"
  decisions: Decision[]; seedContracts: string[]; kind?: "case" | "oracle"
}
