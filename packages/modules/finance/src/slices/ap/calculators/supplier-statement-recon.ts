/**
 * AP-05: Supplier statement reconciliation.
 * Matches supplier statement lines against AP ledger entries to identify discrepancies.
 * Pure calculator — no DB, no side effects.
 *
 * Uses raw bigint for amounts (minor units).
 */

export interface SupplierStatementLine {
  readonly lineRef: string;
  readonly date: Date;
  readonly description: string;
  readonly amount: bigint;
  readonly currencyCode: string;
}

export interface ApLedgerEntry {
  readonly invoiceId: string;
  readonly invoiceNumber: string;
  readonly invoiceDate: Date;
  readonly amount: bigint;
  readonly currencyCode: string;
  readonly supplierRef: string | null;
}

export type ReconMatchStatus = "MATCHED" | "STATEMENT_ONLY" | "LEDGER_ONLY";

export interface ReconMatch {
  readonly status: ReconMatchStatus;
  readonly statementLine: SupplierStatementLine | null;
  readonly ledgerEntry: ApLedgerEntry | null;
  readonly amountDifference: bigint;
}

export interface ReconResult {
  readonly supplierId: string;
  readonly asOfDate: Date;
  readonly matches: readonly ReconMatch[];
  readonly matchedCount: number;
  readonly statementOnlyCount: number;
  readonly ledgerOnlyCount: number;
  readonly statementTotal: bigint;
  readonly ledgerTotal: bigint;
  readonly difference: bigint;
}

/**
 * Reconcile supplier statement lines against AP ledger entries.
 * Matching strategy: exact amount + date within tolerance window.
 */
export function reconcileSupplierStatement(
  supplierId: string,
  asOfDate: Date,
  statementLines: readonly SupplierStatementLine[],
  ledgerEntries: readonly ApLedgerEntry[],
  dateTolerance: number = 3,
): ReconResult {
  const usedLedger = new Set<string>();
  const matches: ReconMatch[] = [];

  // Phase 1: Match statement lines to ledger entries
  for (const sl of statementLines) {
    let matched = false;
    for (const le of ledgerEntries) {
      if (usedLedger.has(le.invoiceId)) continue;
      if (sl.amount !== le.amount) continue;
      if (sl.currencyCode !== le.currencyCode) continue;

      const daysDiff = Math.abs(
        (sl.date.getTime() - le.invoiceDate.getTime()) / (1000 * 60 * 60 * 24),
      );
      if (daysDiff > dateTolerance) continue;

      matches.push({
        status: "MATCHED",
        statementLine: sl,
        ledgerEntry: le,
        amountDifference: 0n,
      });
      usedLedger.add(le.invoiceId);
      matched = true;
      break;
    }

    if (!matched) {
      matches.push({
        status: "STATEMENT_ONLY",
        statementLine: sl,
        ledgerEntry: null,
        amountDifference: sl.amount,
      });
    }
  }

  // Phase 2: Identify ledger-only entries
  for (const le of ledgerEntries) {
    if (usedLedger.has(le.invoiceId)) continue;
    matches.push({
      status: "LEDGER_ONLY",
      statementLine: null,
      ledgerEntry: le,
      amountDifference: -le.amount,
    });
  }

  const matchedCount = matches.filter((m) => m.status === "MATCHED").length;
  const statementOnlyCount = matches.filter((m) => m.status === "STATEMENT_ONLY").length;
  const ledgerOnlyCount = matches.filter((m) => m.status === "LEDGER_ONLY").length;
  const statementTotal = statementLines.reduce((s, l) => s + l.amount, 0n);
  const ledgerTotal = ledgerEntries.reduce((s, e) => s + e.amount, 0n);

  return {
    supplierId,
    asOfDate,
    matches,
    matchedCount,
    statementOnlyCount,
    ledgerOnlyCount,
    statementTotal,
    ledgerTotal,
    difference: statementTotal - ledgerTotal,
  };
}
