import { describe, it, expect } from "vitest";
import { getIncomeStatement } from "../app/services/get-income-statement.js";
import {
  IDS,
  mockBalanceRepo,
  mockLedgerRepo,
} from "./helpers.js";

function buildDeps(overrides: Record<string, unknown> = {}) {
  return {
    balanceRepo: mockBalanceRepo(),
    ledgerRepo: mockLedgerRepo(),
    ...overrides,
  };
}

describe("getIncomeStatement", () => {
  it("returns an income statement with revenue/expenses/netIncome", async () => {
    const deps = buildDeps();

    const result = await getIncomeStatement(
      { ledgerId: IDS.ledger, fromPeriodId: IDS.period, toPeriodId: IDS.period },
      deps,
    );

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toHaveProperty("revenue");
      expect(result.value).toHaveProperty("expenses");
      expect(result.value).toHaveProperty("netIncome");
      expect(result.value.revenue.label).toBe("Revenue");
      expect(result.value.expenses.label).toBe("Expenses");
    }
  });

  it("includes period range in the result", async () => {
    const deps = buildDeps();

    const result = await getIncomeStatement(
      { ledgerId: IDS.ledger, fromPeriodId: "P01", toPeriodId: "P06" },
      deps,
    );

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.fromPeriodId).toBe("P01");
      expect(result.value.toPeriodId).toBe("P06");
    }
  });

  it("returns error when ledger not found", async () => {
    const deps = buildDeps({
      ledgerRepo: mockLedgerRepo([]),
    });

    const result = await getIncomeStatement(
      { ledgerId: "nonexistent", fromPeriodId: IDS.period, toPeriodId: IDS.period },
      deps,
    );

    expect(result.ok).toBe(false);
  });
});
