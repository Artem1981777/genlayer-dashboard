import { describe, it, expect } from "vitest"
import { ACTIONS, canDo, whyNot, visibleActions, isCreator, isAuthor } from "./actions"
const CREATOR = "0x198a1952BD58984281f57CF824d264cdbd412814"
const AUTHOR = "0xB596E244aabBccDDeeFF00112233445566778899"
const JUDGE = "0xdc6778C5F8cC74b10aED11c48306D4Cfc5737FBD"
const V = (p: string, st: any, acct?: string | null) => visibleActions(p, st, acct).map((a) => a.fn).sort()
const cases: Array<[string, string, any, string | null, string[]]> = [
  ["pred non-creator open", "prediction", { status: "open", creator: CREATOR }, JUDGE, ["stake"]],
  ["pred creator open", "prediction", { status: "open", creator: CREATOR }, CREATOR, ["resolve", "stake"]],
  ["pred resolved judge", "prediction", { status: "resolved", creator: CREATOR }, JUDGE, ["dispute"]],
  ["pred disputed creator", "prediction", { status: "disputed", creator: CREATOR }, CREATOR, ["resolve_dispute"]],
  ["pred disputed judge", "prediction", { status: "disputed", creator: CREATOR }, JUDGE, []],
  ["pred settle YES creator", "prediction", { status: "resolved", outcome: "YES", creator: CREATOR }, CREATOR, ["dispute", "settle"]],
  ["pred settle UNRESOLVED creator", "prediction", { status: "resolved", outcome: "UNRESOLVED", creator: CREATOR }, CREATOR, ["dispute"]],
  ["pred settled claim", "prediction", { status: "settled", creator: CREATOR }, JUDGE, ["claim"]],
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
describe("role/phase action visibility", () => {
  for (const [name, proj, st, acct, expected] of cases) {
    it(name, () => { expect(V(proj, st, acct)).toEqual([...expected].sort()) })
  }
})
describe("whyNot + identity + canDo", () => {
  it("creator-only message", () => { expect(whyNot(ACTIONS.prediction.find((a) => a.fn === "resolve")!, { status: "open", creator: CREATOR }, JUDGE)).toBe("Only the market creator can do this") })
  it("author-only message", () => { expect(whyNot(ACTIONS.moderator.find((a) => a.fn === "appeal")!, { status: "enforced", verdict: "REMOVE", creator: CREATOR, author: AUTHOR }, JUDGE)).toBe("Only the content author can do this") })
  it("wrong-phase message", () => { expect(whyNot(ACTIONS.prediction.find((a) => a.fn === "claim")!, { status: "open", creator: CREATOR }, JUDGE)).toBe("Not available in the current phase") })
  it("identity is case-insensitive", () => { expect(isCreator({ creator: CREATOR }, CREATOR.toLowerCase())).toBe(true); expect(isAuthor({ author: AUTHOR }, AUTHOR.toUpperCase())).toBe(true) })
  it("canDo false for wrong role", () => { expect(canDo(ACTIONS.prediction.find((a) => a.fn === "resolve")!, { status: "open", creator: CREATOR }, JUDGE)).toBe(false) })
})
