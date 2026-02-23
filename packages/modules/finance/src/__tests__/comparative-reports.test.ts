import { describe, it, expect } from "vitest";
import { money } from "@afenda/core";
import { buildComparativeSection } from "../slices/reporting/calculators/comparative-report.js";
import { getComparativeBalanceSheet } from "../slices/reporting/services/get-comparative-balance-sheet.js";
import { getComparativeIncomeStatement } from "../slices/reporting/services/get-comparative-income-statement.js";
import type { ReportSection } from "../slices/reporting/entities/financial-reports.js";
import { IDS, mockBalanceRepo, mockLedgerRepo } from "./helpers.js";

// ─── Calculator Tests ────────────────────────────────────────────────────────

function makeSection(label: string, rows: { code: string; name: string; amount: bigint }[]): ReportSection {
  return {
    label,
    rows: rows.map((r) => ({
      accountCode: r.code,
      accountName: r.name,
      balance: money(r.amount, "USD"),
    })),
    total: money(rows.reduce((s, r) => s + r.amount, 0n), "USD"),
  };
}

describe("buildComparativeSection (FR-05 calculator)", () => {
  it("merges matching accounts with variance", () => {
    const current = makeSection("Assets", [
      { code: "1000", name: "Cash", amount: 50000n },
      { code: "1100", name: "AR", amount: 30000n },
    ]);
    const prior = makeSection("Assets", [
      { code: "1000", name: "Cash", amount: 40000n },
      { code: "1100", name: "AR", amount: 35000n },
    ]);

    const { result } = buildComparativeSection({ current, prior, currency: "USD" });

    expect(result.rows).toHaveLength(2);
    expect(result.rows[0]!.accountCode).toBe("1000");
    expect(result.rows[0]!.currentBalance.amount).toBe(50000n);
    expect(result.rows[0]!.priorBalance.amount).toBe(40000n);
    expect(result.rows[0]!.variance.amount).toBe(10000n);
    expect(result.rows[0]!.variancePercent).toBe(25);

    expect(result.rows[1]!.variance.amount).toBe(-5000n);
    expect(result.currentTotal.amount).toBe(80000n);
    expect(result.priorTotal.amount).toBe(75000n);
    expect(result.varianceTotal.amount).toBe(5000n);
  });

  it("handles accounts present only in current period", () => {
    const current = makeSection("Assets", [
      { code: "1000", name: "Cash", amount: 50000n },
      { code: "1200", name: "Inventory", amount: 20000n },
    ]);
    const prior = makeSection("Assets", [
      { code: "1000", name: "Cash", amount: 40000n },
    ]);

    const { result } = buildComparativeSection({ current, prior, currency: "USD" });

    expect(result.rows).toHaveLength(2);
    expect(result.rows[1]!.accountCode).toBe("1200");
    expect(result.rows[1]!.priorBalance.amount).toBe(0n);
    expect(result.rows[1]!.variancePercent).toBeNull();
  });

  it("handles accounts present only in prior period", () => {
    const current = makeSection("Assets", [
      { code: "1000", name: "Cash", amount: 50000n },
    ]);
    const prior = makeSection("Assets", [
      { code: "1000", name: "Cash", amount: 40000n },
      { code: "1300", name: "Prepaid", amount: 10000n },
    ]);

    const { result } = buildComparativeSection({ current, prior, currency: "USD" });

    expect(result.rows).toHaveLength(2);
    expect(result.rows[1]!.accountCode).toBe("1300");
    expect(result.rows[1]!.currentBalance.amount).toBe(0n);
    expect(result.rows[1]!.priorBalance.amount).toBe(10000n);
    expect(result.rows[1]!.variance.amount).toBe(-10000n);
  });

  it("handles empty sections", () => {
    const current = makeSection("Assets", []);
    const prior = makeSection("Assets", []);

    const { result } = buildComparativeSection({ current, prior, currency: "USD" });

    expect(result.rows).toHaveLength(0);
    expect(result.varianceTotal.amount).toBe(0n);
  });

  it("computes variance percent correctly", () => {
    const current = makeSection("Revenue", [
      { code: "4000", name: "Sales", amount: 150000n },
    ]);
    const prior = makeSection("Revenue", [
      { code: "4000", name: "Sales", amount: 100000n },
    ]);

    const { result } = buildComparativeSection({ current, prior, currency: "USD" });
    expect(result.rows[0]!.variancePercent).toBe(50);
  });
});

// ─── Service Tests ───────────────────────────────────────────────────────────

describe("getComparativeBalanceSheet (FR-05)", () => {
  it("returns comparative balance sheet with all three sections", async () => {
    const result = await getComparativeBalanceSheet(
      { ledgerId: IDS.ledger, currentPeriodId: "2025-P06", priorPeriodId: "2025-P05" },
      { balanceRepo: mockBalanceRepo(), ledgerRepo: mockLedgerRepo() },
    );

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.currentPeriodId).toBe("2025-P06");
      expect(result.value.priorPeriodId).toBe("2025-P05");
      expect(result.value.assets).toBeDefined();
      expect(result.value.liabilities).toBeDefined();
      expect(result.value.equity).toBeDefined();
      expect(result.value.assets.label).toBe("Assets");
    }
  });
});

describe("getComparativeIncomeStatement (FR-05)", () => {
  it("returns comparative income statement with revenue and expenses", async () => {
    const result = await getComparativeIncomeStatement(
      {
        ledgerId: IDS.ledger,
        currentFromPeriodId: "2025-P01",
        currentToPeriodId: "2025-P06",
        priorFromPeriodId: "2024-P01",
        priorToPeriodId: "2024-P06",
      },
      { balanceRepo: mockBalanceRepo(), ledgerRepo: mockLedgerRepo() },
    );

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.currentFromPeriodId).toBe("2025-P01");
      expect(result.value.priorFromPeriodId).toBe("2024-P01");
      expect(result.value.revenue).toBeDefined();
      expect(result.value.expenses).toBeDefined();
      expect(result.value.currentNetIncome).toBeDefined();
      expect(result.value.priorNetIncome).toBeDefined();
      expect(result.value.netIncomeVariance).toBeDefined();
    }
  });
});
