import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { Suspense } from 'react';
import { PageHeader } from '@/components/erp/page-header';
import { BusinessDocument } from '@/components/erp/business-document';
import { getRequestContext } from '@/lib/auth';
import { handleApiError } from '@/lib/api-error.server';
import { getRevenueContract } from '@/features/finance/revenue-recognition/queries/revenue.queries';
import { Skeleton } from '@/components/ui/skeleton';
import { ContractHeader, ContractOverview, MilestonesSection } from '@/features/finance/revenue-recognition/blocks/contract-detail-blocks';
import { routes } from '@/lib/constants';

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const ctx = await getRequestContext();
  const result = await getRevenueContract(ctx, id);
  if (!result.ok) return { title: 'Revenue Contract | Finance' };
  return { title: `${result.value.contractNumber} | Revenue Recognition` };
}

export default async function RevenueContractDetailPage({ params }: Props) {
  const { id } = await params;
  const ctx = await getRequestContext();
  const result = await getRevenueContract(ctx, id);

  if (!result.ok) {
    if (result.error.statusCode === 404) notFound();
    handleApiError(result, 'Failed to load revenue contract');
  }

  const contract = result.value;

  return (
    <div className="space-y-6">
      <PageHeader
        title={`${contract.contractNumber} — ${contract.customerName}`}
        breadcrumbs={[
          { label: 'Finance' },
          { label: 'Revenue Recognition', href: routes.finance.revenueRecognition },
          { label: contract.contractNumber },
        ]}
      />
      <BusinessDocument
        header={<ContractHeader contract={contract} />}
        tabs={[
          { value: 'overview', label: 'Overview', content: <ContractOverview contract={contract} /> },
          {
            value: 'milestones',
            label: 'Milestones',
            content: (
              <Suspense fallback={<Skeleton className="h-48 w-full" />}>
                <MilestonesSection contractId={contract.id} />
              </Suspense>
            ),
          },
        ]}
      />
    </div>
  );
}
