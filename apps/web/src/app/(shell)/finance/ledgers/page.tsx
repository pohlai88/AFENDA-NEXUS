import Link from 'next/link';
import { PageHeader } from '@/components/erp/page-header';
import { EmptyState } from '@/components/erp/empty-state';
import { getRequestContext } from '@/lib/auth';
import { handleApiError } from '@/lib/api-error.server';
import { getLedgers } from '@/features/finance/ledgers/queries/ledger.queries';
import { LedgerTable } from '@/features/finance/ledgers/blocks/ledger-table';
import { BookOpen } from 'lucide-react';
import { routes } from '@/lib/constants';

export const metadata = { title: 'Ledgers' };

interface LedgersPageProps {
  searchParams: Promise<{
    page?: string;
    limit?: string;
  }>;
}

export default async function LedgersPage({ searchParams }: LedgersPageProps) {
  const params = await searchParams;
  const ctx = await getRequestContext();

  const result = await getLedgers(ctx, {
    page: params.page ?? '1',
    limit: params.limit ?? '25',
  });

  if (!result.ok) {
    handleApiError(result, 'Failed to load ledgers');
  }

  const ledgers = result.value.data;
  const { total, page, limit } = result.value;
  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Ledgers"
        description="Manage general ledgers for each company entity."
        breadcrumbs={[{ label: 'Finance', href: routes.finance.journals }, { label: 'Ledgers' }]}
      />

      {ledgers.length === 0 ? (
        <EmptyState
          contentKey="finance.ledgers"
          icon={BookOpen}
        />
      ) : (
        <LedgerTable data={ledgers} />
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            Page {page} of {totalPages} ({total} ledgers)
          </span>
          <div className="flex gap-2">
            {page > 1 && (
              <Link
                href={`/finance/ledgers?page=${page - 1}`}
                className="rounded-md border px-3 py-1.5 hover:bg-muted"
              >
                Previous
              </Link>
            )}
            {page < totalPages && (
              <Link
                href={`/finance/ledgers?page=${page + 1}`}
                className="rounded-md border px-3 py-1.5 hover:bg-muted"
              >
                Next
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
