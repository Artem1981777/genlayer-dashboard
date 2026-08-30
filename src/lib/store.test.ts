import { describe, it, expect } from "vitest"
import { loadTracked, addContract, removeContract } from "./store"
import { getProject, PROJECTS } from "./projects"
describe("projects", () => {
  it("includes moderator and prediction", () => { const ids = PROJECTS.map((p) => p.id); expect(ids).toContain("moderator"); expect(ids).toContain("prediction") })
  it("getProject falls back to first for unknown id", () => { expect(getProject("does-not-exist").id).toBe(PROJECTS[0].id) })
  it("every project has at least one seed contract", () => { for (const p of PROJECTS) expect(p.seedContracts.length).toBeGreaterThan(0) })
})
describe("store", () => {
  it("seeds tracked contracts per project", () => { const s = loadTracked(); expect(s.moderator).toContain("0x235f51b11b9f96d6673df37553ef58373c4324f9") })
  it("addContract prepends a new address", () => { const s = addContract("moderator", "0x0000000000000000000000000000000000000001"); expect(s.moderator[0]).toBe("0x0000000000000000000000000000000000000001") })
  it("addContract dedupes case-insensitively", () => { const existing = loadTracked().moderator[0]; const s = addContract("moderator", existing.toUpperCase()); const n = s.moderator.filter((a) => a.toLowerCase() === existing.toLowerCase()).length; expect(n).toBe(1) })
  it("removeContract removes an address", () => { const target = loadTracked().moderator[0]; const s = removeContract("moderator", target); expect(s.moderator.map((a) => a.toLowerCase())).not.toContain(target.toLowerCase()) })
})
