import { describe, it, expect } from "vitest";
import { computeEquityStatement } from "../calculators/equity-statement.js";
import { generateNotes } from "../calculators/notes-engine.js";
import { computeSegmentReport } from "../calculators/segment-reporting.js";
import { computeRelatedPartyDisclosures } from "../calculators/related-party.js";
import { tagWithXbrl } from "../calculators/xbrl-tagger.js";

// ── Equity Statement ─────────────────────────────────────────────────────────

describe("computeEquityStatement", () => {
  it("computes closing balances from movements", () => {
    const result = computeEquityStatement([
      {
        component: "RETAINED_EARNINGS",
        openingBalance: 500000n,
        profitOrLoss: 100000n,
        otherComprehensiveIncome: 0n,
        dividendsDeclared: 20000n,
        sharesIssued: 0n,
        sharesRepurchased: 0n,
        transfersBetweenReserves: 0n,
        otherMovements: 0n,
      },
      {
        component: "SHARE_CAPITAL",
        openingBalance: 200000n,
        profitOrLoss: 0n,
        otherComprehensiveIncome: 0n,
        dividendsDeclared: 0n,
        sharesIssued: 50000n,
        sharesRepurchased: 0n,
        transfersBetweenReserves: 0n,
        otherMovements: 0n,
      },
    ]);

    const re = result.result.rows.find((r) => r.component === "RETAINED_EARNINGS")!;
    // closing = 500000 + 100000 - 20000 = 580000
    expect(re.closingBalance).toBe(580000n);
    expect(re.totalMovements).toBe(80000n);

    const sc = result.result.rows.find((r) => r.component === "SHARE_CAPITAL")!;
    expect(sc.closingBalance).toBe(250000n);

    expect(result.result.totalOpeningEquity).toBe(700000n);
    expect(result.result.totalClosingEquity).toBe(830000n);
    expect(result.result.totalComprehensiveIncome).toBe(100000n);
  });

  it("handles OCI and treasury shares", () => {
    const result = computeEquityStatement([
      {
        component: "OCI_RESERVE",
        openingBalance: 10000n,
        profitOrLoss: 0n,
        otherComprehensiveIncome: 5000n,
        dividendsDeclared: 0n,
        sharesIssued: 0n,
        sharesRepurchased: 0n,
        transfersBetweenReserves: -2000n,
        otherMovements: 0n,
      },
    ]);
    // closing = 10000 + 5000 - 2000 = 13000
    expect(result.result.rows[0]!.closingBalance).toBe(13000n);
  });

  it("throws on empty input", () => {
    expect(() => computeEquityStatement([])).toThrow("At least one equity component");
  });
});

// ── Notes Engine ─────────────────────────────────────────────────────────────

describe("generateNotes", () => {
  it("generates notes from templates and data", () => {
    const result = generateNotes(
      [
        {
          id: "note-1",
          category: "REVENUE",
          title: "Revenue Recognition",
          templateText: "Revenue for the period was {{revenue}} in {{currency}}.",
          requiredFields: ["revenue", "currency"],
          isRequired: true,
        },
      ],
      [
        { templateId: "note-1", fields: { revenue: 1000000n, currency: "USD" } },
      ],
    );
    expect(result.result.completeCount).toBe(1);
    expect(result.result.notes[0]!.content).toBe("Revenue for the period was 1000000 in USD.");
    expect(result.result.notes[0]!.isComplete).toBe(true);
  });

  it("detects missing required fields", () => {
    const result = generateNotes(
      [
        {
          id: "note-1",
          category: "REVENUE",
          title: "Revenue",
          templateText: "Revenue: {{amount}}",
          requiredFields: ["amount"],
          isRequired: true,
        },
      ],
      [{ templateId: "note-1", fields: {} }],
    );
    expect(result.result.notes[0]!.isComplete).toBe(false);
    expect(result.result.notes[0]!.missingFields).toContain("amount");
  });

  it("reports missing required notes", () => {
    const result = generateNotes(
      [
        {
          id: "note-1",
          category: "ACCOUNTING_POLICIES",
          title: "Policies",
          templateText: "...",
          requiredFields: [],
          isRequired: true,
        },
      ],
      [], // no data provided
    );
    expect(result.result.missingRequiredNotes).toContain("note-1");
  });

  it("throws on empty templates", () => {
    expect(() => generateNotes([], [])).toThrow("At least one note template");
  });
});

// ── Segment Reporting ────────────────────────────────────────────────────────

describe("computeSegmentReport", () => {
  it("aggregates segments and eliminates inter-segment revenue", () => {
    const result = computeSegmentReport([
      {
        segmentId: "retail",
        segmentName: "Retail",
        externalRevenue: 800000n,
        interSegmentRevenue: 50000n,
        operatingExpenses: 600000n,
        depreciationAmortization: 40000n,
        totalAssets: 2000000n,
        totalLiabilities: 1000000n,
        capitalExpenditure: 100000n,
        currencyCode: "USD",
      },
      {
        segmentId: "wholesale",
        segmentName: "Wholesale",
        externalRevenue: 500000n,
        interSegmentRevenue: 30000n,
        operatingExpenses: 400000n,
        depreciationAmortization: 20000n,
        totalAssets: 1500000n,
        totalLiabilities: 800000n,
        capitalExpenditure: 60000n,
        currencyCode: "USD",
      },
    ]);

    expect(result.result.segments).toHaveLength(2);
    expect(result.result.eliminations.interSegmentRevenue).toBe(80000n);
    expect(result.result.consolidated.totalRevenue).toBe(1300000n); // external only
    expect(result.result.consolidated.totalAssets).toBe(3500000n);

    const retail = result.result.segments.find((s) => s.segmentId === "retail")!;
    expect(retail.totalRevenue).toBe(850000n); // 800k + 50k
    // result = 850000 - 600000 - 40000 = 210000
    expect(retail.segmentResult).toBe(210000n);
  });

  it("throws on empty segments", () => {
    expect(() => computeSegmentReport([])).toThrow("At least one segment");
  });
});

// ── Related Party ────────────────────────────────────────────────────────────

describe("computeRelatedPartyDisclosures", () => {
  it("groups transactions by party", () => {
    const result = computeRelatedPartyDisclosures([
      {
        partyId: "p1",
        partyName: "Parent Co",
        partyType: "PARENT",
        transactionNature: "MANAGEMENT_FEE",
        transactionAmount: 100000n,
        outstandingBalance: 20000n,
        currencyCode: "USD",
        isArmsLength: true,
      },
      {
        partyId: "p1",
        partyName: "Parent Co",
        partyType: "PARENT",
        transactionNature: "LOAN",
        transactionAmount: 500000n,
        outstandingBalance: 500000n,
        currencyCode: "USD",
        isArmsLength: true,
      },
    ]);
    expect(result.result.disclosures).toHaveLength(1);
    const d = result.result.disclosures[0]!;
    expect(d.transactions).toHaveLength(2);
    expect(d.totalTransactionAmount).toBe(600000n);
    expect(d.totalOutstandingBalance).toBe(520000n);
    expect(d.hasNonArmsLengthTransactions).toBe(false);
  });

  it("flags non-arms-length transactions", () => {
    const result = computeRelatedPartyDisclosures([
      {
        partyId: "km1",
        partyName: "CEO",
        partyType: "KEY_MANAGEMENT",
        transactionNature: "LOAN",
        transactionAmount: 50000n,
        outstandingBalance: 50000n,
        currencyCode: "USD",
        isArmsLength: false,
      },
    ]);
    expect(result.result.nonArmsLengthCount).toBe(1);
    expect(result.result.disclosures[0]!.hasNonArmsLengthTransactions).toBe(true);
  });

  it("handles empty input", () => {
    const result = computeRelatedPartyDisclosures([]);
    expect(result.result.disclosures).toHaveLength(0);
    expect(result.result.totalTransactionsAmount).toBe(0n);
  });
});

// ── XBRL Tagger ──────────────────────────────────────────────────────────────

describe("tagWithXbrl", () => {
  it("tags data points with XBRL elements", () => {
    const result = tagWithXbrl(
      [
        {
          accountId: "acc-revenue",
          label: "Revenue",
          value: 1000000n,
          currencyCode: "USD",
          periodStart: "2025-01-01",
          periodEnd: "2025-12-31",
          isInstant: false,
        },
        {
          accountId: "acc-assets",
          label: "Total Assets",
          value: 5000000n,
          currencyCode: "USD",
          periodStart: "2025-01-01",
          periodEnd: "2025-12-31",
          isInstant: true,
        },
      ],
      [
        {
          accountId: "acc-revenue",
          xbrlElement: "Revenue",
          xbrlNamespace: "ifrs-full",
          periodType: "duration",
          balanceType: "credit",
        },
        {
          accountId: "acc-assets",
          xbrlElement: "Assets",
          xbrlNamespace: "ifrs-full",
          periodType: "instant",
          balanceType: "debit",
        },
      ],
      "IFRS_FULL",
      "entity-1",
    );

    expect(result.result.facts).toHaveLength(2);
    expect(result.result.unmappedAccounts).toHaveLength(0);

    const revFact = result.result.facts.find((f) => f.xbrlElement === "Revenue")!;
    expect(revFact.value).toBe("1000000");
    expect(revFact.contextRef).toBe("ctx_2025-01-01_2025-12-31");
    expect(revFact.xmlFragment).toContain("ifrs-full:Revenue");

    const assetFact = result.result.facts.find((f) => f.xbrlElement === "Assets")!;
    expect(assetFact.contextRef).toBe("ctx_2025-12-31");
  });

  it("reports unmapped accounts", () => {
    const result = tagWithXbrl(
      [
        {
          accountId: "unknown-acc",
          label: "Mystery",
          value: 100n,
          currencyCode: "USD",
          periodStart: "2025-01-01",
          periodEnd: "2025-12-31",
          isInstant: false,
        },
      ],
      [],
      "IFRS_FULL",
      "entity-1",
    );
    expect(result.result.facts).toHaveLength(0);
    expect(result.result.unmappedAccounts).toContain("unknown-acc");
  });

  it("throws on empty data points", () => {
    expect(() => tagWithXbrl([], [], "IFRS_FULL", "e1")).toThrow("At least one data point");
  });
});
