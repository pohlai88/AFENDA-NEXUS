import { describe, it, expect } from 'vitest';
import { closePeriod } from '../slices/gl/services/close-period.js';
import {
  IDS,
  makeJournal,
  makePeriod,
  mockJournalRepo,
  mockPeriodRepo,
  mockOutboxWriter,
} from './helpers.js';

function makeDeps(overrides: Record<string, unknown> = {}) {
  return {
    periodRepo: mockPeriodRepo(),
    journalRepo: mockJournalRepo(),
    outboxWriter: mockOutboxWriter(),
    ...overrides,
  };
}

describe('closePeriod()', () => {
  it('closes an OPEN period with no DRAFT journals', async () => {
    const deps = makeDeps();
    const result = await closePeriod({ tenantId: 't1', periodId: IDS.period, userId: 'u1' }, deps);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value.status).toBe('CLOSED');
  });

  it('rejects already CLOSED period', async () => {
    const deps = makeDeps({ periodRepo: mockPeriodRepo([makePeriod({ status: 'CLOSED' })]) });
    const result = await closePeriod({ tenantId: 't1', periodId: IDS.period, userId: 'u1' }, deps);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe('INVALID_STATE');
  });

  it('rejects period with remaining DRAFT journals', async () => {
    const draftJournal = makeJournal({ fiscalPeriodId: IDS.period, status: 'DRAFT' });
    const repo = mockJournalRepo(new Map([[IDS.journal, draftJournal]]));
    const deps = makeDeps({ journalRepo: repo });
    const result = await closePeriod({ tenantId: 't1', periodId: IDS.period, userId: 'u1' }, deps);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe('VALIDATION');
  });

  it('emits PERIOD_CLOSED outbox event with userId (A-06)', async () => {
    const outbox = mockOutboxWriter();
    const deps = makeDeps({ outboxWriter: outbox });
    await closePeriod(
      { tenantId: 't1', periodId: IDS.period, userId: 'u1', reason: 'month-end' },
      deps
    );
    expect(outbox.events.some((e) => e.eventType === 'PERIOD_CLOSED')).toBe(true);
    const evt = outbox.events.find((e) => e.eventType === 'PERIOD_CLOSED');
    expect(evt?.payload).toHaveProperty('userId', 'u1');
    expect(evt?.payload).toHaveProperty('reason', 'month-end');
  });
});
