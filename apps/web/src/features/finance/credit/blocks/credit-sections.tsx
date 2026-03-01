import { Skeleton } from '@/components/ui/skeleton';
import { getRequestContext } from '@/lib/auth';
import {
  getCustomerCredits,
  getCreditHolds,
  getCreditSummary,
} from '@/features/finance/credit/queries/credit.queries';
import { CreditSummaryCards } from '@/features/finance/credit/blocks/credit-summary-cards';
import { CustomerCreditsTable } from '@/features/finance/credit/blocks/customer-credits-table';
import { CreditHoldsTable } from '@/features/finance/credit/blocks/credit-holds-table';

export function CreditSummarySkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
      {Array.from({ length: 6 }).map((_, i) => (
        <Skeleton key={i} className="h-[100px]" />
      ))}
    </div>
  );
}

export function CreditTableSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex justify-between">
        <Skeleton className="h-10 w-[300px]" />
        <Skeleton className="h-10 w-[120px]" />
      </div>
      <Skeleton className="h-[350px]" />
    </div>
  );
}

export async function CreditSummarySection() {
  const ctx = await getRequestContext();
  const result = await getCreditSummary(ctx);
  if (!result.ok) {
    return <div className="text-destructive">{result.error.message}</div>;
  }
  return <CreditSummaryCards summary={result.value} />;
}

export async function CreditsSection({ status }: { status?: string }) {
  const ctx = await getRequestContext();
  const result = await getCustomerCredits(ctx, { status });
  if (!result.ok) {
    return <div className="text-destructive">{result.error.message}</div>;
  }
  return <CustomerCreditsTable credits={result.value.data} />;
}

export async function CreditHoldsSection() {
  const ctx = await getRequestContext();
  const result = await getCreditHolds(ctx, { status: 'active' });
  if (!result.ok) {
    return <div className="text-destructive">{result.error.message}</div>;
  }
  return <CreditHoldsTable holds={result.value.data} />;
}
