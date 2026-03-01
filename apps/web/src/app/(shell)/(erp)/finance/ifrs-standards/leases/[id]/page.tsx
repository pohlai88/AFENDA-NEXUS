import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { Suspense } from 'react';
import { PageHeader } from '@/components/erp/page-header';
import { BusinessDocument } from '@/components/erp/business-document';
import { getRequestContext } from '@/lib/auth';
import { getLeaseById } from '@/features/finance/leases/queries/leases.queries';
import { LeaseDetailHeader, LeaseOverview } from '@/features/finance/leases/blocks/lease-detail';
import { LeaseScheduleSection, LeaseModificationsSection } from '@/features/finance/leases/blocks/lease-sections';
import { routes } from '@/lib/constants';
import { Skeleton } from '@/components/ui/skeleton';

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const ctx = await getRequestContext();
  const result = await getLeaseById(ctx, id);
  if (!result.ok) return { title: 'Lease | Finance' };
  return { title: `${result.data.leaseNumber} | Leases` };
}

export default async function LeaseDetailPage({ params }: Props) {
  const { id } = await params;
  const ctx = await getRequestContext();
  const result = await getLeaseById(ctx, id);

  if (!result.ok) {
    if (result.error.includes('not found') || result.error.includes('Not found')) notFound();
    throw new Error(result.error);
  }

  const lease = result.data;

  return (
    <div className="space-y-6">
      <PageHeader
        title={`${lease.leaseNumber} — ${lease.assetDescription}`}
        breadcrumbs={[
          { label: 'Finance' },
          { label: 'Leases', href: routes.finance.leases },
          { label: lease.leaseNumber },
        ]}
      />
      <BusinessDocument
        header={<LeaseDetailHeader lease={lease} />}
        tabs={[
          { value: 'overview', label: 'Overview', content: <LeaseOverview lease={lease} /> },
          {
            value: 'schedule',
            label: 'Payment Schedule',
            content: (
              <Suspense fallback={<Skeleton className="h-48 w-full" />}>
                <LeaseScheduleSection leaseId={lease.id} />
              </Suspense>
            ),
          },
          {
            value: 'modifications',
            label: 'Modifications',
            content: (
              <Suspense fallback={<Skeleton className="h-48 w-full" />}>
                <LeaseModificationsSection leaseId={lease.id} />
              </Suspense>
            ),
          },
        ]}
      />
    </div>
  );
}
