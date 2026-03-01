import { Plus } from 'lucide-react';
import Link from 'next/link';
import { routes } from '@/lib/constants';
import { UpsertBudgetEntryForm } from '@/features/finance/budgets/forms/upsert-budget-entry-form';

interface BudgetCreateSectionProps {
  defaultValues?: { ledgerId?: string; periodId?: string };
}

export function BudgetCreateSection({ defaultValues }: BudgetCreateSectionProps) {
  return (
    <details className="rounded-md border p-4">
      <summary className="flex cursor-pointer items-center gap-2 text-sm font-medium">
        <Plus className="h-4 w-4" />
        Add Budget Entry
      </summary>
      <div className="mt-4">
        <UpsertBudgetEntryForm defaultValues={defaultValues} />
      </div>
    </details>
  );
}

interface BudgetPaginationProps {
  page: number;
  totalPages: number;
  total: number;
  ledgerId: string;
  periodId: string;
}

export function BudgetPagination({ page, totalPages, total, ledgerId, periodId }: BudgetPaginationProps) {
  if (totalPages <= 1) return null;
  return (
    <div className="flex items-center justify-between text-sm text-muted-foreground">
      <span>Page {page} of {totalPages} ({total} entries)</span>
      <div className="flex gap-2">
        {page > 1 && (
          <Link href={`${routes.finance.budgetEntries}?ledgerId=${ledgerId}&periodId=${periodId}&page=${page - 1}`} className="rounded-md border px-3 py-1.5 hover:bg-muted">Previous</Link>
        )}
        {page < totalPages && (
          <Link href={`${routes.finance.budgetEntries}?ledgerId=${ledgerId}&periodId=${periodId}&page=${page + 1}`} className="rounded-md border px-3 py-1.5 hover:bg-muted">Next</Link>
        )}
      </div>
    </div>
  );
}
