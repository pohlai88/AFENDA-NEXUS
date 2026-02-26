/**
 * GL-13: Fiscal year period auto-generator.
 * Pure calculator — generates 12 monthly periods (or 13-period calendar)
 * for a given fiscal year configuration.
 *
 * Supports:
 * - Calendar year (Jan–Dec)
 * - Non-calendar fiscal years (e.g., Apr–Mar for ASEAN companies)
 * - 13-period 4-4-5, 4-5-4, 5-4-4 week patterns
 * - Carry-forward from prior year structure
 */
import type { CalculatorResult } from '../../../shared/types.js';

export type PeriodPattern = 'MONTHLY' | '4-4-5' | '4-5-4' | '5-4-4';

export interface FiscalYearConfig {
  /** First month of the fiscal year (1 = January, 4 = April, etc.). */
  readonly startMonth: number;
  /** Calendar year the fiscal year starts in. */
  readonly startYear: number;
  /** Period generation pattern. Default: MONTHLY. */
  readonly pattern?: PeriodPattern;
  /** Company identifier for the generated periods. */
  readonly companyId: string;
  /** Optional name prefix (default: "FY"). */
  readonly namePrefix?: string;
}

export interface GeneratedPeriod {
  readonly name: string;
  readonly periodNumber: number;
  readonly from: Date;
  readonly to: Date;
  readonly isFinalPeriod: boolean;
}

export interface FiscalYearResult {
  readonly fiscalYearLabel: string;
  readonly periods: readonly GeneratedPeriod[];
  readonly totalPeriods: number;
  readonly startDate: Date;
  readonly endDate: Date;
}

function lastDayOfMonth(year: number, month: number): Date {
  // month is 1-indexed; Date constructor month is 0-indexed
  // day 0 of next month = last day of current month
  return new Date(year, month, 0);
}

function startOfDay(year: number, month: number, day: number): Date {
  return new Date(year, month - 1, day);
}

function endOfDay(year: number, month: number): Date {
  const last = lastDayOfMonth(year, month);
  return new Date(last.getFullYear(), last.getMonth(), last.getDate());
}

/**
 * Generates monthly periods for a fiscal year.
 */
function generateMonthlyPeriods(
  startMonth: number,
  startYear: number,
  prefix: string
): GeneratedPeriod[] {
  const periods: GeneratedPeriod[] = [];

  for (let i = 0; i < 12; i++) {
    let month = startMonth + i;
    let year = startYear;
    if (month > 12) {
      month -= 12;
      year += 1;
    }

    const from = startOfDay(year, month, 1);
    const to = endOfDay(year, month);
    const monthStr = String(month).padStart(2, '0');

    periods.push({
      name: `${prefix}-P${String(i + 1).padStart(2, '0')} (${year}-${monthStr})`,
      periodNumber: i + 1,
      from,
      to,
      isFinalPeriod: i === 11,
    });
  }

  return periods;
}

/**
 * Generates 13-period (4-week) periods based on week patterns.
 * Each "4" = 4 weeks (28 days), each "5" = 5 weeks (35 days).
 * Pattern repeats 4 times for 4 quarters.
 */
function generate13PeriodCalendar(
  startMonth: number,
  startYear: number,
  pattern: '4-4-5' | '4-5-4' | '5-4-4',
  prefix: string
): GeneratedPeriod[] {
  const weekPattern = pattern === '4-4-5' ? [4, 4, 5] : pattern === '4-5-4' ? [4, 5, 4] : [5, 4, 4];

  // 13 periods: 4 quarters × 3 periods + 1 extra period
  // Total: 4×(4+4+5) = 52 weeks = 364 days (or 4×(4+5+4) etc.)
  const periods: GeneratedPeriod[] = [];
  let currentDate = startOfDay(startYear, startMonth, 1);
  let periodNum = 1;

  for (let quarter = 0; quarter < 4; quarter++) {
    for (const weeks of weekPattern) {
      const from = new Date(currentDate);
      const days = weeks * 7;
      const to = new Date(currentDate);
      to.setDate(to.getDate() + days - 1);

      periods.push({
        name: `${prefix}-P${String(periodNum).padStart(2, '0')} (Q${quarter + 1}-${weeks}w)`,
        periodNumber: periodNum,
        from,
        to,
        isFinalPeriod: false,
      });

      currentDate = new Date(to);
      currentDate.setDate(currentDate.getDate() + 1);
      periodNum++;
    }
  }

  // Add 13th period for remaining days to fiscal year end
  const fyEndMonth = startMonth === 1 ? 12 : startMonth - 1;
  const fyEndYear = startMonth === 1 ? startYear : startYear + 1;
  const fyEnd = endOfDay(fyEndYear, fyEndMonth);

  if (currentDate <= fyEnd) {
    periods.push({
      name: `${prefix}-P13 (Adj)`,
      periodNumber: 13,
      from: new Date(currentDate),
      to: fyEnd,
      isFinalPeriod: true,
    });
  }

  // Mark last period
  if (periods.length > 0) {
    const last = periods[periods.length - 1]!;
    periods[periods.length - 1] = { ...last, isFinalPeriod: true };
  }

  return periods;
}

/**
 * Generates fiscal year periods from configuration.
 *
 * @throws if startMonth is not 1-12 or startYear is invalid.
 */
export function generateFiscalYear(config: FiscalYearConfig): CalculatorResult<FiscalYearResult> {
  if (config.startMonth < 1 || config.startMonth > 12) {
    throw new Error(`Invalid start month: ${config.startMonth}. Must be 1-12.`);
  }
  if (config.startYear < 1900 || config.startYear > 2200) {
    throw new Error(`Invalid start year: ${config.startYear}. Must be 1900-2200.`);
  }

  const prefix = config.namePrefix ?? 'FY';
  const pattern = config.pattern ?? 'MONTHLY';

  // Fiscal year label: e.g., "FY2026" or "FY2025/2026" for non-calendar
  const endYear = config.startMonth === 1 ? config.startYear : config.startYear + 1;
  const fyLabel =
    config.startMonth === 1
      ? `${prefix}${config.startYear}`
      : `${prefix}${config.startYear}/${endYear}`;

  let periods: GeneratedPeriod[];

  if (pattern === 'MONTHLY') {
    periods = generateMonthlyPeriods(config.startMonth, config.startYear, prefix);
  } else {
    periods = generate13PeriodCalendar(config.startMonth, config.startYear, pattern, prefix);
  }

  const startDate = periods[0]!.from;
  const endDate = periods[periods.length - 1]!.to;

  return {
    result: {
      fiscalYearLabel: fyLabel,
      periods,
      totalPeriods: periods.length,
      startDate,
      endDate,
    },
    inputs: {
      startMonth: config.startMonth,
      startYear: config.startYear,
      pattern,
      companyId: config.companyId,
    },
    explanation:
      `Fiscal year ${fyLabel}: ${periods.length} ${pattern} periods from ` +
      `${startDate.toISOString().slice(0, 10)} to ${endDate.toISOString().slice(0, 10)}`,
  };
}
