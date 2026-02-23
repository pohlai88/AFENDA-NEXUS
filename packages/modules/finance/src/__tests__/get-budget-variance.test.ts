import { describe, it, expect } from "vitest";
import { money } from "@afenda/core";
import { getBudgetVariance } from "../slices/hub/services/get-budget-variance.js";
import {
  IDS,
  makeBudgetEntry,
  mockBudgetRepo,
  mockBalanceRepo,
  mockAccountRepo,
  mockLedgerRepo,
} from "./helpers.js";

function buildDeps(overrides: Record<string, unknown> = {}) {
  return {
    budgetRepo: mockBudgetRepo(),
    balanceRepo: mockBalanceRepo(),
    accountRepo: mockAccountRepo(),
    ledgerRepo: mockLedgerRepo(),
    ...overrides,
  };
}

describe("getBudgetVariance", () => {
  it("returns variance report when budget entries exist", async () => {
    const entry = makeBudgetEntry({
      accountCode: "1000",
      budgetAmount: money(50000n, "USD"),
    });
    const deps = buildDeps({
      budgetRepo: mockBudgetRepo([entry]),
    });

    const result = await getBudgetVariance(
      { ledgerId: IDS.ledger, periodId: IDS.period },
      deps,
    );

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.rows).toHaveLength(1);
      expect(result.value.rows[0]!.accountCode).toBe("1000");
      expect(result.value.totalBudget.amount).toBe(50000n);
    }
  });

  it("returns error when no budget entries found", async () => {
    const deps = buildDeps();

    const result = await getBudgetVariance(
      { ledgerId: IDS.ledger, periodId: IDS.period },
      deps,
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("NO_BUDGET_DATA");
    }
  });

  it("computes variance as budget minus actual", async () => {
    const entry = makeBudgetEntry({
      accountCode: "1000",
      budgetAmount: money(100000n, "USD"),
    });
    const deps = buildDeps({
      budgetRepo: mockBudgetRepo([entry]),
    });

    const result = await getBudgetVariance(
      { ledgerId: IDS.ledger, periodId: IDS.period },
      deps,
    );

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.totalVariance.amount).toBe(
        result.value.totalBudget.amount - result.value.totalActual.amount,
      );
    }
  });
});
