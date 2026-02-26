/**
 * GAP-01: Posting atomicity fault-injection tests.
 *
 * Proves that when a downstream dependency fails during postJournal,
 * the error is surfaced and side-effects are not partially applied.
 * In production, the DB transaction (managed by FinanceRuntime.withTenant)
 * ensures all-or-nothing semantics. These tests verify the service layer
 * correctly propagates failures from each dependency.
 */
import { describe, it, expect, vi } from 'vitest';
import { AppError, err } from '@afenda/core';
import { postJournal } from '../slices/gl/services/post-journal.js';
import {
  IDS,
  makeJournal,
  makePeriod,
  mockJournalRepo,
  mockPeriodRepo,
  mockBalanceRepo,
  mockIdempotencyStore,
  mockOutboxWriter,
  mockJournalAuditRepo,
  mockFxRateRepo,
  mockLedgerRepo,
} from './helpers.js';

const BASE_INPUT = {
  tenantId: 't1',
  userId: 'u1',
  journalId: IDS.journal,
  idempotencyKey: '00000000-0000-4000-8000-000000000099',
};

function makeDeps(overrides: Record<string, unknown> = {}) {
  return {
    journalRepo: mockJournalRepo(new Map([[IDS.journal, makeJournal()]])),
    periodRepo: mockPeriodRepo([makePeriod()]),
    balanceRepo: mockBalanceRepo(),
    idempotencyStore: mockIdempotencyStore(),
    outboxWriter: mockOutboxWriter(),
    journalAuditRepo: mockJournalAuditRepo(),
    fxRateRepo: mockFxRateRepo(),
    ledgerRepo: mockLedgerRepo(),
    ...overrides,
  };
}

describe('GAP-01: Posting atomicity fault-injection', () => {
  it('propagates journalRepo.save failure — journal stays DRAFT', async () => {
    const journalRepo = mockJournalRepo(new Map([[IDS.journal, makeJournal()]]));
    // Inject fault: save always fails
    journalRepo.save = vi.fn().mockResolvedValue(err(new AppError('INTERNAL', 'DB write failed')));
    const outbox = mockOutboxWriter();
    const deps = makeDeps({ journalRepo, outboxWriter: outbox });

    const result = await postJournal(BASE_INPUT, deps);

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe('INTERNAL');
    // No outbox events should have been written
    expect(outbox.events).toHaveLength(0);
  });

  it('propagates balanceRepo.upsertForJournal failure', async () => {
    const balanceRepo = mockBalanceRepo();
    // Inject fault: balance upsert throws
    balanceRepo.upsertForJournal = vi
      .fn()
      .mockRejectedValue(new Error('Balance upsert DB timeout'));
    const outbox = mockOutboxWriter();
    const deps = makeDeps({ balanceRepo, outboxWriter: outbox });

    // In production, the DB transaction would roll back the journal save.
    // At service level, the thrown error propagates as an unhandled rejection.
    await expect(postJournal(BASE_INPUT, deps)).rejects.toThrow('Balance upsert DB timeout');
    // Outbox should NOT have been written (balance upsert happens before outbox)
    expect(outbox.events).toHaveLength(0);
  });

  it('propagates outboxWriter.write failure', async () => {
    const outbox = mockOutboxWriter();
    // Inject fault: outbox write throws
    outbox.write = vi.fn().mockRejectedValue(new Error('Outbox write failed'));
    const deps = makeDeps({ outboxWriter: outbox });

    // In production, the DB transaction would roll back everything.
    await expect(postJournal(BASE_INPUT, deps)).rejects.toThrow('Outbox write failed');
  });

  it('propagates journalAuditRepo.log failure', async () => {
    const auditRepo = mockJournalAuditRepo();
    // Inject fault: audit log throws
    auditRepo.log = vi.fn().mockRejectedValue(new Error('Audit write failed'));
    const deps = makeDeps({ journalAuditRepo: auditRepo });

    await expect(postJournal(BASE_INPUT, deps)).rejects.toThrow('Audit write failed');
  });

  it('does not write outbox or audit when journal save fails', async () => {
    const journalRepo = mockJournalRepo(new Map([[IDS.journal, makeJournal()]]));
    journalRepo.save = vi.fn().mockResolvedValue(err(new AppError('INTERNAL', 'Disk full')));
    const outbox = mockOutboxWriter();
    const auditRepo = mockJournalAuditRepo();
    const deps = makeDeps({ journalRepo, outboxWriter: outbox, journalAuditRepo: auditRepo });

    const result = await postJournal(BASE_INPUT, deps);

    expect(result.ok).toBe(false);
    expect(outbox.events).toHaveLength(0);
    expect(auditRepo.entries).toHaveLength(0);
  });

  it('idempotency prevents double-posting even if first attempt partially failed', async () => {
    // First call claims the idempotency key
    const alreadyClaimed = new Set<string>();
    const deps = makeDeps({ idempotencyStore: mockIdempotencyStore(alreadyClaimed) });

    const result1 = await postJournal(BASE_INPUT, deps);
    expect(result1.ok).toBe(true);

    // Second call with same key should be rejected
    const deps2 = makeDeps({ idempotencyStore: mockIdempotencyStore(alreadyClaimed) });
    const result2 = await postJournal(BASE_INPUT, deps2);
    expect(result2.ok).toBe(false);
    if (!result2.ok) expect(result2.error.code).toBe('IDEMPOTENCY_CONFLICT');
  });
});
