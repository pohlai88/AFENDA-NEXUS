import Link from 'next/link';
import { PageHeader } from '@/components/erp/page-header';
import { EmptyState } from '@/components/erp/empty-state';
import { getRequestContext } from '@/lib/auth';
import { handleApiError } from '@/lib/api-error.server';
import { getAccounts, type AccountType } from '@/features/finance/accounts/queries/account.queries';
import { AccountTable } from '@/features/finance/accounts/blocks/account-table';
import { List } from 'lucide-react';
import { routes } from '@/lib/constants';

export const metadata = { title: 'Chart of Accounts' };

interface AccountsPageProps {
  searchParams: Promise<{
    type?: string;
    active?: string;
    page?: string;
    limit?: string;
  }>;
}

const ACCOUNT_TYPES: { value: AccountType | undefined; label: string }[] = [
  { value: undefined, label: 'All Types' },
  { value: 'ASSET', label: 'Asset' },
  { value: 'LIABILITY', label: 'Liability' },
  { value: 'EQUITY', label: 'Equity' },
  { value: 'REVENUE', label: 'Revenue' },
  { value: 'EXPENSE', label: 'Expense' },
];

export default async function AccountsPage({ searchParams }: AccountsPageProps) {
  const params = await searchParams;
  const ctx = await getRequestContext();

  const result = await getAccounts(ctx, {
    type: params.type,
    active: params.active,
    page: params.page ?? '1',
    limit: params.limit ?? '50',
  });

  if (!result.ok) {
    handleApiError(result, 'Failed to load accounts');
  }

  const accounts = result.value.data;
  const total = result.value.total;
  const page = result.value.page;
  const limit = result.value.limit;
  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Chart of Accounts"
        description="Manage your general ledger account structure."
        breadcrumbs={[{ label: 'Finance', href: routes.finance.journals }, { label: 'Accounts' }]}
      />

      {/* Filter bar */}
      <AccountFilters currentType={params.type} currentPage={page} totalPages={totalPages} />

      {/* Data table */}
      {accounts.length > 0 && <AccountTable data={accounts} />}

      {/* Empty state */}
      {result.ok && accounts.length === 0 && (
        <EmptyState
          contentKey="finance.accounts"
          icon={List}
        />
      )}
    </div>
  );
}

// ─── Filter bar ─────────────────────────────────────────────────────────────

function AccountFilters({
  currentType,
  currentPage,
  totalPages,
}: {
  currentType?: string;
  currentPage: number;
  totalPages: number;
}) {
  function buildUrl(overrides: { type?: string; page?: number }) {
    const params = new URLSearchParams();
    const t = overrides.type ?? currentType;
    if (t) params.set('type', t);
    const p = overrides.page ?? currentPage;
    if (p > 1) params.set('page', String(p));
    const qs = params.toString();
    return qs ? `${routes.finance.accounts}?${qs}` : routes.finance.accounts;
  }

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      {/* Type tabs */}
      <div className="flex gap-1 overflow-x-auto">
        {ACCOUNT_TYPES.map((t) => {
          const isActive = t.value === currentType || (!t.value && !currentType);
          return (
            <Link
              key={t.label}
              href={buildUrl({ type: t.value, page: 1 })}
              className={`whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
              }`}
            >
              {t.label}
            </Link>
          );
        })}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          {currentPage > 1 && (
            <Link
              href={buildUrl({ page: currentPage - 1 })}
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
              href={buildUrl({ page: currentPage + 1 })}
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
