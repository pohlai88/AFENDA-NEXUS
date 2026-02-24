import { describe, it, expect } from "vitest";
import { computeGroupOwnership } from "../calculators/group-ownership.js";
import { computeNci } from "../calculators/nci.js";
import { computeGoodwill } from "../calculators/goodwill-calc.js";
import { computeDividendEliminations } from "../calculators/dividend-elimination.js";
import { generateConsolidationJournal } from "../calculators/consolidation-journal.js";

// ── Group Ownership ──────────────────────────────────────────────────────────

describe("computeGroupOwnership", () => {
  it("computes direct subsidiaries", () => {
    const result = computeGroupOwnership("root", [
      { parentEntityId: "root", childEntityId: "sub-a", directPctBps: 8000 },
      { parentEntityId: "root", childEntityId: "sub-b", directPctBps: 3000 },
    ]);
    expect(result.result).toHaveLength(2);
    const subA = result.result.find((r) => r.entityId === "sub-a")!;
    expect(subA.effectivePctBps).toBe(8000);
    expect(subA.consolidationMethod).toBe("FULL");
    const subB = result.result.find((r) => r.entityId === "sub-b")!;
    expect(subB.effectivePctBps).toBe(3000);
    expect(subB.consolidationMethod).toBe("EQUITY");
  });

  it("computes multi-tier effective ownership", () => {
    const result = computeGroupOwnership("root", [
      { parentEntityId: "root", childEntityId: "sub-a", directPctBps: 8000 },
      { parentEntityId: "sub-a", childEntityId: "sub-b", directPctBps: 6000 },
    ]);
    expect(result.result).toHaveLength(2);
    const subB = result.result.find((r) => r.entityId === "sub-b")!;
    // 80% × 60% = 48%
    expect(subB.effectivePctBps).toBe(4800);
    expect(subB.consolidationMethod).toBe("EQUITY");
    expect(subB.path).toEqual(["root", "sub-a", "sub-b"]);
  });

  it("determines NONE for low ownership", () => {
    const result = computeGroupOwnership("root", [
      { parentEntityId: "root", childEntityId: "minority", directPctBps: 1500 },
    ]);
    expect(result.result[0]!.consolidationMethod).toBe("NONE");
  });

  it("handles empty links", () => {
    const result = computeGroupOwnership("root", []);
    expect(result.result).toHaveLength(0);
  });

  it("prevents circular visits", () => {
    const result = computeGroupOwnership("root", [
      { parentEntityId: "root", childEntityId: "a", directPctBps: 8000 },
      { parentEntityId: "a", childEntityId: "b", directPctBps: 7000 },
      { parentEntityId: "b", childEntityId: "a", directPctBps: 5000 },
    ]);
    // 'a' should only appear once — the circular link is ignored
    const aEntries = result.result.filter((r) => r.entityId === "a");
    expect(aEntries).toHaveLength(1);
  });
});

// ── NCI ──────────────────────────────────────────────────────────────────────

describe("computeNci", () => {
  it("computes NCI share of net assets and P&L", () => {
    const result = computeNci([
      {
        childEntityId: "sub-a",
        parentOwnershipPctBps: 8000,
        subsidiaryNetAssets: 1000000n,
        subsidiaryProfitOrLoss: 200000n,
        currencyCode: "USD",
      },
    ]);
    const nci = result.result[0]!;
    expect(nci.nciPctBps).toBe(2000);
    expect(nci.nciNetAssets).toBe(200000n); // 20% of 1M
    expect(nci.nciProfitOrLoss).toBe(40000n); // 20% of 200K
    expect(nci.parentNetAssets).toBe(800000n);
    expect(nci.parentProfitOrLoss).toBe(160000n);
  });

  it("handles 100% ownership (zero NCI)", () => {
    const result = computeNci([
      {
        childEntityId: "sub-a",
        parentOwnershipPctBps: 10000,
        subsidiaryNetAssets: 500000n,
        subsidiaryProfitOrLoss: 50000n,
        currencyCode: "USD",
      },
    ]);
    expect(result.result[0]!.nciNetAssets).toBe(0n);
    expect(result.result[0]!.nciProfitOrLoss).toBe(0n);
  });

  it("throws on invalid ownership BPS", () => {
    expect(() =>
      computeNci([
        {
          childEntityId: "x",
          parentOwnershipPctBps: 11000,
          subsidiaryNetAssets: 100n,
          subsidiaryProfitOrLoss: 10n,
          currencyCode: "USD",
        },
      ]),
    ).toThrow("Invalid ownership BPS");
  });

  it("throws on empty input", () => {
    expect(() => computeNci([])).toThrow("At least one subsidiary required");
  });
});

// ── Goodwill ─────────────────────────────────────────────────────────────────

describe("computeGoodwill", () => {
  it("computes proportionate method goodwill", () => {
    const result = computeGoodwill([
      {
        childEntityId: "sub-a",
        considerationPaid: 500000n,
        fairValueNetAssets: 400000n,
        parentOwnershipPctBps: 8000,
        nciMeasurementMethod: "PROPORTIONATE",
        nciFairValue: 0n,
        currencyCode: "USD",
      },
    ]);
    const gw = result.result[0]!;
    // parent share = 400000 * 80% = 320000, goodwill = 500000 - 320000 = 180000
    expect(gw.parentShareOfNetAssets).toBe(320000n);
    expect(gw.goodwillAmount).toBe(180000n);
    expect(gw.isBargainPurchase).toBe(false);
  });

  it("computes full fair-value method goodwill", () => {
    const result = computeGoodwill([
      {
        childEntityId: "sub-a",
        considerationPaid: 500000n,
        fairValueNetAssets: 600000n,
        parentOwnershipPctBps: 8000,
        nciMeasurementMethod: "FULL_FAIR_VALUE",
        nciFairValue: 120000n,
        currencyCode: "USD",
      },
    ]);
    const gw = result.result[0]!;
    // goodwill = (500000 + 120000) - 600000 = 20000
    expect(gw.goodwillAmount).toBe(20000n);
    expect(gw.nciAtAcquisition).toBe(120000n);
  });

  it("detects bargain purchase (negative goodwill)", () => {
    const result = computeGoodwill([
      {
        childEntityId: "sub-a",
        considerationPaid: 200000n,
        fairValueNetAssets: 400000n,
        parentOwnershipPctBps: 8000,
        nciMeasurementMethod: "PROPORTIONATE",
        nciFairValue: 0n,
        currencyCode: "USD",
      },
    ]);
    // parent share = 320000, goodwill = 200000 - 320000 = -120000
    expect(result.result[0]!.isBargainPurchase).toBe(true);
    expect(result.result[0]!.goodwillAmount).toBe(-120000n);
  });

  it("throws on empty input", () => {
    expect(() => computeGoodwill([])).toThrow("At least one acquisition required");
  });
});

// ── Dividend Elimination ─────────────────────────────────────────────────────

describe("computeDividendEliminations", () => {
  it("eliminates parent share of dividends", () => {
    const result = computeDividendEliminations([
      {
        childEntityId: "sub-a",
        parentEntityId: "parent",
        parentOwnershipPctBps: 7500,
        totalDividendDeclared: 100000n,
        currencyCode: "USD",
      },
    ]);
    const entry = result.result[0]!;
    expect(entry.eliminationAmount).toBe(75000n); // 75%
    expect(entry.nciShare).toBe(25000n); // 25%
  });

  it("handles empty input", () => {
    const result = computeDividendEliminations([]);
    expect(result.result).toHaveLength(0);
  });

  it("throws on negative dividend", () => {
    expect(() =>
      computeDividendEliminations([
        {
          childEntityId: "x",
          parentEntityId: "p",
          parentOwnershipPctBps: 8000,
          totalDividendDeclared: -100n,
          currencyCode: "USD",
        },
      ]),
    ).toThrow("Dividend must be non-negative");
  });
});

// ── Consolidation Journal ────────────────────────────────────────────────────

describe("generateConsolidationJournal", () => {
  it("generates lines from all adjustment types", () => {
    const result = generateConsolidationJournal({
      icEliminations: [
        { accountId: "acc-1", amountMinor: 50000n, currencyCode: "USD", fromEntityId: "e1", toEntityId: "e2" },
      ],
      nciAllocations: [
        { entityId: "sub-a", nciNetAssets: 200000n, nciProfitOrLoss: 40000n, currencyCode: "USD" },
      ],
      goodwillEntries: [
        { entityId: "sub-a", goodwillAmount: 180000n, currencyCode: "USD" },
      ],
      dividendEliminations: [
        { entityId: "sub-a", eliminationAmount: 75000n, currencyCode: "USD" },
      ],
      nciEquityAccountId: "nci-eq",
      nciPnlAccountId: "nci-pnl",
      goodwillAccountId: "gw-acc",
      investmentAccountId: "inv-acc",
      dividendIncomeAccountId: "div-inc",
      retainedEarningsAccountId: "re-acc",
    });
    // 1 IC + 2 NCI (net assets + P&L) + 1 goodwill + 1 dividend = 5 lines
    expect(result.result).toHaveLength(5);
    expect(result.result.filter((l) => l.lineType === "IC_ELIMINATION")).toHaveLength(1);
    expect(result.result.filter((l) => l.lineType === "NCI_ALLOCATION")).toHaveLength(2);
    expect(result.result.filter((l) => l.lineType === "GOODWILL_RECOGNITION")).toHaveLength(1);
    expect(result.result.filter((l) => l.lineType === "DIVIDEND_ELIMINATION")).toHaveLength(1);
  });

  it("skips zero-amount entries", () => {
    const result = generateConsolidationJournal({
      icEliminations: [],
      nciAllocations: [
        { entityId: "sub-a", nciNetAssets: 0n, nciProfitOrLoss: 0n, currencyCode: "USD" },
      ],
      goodwillEntries: [
        { entityId: "sub-a", goodwillAmount: 0n, currencyCode: "USD" },
      ],
      dividendEliminations: [
        { entityId: "sub-a", eliminationAmount: 0n, currencyCode: "USD" },
      ],
      nciEquityAccountId: "nci-eq",
      nciPnlAccountId: "nci-pnl",
      goodwillAccountId: "gw-acc",
      investmentAccountId: "inv-acc",
      dividendIncomeAccountId: "div-inc",
      retainedEarningsAccountId: "re-acc",
    });
    expect(result.result).toHaveLength(0);
  });
});
