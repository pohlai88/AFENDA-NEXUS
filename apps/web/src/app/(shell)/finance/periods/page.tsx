import Link from 'next/link';
import { PageHeader } from '@/components/erp/page-header';
import { EmptyState } from '@/components/erp/empty-state';
import { getRequestContext } from '@/lib/auth';
import { handleApiError } from '@/lib/api-error.server';
import { getPeriods, type PeriodListItem } from '@/features/finance/periods/queries/period.queries';
import { PeriodTable } from '@/features/finance/periods/blocks/period-table';
import { Calendar } from 'lucide-react';

export const metadata = { title: 'Fiscal Periods' };

interface PeriodsPageProps {
  searchParams: Promise<{
    year?: string;
    status?: string;
    page?: string;
    limit?: string;
  }>;
}

export default async function PeriodsPage({ searchParams }: PeriodsPageProps) {
  const params = await searchParams;
  const ctx = await getRequestContext();

  const currentYear = params.year ?? new Date().getFullYear().toString();

  const result = await getPeriods(ctx, {
    year: currentYear,
    status: params.status,
    page: params.page ?? '1',
    limit: params.limit ?? '13',
  });

  if (!result.ok) {
    handleApiError(result, 'Failed to load periods');
  }

  const periods = result.value.data;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Fiscal Periods"
        description="Manage fiscal year periods — open, close, and lock."
        breadcrumbs={[{ label: 'Finance', href: '/finance/journals' }, { label: 'Periods' }]}
      />

      {/* Filters */}
      <PeriodFilters currentYear={currentYear} currentStatus={params.status} />

      {/* Data table */}
      {periods.length > 0 && <PeriodTable data={periods} />}

      {/* Empty state */}
      {periods.length === 0 && (
        <EmptyState
          title="No periods found"
          description="No fiscal periods found for the selected year."
          icon={Calendar}
        />
      )}
    </div>
  );
}

// ─── Filter bar (server-rendered links for zero JS) ─────────────────────────

function PeriodFilters({
  currentYear,
  currentStatus,
}: {
  currentYear: string;
  currentStatus?: string;
}) {
  const years = Array.from({ length: 5 }, (_, i) => (new Date().getFullYear() - i).toString());

  const statuses = [
    { value: undefined, label: 'All' },
    { value: 'OPEN', label: 'Open' },
    { value: 'CLOSED', label: 'Closed' },
    { value: 'LOCKED', label: 'Locked' },
  ];

  function buildUrl(overrides: { year?: string; status?: string }) {
    const params = new URLSearchParams();
    const y = overrides.year ?? currentYear;
    if (y) params.set('year', y);
    const s = overrides.status ?? currentStatus;
    if (s) params.set('status', s);
    const qs = params.toString();
    return qs ? `/finance/periods?${qs}` : '/finance/periods';
  }

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      {/* Year tabs */}
      <div className="flex gap-1">
        {years.map((y) => {
          const isActive = y === currentYear;
          return (
            <Link
              key={y}
              href={buildUrl({ year: y, status: currentStatus })}
              className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
              }`}
            >
              {y}
            </Link>
          );
        })}
      </div>

      {/* Status tabs */}
      <div className="flex gap-1">
        {statuses.map((s) => {
          const isActive = s.value === currentStatus || (!s.value && !currentStatus);
          return (
            <Link
              key={s.label}
              href={buildUrl({ year: currentYear, status: s.value })}
              className={`rounded-md px-2 py-1.5 text-xs font-medium transition-colors ${
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
              }`}
            >
              {s.label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
