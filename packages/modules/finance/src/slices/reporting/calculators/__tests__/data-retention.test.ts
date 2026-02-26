import { describe, it, expect } from 'vitest';
import {
  evaluateRetention,
  type RetentionInput,
  type RetentionPolicy,
  type RetentionRecord,
} from '../data-retention.js';

const myPolicy: RetentionPolicy = {
  entityType: 'JOURNAL',
  jurisdiction: 'MY',
  retentionMonths: 84,
  gdprApplicable: false,
  legalHoldOverride: false,
};

const euPolicy: RetentionPolicy = {
  entityType: 'USER_DATA',
  jurisdiction: 'EU',
  retentionMonths: 84,
  gdprApplicable: true,
  legalHoldOverride: false,
};

function makeRecord(overrides: Partial<RetentionRecord> = {}): RetentionRecord {
  return {
    entityId: 'rec-1',
    entityType: 'JOURNAL',
    jurisdiction: 'MY',
    fiscalYearEnd: '2020-12-31',
    createdAt: '2020-06-15',
    containsPii: false,
    isOnLegalHold: false,
    ...overrides,
  };
}

describe('evaluateRetention', () => {
  it('retains records within retention period', () => {
    const input: RetentionInput = {
      evaluationDate: '2025-06-01',
      policies: [myPolicy],
      records: [makeRecord({ fiscalYearEnd: '2020-12-31' })],
    };

    const { result } = evaluateRetention(input);

    expect(result.evaluations[0]!.action).toBe('RETAIN');
    expect(result.retainCount).toBe(1);
  });

  it('archives records approaching expiry', () => {
    const input: RetentionInput = {
      evaluationDate: '2027-10-01',
      policies: [myPolicy],
      records: [makeRecord({ fiscalYearEnd: '2020-12-31' })],
    };

    const { result } = evaluateRetention(input);

    expect(result.evaluations[0]!.action).toBe('ARCHIVE');
    expect(result.archiveCount).toBe(1);
  });

  it('marks records as purge-eligible after retention expires', () => {
    const input: RetentionInput = {
      evaluationDate: '2029-01-01',
      policies: [myPolicy],
      records: [makeRecord({ fiscalYearEnd: '2020-12-31' })],
    };

    const { result } = evaluateRetention(input);

    expect(result.evaluations[0]!.action).toBe('PURGE_ELIGIBLE');
    expect(result.purgeEligibleCount).toBe(1);
  });

  it('retains records on legal hold regardless of expiry', () => {
    const input: RetentionInput = {
      evaluationDate: '2030-01-01',
      policies: [myPolicy],
      records: [makeRecord({ fiscalYearEnd: '2020-12-31', isOnLegalHold: true })],
    };

    const { result } = evaluateRetention(input);

    expect(result.evaluations[0]!.action).toBe('RETAIN');
    expect(result.evaluations[0]!.reason).toContain('Legal hold');
  });

  it('flags GDPR review for expired PII records in EU jurisdiction', () => {
    const input: RetentionInput = {
      evaluationDate: '2029-01-01',
      policies: [euPolicy],
      records: [
        makeRecord({
          entityType: 'USER_DATA',
          jurisdiction: 'EU',
          fiscalYearEnd: '2020-12-31',
          containsPii: true,
        }),
      ],
    };

    const { result } = evaluateRetention(input);

    expect(result.evaluations[0]!.action).toBe('GDPR_REVIEW');
    expect(result.evaluations[0]!.gdprAnonymizationRequired).toBe(true);
    expect(result.gdprReviewCount).toBe(1);
  });

  it('uses default retention when no policy matches', () => {
    const input: RetentionInput = {
      evaluationDate: '2025-06-01',
      policies: [],
      records: [makeRecord({ jurisdiction: 'JP' })],
    };

    const { result } = evaluateRetention(input);

    // Default is 84 months, FYE 2020-12-31 + 84 months = 2027-12-31
    expect(result.evaluations[0]!.action).toBe('RETAIN');
  });

  it('throws on empty records', () => {
    expect(() =>
      evaluateRetention({
        evaluationDate: '2025-01-01',
        policies: [],
        records: [],
      })
    ).toThrow('At least one record');
  });

  it('handles multiple records with mixed actions', () => {
    const input: RetentionInput = {
      evaluationDate: '2029-01-01',
      policies: [myPolicy],
      records: [
        makeRecord({ entityId: 'a', fiscalYearEnd: '2025-12-31' }),
        makeRecord({ entityId: 'b', fiscalYearEnd: '2020-12-31' }),
        makeRecord({ entityId: 'c', fiscalYearEnd: '2020-12-31', isOnLegalHold: true }),
      ],
    };

    const { result } = evaluateRetention(input);

    expect(result.totalRecords).toBe(3);
    const actions = result.evaluations.map((e) => e.action);
    expect(actions).toContain('RETAIN');
    expect(actions).toContain('PURGE_ELIGIBLE');
  });

  it('builds summary by entity type', () => {
    const input: RetentionInput = {
      evaluationDate: '2025-06-01',
      policies: [myPolicy],
      records: [makeRecord(), makeRecord({ entityId: 'rec-2' })],
    };

    const { result } = evaluateRetention(input);

    expect(result.summary.length).toBeGreaterThanOrEqual(1);
    expect(result.summary[0]!.total).toBe(2);
  });

  it('provides audit explanation', () => {
    const calc = evaluateRetention({
      evaluationDate: '2025-06-01',
      policies: [myPolicy],
      records: [makeRecord()],
    });

    expect(calc.explanation).toContain('Data retention');
    expect(calc.explanation).toContain('retain');
  });
});
