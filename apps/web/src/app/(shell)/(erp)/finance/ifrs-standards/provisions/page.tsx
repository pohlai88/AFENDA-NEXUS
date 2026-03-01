import { Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { PageHeader } from '@/components/erp/page-header';
import { getRequestContext } from '@/lib/auth';
import {
  getProvisions,
  getProvisionSummary,
} from '@/features/finance/provisions/queries/provisions.queries';
import { ProvisionsSummaryCards } from '@/features/finance/provisions/blocks/provisions-summary-cards';
import { ProvisionsGrid } from '@/features/finance/provisions/blocks/provisions-grid';
import { routes } from '@/lib/constants';

export const metadata = { title: 'Provisions (IAS 37) | Finance' };

async function SummarySection() {
  const ctx = await getRequestContext();
  const result = await getProvisionSummary(ctx);
  if (!result.ok) return <div className="text-destructive">{result.error.message}</div>;
  return <ProvisionsSummaryCards summary={result.value} />;
}

async function ProvisionsSection() {
  const ctx = await getRequestContext();
  const result = await getProvisions(ctx, { status: 'active' });
  if (!result.ok) return <div className="text-destructive">{result.error.message}</div>;
  return <ProvisionsGrid provisions={result.value.data} />;
}

export default function ProvisionsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Provisions (IAS 37)"
        description="Manage provisions, contingent liabilities, and movements."
        breadcrumbs={[
          { label: 'Finance' },
          { label: 'Provisions' },
        ]}
        actions={[
          {
            label: 'New Provision',
            href: routes.finance.provisionNew,
          },
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
      <h2 className="text-xl font-semibold">Active Provisions</h2>
      <Suspense
        fallback={
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-[180px]" />
            ))}
          </div>
        }
      >
        <ProvisionsSection />
      </Suspense>
    </div>
  );
}
