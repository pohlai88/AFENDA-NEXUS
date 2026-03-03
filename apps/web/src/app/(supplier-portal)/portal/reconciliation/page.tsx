import { Suspense } from 'react';
import { getRequestContext } from '@/lib/auth';
import { getPortalSupplier } from '@/features/portal/queries/portal.queries';
import { PageHeader } from '@/components/erp/page-header';
import { PortalReconciliationPageClient } from '@/features/portal/blocks/portal-reconciliation-page-client';
import { AlertTriangle } from 'lucide-react';
import { routes } from '@/lib/constants';
import { LoadingSkeleton } from '@/components/erp/loading-skeleton';
import type { RequestContext } from '@afenda/core';

/**
 * Async child component - enables Suspense streaming
 */
async function ReconciliationContent({ ctx }: { ctx: RequestContext }) {
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

  return (
    <div className="space-y-6">
      <PageHeader
        title="Statement Reconciliation"
        description="Upload your bank statement to reconcile against the AP ledger."
        breadcrumbs={[
          { label: 'Portal', href: routes.portal.dashboard },
          { label: 'Reconciliation' },
        ]}
      />

      <PortalReconciliationPageClient
        supplierId={supplier.supplierId}
        currencyCode={supplier.currencyCode}
      />
    </div>
  );
}

export default async function PortalReconciliationPage() {
  const ctx = await getRequestContext();

  return (
    <Suspense fallback={<LoadingSkeleton />}>
      <ReconciliationContent ctx={ctx} />
    </Suspense>
  );
}
