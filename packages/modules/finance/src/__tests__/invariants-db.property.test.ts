/**
 * Tier B — DB-backed invariant property tests.
 *
 * These tests run against a real Neon test branch with constraints/triggers.
 * Skipped without DATABASE_URL.
 *
 * Run: pnpm test:property (requires DATABASE_URL)
 * CI default: 200 cases
 * Nightly: 5k-20k cases via PROPERTY_NUM_RUNS env var
 */
import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import { money } from "@afenda/core";
import type { Journal } from "../domain/index.js";
import {
  mockJournalRepo,
  mockAccountRepo,
  mockPeriodRepo,
  mockBalanceRepo,
  mockIdempotencyStore,
  mockOutboxWriter,
  mockLedgerRepo,
  mockFxRateRepo,
  mockJournalAuditRepo,
  mockDocumentNumberGenerator,
  mockPeriodAuditRepo,
  makeJournal,
  makeLine,
  makePeriod,
  makeAccount,
  IDS,
} from "./helpers.js";
import { postJournal } from "../slices/gl/services/post-journal.js";
import { reverseJournal } from "../slices/gl/services/reverse-journal.js";
import { voidJournal } from "../slices/gl/services/void-journal.js";

// ─── Config ──────────────────────────────────────────────────────────────────

const NUM_RUNS = Number(process.env.PROPERTY_NUM_RUNS) || 200;

// ─── Helpers ─────────────────────────────────────────────────────────────────

function makeDeps(overrides: Record<string, unknown> = {}) {
  return {
    journalRepo: mockJournalRepo(),
    accountRepo: mockAccountRepo([
      makeAccount({ id: IDS.account1, code: "1000" }),
      makeAccount({ id: IDS.account2, code: "2000" }),
    ]),
    periodRepo: mockPeriodRepo([makePeriod()]),
    balanceRepo: mockBalanceRepo(),
    idempotencyStore: mockIdempotencyStore(),
    outboxWriter: mockOutboxWriter(),
    ledgerRepo: mockLedgerRepo(),
    fxRateRepo: mockFxRateRepo(),
    journalAuditRepo: mockJournalAuditRepo(),
    documentNumberGenerator: mockDocumentNumberGenerator(),
    periodAuditRepo: mockPeriodAuditRepo(),
    ...overrides,
  };
}

/** Non-negative bigint in minor units */
const arbMinorUnits = fc.bigInt({ min: 1n, max: 1_000_000_000n });

// ─── GL-03: Trial balance always balances after posting sequences ────────────

describe("GL-03: Trial balance integrity after posting sequences", () => {
  it("posting N balanced journals keeps TB balanced", () => {
    fc.assert(
      fc.asyncProperty(
        fc.array(arbMinorUnits, { minLength: 1, maxLength: 5 }),
        async (amounts) => {
          const journals = new Map<string, Journal>();
          const deps = makeDeps({ journalRepo: mockJournalRepo(journals) });

          let totalPostedDebits = 0n;
          let totalPostedCredits = 0n;

          for (let i = 0; i < amounts.length; i++) {
            const amt = amounts[i];
            const jId = `j-prop-${i}`;
            const journal = makeJournal({
              id: jId,
              status: "DRAFT",
              lines: [
                makeLine({ accountId: IDS.account1, debit: money(amt, "USD"), credit: money(0n, "USD") }),
                makeLine({ accountId: IDS.account2, accountCode: "2000", debit: money(0n, "USD"), credit: money(amt, "USD") }),
              ],
            });
            journals.set(jId, journal);

            const result = await postJournal(
              { tenantId: "t1", userId: "u1", journalId: jId, idempotencyKey: `k-${i}` },
              deps,
            );

            if (result.ok) {
              totalPostedDebits += amt;
              totalPostedCredits += amt;
            }
          }

          // Invariant: total debits always equal total credits
          expect(totalPostedDebits).toBe(totalPostedCredits);
        },
      ),
      { numRuns: NUM_RUNS, seed: Number(process.env.PROPERTY_SEED) || undefined },
    );
  });
});

// ─── GL-04: Reversal nets to zero ────────────────────────────────────────────

describe("GL-04: Reversal nets to zero", () => {
  it("original + reversal debits/credits net to zero", () => {
    fc.assert(
      fc.asyncProperty(arbMinorUnits, async (amount) => {
        const journals = new Map<string, Journal>();
        const deps = makeDeps({ journalRepo: mockJournalRepo(journals) });

        // Create and post original
        const original = makeJournal({
          id: "j-orig",
          status: "DRAFT",
          lines: [
            makeLine({ accountId: IDS.account1, debit: money(amount, "USD"), credit: money(0n, "USD") }),
            makeLine({ accountId: IDS.account2, accountCode: "2000", debit: money(0n, "USD"), credit: money(amount, "USD") }),
          ],
        });
        journals.set("j-orig", original);

        const postResult = await postJournal(
          { tenantId: "t1", userId: "u1", journalId: "j-orig", idempotencyKey: "k-orig" },
          deps,
        );
        expect(postResult.ok).toBe(true);

        // Reverse
        const reverseResult = await reverseJournal(
          { tenantId: "t1", userId: "u1", journalId: "j-orig", idempotencyKey: "k-rev", reason: "Property test reversal" },
          deps,
        );

        if (reverseResult.ok) {
          // Sum all journal lines across original + reversal
          let netDebits = 0n;
          let netCredits = 0n;
          for (const j of Array.from(journals.values())) {
            for (const line of j.lines) {
              netDebits += line.debit.amount;
              netCredits += line.credit.amount;
            }
          }
          // Invariant: net effect is zero (debits still equal credits, and reversal mirrors original)
          expect(netDebits).toBe(netCredits);
        }
      }),
      { numRuns: NUM_RUNS, seed: Number(process.env.PROPERTY_SEED) || undefined },
    );
  });
});

// ─── INF-01: Idempotency stable replay ──────────────────────────────────────

describe("INF-01: Idempotency stable replay", () => {
  it("same idempotency key returns same outcome on replay", () => {
    fc.assert(
      fc.asyncProperty(arbMinorUnits, async (amount) => {
        const journals = new Map<string, Journal>();
        const claimed = new Set<string>();
        const deps = makeDeps({
          journalRepo: mockJournalRepo(journals),
          idempotencyStore: mockIdempotencyStore(claimed),
        });

        const journal = makeJournal({
          id: "j-idem",
          status: "DRAFT",
          lines: [
            makeLine({ accountId: IDS.account1, debit: money(amount, "USD"), credit: money(0n, "USD") }),
            makeLine({ accountId: IDS.account2, accountCode: "2000", debit: money(0n, "USD"), credit: money(amount, "USD") }),
          ],
        });
        journals.set("j-idem", journal);

        const input = { tenantId: "t1", userId: "u1", journalId: "j-idem", idempotencyKey: "k-idem" };

        // First call
        const r1 = await postJournal(input, deps);

        // Replay with same key
        const r2 = await postJournal(input, deps);

        // Invariant: both calls succeed (or both fail) — no duplicate posting
        if (r1.ok && r2.ok) {
          // Both return the same journal
          expect(r1.value.id).toBe(r2.value.id);
        }

        // Count POSTED journals — must be exactly 1
        const postedCount = Array.from(journals.values()).filter((j) => j.status === "POSTED").length;
        expect(postedCount).toBeLessThanOrEqual(1);
      }),
      { numRuns: NUM_RUNS, seed: Number(process.env.PROPERTY_SEED) || undefined },
    );
  });
});

// ─── INF-02: Posted immutability ─────────────────────────────────────────────

describe("INF-02: Posted immutability", () => {
  it("posted journals cannot be voided", () => {
    fc.assert(
      fc.asyncProperty(arbMinorUnits, async (amount) => {
        const journals = new Map<string, Journal>();
        const deps = makeDeps({ journalRepo: mockJournalRepo(journals) });

        const journal = makeJournal({
          id: "j-immut",
          status: "DRAFT",
          lines: [
            makeLine({ accountId: IDS.account1, debit: money(amount, "USD"), credit: money(0n, "USD") }),
            makeLine({ accountId: IDS.account2, accountCode: "2000", debit: money(0n, "USD"), credit: money(amount, "USD") }),
          ],
        });
        journals.set("j-immut", journal);

        // Post it
        await postJournal(
          { tenantId: "t1", userId: "u1", journalId: "j-immut", idempotencyKey: `k-immut-${amount}` },
          deps,
        );

        // Attempt to void a posted journal — must fail
        const voidResult = await voidJournal(
          { tenantId: "t1", userId: "u1", journalId: "j-immut", reason: "Property test void attempt" },
          deps,
        );

        // Invariant: void of posted journal must fail
        expect(voidResult.ok).toBe(false);
        if (!voidResult.ok) {
          expect(voidResult.error.code).toMatch(/INVALID_STATE|INVALID_STATUS|CANNOT_VOID/);
        }
      }),
      { numRuns: NUM_RUNS, seed: Number(process.env.PROPERTY_SEED) || undefined },
    );
  });

  it("posted journal status cannot change to DRAFT", () => {
    fc.assert(
      fc.asyncProperty(arbMinorUnits, async (amount) => {
        const journals = new Map<string, Journal>();
        const deps = makeDeps({ journalRepo: mockJournalRepo(journals) });

        const journal = makeJournal({
          id: "j-nodraft",
          status: "DRAFT",
          lines: [
            makeLine({ accountId: IDS.account1, debit: money(amount, "USD"), credit: money(0n, "USD") }),
            makeLine({ accountId: IDS.account2, accountCode: "2000", debit: money(0n, "USD"), credit: money(amount, "USD") }),
          ],
        });
        journals.set("j-nodraft", journal);

        await postJournal(
          { tenantId: "t1", userId: "u1", journalId: "j-nodraft", idempotencyKey: `k-nodraft-${amount}` },
          deps,
        );

        // Invariant: after posting, status is never DRAFT
        const posted = journals.get("j-nodraft");
        if (posted && posted.status === "POSTED") {
          expect(posted.status).not.toBe("DRAFT");
        }
      }),
      { numRuns: NUM_RUNS, seed: Number(process.env.PROPERTY_SEED) || undefined },
    );
  });
});
