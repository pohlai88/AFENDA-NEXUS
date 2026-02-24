/**
 * @see IC-08 — Exception reporting: anomaly detection on GL transactions
 *
 * Pure calculator — no I/O, no side effects.
 * Scans journal entries for anomalies: unusual amounts, weekend/holiday postings,
 * round-number bias, duplicate amounts, and threshold breaches.
 */

export type ExceptionType =
  | "AMOUNT_EXCEEDS_THRESHOLD"
  | "ROUND_NUMBER_BIAS"
  | "WEEKEND_POSTING"
  | "DUPLICATE_AMOUNT"
  | "UNUSUAL_ACCOUNT_PAIR"
  | "PERIOD_END_CLUSTERING"
  | "SINGLE_LINE_DOMINANCE";

export type ExceptionSeverity = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export interface JournalEntryInput {
  readonly journalId: string;
  readonly postingDate: Date;
  readonly totalAmount: bigint;
  readonly lineCount: number;
  readonly maxLineAmount: bigint;
  readonly debitAccountCodes: readonly string[];
  readonly creditAccountCodes: readonly string[];
  readonly currencyCode: string;
  readonly postedBy: string;
}

export interface ExceptionConfig {
  readonly amountThreshold: bigint;
  readonly roundNumberThreshold: bigint;
  readonly duplicateWindowDays: number;
  readonly periodEndDays: number;
  readonly singleLineDominancePercent: number;
}

export interface DetectedException {
  readonly journalId: string;
  readonly exceptionType: ExceptionType;
  readonly severity: ExceptionSeverity;
  readonly description: string;
  readonly amount: bigint;
  readonly currencyCode: string;
}

export interface ExceptionReport {
  readonly exceptions: readonly DetectedException[];
  readonly totalJournalsScanned: number;
  readonly totalExceptions: number;
  readonly bySeverity: {
    readonly critical: number;
    readonly high: number;
    readonly medium: number;
    readonly low: number;
  };
}

const DEFAULT_CONFIG: ExceptionConfig = {
  amountThreshold: 10_000_000_00n,
  roundNumberThreshold: 1_000_000_00n,
  duplicateWindowDays: 7,
  periodEndDays: 3,
  singleLineDominancePercent: 95,
};

function isWeekend(date: Date): boolean {
  const day = date.getDay();
  return day === 0 || day === 6;
}

function isRoundNumber(amount: bigint, threshold: bigint): boolean {
  if (amount < threshold) return false;
  const abs = amount < 0n ? -amount : amount;
  return abs % 100_00n === 0n;
}

function isPeriodEnd(date: Date, periodEndDays: number): boolean {
  const dayOfMonth = date.getDate();
  const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  return lastDay - dayOfMonth < periodEndDays;
}

export function detectExceptions(
  entries: readonly JournalEntryInput[],
  config: Partial<ExceptionConfig> = {},
): { result: ExceptionReport; explanation: string } {
  if (entries.length === 0) {
    throw new Error("At least one journal entry is required");
  }

  const cfg: ExceptionConfig = { ...DEFAULT_CONFIG, ...config };
  const exceptions: DetectedException[] = [];

  const amountMap = new Map<string, string[]>();

  for (const entry of entries) {
    if (entry.totalAmount > cfg.amountThreshold) {
      exceptions.push({
        journalId: entry.journalId,
        exceptionType: "AMOUNT_EXCEEDS_THRESHOLD",
        severity: entry.totalAmount > cfg.amountThreshold * 10n ? "CRITICAL" : "HIGH",
        description: `Total amount ${entry.totalAmount} exceeds threshold ${cfg.amountThreshold}`,
        amount: entry.totalAmount,
        currencyCode: entry.currencyCode,
      });
    }

    if (isRoundNumber(entry.totalAmount, cfg.roundNumberThreshold)) {
      exceptions.push({
        journalId: entry.journalId,
        exceptionType: "ROUND_NUMBER_BIAS",
        severity: "MEDIUM",
        description: `Round number ${entry.totalAmount} (≥ ${cfg.roundNumberThreshold}) may indicate estimate or manual override`,
        amount: entry.totalAmount,
        currencyCode: entry.currencyCode,
      });
    }

    if (isWeekend(entry.postingDate)) {
      exceptions.push({
        journalId: entry.journalId,
        exceptionType: "WEEKEND_POSTING",
        severity: "LOW",
        description: `Posted on ${entry.postingDate.toISOString().slice(0, 10)} (weekend)`,
        amount: entry.totalAmount,
        currencyCode: entry.currencyCode,
      });
    }

    if (isPeriodEnd(entry.postingDate, cfg.periodEndDays)) {
      exceptions.push({
        journalId: entry.journalId,
        exceptionType: "PERIOD_END_CLUSTERING",
        severity: "MEDIUM",
        description: `Posted within ${cfg.periodEndDays} days of period end — potential window dressing`,
        amount: entry.totalAmount,
        currencyCode: entry.currencyCode,
      });
    }

    if (entry.lineCount > 0 && entry.maxLineAmount > 0n) {
      const dominance = Number((entry.maxLineAmount * 100n) / entry.totalAmount);
      if (dominance >= cfg.singleLineDominancePercent && entry.lineCount > 2) {
        exceptions.push({
          journalId: entry.journalId,
          exceptionType: "SINGLE_LINE_DOMINANCE",
          severity: "MEDIUM",
          description: `Single line represents ${dominance}% of total — ${entry.lineCount} lines but one dominates`,
          amount: entry.maxLineAmount,
          currencyCode: entry.currencyCode,
        });
      }
    }

    const amountKey = `${entry.totalAmount}_${entry.currencyCode}`;
    const existing = amountMap.get(amountKey);
    if (existing) {
      existing.push(entry.journalId);
    } else {
      amountMap.set(amountKey, [entry.journalId]);
    }
  }

  for (const [, journalIds] of amountMap) {
    if (journalIds.length > 1) {
      for (const jid of journalIds) {
        const entry = entries.find((e) => e.journalId === jid)!;
        exceptions.push({
          journalId: jid,
          exceptionType: "DUPLICATE_AMOUNT",
          severity: "HIGH",
          description: `Amount appears in ${journalIds.length} journals — potential duplicate`,
          amount: entry.totalAmount,
          currencyCode: entry.currencyCode,
        });
      }
    }
  }

  const bySeverity = {
    critical: exceptions.filter((e) => e.severity === "CRITICAL").length,
    high: exceptions.filter((e) => e.severity === "HIGH").length,
    medium: exceptions.filter((e) => e.severity === "MEDIUM").length,
    low: exceptions.filter((e) => e.severity === "LOW").length,
  };

  return {
    result: {
      exceptions,
      totalJournalsScanned: entries.length,
      totalExceptions: exceptions.length,
      bySeverity,
    },
    explanation: exceptions.length === 0
      ? `${entries.length} journals scanned — no exceptions detected`
      : `${entries.length} journals scanned — ${exceptions.length} exception(s): ${bySeverity.critical} critical, ${bySeverity.high} high, ${bySeverity.medium} medium, ${bySeverity.low} low`,
  };
}
