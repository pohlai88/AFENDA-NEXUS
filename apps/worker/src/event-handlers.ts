/**
 * Outbox event handler registry — dispatches events by eventType.
 *
 * Each handler receives the outbox row and performs side effects
 * (email, PDF, webhook, cache invalidation, etc.).
 *
 * Handlers are registered at startup and looked up by eventType string.
 */
import type { OutboxRow, DbSession } from '@afenda/db';
import type { Logger } from '@afenda/platform';
import type { IObjectStore } from '@afenda/storage';
import type Redis from 'ioredis';

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
  deps?: {
    objectStore?: IObjectStore;
    session?: DbSession;
    redis?: Redis | null;
    resendApiKey?: string;
  }
): void {
  registry.register('JOURNAL_CREATED', async (row) => {
    const p = payload(row);
    logger.info('Journal created — draft ready for review', {
      event: 'JOURNAL_CREATED',
      outboxId: row.id,
      tenantId: row.tenantId,
      journalId: p.journalId,
      ledgerId: p.ledgerId,
    });
  });

  registry.register('JOURNAL_POSTED', async (row) => {
    const p = payload(row);
    logger.info('Journal posted — GL balances updated', {
      event: 'JOURNAL_POSTED',
      outboxId: row.id,
      tenantId: row.tenantId,
      journalId: p.journalId,
      ledgerId: p.ledgerId,
      idempotencyKey: p.idempotencyKey,
    });
    if (deps?.redis) {
      const keys = [
        `cache:balance:${row.tenantId}:${p.ledgerId}`,
        `cache:trial-balance:${row.tenantId}:${p.ledgerId}`,
      ];
      await deps.redis.del(...keys);
      await deps.redis.publish('cache:invalidate', JSON.stringify({ tenantId: row.tenantId, keys }));
      logger.info('Balance cache invalidated', { keys });
    }
    if (deps?.resendApiKey && deps?.session) {
      try {
        const recipients = (p.notifyEmails as string[] | undefined) ?? [];
        if (recipients.length > 0) {
          const { Resend } = await import('resend');
          const resend = new Resend(deps.resendApiKey);
          await resend.emails.send({
            from: process.env.DEFAULT_FROM_EMAIL ?? 'no-reply@nexuscanon.com',
            to: recipients,
            subject: `Journal ${p.journalId} posted — review required`,
            text: `Journal ${p.journalId} has been posted in ledger ${p.ledgerId}.`,
          });
        } else {
          logger.debug('JOURNAL_POSTED — no notifyEmails in payload, skipping email', {
            journalId: p.journalId,
          });
        }
      } catch (emailErr) {
        logger.warn('Notification email failed (non-fatal)', { error: String(emailErr) });
      }
    }
  });

  registry.register('GL_BALANCE_CHANGED', async (row) => {
    const p = payload(row);
    logger.info('GL balance changed — cache invalidation signal', {
      event: 'GL_BALANCE_CHANGED',
      outboxId: row.id,
      tenantId: row.tenantId,
      ledgerId: p.ledgerId,
      periodId: p.periodId,
    });
    if (deps?.redis) {
      const keys = [
        `cache:balance:${row.tenantId}:${p.ledgerId}`,
        `cache:trial-balance:${row.tenantId}:${p.ledgerId}`,
        `cache:report:${row.tenantId}:${p.ledgerId}:${p.periodId}`,
      ];
      await deps.redis.del(...keys);
      await deps.redis.publish('cache:invalidate', JSON.stringify({ tenantId: row.tenantId, keys }));
      logger.info('Report caches invalidated', { keys });
    }
  });

  registry.register('JOURNAL_REVERSED', async (row) => {
    const p = payload(row);
    logger.info('Journal reversed — reversal journal created', {
      event: 'JOURNAL_REVERSED',
      outboxId: row.id,
      tenantId: row.tenantId,
      originalJournalId: p.journalId,
      reversalJournalId: p.reversalJournalId,
    });
  });

  registry.register('JOURNAL_VOIDED', async (row) => {
    const p = payload(row);
    logger.info('Journal voided', {
      event: 'JOURNAL_VOIDED',
      outboxId: row.id,
      tenantId: row.tenantId,
      journalId: p.journalId,
    });
  });

  registry.register('IC_TRANSACTION_CREATED', async (row) => {
    const p = payload(row);
    logger.info('Intercompany transaction created — paired legs recorded', {
      event: 'IC_TRANSACTION_CREATED',
      outboxId: row.id,
      tenantId: row.tenantId,
      transactionId: p.transactionId,
      sourceCompanyId: p.sourceCompanyId,
      mirrorCompanyId: p.mirrorCompanyId,
    });
    if (deps?.resendApiKey) {
      try {
        const recipients = (p.notifyEmails as string[] | undefined) ?? [];
        if (recipients.length > 0) {
          const { Resend } = await import('resend');
          const resend = new Resend(deps.resendApiKey);
          await resend.emails.send({
            from: process.env.DEFAULT_FROM_EMAIL ?? 'no-reply@nexuscanon.com',
            to: recipients,
            subject: `New intercompany transaction ${p.transactionId}`,
            text: `An intercompany transaction has been created between company ${p.sourceCompanyId} and ${p.mirrorCompanyId}.`,
          });
        } else {
          logger.debug('IC_TRANSACTION_CREATED — no notifyEmails in payload, skipping email', {
            transactionId: p.transactionId,
          });
        }
      } catch (emailErr) {
        logger.warn('IC notification email failed (non-fatal)', { error: String(emailErr) });
      }
    }
  });

  registry.register('RECURRING_JOURNAL_CREATED', async (row) => {
    const p = payload(row);
    logger.info('Recurring journal processed — draft journal created from template', {
      event: 'RECURRING_JOURNAL_CREATED',
      outboxId: row.id,
      tenantId: row.tenantId,
      journalId: p.journalId,
      templateId: p.templateId,
    });
    if (deps?.session && p.autoPost) {
      // TODO: wire up postJournal with full repo deps injection once
      // the worker has access to the finance service container.
      // postJournal now requires (input: PostJournalInput, deps: {...repos}, ctx?)
      logger.warn('Recurring journal auto-post requested but not yet supported in worker', {
        journalId: p.journalId,
        templateId: p.templateId,
        tenantId: row.tenantId,
      });
    }
  });

  // ─── Tier-1: Approval notifications ──────────────────────────────────────────

  registry.register('APPROVAL_SUBMITTED', async (row) => {
    const p = payload(row);
    logger.info('Approval submitted — notification pending', {
      event: 'APPROVAL_SUBMITTED',
      outboxId: row.id,
      tenantId: row.tenantId,
      entityType: p.entityType,
      entityId: p.entityId,
      submittedBy: p.submittedBy,
    });
    if (deps?.resendApiKey) {
      try {
        const { Resend } = await import('resend');
        const resend = new Resend(deps.resendApiKey);
        const approvers = (p.approverEmails as string[]) ?? [];
        if (approvers.length > 0) {
          await resend.emails.send({
            from: process.env.DEFAULT_FROM_EMAIL ?? 'no-reply@nexuscanon.com',
            to: approvers,
            subject: `Approval requested: ${p.entityType} ${p.entityId}`,
            text: `A ${p.entityType} requires your approval. Entity ID: ${p.entityId}.`,
          });
        }
      } catch (emailErr) {
        logger.warn('Approval notification email failed (non-fatal)', { error: String(emailErr) });
      }
    }
  });

  registry.register('APPROVAL_APPROVED', async (row) => {
    const p = payload(row);
    logger.info('Approval approved', {
      event: 'APPROVAL_APPROVED',
      outboxId: row.id,
      tenantId: row.tenantId,
      entityType: p.entityType,
      entityId: p.entityId,
      approvedBy: p.approvedBy,
    });
    if (deps?.resendApiKey) {
      try {
        const { Resend } = await import('resend');
        const resend = new Resend(deps.resendApiKey);
        const submitterEmail = p.submitterEmail as string | undefined;
        if (submitterEmail) {
          await resend.emails.send({
            from: process.env.DEFAULT_FROM_EMAIL ?? 'no-reply@nexuscanon.com',
            to: [submitterEmail],
            subject: `Approved: ${p.entityType} ${p.entityId}`,
            text: `Your ${p.entityType} (${p.entityId}) has been approved.`,
          });
        }
      } catch (emailErr) {
        logger.warn('Approval approved email failed (non-fatal)', { error: String(emailErr) });
      }
    }
  });

  registry.register('APPROVAL_REJECTED', async (row) => {
    const p = payload(row);
    logger.info('Approval rejected', {
      event: 'APPROVAL_REJECTED',
      outboxId: row.id,
      tenantId: row.tenantId,
      entityType: p.entityType,
      entityId: p.entityId,
      rejectedBy: p.rejectedBy,
      reason: p.reason,
    });
    if (deps?.resendApiKey) {
      try {
        const { Resend } = await import('resend');
        const resend = new Resend(deps.resendApiKey);
        const submitterEmail = p.submitterEmail as string | undefined;
        if (submitterEmail) {
          await resend.emails.send({
            from: process.env.DEFAULT_FROM_EMAIL ?? 'no-reply@nexuscanon.com',
            to: [submitterEmail],
            subject: `Rejected: ${p.entityType} ${p.entityId}`,
            text: `Your ${p.entityType} (${p.entityId}) has been rejected. Reason: ${p.reason ?? 'None given'}.`,
          });
        }
      } catch (emailErr) {
        logger.warn('Approval rejected email failed (non-fatal)', { error: String(emailErr) });
      }
    }
  });

  // ─── Tier-0/1: AP OCR Pipeline ──────────────────────────────────────────────

  registry.register('AP_OCR_REQUESTED', async (row) => {
    const p = payload(row);
    logger.info('AP OCR extraction requested', {
      event: 'AP_OCR_REQUESTED',
      outboxId: row.id,
      tenantId: row.tenantId,
      jobId: p.jobId,
      storageKey: p.storageKey,
      providerName: p.providerName,
      confidence: p.confidence,
    });
  });

  registry.register('AP_OCR_EXTRACTION_FAILED', async (row) => {
    const p = payload(row);
    logger.error('AP OCR extraction failed', {
      event: 'AP_OCR_EXTRACTION_FAILED',
      outboxId: row.id,
      tenantId: row.tenantId,
      jobId: p.jobId,
      reasonCode: p.reasonCode,
      errorMessage: p.errorMessage,
      providerName: p.providerName,
      storageKey: p.storageKey,
    });
  });

  registry.register('AP_OCR_INVOICE_RECEIVED', async (row) => {
    const p = payload(row);
    logger.info('AP OCR invoice received — triage review required', {
      event: 'AP_OCR_INVOICE_RECEIVED',
      outboxId: row.id,
      tenantId: row.tenantId,
      jobId: p.jobId,
      invoiceId: p.invoiceId,
      confidence: p.confidence,
      possibleDuplicate: p.possibleDuplicate,
    });
  });

  // ─── Tier-1: AP/Expense/Covenant notifications ─────────────────────────────

  registry.register('AP_PAYMENT_RUN_EXECUTED', async (row) => {
    const p = payload(row);
    logger.info('AP payment run executed', {
      event: 'AP_PAYMENT_RUN_EXECUTED',
      outboxId: row.id,
      tenantId: row.tenantId,
      paymentRunId: p.paymentRunId,
      invoiceCount: p.invoiceCount,
      totalAmount: p.totalAmount,
    });
  });

  registry.register('EXPENSE_CLAIM_APPROVED', async (row) => {
    const p = payload(row);
    logger.info('Expense claim approved — reimbursement pending', {
      event: 'EXPENSE_CLAIM_APPROVED',
      outboxId: row.id,
      tenantId: row.tenantId,
      claimId: p.claimId,
      claimantId: p.claimantId,
    });
  });

  registry.register('EXPENSE_CLAIM_REJECTED', async (row) => {
    const p = payload(row);
    logger.info('Expense claim rejected', {
      event: 'EXPENSE_CLAIM_REJECTED',
      outboxId: row.id,
      tenantId: row.tenantId,
      claimId: p.claimId,
      claimantId: p.claimantId,
      reason: p.reason,
    });
  });

  registry.register('COVENANT_BREACHED', async (row) => {
    const p = payload(row);
    logger.info('Covenant breached — immediate notification required', {
      event: 'COVENANT_BREACHED',
      outboxId: row.id,
      tenantId: row.tenantId,
      covenantId: p.covenantId,
      metric: p.metric,
      actual: p.actual,
      threshold: p.threshold,
    });
  });

  // ─── Tier-1: Document operations ───────────────────────────────────────────

  registry.register('AR_DUNNING_RUN_CREATED', async (row) => {
    const p = payload(row);
    logger.info('AR dunning run created — dunning letters pending generation', {
      event: 'AR_DUNNING_RUN_CREATED',
      outboxId: row.id,
      tenantId: row.tenantId,
      dunningRunId: p.dunningRunId,
      customerCount: p.customerCount,
    });
  });

  // Document storage handlers (R2 integration)
  registry.register('DOCUMENT_R2_DELETE', async (row) => {
    const p = payload(row) as { documentId: string; storageKey: string; bucket: string };
    const store = deps?.objectStore;
    const session = deps?.session;
    if (store && session && p.documentId && p.storageKey) {
      try {
        await store.deleteObject({ tenantId: row.tenantId }, p.storageKey);
        await session.withTenant({ tenantId: row.tenantId }, async (tx) => {
          const { DrizzleDocumentAttachmentRepo } = await import('@afenda/finance/infra');
          const repo = new DrizzleDocumentAttachmentRepo(tx);
          await repo.updateStorageDeleted(p.documentId);
        });
        logger.info('Document R2 object deleted', { documentId: p.documentId, outboxId: row.id });
      } catch (err) {
        logger.error('DOCUMENT_R2_DELETE failed', { error: String(err), documentId: p.documentId });
        throw err;
      }
    } else {
      logger.warn('DOCUMENT_R2_DELETE skipped — no objectStore or session', { outboxId: row.id });
    }
  });

  /** System user for worker-initiated operations (merge, etc.) */
  const SYSTEM_USER_ID = '00000000-0000-4000-8000-000000000000';

  registry.register('DOCUMENT_VERIFY_CHECKSUM', async (row) => {
    const p = payload(row) as { documentId: string; storageKey: string; bucket: string };
    const store = deps?.objectStore;
    const session = deps?.session;
    if (!store || !session || !p.documentId || !p.storageKey) {
      logger.warn('DOCUMENT_VERIFY_CHECKSUM skipped — no objectStore or session', {
        outboxId: row.id,
      });
      return;
    }
    try {
      const stream = await store.getObjectStream({ tenantId: row.tenantId }, p.storageKey);
      if (!stream) {
        logger.warn('DOCUMENT_VERIFY_CHECKSUM — object not found', { documentId: p.documentId });
        return;
      }
      const { createHash } = await import('crypto');
      const hash = createHash('sha256');
      const reader = stream.getReader();
      let done = false;
      while (!done) {
        const { value, done: d } = await reader.read();
        done = d;
        if (value) hash.update(value);
      }
      const checksumSha256 = hash.digest('hex');

      await session.withTenant({ tenantId: row.tenantId }, async (tx) => {
        const { DrizzleDocumentAttachmentRepo, DrizzleDocumentLinkRepo, DrizzleOutboxWriter } =
          await import('@afenda/finance/infra');
        const attachmentRepo = new DrizzleDocumentAttachmentRepo(tx);
        const linkRepo = new DrizzleDocumentLinkRepo(tx);
        const outboxWriter = new DrizzleOutboxWriter(tx);

        const existing = await attachmentRepo.findByChecksumVerified(
          row.tenantId,
          checksumSha256,
          p.documentId
        );

        if (existing) {
          const sourceLinks = await linkRepo.findByDocument(row.tenantId, p.documentId);
          for (const link of sourceLinks) {
            const targetHas = await linkRepo.exists(
              row.tenantId,
              link.entityType,
              link.entityId,
              existing.documentId
            );
            if (!targetHas) {
              await linkRepo.insert({
                documentId: existing.documentId,
                tenantId: row.tenantId,
                entityType: link.entityType,
                entityId: link.entityId,
                linkedBy: link.linkedBy,
                linkedCompanyId: link.linkedCompanyId,
              });
            }
          }
          await linkRepo.deleteByDocumentId(row.tenantId, p.documentId);
          await attachmentRepo.softDelete(p.documentId, SYSTEM_USER_ID);
          await outboxWriter.write({
            tenantId: row.tenantId,
            eventType: 'DOCUMENT_R2_DELETE',
            payload: { documentId: p.documentId, storageKey: p.storageKey, bucket: p.bucket },
          });
          logger.info('Document presigned merge — duplicate merged into existing', {
            sourceDocumentId: p.documentId,
            targetDocumentId: existing.documentId,
            outboxId: row.id,
          });
        } else {
          await attachmentRepo.updateIntegrity(p.documentId, checksumSha256, 'VERIFIED');
          logger.info('Document checksum verified', {
            documentId: p.documentId,
            outboxId: row.id,
          });
        }
      });
    } catch (err) {
      logger.error('DOCUMENT_VERIFY_CHECKSUM failed', {
        error: String(err),
        documentId: p.documentId,
      });
      await session!.withTenant({ tenantId: row.tenantId }, async (tx) => {
        const { DrizzleDocumentAttachmentRepo } = await import('@afenda/finance/infra');
        const repo = new DrizzleDocumentAttachmentRepo(tx);
        await repo.updateIntegrityFailed(p.documentId);
      });
    }
  });
}
