import { describe, it, expect } from "vitest"
import { PROJECTS, getProject } from "./projects"

const CM = "0x235F51b11b9F96d6673df37553Ef58373c4324F9"
const PM = "0xd5fbdf280d1726079d3741B4E18BaD656851A34d"
const ADDR = /^0x[0-9a-fA-F]{40}$/

describe("projects config", () => {
  it("has moderator and prediction", () => {
    expect(getProject("moderator").id).toBe("moderator")
    expect(getProject("prediction").id).toBe("prediction")
  })
  it("defaults to latest contracts (seedContracts[0])", () => {
    expect(getProject("moderator").seedContracts[0]).toBe(CM)
    expect(getProject("prediction").seedContracts[0]).toBe(PM)
  })
  it("drops the stale prediction address", () => {
    const all = PROJECTS.flatMap((p) => p.seedContracts)
    expect(all).not.toContain("0xd2Ead3C6BbaCe1D423F156762f33A2C9B406C73f")
    expect(all).not.toContain("0x72f6BE503a8319A40515641536C1d74378623914")
  })
  it("all seed contracts are valid addresses", () => {
    for (const p of PROJECTS) for (const a of p.seedContracts) expect(a).toMatch(ADDR)
  })
  it("every project has repo, demo, and at least one contract", () => {
    for (const p of PROJECTS) {
      expect(p.repo).toMatch(/^https:\/\/github\.com\//)
      expect(p.demo).toMatch(/^https:\/\//)
      expect(p.seedContracts.length).toBeGreaterThan(0)
    }
  })
  it("falls back to the first project for unknown id", () => {
    expect(getProject("nope").id).toBe(PROJECTS[0].id)
  })
})
