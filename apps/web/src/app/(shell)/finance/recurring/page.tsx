import Link from 'next/link';
import { PageHeader } from '@/components/erp/page-header';
import { EmptyState } from '@/components/erp/empty-state';
import { getRequestContext } from '@/lib/auth';
import { handleApiError } from '@/lib/api-error.server';
import { getRecurringTemplates } from '@/features/finance/recurring/queries/recurring.queries';
import { RecurringTemplateTable } from '@/features/finance/recurring/blocks/recurring-template-table';
import { routes } from '@/lib/constants';
import { Button } from '@/components/ui/button';
import { RefreshCw, Plus } from 'lucide-react';

export const metadata = { title: 'Recurring Templates' };

interface RecurringPageProps {
  searchParams: Promise<{
    active?: string;
    page?: string;
    limit?: string;
  }>;
}

export default async function RecurringPage({ searchParams }: RecurringPageProps) {
  const params = await searchParams;
  const ctx = await getRequestContext();

  const result = await getRecurringTemplates(ctx, {
    active: params.active,
    page: params.page ?? '1',
    limit: params.limit ?? '25',
  });

  if (!result.ok) {
    handleApiError(result, 'Failed to load recurring templates');
  }

  const templates = result.value.data;
  const { total, page, limit } = result.value;
  const totalPages = Math.ceil(total / limit);

  // Filter tabs
  const filters = [
    { label: 'All', value: undefined },
    { label: 'Active', value: 'true' },
    { label: 'Inactive', value: 'false' },
  ] as const;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Recurring Templates"
        description="Manage recurring journal templates for scheduled postings."
        breadcrumbs={[
          { label: 'Finance', href: routes.finance.journals },
          { label: 'Recurring Templates' },
        ]}
        actions={
          <Button asChild>
            <Link href={routes.finance.recurringNew}>
              <Plus className="mr-2 h-4 w-4" aria-hidden="true" />
              Create Template
            </Link>
          </Button>
        }
      />

      {/* Filter tabs */}
      <div className="flex gap-2">
        {filters.map((f) => {
          const isActive = (params.active ?? undefined) === f.value;
          const href = f.value
            ? `${routes.finance.recurring}?active=${f.value}`
            : routes.finance.recurring;
          return (
            <Link
              key={f.label}
              href={href}
              className={`rounded-md border px-3 py-1.5 text-sm font-medium transition-colors ${
                isActive
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-border hover:bg-muted'
              }`}
            >
              {f.label}
            </Link>
          );
        })}
      </div>

      {/* Table */}
      {templates.length === 0 ? (
        <EmptyState
          contentKey="finance.recurring"
          icon={RefreshCw}
        />
      ) : (
        <RecurringTemplateTable data={templates} />
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            Page {page} of {totalPages} ({total} templates)
          </span>
          <div className="flex gap-2">
            {page > 1 && (
              <Link
                href={`${routes.finance.recurring}?page=${page - 1}${params.active ? `&active=${params.active}` : ''}`}
                className="rounded-md border px-3 py-1.5 hover:bg-muted"
              >
                Previous
              </Link>
            )}
            {page < totalPages && (
              <Link
                href={`${routes.finance.recurring}?page=${page + 1}${params.active ? `&active=${params.active}` : ''}`}
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
