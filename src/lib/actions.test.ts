import { describe, it, expect } from "vitest"
import { ACTIONS, canDo, whyNot, visibleActions, isCreator, isAuthor, hasStake, winningStake, alreadyClaimed, disputeRounds } from "./actions"
const CREATOR = "0x198a1952BD58984281f57CF824d264cdbd412814"
const AUTHOR = "0xB596E244aabBccDDeeFF00112233445566778899"
const JUDGE = "0xdc6778C5F8cC74b10aED11c48306D4Cfc5737FBD"
const V = (p: string, st: any, acct?: string | null) => visibleActions(p, st, acct).map((a) => a.fn).sort()
const posOf = (m: any) => JSON.stringify(m)
const disputes = (n: number) => JSON.stringify(Array.from({ length: n }, (_, i) => ({ round: i + 1, kind: "dispute" })))
const PM = ACTIONS.prediction
const find = (fn: string) => PM.find((a) => a.fn === fn)!
const cases: Array<[string, string, any, string | null, string[]]> = [
  ["pred non-creator open", "prediction", { status: "open", creator: CREATOR }, JUDGE, ["stake"]],
  ["pred creator open", "prediction", { status: "open", creator: CREATOR }, CREATOR, ["resolve", "stake", "void"]],
  ["pred resolved non-participant", "prediction", { status: "resolved", creator: CREATOR }, JUDGE, []],
  ["pred resolved participant", "prediction", { status: "resolved", creator: CREATOR, positions: posOf({ [JUDGE]: { YES: 100, NO: 0 } }) }, JUDGE, ["dispute"]],
  ["pred resolved dispute-limit", "prediction", { status: "resolved", creator: CREATOR, positions: posOf({ [JUDGE]: { YES: 100, NO: 0 } }), history: disputes(2) }, JUDGE, []],
  ["pred resolved YES creator not-staked", "prediction", { status: "resolved", outcome: "YES", creator: CREATOR }, CREATOR, ["settle"]],
  ["pred resolved YES creator staked", "prediction", { status: "resolved", outcome: "YES", creator: CREATOR, positions: posOf({ [CREATOR]: { YES: 50, NO: 0 } }) }, CREATOR, ["dispute", "settle"]],
  ["pred resolved UNRESOLVED creator", "prediction", { status: "resolved", outcome: "UNRESOLVED", creator: CREATOR }, CREATOR, []],
  ["pred settled winner unclaimed", "prediction", { status: "settled", creator: CREATOR, winning_side: "YES", positions: posOf({ [JUDGE]: { YES: 100, NO: 0 } }) }, JUDGE, ["claim"]],
  ["pred settled winner claimed", "prediction", { status: "settled", creator: CREATOR, winning_side: "YES", positions: posOf({ [JUDGE]: { YES: 100, NO: 0 } }), claims: posOf({ [JUDGE]: { claimed: true } }) }, JUDGE, []],
  ["pred settled loser", "prediction", { status: "settled", creator: CREATOR, winning_side: "YES", positions: posOf({ [JUDGE]: { YES: 0, NO: 100 } }) }, JUDGE, []],
  ["pred settled non-participant", "prediction", { status: "settled", creator: CREATOR, winning_side: "YES" }, JUDGE, []],
  ["pred voided participant", "prediction", { status: "voided", creator: CREATOR, positions: posOf({ [JUDGE]: { YES: 0, NO: 80 } }) }, JUDGE, ["refund"]],
  ["pred voided refunded", "prediction", { status: "voided", creator: CREATOR, positions: posOf({ [JUDGE]: { YES: 0, NO: 80 } }), claims: posOf({ [JUDGE]: { claimed: true } }) }, JUDGE, []],
  ["pred voided non-participant", "prediction", { status: "voided", creator: CREATOR }, JUDGE, []],
  ["mod pending any", "moderator", { status: "pending", creator: CREATOR, author: CREATOR }, JUDGE, ["moderate"]],
  ["mod moderated creator", "moderator", { status: "moderated", creator: CREATOR, author: AUTHOR }, CREATOR, ["enforce"]],
  ["mod moderated judge", "moderator", { status: "moderated", creator: CREATOR, author: AUTHOR }, JUDGE, []],
  ["mod enforced author REMOVE", "moderator", { status: "enforced", verdict: "REMOVE", creator: CREATOR, author: AUTHOR }, AUTHOR, ["appeal"]],
  ["mod enforced author ALLOW", "moderator", { status: "enforced", verdict: "ALLOW", creator: CREATOR, author: AUTHOR }, AUTHOR, []],
  ["mod enforced judge", "moderator", { status: "enforced", verdict: "REMOVE", creator: CREATOR, author: AUTHOR }, JUDGE, []],
  ["mod appealed creator", "moderator", { status: "appealed", creator: CREATOR, author: AUTHOR }, CREATOR, ["resolve_appeal"]],
  ["mod resolved terminal", "moderator", { status: "resolved", verdict: "REMOVE", creator: CREATOR, author: AUTHOR }, JUDGE, []],
  ["oracle feeds", "oracle", { feeds: JSON.stringify({ btc_usd: {} }) }, JUDGE, ["update"]],
  ["oracle empty feeds", "oracle", { feeds: "{}" }, JUDGE, []],
  ["oracle no feeds", "oracle", {}, JUDGE, []],
  ["oracle bad json", "oracle", { feeds: "not json" }, JUDGE, []],
]
describe("role/phase/precondition action visibility", () => {
  for (const [name, proj, st, acct, expected] of cases) {
    it(name, () => { expect(V(proj, st, acct)).toEqual([...expected].sort()) })
  }
})
describe("precise whyNot reasons for per-caller gating", () => {
  it("claim no winning stake", () => { expect(whyNot(find("claim"), { status: "settled", winning_side: "YES" }, JUDGE)).toBe("No winning stake to claim") })
  it("claim already claimed", () => { expect(whyNot(find("claim"), { status: "settled", winning_side: "YES", positions: posOf({ [JUDGE]: { YES: 10, NO: 0 } }), claims: posOf({ [JUDGE]: { claimed: true } }) }, JUDGE)).toBe("Already claimed") })
  it("dispute non-participant", () => { expect(whyNot(find("dispute"), { status: "resolved" }, JUDGE)).toBe("Only a participant who staked this market can dispute") })
  it("dispute limit", () => { expect(whyNot(find("dispute"), { status: "resolved", positions: posOf({ [JUDGE]: { YES: 5, NO: 0 } }), history: disputes(2) }, JUDGE)).toBe("Dispute limit reached (max 2) for this market") })
  it("refund nothing", () => { expect(whyNot(find("refund"), { status: "voided" }, JUDGE)).toBe("Nothing to refund") })
  it("void definite outcome", () => { expect(whyNot(find("void"), { status: "open", creator: CREATOR, outcome: "YES" }, CREATOR)).toBe("Cannot void a market with a definite YES/NO outcome; settle it instead") })
  it("wrong-phase message", () => { expect(whyNot(find("claim"), { status: "open", creator: CREATOR }, JUDGE)).toBe("Not available in the current phase") })
  it("creator-only message", () => { expect(whyNot(find("resolve"), { status: "open", creator: CREATOR }, JUDGE)).toBe("Only the market creator can do this") })
})
describe("identity + helpers", () => {
  it("identity case-insensitive", () => { expect(isCreator({ creator: CREATOR }, CREATOR.toLowerCase())).toBe(true); expect(isAuthor({ author: AUTHOR }, AUTHOR.toUpperCase())).toBe(true) })
  it("stake/winning/claimed/disputeRounds helpers", () => {
    const st = { winning_side: "NO", positions: posOf({ [JUDGE]: { YES: 0, NO: 30 } }), claims: posOf({ [JUDGE]: { claimed: true } }), history: disputes(1) }
    expect(hasStake(st, JUDGE)).toBe(true); expect(winningStake(st, JUDGE)).toBe(30); expect(alreadyClaimed(st, JUDGE)).toBe(true); expect(disputeRounds(st)).toBe(1)
  })
})
