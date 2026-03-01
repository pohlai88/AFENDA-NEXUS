import { cn } from '@/lib/utils';
import Link from 'next/link';
import { routes } from '@/lib/constants';

const FILTERS = [
  { label: 'All', value: undefined },
  { label: 'Active', value: 'true' },
  { label: 'Inactive', value: 'false' },
] as const;

export function RecurringListFilters({
  currentActive,
  currentPage,
  totalPages,
  total,
}: {
  currentActive?: string;
  currentPage: number;
  totalPages: number;
  total: number;
}) {
  return (
    <>
      <div className="flex gap-2">
        {FILTERS.map((f) => {
          const isActive = (currentActive ?? undefined) === f.value;
          const href = f.value
            ? `${routes.finance.recurring}?active=${f.value}`
            : routes.finance.recurring;
          return (
            <Link
              key={f.label}
              href={href}
              className={cn(
                'rounded-md border px-3 py-1.5 text-sm font-medium transition-colors',
                isActive
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-border hover:bg-muted',
              )}
            >
              {f.label}
            </Link>
          );
        })}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            Page {currentPage} of {totalPages} ({total} templates)
          </span>
          <div className="flex gap-2">
            {currentPage > 1 && (
              <Link
                href={`${routes.finance.recurring}?page=${currentPage - 1}${currentActive ? `&active=${currentActive}` : ''}`}
                className="rounded-md border px-3 py-1.5 hover:bg-muted"
              >
                Previous
              </Link>
            )}
            {currentPage < totalPages && (
              <Link
                href={`${routes.finance.recurring}?page=${currentPage + 1}${currentActive ? `&active=${currentActive}` : ''}`}
                className="rounded-md border px-3 py-1.5 hover:bg-muted"
              >
                Next
              </Link>
            )}
          </div>
        </div>
      )}
    </>
  );
}
