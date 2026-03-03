import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import type { RequestContext } from '@afenda/core';
import { PageHeader } from '@/components/erp/page-header';
import { BusinessDocument } from '@/components/erp/business-document';
import { AllocationRunDetail } from '@/features/finance/cost-accounting/blocks/allocation-run-detail';
import { getRequestContext } from '@/lib/auth';
import { handleApiError } from '@/lib/api-error.server';
import { getAllocationRunById } from '@/features/finance/cost-accounting/queries/cost-accounting.queries';
import { routes } from '@/lib/constants';
import { LoadingSkeleton } from '@/components/erp/loading-skeleton';

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const [{ id }, ctx] = await Promise.all([params, getRequestContext()]);
  const result = await getAllocationRunById(ctx, id);
  if (!result.ok) return { title: 'Allocation Run | Finance' };
  const run = result.value;
  return {
    title: `${run.runNumber} | Allocation Run | Finance`,
    description: `Allocation run ${run.runNumber} — ${run.period} — ${run.status}`,
  };
}

async function AllocationDetailContent({ ctx, id }: { ctx: RequestContext; id: string }) {
  const result = await getAllocationRunById(ctx, id);

  if (!result.ok) {
    if (result.error.statusCode === 404) notFound();
    handleApiError(result, 'Failed to load allocation run');
  }

  const run = result.value;

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Allocation Run — ${run.runNumber}`}
        breadcrumbs={[
          { label: 'Finance' },
          { label: 'Cost Accounting', href: routes.finance.costCenters },
          { label: 'Allocations', href: routes.finance.allocations },
          { label: run.runNumber },
        ]}
      />

      <BusinessDocument
        header={<AllocationRunDetail run={run} />}
        tabs={[
          {
            value: 'details',
            label: 'Details',
            content: (
              <div className="space-y-4 text-sm">
                {run.journalEntryNumber && (
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Journal Entry</h3>
                    <p className="mt-1 font-mono">{run.journalEntryNumber}</p>
                  </div>
                )}
              </div>
            ),
          },
        ]}
        defaultTab="details"
      />
    </div>
  );
}

export default async function AllocationDetailPage({ params }: Props) {
  const [{ id }, ctx] = await Promise.all([params, getRequestContext()]);

  return (
    <Suspense fallback={<LoadingSkeleton />}>
      <AllocationDetailContent ctx={ctx} id={id} />
    </Suspense>
  );
}
