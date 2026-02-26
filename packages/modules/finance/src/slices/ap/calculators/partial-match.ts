/**
 * W3-7: Partial match + split invoice lines.
 *
 * Extends the 3-way match concept to support line-level partial matching
 * with a structured diff output showing per-line match results.
 *
 * Pure calculator — no DB, no side effects, all amounts in bigint minor units.
 */

// ─── Input types ────────────────────────────────────────────────────────────

export interface PartialMatchInput {
  readonly poLines: readonly MatchLine[];
  readonly receiptLines: readonly MatchLine[];
  readonly invoiceLines: readonly MatchLine[];
  /** Tolerance in basis points (100 = 1%) */
  readonly toleranceBps: number;
}

export interface MatchLine {
  readonly lineId: string;
  readonly lineNumber: number;
  readonly description: string;
  readonly quantity: number;
  readonly unitPrice: bigint;
  readonly amount: bigint;
}

// ─── Output types ───────────────────────────────────────────────────────────

export type LineMatchStatus =
  | 'MATCHED'
  | 'WITHIN_TOLERANCE'
  | 'QUANTITY_MISMATCH'
  | 'PRICE_MISMATCH'
  | 'OVER_TOLERANCE'
  | 'UNMATCHED_PO'
  | 'UNMATCHED_RECEIPT'
  | 'UNMATCHED_INVOICE';

export interface LineMatchResult {
  readonly lineNumber: number;
  readonly status: LineMatchStatus;
  readonly poLine: MatchLine | null;
  readonly receiptLine: MatchLine | null;
  readonly invoiceLine: MatchLine | null;
  readonly varianceAmount: bigint;
  readonly varianceBps: number;
}

export interface PartialMatchResult {
  readonly overallStatus: 'FULLY_MATCHED' | 'PARTIALLY_MATCHED' | 'UNMATCHED';
  readonly lines: readonly LineMatchResult[];
  readonly matchedCount: number;
  readonly toleranceCount: number;
  readonly mismatchCount: number;
  readonly unmatchedCount: number;
  readonly totalPoAmount: bigint;
  readonly totalReceiptAmount: bigint;
  readonly totalInvoiceAmount: bigint;
  readonly totalVariance: bigint;
}

// ─── Calculator ─────────────────────────────────────────────────────────────

export function partialMatch(input: PartialMatchInput): PartialMatchResult {
  const { poLines, receiptLines, invoiceLines, toleranceBps } = input;

  // Index lines by lineNumber for matching
  const poByLine = new Map(poLines.map((l) => [l.lineNumber, l]));
  const receiptByLine = new Map(receiptLines.map((l) => [l.lineNumber, l]));
  const invoiceByLine = new Map(invoiceLines.map((l) => [l.lineNumber, l]));

  // Collect all line numbers across the three sources
  const allLineNumbers = new Set<number>();
  for (const l of poLines) allLineNumbers.add(l.lineNumber);
  for (const l of receiptLines) allLineNumbers.add(l.lineNumber);
  for (const l of invoiceLines) allLineNumbers.add(l.lineNumber);

  const sortedLineNumbers = [...allLineNumbers].sort((a, b) => a - b);
  const lines: LineMatchResult[] = [];

  let matchedCount = 0;
  let toleranceCount = 0;
  let mismatchCount = 0;
  let unmatchedCount = 0;

  for (const lineNum of sortedLineNumbers) {
    const po = poByLine.get(lineNum) ?? null;
    const receipt = receiptByLine.get(lineNum) ?? null;
    const invoice = invoiceByLine.get(lineNum) ?? null;

    const result = matchSingleLine(po, receipt, invoice, toleranceBps, lineNum);
    lines.push(result);

    switch (result.status) {
      case 'MATCHED':
        matchedCount++;
        break;
      case 'WITHIN_TOLERANCE':
        toleranceCount++;
        break;
      case 'QUANTITY_MISMATCH':
      case 'PRICE_MISMATCH':
      case 'OVER_TOLERANCE':
        mismatchCount++;
        break;
      default:
        unmatchedCount++;
    }
  }

  const totalPoAmount = poLines.reduce((s, l) => s + l.amount, 0n);
  const totalReceiptAmount = receiptLines.reduce((s, l) => s + l.amount, 0n);
  const totalInvoiceAmount = invoiceLines.reduce((s, l) => s + l.amount, 0n);
  const totalVariance = totalInvoiceAmount - totalReceiptAmount;

  let overallStatus: PartialMatchResult['overallStatus'];
  if (mismatchCount === 0 && unmatchedCount === 0) {
    overallStatus = 'FULLY_MATCHED';
  } else if (matchedCount + toleranceCount > 0) {
    overallStatus = 'PARTIALLY_MATCHED';
  } else {
    overallStatus = 'UNMATCHED';
  }

  return {
    overallStatus,
    lines,
    matchedCount,
    toleranceCount,
    mismatchCount,
    unmatchedCount,
    totalPoAmount,
    totalReceiptAmount,
    totalInvoiceAmount,
    totalVariance,
  };
}

function matchSingleLine(
  po: MatchLine | null,
  receipt: MatchLine | null,
  invoice: MatchLine | null,
  toleranceBps: number,
  lineNumber: number
): LineMatchResult {
  // Orphan cases
  if (!po && !receipt && invoice) {
    return {
      lineNumber,
      status: 'UNMATCHED_INVOICE',
      poLine: null,
      receiptLine: null,
      invoiceLine: invoice,
      varianceAmount: invoice.amount,
      varianceBps: 0,
    };
  }
  if (po && !receipt && !invoice) {
    return {
      lineNumber,
      status: 'UNMATCHED_PO',
      poLine: po,
      receiptLine: null,
      invoiceLine: null,
      varianceAmount: 0n,
      varianceBps: 0,
    };
  }
  if (!po && receipt && !invoice) {
    return {
      lineNumber,
      status: 'UNMATCHED_RECEIPT',
      poLine: null,
      receiptLine: receipt,
      invoiceLine: null,
      varianceAmount: 0n,
      varianceBps: 0,
    };
  }
  if (!po && !receipt) {
    return {
      lineNumber,
      status: 'UNMATCHED_INVOICE',
      poLine: null,
      receiptLine: null,
      invoiceLine: invoice,
      varianceAmount: invoice?.amount ?? 0n,
      varianceBps: 0,
    };
  }

  // At least PO exists; check PO vs receipt quantity
  if (po && receipt && po.quantity !== receipt.quantity) {
    return {
      lineNumber,
      status: 'QUANTITY_MISMATCH',
      poLine: po,
      receiptLine: receipt,
      invoiceLine: invoice,
      varianceAmount: receipt.amount - po.amount,
      varianceBps: 0,
    };
  }

  // Receipt vs invoice price match
  const receiptAmt = receipt?.amount ?? po!.amount;
  const invoiceAmt = invoice?.amount ?? 0n;

  if (!invoice) {
    return {
      lineNumber,
      status: 'UNMATCHED_RECEIPT',
      poLine: po,
      receiptLine: receipt,
      invoiceLine: null,
      varianceAmount: 0n,
      varianceBps: 0,
    };
  }

  if (receiptAmt === invoiceAmt) {
    return {
      lineNumber,
      status: 'MATCHED',
      poLine: po,
      receiptLine: receipt,
      invoiceLine: invoice,
      varianceAmount: 0n,
      varianceBps: 0,
    };
  }

  const variance = invoiceAmt - receiptAmt;
  const absVariance = variance < 0n ? -variance : variance;
  const baseAmount = receiptAmt < 0n ? -receiptAmt : receiptAmt;

  if (baseAmount === 0n) {
    return {
      lineNumber,
      status: 'PRICE_MISMATCH',
      poLine: po,
      receiptLine: receipt,
      invoiceLine: invoice,
      varianceAmount: variance,
      varianceBps: 0,
    };
  }

  const varBps = Number((absVariance * 10000n) / baseAmount);

  if (varBps <= toleranceBps) {
    return {
      lineNumber,
      status: 'WITHIN_TOLERANCE',
      poLine: po,
      receiptLine: receipt,
      invoiceLine: invoice,
      varianceAmount: variance,
      varianceBps: varBps,
    };
  }

  return {
    lineNumber,
    status: 'OVER_TOLERANCE',
    poLine: po,
    receiptLine: receipt,
    invoiceLine: invoice,
    varianceAmount: variance,
    varianceBps: varBps,
  };
}
