'use server';

import { revalidatePath } from 'next/cache';
import { getRequestContext } from '@/lib/auth';
import {
  createMatchTolerance,
  updateMatchTolerance,
} from '../queries/match-tolerance.queries';
import type { ApiResult } from '@/lib/types';
import type { ToleranceScope } from '@afenda/contracts';
import { routes } from '@/lib/constants';

export async function createMatchToleranceAction(
  body: {
    scope: ToleranceScope;
    scopeEntityId?: string | null;
    companyId?: string | null;
    toleranceBps: number;
    quantityTolerancePercent?: number;
    autoHold?: boolean;
  }
): Promise<ApiResult<unknown>> {
  const ctx = await getRequestContext();
  const result = await createMatchTolerance(ctx, body);
  if (result.ok) {
    revalidatePath(routes.finance.matchTolerances);
  }
  return result;
}

export async function updateMatchToleranceAction(
  id: string,
  body: {
    toleranceBps?: number;
    quantityTolerancePercent?: number;
    autoHold?: boolean;
    isActive?: boolean;
  }
): Promise<ApiResult<unknown>> {
  const ctx = await getRequestContext();
  const result = await updateMatchTolerance(ctx, id, body);
  if (result.ok) {
    revalidatePath(routes.finance.matchTolerances);
  }
  return result;
}
