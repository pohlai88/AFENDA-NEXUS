import { cn } from '@/lib/utils';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { routes } from '@/lib/constants';

const STATUSES = [
  { value: undefined, label: 'All' },
  { value: 'DRAFT', label: 'Draft' },
  { value: 'POSTED', label: 'Posted' },
  { value: 'REVERSED', label: 'Reversed' },
  { value: 'VOIDED', label: 'Voided' },
] as const;

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
  return qs ? `${routes.finance.journals}?${qs}` : routes.finance.journals;
}

export function JournalListFilters({
  currentStatus,
  currentPage,
  totalPages,
}: {
  currentStatus?: string;
  currentPage: number;
  totalPages: number;
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex gap-1">
        {STATUSES.map((s) => {
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
