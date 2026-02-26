import { describe, it, expect, vi } from 'vitest';
import type { OutboxRow } from '@afenda/db';
import type { Logger } from '@afenda/platform';

vi.mock('@afenda/finance/app', () => ({ postJournal: vi.fn() }));
vi.mock('@afenda/finance/infra', () => ({
  DrizzleDocumentAttachmentRepo: vi.fn(),
  DrizzleDocumentLinkRepo: vi.fn(),
  DrizzleOutboxWriter: vi.fn(),
}));
vi.mock('resend', () => ({ Resend: vi.fn() }));

import { createEventHandlerRegistry } from '../event-handlers.js';

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

describe('createEventHandlerRegistry', () => {
  it('registers and dispatches to the correct handler', async () => {
    const logger = mockLogger();
    const registry = createEventHandlerRegistry(logger);
    const handler = vi.fn();

    registry.register('JOURNAL_POSTED', handler);
    await registry.dispatch(makeOutboxRow());

    expect(handler).toHaveBeenCalledOnce();
    expect(handler).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'outbox-1', eventType: 'JOURNAL_POSTED' })
    );
  });

  it('warns on unknown event type without throwing', async () => {
    const logger = mockLogger();
    const registry = createEventHandlerRegistry(logger);

    await registry.dispatch(makeOutboxRow({ eventType: 'NEVER_HEARD_OF_IT' }));

    expect(logger.warn).toHaveBeenCalledOnce();
    expect((logger.warn as ReturnType<typeof vi.fn>).mock.calls[0]?.[0]).toContain(
      'No handler registered'
    );
    expect((logger.warn as ReturnType<typeof vi.fn>).mock.calls[0]?.[1]).toEqual(
      expect.objectContaining({ eventType: 'NEVER_HEARD_OF_IT' })
    );
  });

  it('propagates handler errors to the caller', async () => {
    const logger = mockLogger();
    const registry = createEventHandlerRegistry(logger);
    registry.register('JOURNAL_POSTED', async () => {
      throw new Error('handler kaboom');
    });

    await expect(registry.dispatch(makeOutboxRow())).rejects.toThrow('handler kaboom');
  });

  it('does not call other handlers for different event types', async () => {
    const logger = mockLogger();
    const registry = createEventHandlerRegistry(logger);
    const journalHandler = vi.fn();
    const balanceHandler = vi.fn();

    registry.register('JOURNAL_POSTED', journalHandler);
    registry.register('GL_BALANCE_CHANGED', balanceHandler);

    await registry.dispatch(makeOutboxRow({ eventType: 'JOURNAL_POSTED' }));

    expect(journalHandler).toHaveBeenCalledOnce();
    expect(balanceHandler).not.toHaveBeenCalled();
  });

  it('uses the last registered handler when same event type is registered twice', async () => {
    const logger = mockLogger();
    const registry = createEventHandlerRegistry(logger);
    const first = vi.fn();
    const second = vi.fn();

    registry.register('JOURNAL_POSTED', first);
    registry.register('JOURNAL_POSTED', second);

    await registry.dispatch(makeOutboxRow());

    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalledOnce();
  });
});
