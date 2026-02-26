import type { Result } from '@afenda/core';
import { err, AppError } from '@afenda/core';
import type { Journal } from '../entities/journal.js';
import type { FxRate } from '../../../shared/ports/fx-port.js';
import { convertAmount } from '../../../shared/ports/fx-port.js';
import { validateJournalBalance } from '../calculators/journal-balance.js';
import { isBalanceDirectionValid } from '../entities/account.js';
import type { IAccountRepo } from '../../../slices/gl/ports/account-repo.js';
import type { IJournalRepo } from '../../../slices/gl/ports/journal-repo.js';
import type { IFiscalPeriodRepo } from '../../../slices/gl/ports/fiscal-period-repo.js';
import type { IGlBalanceRepo } from '../../../slices/gl/ports/gl-balance-repo.js';
import type { IIdempotencyStore } from '../../../shared/ports/idempotency-store.js';
import type { IOutboxWriter } from '../../../shared/ports/outbox-writer.js';
import type { IJournalAuditRepo } from '../../../slices/gl/ports/journal-audit-repo.js';
import type { IFxRateRepo } from '../../../shared/ports/fx-port.js';
import type { ILedgerRepo } from '../../../slices/gl/ports/ledger-repo.js';
import type { ISoDActionLogRepo } from '../../../shared/ports/sod-action-log-repo.js';
import type { IApprovalWorkflow } from '../../../shared/ports/approval-workflow.js';
import type { FinanceContext } from '../../../shared/finance-context.js';
import { FinanceEventType } from '../../../shared/events.js';

export interface PostJournalInput {
  tenantId: string;
  userId: string;
  journalId: string;
  idempotencyKey: string;
  correlationId?: string;
}

export async function postJournal(
  input: PostJournalInput,
  deps: {
    journalRepo: IJournalRepo;
    periodRepo: IFiscalPeriodRepo;
    balanceRepo: IGlBalanceRepo;
    idempotencyStore: IIdempotencyStore;
    outboxWriter: IOutboxWriter;
    journalAuditRepo: IJournalAuditRepo;
    fxRateRepo: IFxRateRepo;
    ledgerRepo: ILedgerRepo;
    accountRepo?: IAccountRepo;
    sodActionLogRepo?: ISoDActionLogRepo;
    approvalWorkflow?: IApprovalWorkflow;
  },
  ctx?: FinanceContext
): Promise<Result<Journal>> {
  const tenantId = ctx?.tenantId ?? input.tenantId;
  const userId = ctx?.actor.userId ?? input.userId;
  // Atomic idempotency claim — prevents check-then-insert race
  const claim = await deps.idempotencyStore.claimOrGet({
    tenantId,
    key: input.idempotencyKey,
    commandType: 'POST_JOURNAL',
  });
  if (!claim.claimed) {
    return err(
      new AppError('IDEMPOTENCY_CONFLICT', `Request ${input.idempotencyKey} already processed`)
    );
  }

  const found = await deps.journalRepo.findById(input.journalId);
  if (!found.ok) return found;

  const journal = found.value;
  if (journal.status !== 'DRAFT' && journal.status !== 'PENDING_APPROVAL') {
    return err(
      new AppError(
        'INVALID_STATE',
        `Journal ${journal.id} is ${journal.status}, expected DRAFT or PENDING_APPROVAL`
      )
    );
  }

  // GAP-A2: Approval workflow integration — opt-in via approvalWorkflow dep
  if (deps.approvalWorkflow && journal.status === 'DRAFT') {
    const totalAmount = journal.lines.reduce((sum, l) => sum + l.debit.amount, 0n);
    const submitResult = await deps.approvalWorkflow.submit({
      tenantId,
      entityType: 'journal',
      entityId: journal.id,
      requestedBy: userId,
      metadata: {
        amount: totalAmount.toString(),
        ledgerId: String(journal.ledgerId),
        companyId: String(journal.companyId),
      },
    });
    if (!submitResult.ok) return submitResult as Result<never>;

    if (submitResult.value.status === 'PENDING') {
      // Approval required — set journal to PENDING_APPROVAL and return
      const pending: Journal = { ...journal, status: 'PENDING_APPROVAL' };
      const pendingSaved = await deps.journalRepo.save(pending);
      if (!pendingSaved.ok) return pendingSaved;
      await deps.journalAuditRepo.log({
        tenantId,
        journalId: journal.id,
        fromStatus: 'DRAFT',
        toStatus: 'PENDING_APPROVAL',
        userId,
        reason: 'Submitted for approval',
        correlationId: input.correlationId,
      });
      return pendingSaved;
    }
    // If auto-approved (status === 'APPROVED'), fall through to normal posting
  }

  // If journal was PENDING_APPROVAL, verify it's now approved
  if (journal.status === 'PENDING_APPROVAL' && deps.approvalWorkflow) {
    const approved = await deps.approvalWorkflow.isApproved(tenantId, 'journal', journal.id);
    if (!approved) {
      return err(
        new AppError(
          'INVALID_STATE',
          `Journal ${journal.id} is pending approval and cannot be posted yet`
        )
      );
    }
  }

  if (journal.lines.length < 2) {
    return err(new AppError('INSUFFICIENT_LINES', 'Journal must have at least 2 lines'));
  }

  // @see DE-01 — Double-entry enforcement via pure calculator
  try {
    const balanceCheck = validateJournalBalance(journal.lines);
    if (!balanceCheck.result.balanced) {
      return err(new AppError('UNBALANCED_JOURNAL', `${balanceCheck.explanation}`));
    }
  } catch (e) {
    return err(new AppError('VALIDATION', (e as Error).message));
  }

  // §9 — Period must be OPEN and postingDate must fall within period range (non-negotiable)
  const periodResult = await deps.periodRepo.findById(journal.fiscalPeriodId);
  if (!periodResult.ok) {
    return err(new AppError('NOT_FOUND', `Fiscal period ${journal.fiscalPeriodId} not found`));
  }
  const period = periodResult.value;
  if (period.status !== 'OPEN') {
    return err(
      new AppError('INVALID_STATE', `Cannot post to ${period.status} period '${period.name}'`)
    );
  }
  if (journal.date < period.range.from || journal.date > period.range.to) {
    return err(
      new AppError(
        'VALIDATION',
        `Journal posting date ${journal.date.toISOString()} is outside period '${period.name}' range`
      )
    );
  }

  // §Multi-currency — if any line currency differs from ledger base, require FX rate
  const ledgerResult = await deps.ledgerRepo.findById(String(journal.ledgerId));
  if (!ledgerResult.ok) {
    return err(new AppError('NOT_FOUND', `Ledger ${journal.ledgerId} not found`));
  }
  const ledger = ledgerResult.value;
  const fxRateCache = new Map<string, FxRate>();
  const foreignLines = journal.lines.filter(
    (l) => l.debit.currency !== ledger.baseCurrency || l.credit.currency !== ledger.baseCurrency
  );
  for (const line of foreignLines) {
    const lineCurrency = line.debit.amount > 0n ? line.debit.currency : line.credit.currency;
    if (!fxRateCache.has(lineCurrency)) {
      const rateResult = await deps.fxRateRepo.findRate(
        lineCurrency,
        ledger.baseCurrency,
        journal.date
      );
      if (!rateResult.ok) {
        return err(
          new AppError(
            'VALIDATION',
            `No FX rate found for ${lineCurrency}/${ledger.baseCurrency} as of ${journal.date.toISOString()}. Multi-currency journals require a valid exchange rate.`
          )
        );
      }
      fxRateCache.set(lineCurrency, rateResult.value);
    }
  }

  const posted: Journal = { ...journal, status: 'POSTED' };
  const saved = await deps.journalRepo.save(posted);

  if (saved.ok) {
    // GL balance UPSERT — computed in posting tx, not in worker
    // Foreign-currency amounts are converted to base-currency equivalents via FX rate
    await deps.balanceRepo.upsertForJournal({
      tenantId,
      ledgerId: String(journal.ledgerId),
      fiscalYear: period.name.split('-')[0] ?? period.name,
      fiscalPeriod: parseInt(period.name.split('-P')[1] ?? '0', 10) || 1,
      lines: journal.lines.map((l) => {
        const lineCurrency = l.debit.amount > 0n ? l.debit.currency : l.credit.currency;
        const fxRate = fxRateCache.get(lineCurrency);
        if (fxRate) {
          return {
            accountId: l.accountId,
            debit: convertAmount(l.debit.amount, fxRate.rate, 0, 0),
            credit: convertAmount(l.credit.amount, fxRate.rate, 0, 0),
          };
        }
        return {
          accountId: l.accountId,
          debit: l.debit.amount,
          credit: l.credit.amount,
        };
      }),
    });

    // GAP-13: Balance direction validation — warn if any account in this journal
    // receives a net entry on the contra-normal side (e.g. net credit to an ASSET).
    // This is an advisory audit log, not a hard block, since legitimate contra entries exist.
    if (deps.accountRepo) {
      const linesByAccount = new Map<string, { debit: bigint; credit: bigint }>();
      for (const line of journal.lines) {
        const existing = linesByAccount.get(line.accountId) ?? { debit: 0n, credit: 0n };
        existing.debit += line.debit.amount;
        existing.credit += line.credit.amount;
        linesByAccount.set(line.accountId, existing);
      }
      for (const [accountId, totals] of linesByAccount) {
        const acctResult = await deps.accountRepo.findById(accountId);
        if (acctResult.ok) {
          const acct = acctResult.value;
          if (!isBalanceDirectionValid(acct.type, totals.debit, totals.credit)) {
            await deps.journalAuditRepo.log({
              tenantId,
              journalId: journal.id,
              fromStatus: 'POSTED',
              toStatus: 'POSTED',
              userId,
              reason: `Balance direction warning: account ${acct.code} (${acct.type}) receives contra-normal net entry in this journal`,
              correlationId: input.correlationId,
            });
          }
        }
      }
    }

    await deps.outboxWriter.write({
      tenantId,
      eventType: FinanceEventType.JOURNAL_POSTED,
      payload: {
        journalId: journal.id,
        ledgerId: journal.ledgerId,
        companyId: journal.companyId,
      },
    });

    // GL_BALANCE_CHANGED — notification-only for cache invalidation
    await deps.outboxWriter.write({
      tenantId,
      eventType: FinanceEventType.GL_BALANCE_CHANGED,
      payload: {
        ledgerId: journal.ledgerId,
        accountIds: journal.lines.map((l) => l.accountId),
        periodId: journal.fiscalPeriodId,
      },
    });

    await deps.journalAuditRepo.log({
      tenantId,
      journalId: journal.id,
      fromStatus: 'DRAFT',
      toStatus: 'POSTED',
      userId,
      correlationId: input.correlationId,
    });

    // A-08: Record outcome reference for idempotency audit trail
    await deps.idempotencyStore.recordOutcome?.(
      tenantId,
      input.idempotencyKey,
      'POST_JOURNAL',
      journal.id
    );

    await deps.sodActionLogRepo?.logAction({
      tenantId,
      entityType: 'journal',
      entityId: journal.id,
      actorId: userId,
      action: 'journal:post',
    });

    // Cross-entity SoD: budget:write ↔ journal:post scoped to fiscal period
    await deps.sodActionLogRepo?.logAction({
      tenantId,
      entityType: 'budgetControl',
      entityId: journal.fiscalPeriodId,
      actorId: userId,
      action: 'journal:post',
    });
  }

  return saved;
}
