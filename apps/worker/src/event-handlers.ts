/**
 * Outbox event handler registry — dispatches events by eventType.
 *
 * Each handler receives the outbox row and performs side effects
 * (email, PDF, webhook, cache invalidation, etc.).
 *
 * Handlers are registered at startup and looked up by eventType string.
 */
import type { OutboxRow } from "@afenda/db";
import type { Logger } from "@afenda/platform";

export type EventHandler = (row: OutboxRow) => Promise<void>;

export interface EventHandlerRegistry {
  register(eventType: string, handler: EventHandler): void;
  dispatch(row: OutboxRow): Promise<void>;
}

export function createEventHandlerRegistry(logger: Logger): EventHandlerRegistry {
  const handlers = new Map<string, EventHandler>();

  return {
    register(eventType: string, handler: EventHandler): void {
      handlers.set(eventType, handler);
    },

    async dispatch(row: OutboxRow): Promise<void> {
      const handler = handlers.get(row.eventType);
      if (handler) {
        await handler(row);
      } else {
        logger.warn(`No handler registered for event type: ${row.eventType}`, {
          eventType: row.eventType,
          outboxId: row.id,
        });
      }
    },
  };
}

/**
 * Extracts typed payload fields from an outbox row.
 */
function payload(row: OutboxRow): Record<string, unknown> {
  return (row.payload ?? {}) as Record<string, unknown>;
}

/**
 * Register all known finance event handlers.
 *
 * Each handler performs structured audit logging with event-specific context.
 * Future enhancements: PDF generation, email notifications, webhook dispatch.
 */
export function registerFinanceHandlers(
  registry: EventHandlerRegistry,
  logger: Logger,
): void {
  registry.register("JOURNAL_CREATED", async (row) => {
    const p = payload(row);
    logger.info("Journal created — draft ready for review", {
      event: "JOURNAL_CREATED",
      outboxId: row.id,
      tenantId: row.tenantId,
      journalId: p.journalId,
      ledgerId: p.ledgerId,
    });
  });

  registry.register("JOURNAL_POSTED", async (row) => {
    const p = payload(row);
    logger.info("Journal posted — GL balances updated", {
      event: "JOURNAL_POSTED",
      outboxId: row.id,
      tenantId: row.tenantId,
      journalId: p.journalId,
      ledgerId: p.ledgerId,
      idempotencyKey: p.idempotencyKey,
    });
    // TODO: Trigger balance cache invalidation
    // TODO: Send notification to approvers
  });

  registry.register("GL_BALANCE_CHANGED", async (row) => {
    const p = payload(row);
    logger.info("GL balance changed — cache invalidation signal", {
      event: "GL_BALANCE_CHANGED",
      outboxId: row.id,
      tenantId: row.tenantId,
      ledgerId: p.ledgerId,
      periodId: p.periodId,
    });
    // TODO: Invalidate trial-balance / report caches
  });

  registry.register("JOURNAL_REVERSED", async (row) => {
    const p = payload(row);
    logger.info("Journal reversed — reversal journal created", {
      event: "JOURNAL_REVERSED",
      outboxId: row.id,
      tenantId: row.tenantId,
      originalJournalId: p.journalId,
      reversalJournalId: p.reversalJournalId,
    });
  });

  registry.register("JOURNAL_VOIDED", async (row) => {
    const p = payload(row);
    logger.info("Journal voided", {
      event: "JOURNAL_VOIDED",
      outboxId: row.id,
      tenantId: row.tenantId,
      journalId: p.journalId,
    });
  });

  registry.register("IC_TRANSACTION_CREATED", async (row) => {
    const p = payload(row);
    logger.info("Intercompany transaction created — paired legs recorded", {
      event: "IC_TRANSACTION_CREATED",
      outboxId: row.id,
      tenantId: row.tenantId,
      transactionId: p.transactionId,
      sourceCompanyId: p.sourceCompanyId,
      mirrorCompanyId: p.mirrorCompanyId,
    });
    // TODO: Notify counterparty company admin
  });

  registry.register("RECURRING_JOURNAL_CREATED", async (row) => {
    const p = payload(row);
    logger.info("Recurring journal processed — draft journal created from template", {
      event: "RECURRING_JOURNAL_CREATED",
      outboxId: row.id,
      tenantId: row.tenantId,
      journalId: p.journalId,
      templateId: p.templateId,
    });
    // TODO: Auto-post if template has autoPost flag
  });
}
