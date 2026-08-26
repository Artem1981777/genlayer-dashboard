// Pure action definitions + role/phase gating, extracted from actions-panel.tsx for unit testing (no React deps).
export type Field = { key: string; label: string; type: "text" | "number" | "select"; options?: string[]; placeholder?: string }
export type ActionDef = { fn: string; label: string; tone?: "ok" | "bad" | "warn"; fields?: Field[]; build?: (v: Record<string, string>) => any[]; value?: (v: Record<string, string>) => bigint; role?: "creator" | "author"; phase?: (st: any) => boolean }
export const isCreator = (st: any, acct?: string | null) => !!(acct && st && st.creator && String(acct).toLowerCase() === String(st.creator).toLowerCase())
export const isAuthor = (st: any, acct?: string | null) => !!(acct && st && st.author && String(acct).toLowerCase() === String(st.author).toLowerCase())
export const roleOk = (a: ActionDef, st: any, acct?: string | null) => a.role === "creator" ? isCreator(st, acct) : a.role === "author" ? isAuthor(st, acct) : true
export const phaseOk = (a: ActionDef, st: any) => a.phase ? !!a.phase(st) : true
export const canDo = (a: ActionDef, st: any, acct?: string | null) => phaseOk(a, st) && roleOk(a, st, acct)
export const whyNot = (a: ActionDef, st: any, acct?: string | null) => !phaseOk(a, st) ? "Not available in the current phase" : (a.role === "creator" ? "Only the market creator can do this" : a.role === "author" ? "Only the content author can do this" : "Not available for your wallet")
export const ACTIONS: Record<string, ActionDef[]> = {
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

export const visibleActions = (projectId: string, st: any, acct?: string | null): ActionDef[] => (ACTIONS[projectId] || []).filter((a) => canDo(a, st, acct))
