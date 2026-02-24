/**
 * SR-03: Segment reporting calculator (IFRS 8).
 * Pure calculator — aggregates financial data by operating segments
 * and computes inter-segment eliminations.
 */
import type { CalculatorResult } from "../../../shared/types.js";

export interface SegmentData {
  readonly segmentId: string;
  readonly segmentName: string;
  readonly externalRevenue: bigint;
  readonly interSegmentRevenue: bigint;
  readonly operatingExpenses: bigint;
  readonly depreciationAmortization: bigint;
  readonly totalAssets: bigint;
  readonly totalLiabilities: bigint;
  readonly capitalExpenditure: bigint;
  readonly currencyCode: string;
}

export interface SegmentReportRow {
  readonly segmentId: string;
  readonly segmentName: string;
  readonly totalRevenue: bigint;
  readonly externalRevenue: bigint;
  readonly interSegmentRevenue: bigint;
  readonly segmentResult: bigint;
  readonly segmentMarginBps: number;
  readonly totalAssets: bigint;
  readonly totalLiabilities: bigint;
  readonly capitalExpenditure: bigint;
}

export interface SegmentReportResult {
  readonly segments: readonly SegmentReportRow[];
  readonly eliminations: {
    readonly interSegmentRevenue: bigint;
    readonly interSegmentExpense: bigint;
  };
  readonly consolidated: {
    readonly totalRevenue: bigint;
    readonly totalResult: bigint;
    readonly totalAssets: bigint;
    readonly totalLiabilities: bigint;
  };
}

/**
 * Computes segment reporting with inter-segment elimination.
 */
export function computeSegmentReport(
  segments: readonly SegmentData[],
): CalculatorResult<SegmentReportResult> {
  if (segments.length === 0) {
    throw new Error("At least one segment required");
  }

  let totalInterSegmentRevenue = 0n;
  let consolidatedRevenue = 0n;
  let consolidatedResult = 0n;
  let consolidatedAssets = 0n;
  let consolidatedLiabilities = 0n;

  const rows: SegmentReportRow[] = segments.map((s) => {
    const totalRevenue = s.externalRevenue + s.interSegmentRevenue;
    const segmentResult =
      totalRevenue - s.operatingExpenses - s.depreciationAmortization;
    const segmentMarginBps =
      totalRevenue > 0n
        ? Number((segmentResult * 10000n) / totalRevenue)
        : 0;

    totalInterSegmentRevenue += s.interSegmentRevenue;
    consolidatedRevenue += s.externalRevenue;
    consolidatedResult += s.externalRevenue - s.operatingExpenses - s.depreciationAmortization;
    consolidatedAssets += s.totalAssets;
    consolidatedLiabilities += s.totalLiabilities;

    return {
      segmentId: s.segmentId,
      segmentName: s.segmentName,
      totalRevenue,
      externalRevenue: s.externalRevenue,
      interSegmentRevenue: s.interSegmentRevenue,
      segmentResult,
      segmentMarginBps,
      totalAssets: s.totalAssets,
      totalLiabilities: s.totalLiabilities,
      capitalExpenditure: s.capitalExpenditure,
    };
  });

  return {
    result: {
      segments: rows,
      eliminations: {
        interSegmentRevenue: totalInterSegmentRevenue,
        interSegmentExpense: totalInterSegmentRevenue,
      },
      consolidated: {
        totalRevenue: consolidatedRevenue,
        totalResult: consolidatedResult,
        totalAssets: consolidatedAssets,
        totalLiabilities: consolidatedLiabilities,
      },
    },
    inputs: { segmentCount: segments.length },
    explanation: `Segment report: ${rows.length} segments, inter-segment elimination=${totalInterSegmentRevenue}`,
  };
}
