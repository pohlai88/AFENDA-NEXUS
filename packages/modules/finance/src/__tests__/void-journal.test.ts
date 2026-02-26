import { describe, it, expect } from 'vitest';
import { voidJournal } from '../slices/gl/services/void-journal.js';
import {
  IDS,
  makeJournal,
  mockJournalRepo,
  mockJournalAuditRepo,
  mockFxRateRepo,
} from './helpers.js';

function makeDeps(overrides: Record<string, unknown> = {}) {
  return {
    journalRepo: mockJournalRepo(),
    journalAuditRepo: mockJournalAuditRepo(),
    fxRateRepo: mockFxRateRepo(),
    ...overrides,
  };
}

describe('voidJournal()', () => {
  it('voids a DRAFT journal', async () => {
    const journal = makeJournal({ status: 'DRAFT' });
    const deps = makeDeps({ journalRepo: mockJournalRepo(new Map([[IDS.journal, journal]])) });
    const result = await voidJournal(
      { tenantId: 't1', journalId: IDS.journal, userId: 'u1', reason: 'entered in error' },
      deps
    );
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value.status).toBe('VOIDED');
  });

  it('rejects POSTED journals', async () => {
    const journal = makeJournal({ status: 'POSTED' });
    const deps = makeDeps({ journalRepo: mockJournalRepo(new Map([[IDS.journal, journal]])) });
    const result = await voidJournal(
      { tenantId: 't1', journalId: IDS.journal, userId: 'u1', reason: 'test' },
      deps
    );
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe('INVALID_STATE');
  });

  it('rejects REVERSED journals', async () => {
    const journal = makeJournal({ status: 'REVERSED' });
    const deps = makeDeps({ journalRepo: mockJournalRepo(new Map([[IDS.journal, journal]])) });
    const result = await voidJournal(
      { tenantId: 't1', journalId: IDS.journal, userId: 'u1', reason: 'test' },
      deps
    );
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe('INVALID_STATE');
  });

  it('returns NOT_FOUND for missing journal', async () => {
    const deps = makeDeps();
    const result = await voidJournal(
      { tenantId: 't1', journalId: 'missing', userId: 'u1', reason: 'test' },
      deps
    );
    expect(result.ok).toBe(false);
  });

  it('passes reason to audit log (A-11)', async () => {
    const journal = makeJournal({ status: 'DRAFT' });
    const auditRepo = mockJournalAuditRepo();
    const deps = makeDeps({
      journalRepo: mockJournalRepo(new Map([[IDS.journal, journal]])),
      journalAuditRepo: auditRepo,
    });
    await voidJournal(
      { tenantId: 't1', journalId: IDS.journal, userId: 'u1', reason: 'duplicate draft' },
      deps
    );
    expect(auditRepo.entries.length).toBe(1);
    expect(auditRepo.entries[0].reason).toBe('duplicate draft');
  });
});
