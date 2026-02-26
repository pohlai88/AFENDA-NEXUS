/**
 * GAP-B4: Data Retention / Archival Policy calculator.
 * Pure calculator — evaluates entity records against configurable retention
 * periods per entity type and jurisdiction, producing archive/purge/retain
 * recommendations.
 *
 * Legislative requirements:
 * - Malaysia: Companies Act 2016 §245 — 7 years
 * - Singapore: Companies Act / IRAS — 5 years
 * - EU GDPR: Right to erasure vs. legal retention obligation
 * - SOX: 7 years for financial records
 * - Common law: 6–7 years from end of financial year
 */
import type { CalculatorResult } from '../../../shared/types.js';

export type RetentionAction = 'RETAIN' | 'ARCHIVE' | 'PURGE_ELIGIBLE' | 'GDPR_REVIEW';

export type EntityType =
  | 'JOURNAL'
  | 'AP_INVOICE'
  | 'AR_INVOICE'
  | 'BANK_STATEMENT'
  | 'TAX_RETURN'
  | 'FIXED_ASSET'
  | 'PAYROLL'
  | 'EXPENSE_CLAIM'
  | 'AUDIT_LOG'
  | 'USER_DATA';

export interface RetentionPolicy {
  readonly entityType: EntityType;
  readonly jurisdiction: string;
  /** Retention period in months from fiscal year end. */
  readonly retentionMonths: number;
  /** Whether GDPR anonymization applies. */
  readonly gdprApplicable: boolean;
  /** Whether the entity has legal hold override. */
  readonly legalHoldOverride: boolean;
}

export interface RetentionRecord {
  readonly entityId: string;
  readonly entityType: EntityType;
  readonly jurisdiction: string;
  readonly fiscalYearEnd: string;
  readonly createdAt: string;
  readonly containsPii: boolean;
  readonly isOnLegalHold: boolean;
}

export interface RetentionEvaluation {
  readonly entityId: string;
  readonly entityType: EntityType;
  readonly action: RetentionAction;
  readonly retentionExpiresAt: string;
  readonly daysUntilExpiry: number;
  readonly reason: string;
  readonly gdprAnonymizationRequired: boolean;
}

export interface RetentionInput {
  readonly evaluationDate: string;
  readonly policies: readonly RetentionPolicy[];
  readonly records: readonly RetentionRecord[];
}

export interface RetentionResult {
  readonly evaluations: readonly RetentionEvaluation[];
  readonly totalRecords: number;
  readonly retainCount: number;
  readonly archiveCount: number;
  readonly purgeEligibleCount: number;
  readonly gdprReviewCount: number;
  readonly summary: readonly RetentionSummaryRow[];
}

export interface RetentionSummaryRow {
  readonly entityType: EntityType;
  readonly jurisdiction: string;
  readonly total: number;
  readonly retain: number;
  readonly archive: number;
  readonly purgeEligible: number;
  readonly gdprReview: number;
}

/** Default retention periods (months) by jurisdiction. */
const DEFAULT_RETENTION: Record<string, number> = {
  MY: 84, // Malaysia: 7 years
  SG: 60, // Singapore: 5 years
  EU: 84, // EU: 7 years (SOX alignment)
  US: 84, // US: 7 years (SOX)
  DEFAULT: 84,
};

function parseDate(s: string): Date {
  return new Date(s);
}

function daysBetween(a: Date, b: Date): number {
  return Math.floor((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24));
}

function addMonths(d: Date, months: number): Date {
  const result = new Date(d);
  result.setMonth(result.getMonth() + months);
  return result;
}

/**
 * Evaluates records against retention policies and produces recommendations.
 */
export function evaluateRetention(input: RetentionInput): CalculatorResult<RetentionResult> {
  if (input.records.length === 0) {
    throw new Error('At least one record required for retention evaluation');
  }

  const evalDate = parseDate(input.evaluationDate);
  const policyMap = new Map<string, RetentionPolicy>();
  for (const policy of input.policies) {
    policyMap.set(`${policy.entityType}:${policy.jurisdiction}`, policy);
  }

  const evaluations: RetentionEvaluation[] = [];
  let retainCount = 0;
  let archiveCount = 0;
  let purgeEligibleCount = 0;
  let gdprReviewCount = 0;

  for (const record of input.records) {
    const key = `${record.entityType}:${record.jurisdiction}`;
    const policy = policyMap.get(key);
    const retentionMonths =
      policy?.retentionMonths ??
      DEFAULT_RETENTION[record.jurisdiction] ??
      DEFAULT_RETENTION['DEFAULT']!;
    const gdprApplicable = policy?.gdprApplicable ?? false;

    const fyeDate = parseDate(record.fiscalYearEnd);
    const expiresAt = addMonths(fyeDate, retentionMonths);
    const daysUntilExpiry = daysBetween(evalDate, expiresAt);

    let action: RetentionAction;
    let reason: string;
    let gdprAnonymizationRequired = false;

    if (record.isOnLegalHold) {
      action = 'RETAIN';
      reason = 'Legal hold active — cannot archive or purge';
    } else if (daysUntilExpiry > 365) {
      action = 'RETAIN';
      reason = `Within retention period (${daysUntilExpiry} days remaining)`;
    } else if (daysUntilExpiry > 0) {
      action = 'ARCHIVE';
      reason = `Approaching retention expiry (${daysUntilExpiry} days remaining) — archive to cold storage`;
      archiveCount++;
    } else if (gdprApplicable && record.containsPii) {
      action = 'GDPR_REVIEW';
      reason =
        'Retention expired + contains PII in GDPR jurisdiction — requires anonymization review';
      gdprAnonymizationRequired = true;
      gdprReviewCount++;
    } else {
      action = 'PURGE_ELIGIBLE';
      reason = `Retention period expired (${Math.abs(daysUntilExpiry)} days ago)`;
      purgeEligibleCount++;
    }

    if (action === 'RETAIN' && !record.isOnLegalHold) retainCount++;
    if (action === 'RETAIN' && record.isOnLegalHold) retainCount++;

    evaluations.push({
      entityId: record.entityId,
      entityType: record.entityType,
      action,
      retentionExpiresAt: expiresAt.toISOString().slice(0, 10),
      daysUntilExpiry,
      reason,
      gdprAnonymizationRequired,
    });
  }

  // Build summary
  const summaryMap = new Map<string, RetentionSummaryRow>();
  for (const evaluation of evaluations) {
    const key = `${evaluation.entityType}:${evaluation.entityType}`;
    const existing = summaryMap.get(key) ?? {
      entityType: evaluation.entityType,
      jurisdiction: evaluation.entityType,
      total: 0,
      retain: 0,
      archive: 0,
      purgeEligible: 0,
      gdprReview: 0,
    };
    summaryMap.set(key, {
      ...existing,
      total: existing.total + 1,
      retain: existing.retain + (evaluation.action === 'RETAIN' ? 1 : 0),
      archive: existing.archive + (evaluation.action === 'ARCHIVE' ? 1 : 0),
      purgeEligible: existing.purgeEligible + (evaluation.action === 'PURGE_ELIGIBLE' ? 1 : 0),
      gdprReview: existing.gdprReview + (evaluation.action === 'GDPR_REVIEW' ? 1 : 0),
    });
  }

  return {
    result: {
      evaluations,
      totalRecords: input.records.length,
      retainCount,
      archiveCount,
      purgeEligibleCount,
      gdprReviewCount,
      summary: [...summaryMap.values()],
    },
    inputs: {
      evaluationDate: input.evaluationDate,
      recordCount: input.records.length,
      policyCount: input.policies.length,
    },
    explanation:
      `Data retention: ${input.records.length} records evaluated, ` +
      `${retainCount} retain, ${archiveCount} archive, ` +
      `${purgeEligibleCount} purge-eligible, ${gdprReviewCount} GDPR review`,
  };
}
