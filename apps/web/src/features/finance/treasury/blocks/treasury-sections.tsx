import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { layoutTokens } from '@/lib/layout-tokens';
import { getRequestContext } from '@/lib/auth';
import {
  getCovenants,
  getIntercompanyLoans,
  getTreasurySummary,
} from '@/features/finance/treasury/queries/treasury.queries';
import { TreasurySummaryCards } from '@/features/finance/treasury/blocks/treasury-summary-cards';
import { CovenantsTable } from '@/features/finance/treasury/blocks/covenants-table';
import { ICLoansTable } from '@/features/finance/treasury/blocks/ic-loans-table';

export function TreasurySummarySkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
      {Array.from({ length: 6 }).map((_, i) => (
        // eslint-disable-next-line react/no-array-index-key -- Static skeleton fallback
        <Skeleton key={`skeleton-${i}`} className={layoutTokens.skeletonRow} />
      ))}
    </div>
  );
}

export function TreasuryTableSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex justify-between">
        <Skeleton className={cn('h-10', layoutTokens.selectWidthLg)} />
        <Skeleton className={cn('h-10', layoutTokens.colActions)} />
      </div>
      <Skeleton className={layoutTokens.skeletonTable} />
    </div>
  );
}

export async function TreasurySummarySection() {
  const ctx = await getRequestContext();
  const result = await getTreasurySummary(ctx);
  if (!result.ok) return <div className="text-destructive">{result.error.message}</div>;
  return <TreasurySummaryCards summary={result.value} />;
}

export async function CovenantsSection() {
  const ctx = await getRequestContext();
  const result = await getCovenants(ctx);
  if (!result.ok) return <div className="text-destructive">{result.error.message}</div>;
  return <CovenantsTable covenants={result.value.data ?? result.value} />;
}

export async function LoansSection() {
  const ctx = await getRequestContext();
  const result = await getIntercompanyLoans(ctx);
  if (!result.ok) return <div className="text-destructive">{result.error.message}</div>;
  return <ICLoansTable loans={result.value.data ?? result.value} />;
}
