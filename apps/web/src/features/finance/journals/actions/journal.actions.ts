'use server';

import { cache } from 'react';
import { getRequestContext } from '@/lib/auth';
import {
  createJournal,
  postJournal,
  reverseJournal,
  voidJournal,
} from '../queries/journal.queries';
import { createApiClient } from '@/lib/api-client';
import type { CreateJournal } from '@afenda/contracts';
import type { ApiResult, CommandReceipt, AuditEntry } from '@/lib/types';

// ─── Mutations (called from client components via useTransition) ────────────

export async function createJournalAction(data: CreateJournal): Promise<ApiResult<CommandReceipt>> {
  const ctx = await getRequestContext();
  return createJournal(ctx, data);
}

export async function postJournalAction(
  journalId: string,
  idempotencyKey: string
): Promise<ApiResult<CommandReceipt>> {
  const ctx = await getRequestContext();
  return postJournal(ctx, journalId, idempotencyKey);
}

export async function reverseJournalAction(
  journalId: string,
  reason: string
): Promise<ApiResult<CommandReceipt>> {
  const ctx = await getRequestContext();
  return reverseJournal(ctx, journalId, reason);
}

export async function voidJournalAction(
  journalId: string,
  reason: string
): Promise<ApiResult<CommandReceipt>> {
  const ctx = await getRequestContext();
  return voidJournal(ctx, journalId, reason);
}

// ─── Queries (called from server components) ───────────────────────────────

export const getJournalAuditAction = cache(async (journalId: string): Promise<ApiResult<AuditEntry[]>> => {
  const ctx = await getRequestContext();
  const client = createApiClient(ctx);
  return client.get<AuditEntry[]>(`/journals/${journalId}/audit`);
});
