import { describe, it, expect } from "vitest"
import { readState } from "./genlayer"
describe("live moderator pending case (no mocks)", () => {
  it("reads get_state from the seeded interactive case", async () => {
    const s: any = await readState("0x16cD8F92DEdDBdF27E7bc8c53633C61Dbb352307")
    expect(s && typeof s === "object").toBe(true)
    expect(typeof s.status).toBe("string")
  }, 30000)
})
