import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { layoutTokens } from '@/lib/layout-tokens';
import { getRequestContext } from '@/lib/auth';
import {
  getCostCenters,
  getCostDrivers,
  getAllocationRuns,
  getCostAccountingSummary,
} from '@/features/finance/cost-accounting/queries/cost-accounting.queries';
import { CostCenterTree } from '@/features/finance/cost-accounting/blocks/cost-center-tree';
import { CostDriversTable } from '@/features/finance/cost-accounting/blocks/cost-drivers-table';
import { AllocationRunsTable } from '@/features/finance/cost-accounting/blocks/allocation-runs-table';
import { CostSummaryCards } from '@/features/finance/cost-accounting/blocks/cost-summary-cards';

// ─── Skeletons ───────────────────────────────────────────────────────────────

export function SummarySkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
      {Array.from({ length: 6 }).map((_, i) => (
        // eslint-disable-next-line react/no-array-index-key -- Static skeleton fallback
        <Skeleton key={`skeleton-${i}`} className={layoutTokens.skeletonRow} />
      ))}
    </div>
  );
}

export function TreeSkeleton() {
  return <Skeleton className={layoutTokens.skeletonChart} />;
}

export function TableSkeleton() {
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

// ─── Async server components ─────────────────────────────────────────────────

export async function SummarySection() {
  const ctx = await getRequestContext();
  const result = await getCostAccountingSummary(ctx);
  if (!result.ok) {
    return <div className="text-destructive">Failed to load summary.</div>;
  }
  return <CostSummaryCards summary={result.value as never} />;
}

export async function TreeSection() {
  const ctx = await getRequestContext();
  const result = await getCostCenters(ctx);
  if (!result.ok) {
    return <div className="text-destructive">Failed to load cost centers.</div>;
  }
  return <CostCenterTree costCenters={result.value.data as never[]} />;
}

export async function DriversSection() {
  const ctx = await getRequestContext();
  const result = await getCostDrivers(ctx);
  if (!result.ok) {
    return <div className="text-destructive">Failed to load drivers.</div>;
  }
  return <CostDriversTable drivers={result.value.data as never[]} />;
}

export async function AllocationsSection() {
  const ctx = await getRequestContext();
  const result = await getAllocationRuns(ctx);
  if (!result.ok) {
    return <div className="text-destructive">Failed to load allocations.</div>;
  }
  return <AllocationRunsTable runs={result.value.data as never[]} />;
}
