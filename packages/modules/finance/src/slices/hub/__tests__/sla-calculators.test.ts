import { describe, it, expect } from "vitest";
import { deriveMultiLedger } from "../calculators/multi-ledger-derivation.js";
import { previewDerivation } from "../calculators/preview-derivation.js";
import type { AccountingEvent } from "../entities/accounting-event.js";
import type { MappingRule } from "../entities/mapping-rule.js";

function makeEvent(overrides: Partial<AccountingEvent> = {}): AccountingEvent {
  return {
    id: "evt-1",
    tenantId: "t1",
    eventType: "SALE",
    sourceSystem: "POS",
    sourceDocumentId: "doc-1",
    sourceDocumentType: "INVOICE",
    ledgerId: "ledger-1",
    accountId: "acc-revenue",
    amountMinor: 100000n,
    currencyCode: "USD",
    description: "Sale of goods",
    eventDate: new Date("2025-01-15"),
    status: "PENDING",
    derivedJournalIds: [],
    errorMessage: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

function makeRule(overrides: Partial<MappingRule> = {}): MappingRule {
  return {
    id: "rule-1",
    tenantId: "t1",
    name: "Sale posting",
    version: 1,
    eventType: "SALE",
    conditions: [],
    targets: [
      {
        debitAccountId: "acc-receivable",
        creditAccountId: "acc-revenue",
        percentageBps: 10000,
        memo: "Sale revenue posting",
      },
    ],
    targetLedgerIds: [],
    priority: 1,
    status: "PUBLISHED",
    publishedAt: new Date(),
    deprecatedAt: null,
    createdBy: "user-1",
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

// ── Multi-Ledger Derivation ──────────────────────────────────────────────────

describe("deriveMultiLedger", () => {
  it("derives lines from matching events and rules", () => {
    const result = deriveMultiLedger([makeEvent()], [makeRule()]);
    expect(result.result.derivedLines).toHaveLength(1);
    expect(result.result.derivedLines[0]!.amountMinor).toBe(100000n);
    expect(result.result.derivedLines[0]!.debitAccountId).toBe("acc-receivable");
    expect(result.result.derivedLines[0]!.creditAccountId).toBe("acc-revenue");
    expect(result.result.unmatchedEvents).toHaveLength(0);
    expect(result.result.totalDerived).toBe(100000n);
  });

  it("supports multi-ledger output", () => {
    const rule = makeRule({
      targetLedgerIds: ["ledger-main", "ledger-tax"],
    });
    const result = deriveMultiLedger([makeEvent()], [rule]);
    expect(result.result.derivedLines).toHaveLength(2);
    expect(result.result.ledgerCount).toBe(2);
    const ledgers = new Set(result.result.derivedLines.map((l) => l.targetLedgerId));
    expect(ledgers).toContain("ledger-main");
    expect(ledgers).toContain("ledger-tax");
  });

  it("applies percentage split across targets", () => {
    const rule = makeRule({
      targets: [
        { debitAccountId: "acc-a", creditAccountId: "acc-b", percentageBps: 7000, memo: "70%" },
        { debitAccountId: "acc-c", creditAccountId: "acc-d", percentageBps: 3000, memo: "30%" },
      ],
    });
    const result = deriveMultiLedger([makeEvent({ amountMinor: 100000n })], [rule]);
    expect(result.result.derivedLines).toHaveLength(2);
    expect(result.result.derivedLines[0]!.amountMinor).toBe(70000n);
    expect(result.result.derivedLines[1]!.amountMinor).toBe(30000n);
    expect(result.result.totalDerived).toBe(100000n);
  });

  it("reports unmatched events", () => {
    const event = makeEvent({ eventType: "PURCHASE" });
    const rule = makeRule({ eventType: "SALE" });
    const result = deriveMultiLedger([event], [rule]);
    expect(result.result.derivedLines).toHaveLength(0);
    expect(result.result.unmatchedEvents).toContain("evt-1");
  });

  it("filters out DRAFT and DEPRECATED rules", () => {
    const draftRule = makeRule({ id: "draft", status: "DRAFT" });
    const deprecatedRule = makeRule({ id: "dep", status: "DEPRECATED" });
    const result = deriveMultiLedger([makeEvent()], [draftRule, deprecatedRule]);
    expect(result.result.derivedLines).toHaveLength(0);
    expect(result.result.unmatchedEvents).toHaveLength(1);
  });

  it("evaluates conditions (EQ)", () => {
    const rule = makeRule({
      conditions: [{ field: "sourceSystem", operator: "EQ", value: "POS" }],
    });
    const result = deriveMultiLedger([makeEvent()], [rule]);
    expect(result.result.derivedLines).toHaveLength(1);

    const noMatch = deriveMultiLedger(
      [makeEvent({ sourceSystem: "ERP" })],
      [rule],
    );
    expect(noMatch.result.derivedLines).toHaveLength(0);
  });

  it("throws on empty events", () => {
    expect(() => deriveMultiLedger([], [makeRule()])).toThrow(
      "At least one accounting event",
    );
  });
});

// ── Preview Derivation ───────────────────────────────────────────────────────

describe("previewDerivation", () => {
  it("previews derivation with balance check", () => {
    const result = previewDerivation([makeEvent()], [makeRule()]);
    expect(result.result.previewLines).toHaveLength(1);
    expect(result.result.isBalanced).toBe(true);
    expect(result.result.ledgerCount).toBe(1);
  });

  it("warns about unmatched events", () => {
    const result = previewDerivation(
      [makeEvent({ eventType: "UNKNOWN" })],
      [makeRule()],
    );
    expect(result.result.warnings.length).toBeGreaterThan(0);
    expect(result.result.warnings[0]).toContain("no matching rules");
  });

  it("warns about unused published rules", () => {
    const result = previewDerivation(
      [makeEvent({ eventType: "PURCHASE" })],
      [makeRule({ eventType: "SALE" })],
    );
    expect(result.result.warnings.some((w) => w.includes("produced no output"))).toBe(true);
  });

  it("reports zero lines for non-matching", () => {
    const result = previewDerivation(
      [makeEvent({ eventType: "OTHER" })],
      [makeRule()],
    );
    expect(result.result.previewLines).toHaveLength(0);
    expect(result.result.totalDebit).toBe(0n);
  });
});
