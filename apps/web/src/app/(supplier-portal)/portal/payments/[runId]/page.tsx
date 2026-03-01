import { Suspense } from 'react';
import { getRequestContext } from '@/lib/auth';
import { getPortalSupplier, getPortalRemittance } from '@/features/portal/queries/portal.queries';
import { PageHeader } from '@/components/erp/page-header';
import { BusinessDocument } from '@/components/erp/business-document';
import { PortalRemittanceView } from '@/features/portal/blocks/portal-remittance-view';
import { AlertTriangle } from 'lucide-react';
import { notFound } from 'next/navigation';
import { routes } from '@/lib/constants';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { LoadingSkeleton } from '@/components/erp/loading-skeleton';

interface Props {
  params: Promise<{ runId: string }>;
}

export default async function PortalPaymentDetailPage({ params }: Props) {
  const [{ runId }, ctx] = await Promise.all([params, getRequestContext()]);

  const supplierResult = await getPortalSupplier(ctx);
  if (!supplierResult.ok) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <AlertTriangle className="h-10 w-10 text-destructive" />
        <h2 className="mt-4 text-lg font-semibold">Unable to load supplier profile</h2>
        <p className="mt-1 text-sm text-muted-foreground">{supplierResult.error.message}</p>
      </div>
    );
  }

  const supplier = supplierResult.value;
  const result = await getPortalRemittance(ctx, supplier.supplierId, runId);

  if (!result.ok) {
    if (result.error.statusCode === 404) notFound();
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <AlertTriangle className="h-10 w-10 text-destructive" />
        <h2 className="mt-4 text-lg font-semibold">Error loading payment run</h2>
        <p className="mt-1 text-sm text-muted-foreground">{result.error.message}</p>
      </div>
    );
  }

  const remittance = result.value;

  return (
    <Suspense fallback={<LoadingSkeleton />}>
    <div className="space-y-6">
      <PageHeader
        breadcrumbs={[
          { label: 'Portal', href: routes.portal.dashboard },
          { label: 'Payments', href: routes.portal.payments },
          { label: remittance.runNumber },
        ]}
        actions={
          <Button asChild variant="outline">
            <Link href={routes.portal.remittance(runId)}>View Remittance Advice</Link>
          </Button>
        }
      />

      <BusinessDocument
        header={
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold tracking-tight">
                  Payment Run {remittance.runNumber}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {remittance.runDate} &middot; {remittance.supplierName}
                </p>
              </div>
            </div>
          </div>
        }
        tabs={[
          {
            value: 'remittance',
            label: 'Remittance Details',
            content: <PortalRemittanceView remittance={remittance} />,
          },
        ]}
      />
    </div>
    </Suspense>
  );
}
