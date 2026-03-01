import { Suspense } from 'react';
import { getRequestContext } from '@/lib/auth';
import { getPortalSupplier } from '@/features/portal/queries/portal.queries';
import { PageHeader } from '@/components/erp/page-header';
import { PortalDisputeForm } from '@/features/portal/forms/portal-dispute-form';
import { AlertTriangle } from 'lucide-react';
import { routes } from '@/lib/constants';
import { LoadingSkeleton } from '@/components/erp/loading-skeleton';

export default async function PortalNewDisputePage() {
  const ctx = await getRequestContext();

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

  return (
    <Suspense fallback={<LoadingSkeleton />}>
    <div className="space-y-6">
      <PageHeader
        title="Raise Dispute"
        description="Submit a new dispute for a billing or payment issue."
        breadcrumbs={[
          { label: 'Portal', href: routes.portal.dashboard },
          { label: 'Disputes', href: routes.portal.disputes },
          { label: 'New Dispute' },
        ]}
      />

      <PortalDisputeForm supplierId={supplierResult.value.supplierId} />
    </div>
    </Suspense>
  );
}
