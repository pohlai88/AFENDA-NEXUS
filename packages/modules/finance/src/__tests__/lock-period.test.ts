import { describe, it, expect } from 'vitest';
import { lockPeriod } from '../slices/gl/services/lock-period.js';
import { IDS, makePeriod, mockPeriodRepo, mockOutboxWriter } from './helpers.js';

function makeDeps(overrides: Record<string, unknown> = {}) {
  return {
    periodRepo: mockPeriodRepo(),
    outboxWriter: mockOutboxWriter(),
    ...overrides,
  };
}

describe('lockPeriod()', () => {
  it('locks a CLOSED period', async () => {
    const period = makePeriod({ status: 'CLOSED' });
    const deps = makeDeps({ periodRepo: mockPeriodRepo([period]) });
    const result = await lockPeriod({ tenantId: 't1', periodId: IDS.period, userId: 'u1' }, deps);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value.status).toBe('LOCKED');
  });

  it('rejects OPEN periods', async () => {
    const period = makePeriod({ status: 'OPEN' });
    const deps = makeDeps({ periodRepo: mockPeriodRepo([period]) });
    const result = await lockPeriod({ tenantId: 't1', periodId: IDS.period, userId: 'u1' }, deps);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe('INVALID_STATE');
  });

  it('rejects already LOCKED periods', async () => {
    const period = makePeriod({ status: 'LOCKED' });
    const deps = makeDeps({ periodRepo: mockPeriodRepo([period]) });
    const result = await lockPeriod({ tenantId: 't1', periodId: IDS.period, userId: 'u1' }, deps);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe('INVALID_STATE');
  });

  it('emits PERIOD_LOCKED outbox event with userId (A-06)', async () => {
    const period = makePeriod({ status: 'CLOSED' });
    const outbox = mockOutboxWriter();
    const deps = makeDeps({ periodRepo: mockPeriodRepo([period]), outboxWriter: outbox });
    await lockPeriod(
      { tenantId: 't1', periodId: IDS.period, userId: 'u1', reason: 'year-end' },
      deps
    );
    expect(outbox.events.length).toBe(1);
    expect(outbox.events[0].eventType).toBe('PERIOD_LOCKED');
    expect(outbox.events[0].payload).toHaveProperty('userId', 'u1');
    expect(outbox.events[0].payload).toHaveProperty('reason', 'year-end');
  });
});
