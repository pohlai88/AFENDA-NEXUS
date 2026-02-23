/**
 * Tier A — Pure invariant property tests (no DB required).
 *
 * Uses fast-check to generate randomized inputs and verify accounting
 * invariants hold for ALL inputs, not just hand-picked fixtures.
 *
 * Run: pnpm test:property
 * CI default: 200-500 cases (fast enough for PR gates)
 * Nightly: 5k-20k cases via PROPERTY_NUM_RUNS env var
 */
import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import { money } from "@afenda/core";
import { validateJournalBalance } from "../domain/calculators/journal-balance.js";
import { convertAmountPrecise } from "../domain/calculators/fx-convert.js";

// ─── Config ──────────────────────────────────────────────────────────────────

const NUM_RUNS = Number(process.env.PROPERTY_NUM_RUNS) || 500;

// ─── Arbitraries ─────────────────────────────────────────────────────────────

/** Non-negative bigint in minor units (0 to 10 billion = $100M) */
const arbMinorUnits = fc.bigInt({ min: 0n, max: 10_000_000_000n });

/** Positive bigint (at least 1 minor unit) */
const arbPositiveMinorUnits = fc.bigInt({ min: 1n, max: 10_000_000_000n });

/** FX rate between 0.0001 and 10000 (covers most real-world pairs) */
const arbFxRate = fc.double({ min: 0.0001, max: 10_000, noNaN: true });

/** Currency code (realistic 3-letter codes) */
const arbCurrency = fc.constantFrom("USD", "EUR", "GBP", "JPY", "MYR", "SGD", "AUD", "CAD", "CHF", "CNY");

/** A balanced set of journal lines: N debit lines + 1 credit line that sums to total */
const arbBalancedLines = fc
  .array(arbPositiveMinorUnits, { minLength: 1, maxLength: 10 })
  .map((debits) => {
    const totalDebit = debits.reduce((a, b) => a + b, 0n);
    const lines = debits.map((d) => ({
      debit: money(d, "USD"),
      credit: money(0n, "USD"),
    }));
    lines.push({
      debit: money(0n, "USD"),
      credit: money(totalDebit, "USD"),
    });
    return lines;
  });

/** An unbalanced set: debit total != credit total */
const arbUnbalancedLines = fc
  .tuple(arbPositiveMinorUnits, arbPositiveMinorUnits)
  .filter(([a, b]) => a !== b)
  .map(([debitAmt, creditAmt]) => [
    { debit: money(debitAmt, "USD"), credit: money(0n, "USD") },
    { debit: money(0n, "USD"), credit: money(creditAmt, "USD") },
  ]);

// ─── GL-01: Balanced posting invariant ───────────────────────────────────────

describe("GL-01: Balanced posting invariant", () => {
  it("balanced lines always produce balanced=true", () => {
    fc.assert(
      fc.property(arbBalancedLines, (lines) => {
        const result = validateJournalBalance(lines);
        expect(result.result.balanced).toBe(true);
        expect(result.result.totalDebits).toBe(result.result.totalCredits);
      }),
      { numRuns: NUM_RUNS, seed: Number(process.env.PROPERTY_SEED) || undefined },
    );
  });

  it("unbalanced lines always produce balanced=false", () => {
    fc.assert(
      fc.property(arbUnbalancedLines, (lines) => {
        const result = validateJournalBalance(lines);
        expect(result.result.balanced).toBe(false);
        expect(result.result.totalDebits).not.toBe(result.result.totalCredits);
      }),
      { numRuns: NUM_RUNS, seed: Number(process.env.PROPERTY_SEED) || undefined },
    );
  });

  it("sum(debits) and sum(credits) are always non-negative", () => {
    fc.assert(
      fc.property(arbBalancedLines, (lines) => {
        const result = validateJournalBalance(lines);
        expect(result.result.totalDebits >= 0n).toBe(true);
        expect(result.result.totalCredits >= 0n).toBe(true);
      }),
      { numRuns: NUM_RUNS, seed: Number(process.env.PROPERTY_SEED) || undefined },
    );
  });
});

// ─── GL-02: Minimum structure invariant ──────────────────────────────────────

describe("GL-02: Minimum structure invariant", () => {
  it("single-line journals always throw", () => {
    fc.assert(
      fc.property(arbMinorUnits, (amount) => {
        expect(() =>
          validateJournalBalance([
            { debit: money(amount, "USD"), credit: money(0n, "USD") },
          ]),
        ).toThrow("at least 2 lines");
      }),
      { numRuns: NUM_RUNS, seed: Number(process.env.PROPERTY_SEED) || undefined },
    );
  });

  it("empty journals always throw", () => {
    expect(() => validateJournalBalance([])).toThrow("at least 2 lines");
  });

  it("negative debit amounts always throw", () => {
    fc.assert(
      fc.property(
        fc.bigInt({ min: -10_000_000_000n, max: -1n }),
        (negAmount) => {
          expect(() =>
            validateJournalBalance([
              { debit: money(negAmount, "USD"), credit: money(0n, "USD") },
              { debit: money(0n, "USD"), credit: money(100n, "USD") },
            ]),
          ).toThrow("non-negative");
        },
      ),
      { numRuns: NUM_RUNS, seed: Number(process.env.PROPERTY_SEED) || undefined },
    );
  });
});

// ─── FX-01: Deterministic conversion invariant ──────────────────────────────

describe("FX-01: Deterministic conversion", () => {
  it("same input + rate always produces same output", () => {
    fc.assert(
      fc.property(arbPositiveMinorUnits, arbFxRate, (amount, rate) => {
        const r1 = convertAmountPrecise(amount, rate, "USD", "EUR");
        const r2 = convertAmountPrecise(amount, rate, "USD", "EUR");
        expect(r1.result.toAmount).toBe(r2.result.toAmount);
      }),
      { numRuns: NUM_RUNS, seed: Number(process.env.PROPERTY_SEED) || undefined },
    );
  });

  it("same-currency conversion is identity", () => {
    fc.assert(
      fc.property(arbMinorUnits, (amount) => {
        const result = convertAmountPrecise(amount, 1.5, "USD", "USD");
        expect(result.result.toAmount).toBe(amount);
        expect(result.result.rate).toBe(1);
      }),
      { numRuns: NUM_RUNS, seed: Number(process.env.PROPERTY_SEED) || undefined },
    );
  });

  it("converted amount is always non-negative", () => {
    fc.assert(
      fc.property(arbMinorUnits, arbFxRate, (amount, rate) => {
        const result = convertAmountPrecise(amount, rate, "USD", "EUR");
        expect(result.result.toAmount >= 0n).toBe(true);
      }),
      { numRuns: NUM_RUNS, seed: Number(process.env.PROPERTY_SEED) || undefined },
    );
  });

  it("zero amount converts to zero regardless of rate", () => {
    fc.assert(
      fc.property(arbFxRate, (rate) => {
        const result = convertAmountPrecise(0n, rate, "USD", "EUR");
        // With banker's rounding, 0 * rate + halfScale / scale = halfScale / scale
        // which rounds to 0 for any rate when amount is 0
        expect(result.result.toAmount).toBe(0n);
      }),
      { numRuns: NUM_RUNS, seed: Number(process.env.PROPERTY_SEED) || undefined },
    );
  });
});

// ─── FX-02: Rounding tolerance invariant ─────────────────────────────────────

describe("FX-02: Rounding tolerance", () => {
  it("round-trip conversion stays within 1 minor unit tolerance", () => {
    fc.assert(
      fc.property(
        arbPositiveMinorUnits,
        fc.double({ min: 0.5, max: 2.0, noNaN: true }),
        (amount, rate) => {
          const forward = convertAmountPrecise(amount, rate, "USD", "EUR");
          const inverseRate = 1 / rate;
          const roundTrip = convertAmountPrecise(
            forward.result.toAmount,
            inverseRate,
            "EUR",
            "USD",
          );
          const diff =
            roundTrip.result.toAmount > amount
              ? roundTrip.result.toAmount - amount
              : amount - roundTrip.result.toAmount;
          // Tolerance: 1 minor unit per conversion step (2 steps = 2 units max)
          expect(diff <= 2n).toBe(true);
        },
      ),
      { numRuns: NUM_RUNS, seed: Number(process.env.PROPERTY_SEED) || undefined },
    );
  });

  it("conversion preserves order: larger amount → larger converted amount", () => {
    fc.assert(
      fc.property(
        arbPositiveMinorUnits,
        arbPositiveMinorUnits,
        arbFxRate,
        (a, b, rate) => {
          const ra = convertAmountPrecise(a, rate, "USD", "EUR");
          const rb = convertAmountPrecise(b, rate, "USD", "EUR");
          if (a > b) {
            expect(ra.result.toAmount >= rb.result.toAmount).toBe(true);
          } else if (a < b) {
            expect(ra.result.toAmount <= rb.result.toAmount).toBe(true);
          } else {
            expect(ra.result.toAmount).toBe(rb.result.toAmount);
          }
        },
      ),
      { numRuns: NUM_RUNS, seed: Number(process.env.PROPERTY_SEED) || undefined },
    );
  });
});
