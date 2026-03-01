import { getRequestContext } from '@/lib/auth';
import {
  getExpenseClaims,
  getExpenseSummary,
  getExpenseLines,
} from '@/features/finance/expenses/queries/expenses.queries';
import { ExpenseSummaryCards } from '@/features/finance/expenses/blocks/expense-summary-cards';
import { ClaimsTable } from '@/features/finance/expenses/blocks/claims-table';
import { ExpenseLinesTable } from '@/features/finance/expenses/blocks/expense-detail';

export async function ExpenseSummarySection() {
  const ctx = await getRequestContext();
  const result = await getExpenseSummary(ctx);
  if (!result.ok) throw new Error(result.error.message);
  return <ExpenseSummaryCards summary={result.value} />;
}

export async function ExpenseClaimsSection({ status }: { status?: string }) {
  const ctx = await getRequestContext();
  const result = await getExpenseClaims(ctx, { status });
  if (!result.ok) throw new Error(result.error.message);
  const { data, total, page, limit } = result.value;
  return (
    <ClaimsTable
      claims={data}
      pagination={{ page, perPage: limit, total, totalPages: Math.ceil(total / limit) }}
    />
  );
}

export async function ExpenseLinesSection({ claimId }: { claimId: string }) {
  const ctx = await getRequestContext();
  const result = await getExpenseLines(ctx, claimId);
  if (!result.ok) return <p className="text-sm text-destructive">Failed to load expense lines</p>;
  return <ExpenseLinesTable lines={result.value.data} />;
}
