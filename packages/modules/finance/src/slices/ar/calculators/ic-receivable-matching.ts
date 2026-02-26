/**
 * AR-08: IC receivable matching.
 * Matches AR invoices against IC transaction counterparts to identify
 * intercompany receivables that should net against IC payables.
 * Pure calculator — no DB, no side effects.
 *
 * Uses raw bigint for amounts (minor units).
 */

export interface IcReceivable {
  readonly invoiceId: string;
  readonly customerId: string;
  readonly counterpartyCompanyId: string;
  readonly amount: bigint;
  readonly currencyCode: string;
  readonly invoiceDate: Date;
}

export interface IcPayable {
  readonly invoiceId: string;
  readonly supplierId: string;
  readonly counterpartyCompanyId: string;
  readonly amount: bigint;
  readonly currencyCode: string;
  readonly invoiceDate: Date;
}

export type IcMatchStatus = 'MATCHED' | 'RECEIVABLE_ONLY' | 'PAYABLE_ONLY' | 'AMOUNT_MISMATCH';

export interface IcMatchResult {
  readonly status: IcMatchStatus;
  readonly receivable: IcReceivable | null;
  readonly payable: IcPayable | null;
  readonly difference: bigint;
}

export interface IcMatchingSummary {
  readonly matches: readonly IcMatchResult[];
  readonly matchedCount: number;
  readonly unmatchedReceivables: number;
  readonly unmatchedPayables: number;
  readonly totalReceivable: bigint;
  readonly totalPayable: bigint;
  readonly netExposure: bigint;
}

/**
 * Match IC receivables against IC payables by counterparty company + currency.
 * Identifies matched pairs, unmatched items, and amount mismatches.
 */
export function matchIcReceivables(
  receivables: readonly IcReceivable[],
  payables: readonly IcPayable[]
): IcMatchingSummary {
  const usedPayables = new Set<string>();
  const matches: IcMatchResult[] = [];

  for (const rec of receivables) {
    let matched = false;
    for (const pay of payables) {
      if (usedPayables.has(pay.invoiceId)) continue;
      if (rec.counterpartyCompanyId !== pay.counterpartyCompanyId) continue;
      if (rec.currencyCode !== pay.currencyCode) continue;

      usedPayables.add(pay.invoiceId);
      matched = true;

      if (rec.amount === pay.amount) {
        matches.push({ status: 'MATCHED', receivable: rec, payable: pay, difference: 0n });
      } else {
        matches.push({
          status: 'AMOUNT_MISMATCH',
          receivable: rec,
          payable: pay,
          difference: rec.amount - pay.amount,
        });
      }
      break;
    }

    if (!matched) {
      matches.push({
        status: 'RECEIVABLE_ONLY',
        receivable: rec,
        payable: null,
        difference: rec.amount,
      });
    }
  }

  for (const pay of payables) {
    if (usedPayables.has(pay.invoiceId)) continue;
    matches.push({
      status: 'PAYABLE_ONLY',
      receivable: null,
      payable: pay,
      difference: -pay.amount,
    });
  }

  const matchedCount = matches.filter((m) => m.status === 'MATCHED').length;
  const unmatchedReceivables = matches.filter((m) => m.status === 'RECEIVABLE_ONLY').length;
  const unmatchedPayables = matches.filter((m) => m.status === 'PAYABLE_ONLY').length;
  const totalReceivable = receivables.reduce((s, r) => s + r.amount, 0n);
  const totalPayable = payables.reduce((s, p) => s + p.amount, 0n);

  return {
    matches,
    matchedCount,
    unmatchedReceivables,
    unmatchedPayables,
    totalReceivable,
    totalPayable,
    netExposure: totalReceivable - totalPayable,
  };
}
