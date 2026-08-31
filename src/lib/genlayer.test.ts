import { describe, it, expect } from "vitest"
import { readState } from "./genlayer"
describe("readState (live Bradbury, no mocks)", () => {
  it("reads get_state from a live Content Moderator contract", async () => { const s = await readState("0x235F51b11b9F96d6673df37553Ef58373c4324F9"); expect(s && typeof s === "object").toBe(true) }, 30000)
})

import { classifyExecution } from "./genlayer"
describe("classifyExecution (strict GenLayer result gating)", () => {
  it("success only for FINISHED / FINISHED_WITH_RETURN", () => {
    expect(classifyExecution("FINISHED")).toBe("success")
    expect(classifyExecution("FINISHED_WITH_RETURN")).toBe("success")
    expect(classifyExecution("finished_with_return")).toBe("success")
  })
  it("failure for every negative / unknown result", () => {
    for (const r of ["FINISHED_WITH_ERROR", "NOT_VOTED", "UNDETERMINED", "LEADER_TIMEOUT", "CANCELED", "ACCEPTED", "", "WHATEVER"]) {
      expect(classifyExecution(r)).toBe("failure")
    }
  })
  it("pending only for PENDING (transport/timeout)", () => {
    expect(classifyExecution("PENDING")).toBe("pending")
  })
})
