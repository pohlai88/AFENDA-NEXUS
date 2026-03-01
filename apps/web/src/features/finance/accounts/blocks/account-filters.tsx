import { cn } from '@/lib/utils';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { routes } from '@/lib/constants';
import type { AccountType } from '../queries/account.queries';

// ─── Account Filters (server-rendered links) ────────────────────────────────

interface AccountFiltersProps {
  currentType?: string;
  currentPage: number;
  totalPages: number;
}

const ACCOUNT_TYPES: { value: AccountType | undefined; label: string }[] = [
  { value: undefined, label: 'All Types' },
  { value: 'ASSET', label: 'Asset' },
  { value: 'LIABILITY', label: 'Liability' },
  { value: 'EQUITY', label: 'Equity' },
  { value: 'REVENUE', label: 'Revenue' },
  { value: 'EXPENSE', label: 'Expense' },
];

function buildUrl(
  currentType: string | undefined,
  currentPage: number,
  overrides: { type?: string; page?: number },
) {
  const params = new URLSearchParams();
  const t = overrides.type ?? currentType;
  if (t) params.set('type', t);
  const p = overrides.page ?? currentPage;
  if (p > 1) params.set('page', String(p));
  const qs = params.toString();
  return qs ? `${routes.finance.accounts}?${qs}` : routes.finance.accounts;
}

export function AccountFilters({ currentType, currentPage, totalPages }: AccountFiltersProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex gap-1 overflow-x-auto">
        {ACCOUNT_TYPES.map((t) => {
          const isActive = t.value === currentType || (!t.value && !currentType);
          return (
            <Link
              key={t.label}
              href={buildUrl(currentType, currentPage, { type: t.value, page: 1 })}
              className={cn(
                'whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
              )}
            >
              {t.label}
            </Link>
          );
        })}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          {currentPage > 1 && (
            <Link
              href={buildUrl(currentType, currentPage, { page: currentPage - 1 })}
              className="rounded-md border px-3 py-1 hover:bg-accent"
            >
              Previous
            </Link>
          )}
          <span>
            Page {currentPage} of {totalPages}
          </span>
          {currentPage < totalPages && (
            <Link
              href={buildUrl(currentType, currentPage, { page: currentPage + 1 })}
              className="rounded-md border px-3 py-1 hover:bg-accent"
            >
              Next
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
