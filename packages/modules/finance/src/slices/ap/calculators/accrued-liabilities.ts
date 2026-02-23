/**
 * AP-10: Accrued liabilities calculator.
 * Computes uninvoiced receipt accruals at period end.
 * Pure calculator — no DB, no side effects.
 *
 * Uses raw bigint for amounts (minor units).
 */

export interface UninvoicedReceipt {
  readonly receiptId: string;
  readonly poRef: string;
  readonly supplierId: string;
  readonly receiptDate: Date;
  readonly amount: bigint;
  readonly currencyCode: string;
  readonly accountId: string;
}

export interface AccrualEntry {
  readonly receiptId: string;
  readonly supplierId: string;
  readonly debitAccountId: string;
  readonly creditAccountId: string;
  readonly amount: bigint;
  readonly currencyCode: string;
  readonly description: string;
}

/**
 * Generate accrual journal entries for uninvoiced receipts.
 * Each receipt produces a debit to expense and credit to accrued liabilities.
 */
export function computeAccruedLiabilities(
  receipts: readonly UninvoicedReceipt[],
  accruedLiabilityAccountId: string,
): readonly AccrualEntry[] {
  return receipts.map((r) => ({
    receiptId: r.receiptId,
    supplierId: r.supplierId,
    debitAccountId: r.accountId,
    creditAccountId: accruedLiabilityAccountId,
    amount: r.amount,
    currencyCode: r.currencyCode,
    description: `Accrual for uninvoiced receipt ${r.poRef} from ${r.receiptDate.toISOString().slice(0, 10)}`,
  }));
}
