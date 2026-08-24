import { describe, it, expect } from "vitest"
import { readState } from "./genlayer"
describe("readState (live Bradbury, no mocks)", () => {
  it("reads get_state from a live Content Moderator contract", async () => { const s = await readState("0x235F51b11b9F96d6673df37553Ef58373c4324F9"); expect(s && typeof s === "object").toBe(true) }, 30000)
})
