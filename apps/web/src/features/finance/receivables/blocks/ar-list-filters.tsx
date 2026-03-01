import { cn } from '@/lib/utils';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { routes } from '@/lib/constants';

// ─── AR List Filters (server-rendered links) ────────────────────────────────

interface ArListFiltersProps {
  currentStatus?: string;
  currentPage: number;
  totalPages: number;
}

const statuses = [
  { value: undefined, label: 'All' },
  { value: 'DRAFT', label: 'Draft' },
  { value: 'PENDING_APPROVAL', label: 'Pending' },
  { value: 'APPROVED', label: 'Approved' },
  { value: 'POSTED', label: 'Posted' },
  { value: 'PAID', label: 'Paid' },
  { value: 'PARTIALLY_PAID', label: 'Partial' },
  { value: 'WRITTEN_OFF', label: 'Written Off' },
  { value: 'CANCELLED', label: 'Cancelled' },
];

function buildUrl(
  currentStatus: string | undefined,
  currentPage: number,
  overrides: { status?: string; page?: number },
) {
  const params = new URLSearchParams();
  const status = overrides.status ?? currentStatus;
  if (status) params.set('status', status);
  const p = overrides.page ?? currentPage;
  if (p > 1) params.set('page', String(p));
  const qs = params.toString();
  return qs ? `${routes.finance.receivables}?${qs}` : routes.finance.receivables;
}

export function ArListFilters({ currentStatus, currentPage, totalPages }: ArListFiltersProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-wrap gap-1">
        {statuses.map((s) => {
          const isActive = s.value === currentStatus || (!s.value && !currentStatus);
          return (
            <Link
              key={s.label}
              href={buildUrl(currentStatus, currentPage, { status: s.value, page: 1 })}
              className={cn(
                'rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
              )}
            >
              {s.label}
            </Link>
          );
        })}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center gap-2">
          {currentPage > 1 && (
            <Button variant="outline" size="sm" asChild>
              <Link href={buildUrl(currentStatus, currentPage, { page: currentPage - 1 })}>
                Previous
              </Link>
            </Button>
          )}
          <span className="text-sm text-muted-foreground">
            Page {currentPage} of {totalPages}
          </span>
          {currentPage < totalPages && (
            <Button variant="outline" size="sm" asChild>
              <Link href={buildUrl(currentStatus, currentPage, { page: currentPage + 1 })}>
                Next
              </Link>
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
