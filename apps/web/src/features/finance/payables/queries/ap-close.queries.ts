import { createApiClient } from '@/lib/api-client';
import type { ApiResult } from '@/lib/types';

// ─── View Models ────────────────────────────────────────────────────────────

export interface CloseChecklistItem {
  id: string;
  label: string;
  description: string;
  status: 'PASS' | 'FAIL' | 'WARNING' | 'SKIPPED';
  details?: string;
  count?: number;
}

export interface ApCloseChecklist {
  periodName: string;
  periodId: string;
  asOfDate: string;
  items: CloseChecklistItem[];
  passCount: number;
  failCount: number;
  warningCount: number;
}

// ─── Query Functions ────────────────────────────────────────────────────────

type Ctx = { tenantId: string; userId: string; token: string };

export async function getApCloseChecklist(
  ctx: Ctx,
  params: { periodId?: string },
): Promise<ApiResult<ApCloseChecklist>> {
  const client = createApiClient(ctx);
  const query: Record<string, string> = {};
  if (params.periodId) query.periodId = params.periodId;
  return client.get<ApCloseChecklist>('/ap/close-checklist', query);
}
