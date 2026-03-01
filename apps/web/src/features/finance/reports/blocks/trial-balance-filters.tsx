import { cn } from '@/lib/utils';
import { routes } from '@/lib/constants';

interface TrialBalanceFiltersProps {
  currentYear: string;
  currentPeriod?: string;
  ledgerId: string;
}

export function TrialBalanceFilters({
  currentYear,
  currentPeriod,
  ledgerId,
}: TrialBalanceFiltersProps) {
  const years = Array.from({ length: 5 }, (_, i) => (new Date().getFullYear() - i).toString());

  const periods = [
    { value: undefined as string | undefined, label: 'Full Year' },
    ...Array.from({ length: 12 }, (_, i) => ({
      value: String(i + 1),
      label: `P${i + 1}`,
    })),
  ];

  function buildUrl(overrides: { year?: string; period?: string }) {
    const params = new URLSearchParams();
    if (ledgerId) params.set('ledgerId', ledgerId);
    const y = overrides.year ?? currentYear;
    if (y) params.set('year', y);
    const p = overrides.period ?? currentPeriod;
    if (p) params.set('period', p);
    const qs = params.toString();
    return qs ? `${routes.finance.trialBalance}?${qs}` : routes.finance.trialBalance;
  }

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      <div className="flex gap-1">
        {years.map((y) => {
          const isActive = y === currentYear;
          return (
            <a
              key={y}
              href={buildUrl({ year: y, period: currentPeriod })}
              className={cn(
                'rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
              )}
            >
              {y}
            </a>
          );
        })}
      </div>
      <div className="flex gap-1 overflow-x-auto">
        {periods.map((p) => {
          const isActive = p.value === currentPeriod || (!p.value && !currentPeriod);
          return (
            <a
              key={p.label}
              href={buildUrl({ year: currentYear, period: p.value })}
              className={cn(
                'whitespace-nowrap rounded-md px-2 py-1.5 text-xs font-medium transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
              )}
            >
              {p.label}
            </a>
          );
        })}
      </div>
    </div>
  );
}
