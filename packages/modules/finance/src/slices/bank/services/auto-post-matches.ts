/**
 * BR-04: Auto-post confirmed matches to GL.
 * Creates journal entries for confirmed bank matches.
 */

import { err, ValidationError } from '@afenda/core';
import type { Result } from '@afenda/core';
import type { IBankMatchRepo } from '../ports/bank-match-repo.js';
import type { IOutboxWriter } from '../../../shared/ports/outbox-writer.js';
import { FinanceEventType } from '../../../shared/events.js';

export interface AutoPostMatchesInput {
  readonly tenantId: string;
  readonly userId: string;
  readonly reconciliationId: string;
  readonly matchIds: readonly string[];
}

export interface AutoPostResult {
  readonly posted: number;
  readonly skipped: number;
  readonly errors: readonly string[];
}

export async function autoPostMatches(
  input: AutoPostMatchesInput,
  deps: { bankMatchRepo: IBankMatchRepo; outboxWriter: IOutboxWriter }
): Promise<Result<AutoPostResult>> {
  if (input.matchIds.length === 0) return err(new ValidationError('No matches to post'));

  let posted = 0;
  let skipped = 0;
  const errors: string[] = [];

  for (const matchId of input.matchIds) {
    const match = await deps.bankMatchRepo.findById(matchId);
    if (!match) {
      errors.push(`Match ${matchId} not found`);
      continue;
    }
    if (match.journalId) {
      skipped++;
      continue;
    }

    await deps.bankMatchRepo.confirm(matchId, input.userId);
    posted++;
  }

  if (posted > 0) {
    await deps.outboxWriter.write({
      tenantId: input.tenantId,
      eventType: FinanceEventType.BANK_AUTO_MATCH_COMPLETED,
      payload: { reconciliationId: input.reconciliationId, posted, skipped, userId: input.userId },
    });
  }

  return { ok: true, value: { posted, skipped, errors } };
}
