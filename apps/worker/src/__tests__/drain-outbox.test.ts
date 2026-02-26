import { describe, it, expect, vi } from 'vitest';
import type { OutboxRow, OutboxDrainer } from '@afenda/db';
import type { Logger } from '@afenda/platform';
import type { EventHandlerRegistry } from '../event-handlers.js';
import { createDrainOutboxTask } from '../tasks/drain-outbox.js';

function mockLogger(): Logger {
  return {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
    fatal: vi.fn(),
    child: vi.fn().mockReturnThis(),
  } as unknown as Logger;
}

function makeOutboxRow(overrides: Partial<OutboxRow> = {}): OutboxRow {
  return {
    id: 'outbox-1',
    tenantId: 't1',
    eventType: 'JOURNAL_POSTED',
    payload: { journalId: 'j1' },
    createdAt: new Date('2025-06-01'),
    processedAt: null,
    ...overrides,
  };
}

function mockDrainer(rows: OutboxRow[] = []): OutboxDrainer {
  return {
    drain: vi.fn().mockResolvedValue(rows),
    markProcessed: vi.fn().mockResolvedValue(undefined),
  };
}

function mockRegistry(): EventHandlerRegistry {
  return {
    register: vi.fn(),
    dispatch: vi.fn().mockResolvedValue(undefined),
  };
}

describe('drainOutbox task', () => {
  it('drains and dispatches each outbox row, then marks processed', async () => {
    const rows = [
      makeOutboxRow({ id: 'o1', eventType: 'JOURNAL_POSTED' }),
      makeOutboxRow({ id: 'o2', eventType: 'GL_BALANCE_CHANGED' }),
    ];
    const drainer = mockDrainer(rows);
    const registry = mockRegistry();
    const logger = mockLogger();

    const task = createDrainOutboxTask({ drainer, registry, logger });
    await task();

    expect(drainer.drain).toHaveBeenCalledWith(50);
    expect(registry.dispatch).toHaveBeenCalledTimes(2);
    expect(registry.dispatch).toHaveBeenCalledWith(rows[0]);
    expect(registry.dispatch).toHaveBeenCalledWith(rows[1]);
    expect(drainer.markProcessed).toHaveBeenCalledTimes(2);
    expect(drainer.markProcessed).toHaveBeenCalledWith('o1');
    expect(drainer.markProcessed).toHaveBeenCalledWith('o2');
  });

  it('returns early on empty outbox without logging', async () => {
    const drainer = mockDrainer([]);
    const registry = mockRegistry();
    const logger = mockLogger();

    const task = createDrainOutboxTask({ drainer, registry, logger });
    await task();

    expect(drainer.drain).toHaveBeenCalledOnce();
    expect(registry.dispatch).not.toHaveBeenCalled();
    expect(drainer.markProcessed).not.toHaveBeenCalled();
    expect(logger.info).not.toHaveBeenCalled();
  });

  it('logs error and skips markProcessed when dispatch throws', async () => {
    const row = makeOutboxRow({ id: 'o-fail' });
    const drainer = mockDrainer([row]);
    const registry = mockRegistry();
    (registry.dispatch as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
      new Error('handler boom')
    );
    const logger = mockLogger();

    const task = createDrainOutboxTask({ drainer, registry, logger });
    await task();

    expect(logger.error).toHaveBeenCalledOnce();
    expect(logger.error).toHaveBeenCalledWith(
      'Failed to process outbox event',
      expect.objectContaining({ outboxId: 'o-fail', eventType: 'JOURNAL_POSTED' })
    );
    expect(drainer.markProcessed).not.toHaveBeenCalled();
  });

  it('continues processing remaining rows after one fails', async () => {
    const rows = [
      makeOutboxRow({ id: 'o1' }),
      makeOutboxRow({ id: 'o2' }),
      makeOutboxRow({ id: 'o3' }),
    ];
    const drainer = mockDrainer(rows);
    const registry = mockRegistry();
    (registry.dispatch as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce(undefined)
      .mockRejectedValueOnce(new Error('fail'))
      .mockResolvedValueOnce(undefined);
    const logger = mockLogger();

    const task = createDrainOutboxTask({ drainer, registry, logger });
    await task();

    expect(drainer.markProcessed).toHaveBeenCalledTimes(2);
    expect(drainer.markProcessed).toHaveBeenCalledWith('o1');
    expect(drainer.markProcessed).toHaveBeenCalledWith('o3');
    expect(drainer.markProcessed).not.toHaveBeenCalledWith('o2');
  });

  it('respects the default batch size of 50', async () => {
    const drainer = mockDrainer([]);
    const registry = mockRegistry();
    const logger = mockLogger();

    const task = createDrainOutboxTask({ drainer, registry, logger });
    await task();

    expect(drainer.drain).toHaveBeenCalledWith(50);
  });
});
