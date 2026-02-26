/**
 * W3-5: WHT report aggregation calculator.
 *
 * Aggregates WHT deductions by supplier and income type
 * for reporting and compliance purposes.
 *
 * Pure calculator — no DB, no side effects.
 */

export interface WhtReportEntry {
  readonly supplierId: string;
  readonly supplierName: string;
  readonly incomeType: string;
  readonly countryCode: string;
  readonly payeeType: 'RESIDENT' | 'NON_RESIDENT';
  readonly grossAmount: bigint;
  readonly whtAmount: bigint;
  readonly netPayable: bigint;
  readonly effectiveRate: number;
  readonly paymentRunId: string;
  readonly paymentDate: Date;
}

export interface WhtReportRow {
  readonly supplierId: string;
  readonly supplierName: string;
  readonly incomeType: string;
  readonly countryCode: string;
  readonly payeeType: 'RESIDENT' | 'NON_RESIDENT';
  readonly transactionCount: number;
  readonly totalGross: bigint;
  readonly totalWht: bigint;
  readonly totalNet: bigint;
  readonly avgEffectiveRate: number;
}

export interface WhtReport {
  readonly rows: readonly WhtReportRow[];
  readonly totals: {
    readonly transactionCount: number;
    readonly totalGross: bigint;
    readonly totalWht: bigint;
    readonly totalNet: bigint;
  };
  readonly dateRange: {
    readonly from: Date;
    readonly to: Date;
  };
}

export function computeWhtReport(
  entries: readonly WhtReportEntry[],
  dateRange: { from: Date; to: Date }
): WhtReport {
  // Group by supplierId + incomeType
  const groupMap = new Map<
    string,
    {
      supplierId: string;
      supplierName: string;
      incomeType: string;
      countryCode: string;
      payeeType: 'RESIDENT' | 'NON_RESIDENT';
      txCount: number;
      gross: bigint;
      wht: bigint;
      net: bigint;
      rateSum: number;
    }
  >();

  for (const e of entries) {
    const key = `${e.supplierId}|${e.incomeType}`;
    let group = groupMap.get(key);
    if (!group) {
      group = {
        supplierId: e.supplierId,
        supplierName: e.supplierName,
        incomeType: e.incomeType,
        countryCode: e.countryCode,
        payeeType: e.payeeType,
        txCount: 0,
        gross: 0n,
        wht: 0n,
        net: 0n,
        rateSum: 0,
      };
      groupMap.set(key, group);
    }
    group.txCount += 1;
    group.gross += e.grossAmount;
    group.wht += e.whtAmount;
    group.net += e.netPayable;
    group.rateSum += e.effectiveRate;
  }

  const rows: WhtReportRow[] = [...groupMap.values()]
    .sort((a, b) => {
      const nameCmp = a.supplierName.localeCompare(b.supplierName);
      if (nameCmp !== 0) return nameCmp;
      return a.incomeType.localeCompare(b.incomeType);
    })
    .map((g) => ({
      supplierId: g.supplierId,
      supplierName: g.supplierName,
      incomeType: g.incomeType,
      countryCode: g.countryCode,
      payeeType: g.payeeType,
      transactionCount: g.txCount,
      totalGross: g.gross,
      totalWht: g.wht,
      totalNet: g.net,
      avgEffectiveRate: g.txCount > 0 ? g.rateSum / g.txCount : 0,
    }));

  const totals = {
    transactionCount: rows.reduce((s, r) => s + r.transactionCount, 0),
    totalGross: rows.reduce((s, r) => s + r.totalGross, 0n),
    totalWht: rows.reduce((s, r) => s + r.totalWht, 0n),
    totalNet: rows.reduce((s, r) => s + r.totalNet, 0n),
  };

  return { rows, totals, dateRange };
}
