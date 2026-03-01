import { cn } from '@/lib/utils';
import Link from 'next/link';
import { routes } from '@/lib/constants';

const STATUSES = [
  { value: undefined, label: 'All' },
  { value: 'DRAFT', label: 'Draft' },
  { value: 'PENDING_APPROVAL', label: 'Pending' },
  { value: 'APPROVED', label: 'Approved' },
  { value: 'POSTED', label: 'Posted' },
  { value: 'PAID', label: 'Paid' },
  { value: 'PARTIALLY_PAID', label: 'Partial' },
  { value: 'CANCELLED', label: 'Cancelled' },
] as const;

export function ApStatusFilters({ currentStatus }: { currentStatus?: string }) {
  return (
    <div className="flex flex-wrap gap-1">
      {STATUSES.map((s) => {
        const isActive = s.value === currentStatus || (!s.value && !currentStatus);
        const params = new URLSearchParams();
        if (s.value) params.set('status', s.value);
        const qs = params.toString();
        const href = qs ? `${routes.finance.payables}?${qs}` : routes.finance.payables;
        return (
          <Link
            key={s.label}
            href={href}
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
  );
}
