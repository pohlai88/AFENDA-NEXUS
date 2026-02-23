import { describe, it, expect } from "vitest";
import { getBalanceSheet } from "../app/services/get-balance-sheet.js";
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

describe("getBalanceSheet", () => {
  it("returns a balance sheet with asset/liability/equity sections", async () => {
    const deps = buildDeps();

    const result = await getBalanceSheet(
      { ledgerId: IDS.ledger, periodId: IDS.period },
      deps,
    );

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toHaveProperty("assets");
      expect(result.value).toHaveProperty("liabilities");
      expect(result.value).toHaveProperty("equity");
      expect(result.value).toHaveProperty("isBalanced");
      expect(result.value.assets.label).toBe("Assets");
      expect(result.value.liabilities.label).toBe("Liabilities");
      expect(result.value.equity.label).toBe("Equity");
    }
  });

  it("includes ledgerId and periodId in the result", async () => {
    const deps = buildDeps();

    const result = await getBalanceSheet(
      { ledgerId: IDS.ledger, periodId: IDS.period },
      deps,
    );

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.periodId).toBe(IDS.period);
    }
  });

  it("returns error when ledger not found", async () => {
    const deps = buildDeps({
      ledgerRepo: mockLedgerRepo([]),
    });

    const result = await getBalanceSheet(
      { ledgerId: "nonexistent", periodId: IDS.period },
      deps,
    );

    expect(result.ok).toBe(false);
  });
});
