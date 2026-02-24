/**
 * @see FR-05 — Comparative period support
 *
 * Pure calculator — no I/O, no side effects.
 * Merges two classified report sections (current vs prior) into a
 * side-by-side comparative view with variance computation.
 */
import { money } from "@afenda/core";
import type { ReportSection, ReportRow } from "../entities/financial-reports.js";
import type { ComparativeReportSection, ComparativeReportRow } from "../entities/financial-reports.js";
import type { CalculatorResult } from "../../../shared/types.js";

export interface ComparativeSectionInput {
  readonly current: ReportSection;
  readonly prior: ReportSection;
  readonly currency: string;
}

/**
 * Merges two ReportSections into a ComparativeReportSection.
 * Accounts present in one period but not the other get zero for the missing period.
 */
export function buildComparativeSection(
  input: ComparativeSectionInput,
): CalculatorResult<ComparativeReportSection> {
  const { current, prior, currency } = input;

  // Build lookup maps by accountCode
  const currentMap = new Map<string, ReportRow>();
  for (const row of current.rows) {
    currentMap.set(row.accountCode, row);
  }
  const priorMap = new Map<string, ReportRow>();
  for (const row of prior.rows) {
    priorMap.set(row.accountCode, row);
  }

  // Union of all account codes, preserving order (current first, then new from prior)
  const allCodes = new Set<string>();
  for (const row of current.rows) allCodes.add(row.accountCode);
  for (const row of prior.rows) allCodes.add(row.accountCode);

  const rows: ComparativeReportRow[] = [];
  for (const code of allCodes) {
    const cur = currentMap.get(code);
    const pri = priorMap.get(code);
    const currentBalance = cur?.balance ?? money(0n, currency);
    const priorBalance = pri?.balance ?? money(0n, currency);
    const varianceAmount = currentBalance.amount - priorBalance.amount;
    const variancePercent = priorBalance.amount !== 0n
      ? Number((varianceAmount * 10000n) / priorBalance.amount) / 100
      : null;

    rows.push({
      accountCode: code,
      accountName: cur?.accountName ?? pri?.accountName ?? code,
      currentBalance,
      priorBalance,
      variance: money(varianceAmount, currency),
      variancePercent,
    });
  }

  const currentTotal = current.total;
  const priorTotal = prior.total;
  const varianceTotalAmount = currentTotal.amount - priorTotal.amount;

  return {
    result: {
      label: current.label,
      rows,
      currentTotal,
      priorTotal,
      varianceTotal: money(varianceTotalAmount, currency),
    },
    inputs: {
      currentRowCount: current.rows.length,
      priorRowCount: prior.rows.length,
      mergedRowCount: rows.length,
    },
    explanation: `Comparative ${current.label}: ${rows.length} accounts, current total=${currentTotal.amount}, prior total=${priorTotal.amount}, variance=${varianceTotalAmount}`,
  };
}
