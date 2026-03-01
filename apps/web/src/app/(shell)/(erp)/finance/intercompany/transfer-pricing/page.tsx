import { Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { PageHeader } from '@/components/erp/page-header';
import { getRequestContext } from '@/lib/auth';
import {
  getTransferPricingPolicies,
  getTransferPricingSummary,
} from '@/features/finance/transfer-pricing/queries/transfer-pricing.queries';
import { TransferPricingSummaryCards } from '@/features/finance/transfer-pricing/blocks/transfer-pricing-summary-cards';
import { PoliciesGrid } from '@/features/finance/transfer-pricing/blocks/policies-grid';
import { routes } from '@/lib/constants';

export const metadata = { title: 'Transfer Pricing' };

async function SummarySection() {
  const ctx = await getRequestContext();
  const result = await getTransferPricingSummary(ctx);
  if (!result.ok) return <div className="text-destructive">{result.error.message}</div>;
  return <TransferPricingSummaryCards summary={result.value} />;
}

async function PoliciesSection() {
  const ctx = await getRequestContext();
  const result = await getTransferPricingPolicies(ctx, { status: 'active' });
  if (!result.ok) return <div className="text-destructive">{result.error.message}</div>;
  return <PoliciesGrid policies={result.value.data ?? result.value} />;
}

export default function TransferPricingPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Transfer Pricing"
        description="Intercompany pricing policies and benchmarks"
        primaryAction={{ label: 'New Policy', href: routes.finance.transferPricingNew }}
        breadcrumbs={[
          { label: 'Finance', href: routes.finance.root },
          { label: 'Transfer Pricing' },
        ]}
      />
      <Suspense
        fallback={
          <div className="grid gap-4 md:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-[100px]" />
            ))}
          </div>
        }
      >
        <SummarySection />
      </Suspense>
      <h2 className="text-xl font-semibold">Active Policies</h2>
      <Suspense
        fallback={
          <div className="grid gap-4 md:grid-cols-2">
            {Array.from({ length: 2 }).map((_, i) => (
              <Skeleton key={i} className="h-[200px]" />
            ))}
          </div>
        }
      >
        <PoliciesSection />
      </Suspense>
    </div>
  );
}
