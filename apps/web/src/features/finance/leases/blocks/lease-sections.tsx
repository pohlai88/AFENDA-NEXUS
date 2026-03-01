import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { layoutTokens } from '@/lib/layout-tokens';
import { getRequestContext } from '@/lib/auth';
import {
  getLeases,
  getLeaseSummary,
  getLeaseSchedule,
  getLeaseModifications,
} from '@/features/finance/leases/queries/leases.queries';
import { LeasesTable } from '@/features/finance/leases/blocks/leases-table';
import { LeaseSummaryCards } from '@/features/finance/leases/blocks/lease-summary-cards';
import { LeasePaymentSchedule, LeaseModificationsTable } from '@/features/finance/leases/blocks/lease-detail';

export function LeaseSummarySkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
      {Array.from({ length: 6 }).map((_, i) => (
        // eslint-disable-next-line react/no-array-index-key -- Static skeleton fallback
        <Skeleton key={`skeleton-${i}`} className={layoutTokens.skeletonRow} />
      ))}
    </div>
  );
}

export function LeaseTableSkeleton() {
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

export async function LeaseSummarySection() {
  const ctx = await getRequestContext();
  const result = await getLeaseSummary(ctx);
  if (!result.ok) return <div className="text-destructive">{result.error}</div>;
  return <LeaseSummaryCards summary={result.data} />;
}

export async function LeasesListSection({ status }: { status?: string }) {
  const ctx = await getRequestContext();
  const result = await getLeases(ctx, { status });
  if (!result.ok) return <div className="text-destructive">{result.error}</div>;
  return <LeasesTable leases={result.data} />;
}

export async function LeaseScheduleSection({ leaseId }: { leaseId: string }) {
  const ctx = await getRequestContext();
  const result = await getLeaseSchedule(ctx, leaseId);
  if (!result.ok) return <p className="text-sm text-destructive">{result.error}</p>;
  return <LeasePaymentSchedule entries={result.data} />;
}

export async function LeaseModificationsSection({ leaseId }: { leaseId: string }) {
  const ctx = await getRequestContext();
  const result = await getLeaseModifications(ctx, leaseId);
  if (!result.ok) return <p className="text-sm text-destructive">{result.error}</p>;
  return <LeaseModificationsTable modifications={result.data} />;
}
