import { cn } from '@/lib/utils';
import Link from 'next/link';
import { routes } from '@/lib/constants';

const STATUSES = [
  { value: undefined, label: 'All' },
  { value: 'OPEN', label: 'Open' },
  { value: 'CLOSED', label: 'Closed' },
  { value: 'LOCKED', label: 'Locked' },
] as const;

export function PeriodFilters({
  currentYear,
  currentStatus,
}: {
  currentYear: string;
  currentStatus?: string;
}) {
  const years = Array.from({ length: 5 }, (_, i) => (new Date().getFullYear() - i).toString());

  function buildUrl(overrides: { year?: string; status?: string }) {
    const params = new URLSearchParams();
    const y = overrides.year ?? currentYear;
    if (y) params.set('year', y);
    const s = overrides.status ?? currentStatus;
    if (s) params.set('status', s);
    const qs = params.toString();
    return qs ? `${routes.finance.periods}?${qs}` : routes.finance.periods;
  }

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      <div className="flex gap-1">
        {years.map((y) => {
          const isActive = y === currentYear;
          return (
            <Link
              key={y}
              href={buildUrl({ year: y, status: currentStatus })}
              className={cn(
                'rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
              )}
            >
              {y}
            </Link>
          );
        })}
      </div>

      <div className="flex gap-1">
        {STATUSES.map((s) => {
          const isActive = s.value === currentStatus || (!s.value && !currentStatus);
          return (
            <Link
              key={s.label}
              href={buildUrl({ year: currentYear, status: s.value })}
              className={cn(
                'rounded-md px-2 py-1.5 text-xs font-medium transition-colors',
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
    </div>
  );
}
