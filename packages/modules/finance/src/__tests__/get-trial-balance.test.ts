import { describe, it, expect } from "vitest";
import { getTrialBalance } from "../slices/gl/services/get-trial-balance.js";
import { mockBalanceRepo } from "./helpers.js";

describe("getTrialBalance()", () => {
  it("returns a trial balance", async () => {
    const balanceRepo = mockBalanceRepo();
    const result = await getTrialBalance(
      { ledgerId: "led-001", year: "2025" },
      { balanceRepo },
    );
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value.isBalanced).toBe(true);
  });

  it("passes period filter to repo", async () => {
    const balanceRepo = mockBalanceRepo();
    const result = await getTrialBalance(
      { ledgerId: "led-001", year: "2025", period: 6 },
      { balanceRepo },
    );
    expect(result.ok).toBe(true);
  });
});
