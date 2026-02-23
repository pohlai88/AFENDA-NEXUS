import { createApiClient } from "@/lib/api-client";
import type { ApiResult } from "@/lib/types";

// ─── View Models ────────────────────────────────────────────────────────────

export interface TrialBalanceRow {
  accountCode: string;
  accountName: string;
  debit: string;
  credit: string;
  balance: string;
}

export interface TrialBalanceResult {
  rows: TrialBalanceRow[];
  totalDebit: string;
  totalCredit: string;
  asOfDate: string;
}

// ─── Query Functions ────────────────────────────────────────────────────────

export async function getTrialBalance(
  ctx: { tenantId: string; userId: string; token: string },
  params: { ledgerId: string; year: string; period?: string },
): Promise<ApiResult<TrialBalanceResult>> {
  const client = createApiClient(ctx);
  const query: Record<string, string> = {
    ledgerId: params.ledgerId,
    year: params.year,
  };
  if (params.period) query.period = params.period;

  return client.get<TrialBalanceResult>("/trial-balance", query);
}
