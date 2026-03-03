import { Suspense } from 'react';
import { getRequestContext } from '@/lib/auth';
import {
  getPortalSupplier,
  getPortalEarlyPaymentOffers,
} from '@/features/portal/queries/portal.queries';
import { PageHeader } from '@/components/erp/page-header';
import { PortalEarlyPaymentOfferList } from '@/features/portal/blocks/portal-early-payment-offer-list';
import { LoadingSkeleton } from '@/components/erp/loading-skeleton';
import { AlertTriangle } from 'lucide-react';
import { routes } from '@/lib/constants';
import type { RequestContext } from '@afenda/core';

async function EarlyPaymentPageContent({ ctx }: { ctx: RequestContext }) {
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
  const result = await getPortalEarlyPaymentOffers(ctx, supplier.supplierId);

  if (!result.ok) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <AlertTriangle className="h-10 w-10 text-destructive" />
        <h2 className="mt-4 text-lg font-semibold">Error loading early payment offers</h2>
        <p className="mt-1 text-sm text-muted-foreground">{result.error.message}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumbs={[
          { label: 'Portal', href: routes.portal.dashboard },
          { label: 'Payments', href: routes.portal.payments },
          { label: 'Early Payment Offers' },
        ]}
        description="Accept early payment offers to receive funds ahead of your invoice due dates at a small discount."
      />

      <PortalEarlyPaymentOfferList data={result.value} />
    </div>
  );
}

export default async function PortalEarlyPaymentPage() {
  const ctx = await getRequestContext();

  return (
    <Suspense fallback={<LoadingSkeleton />}>
      <EarlyPaymentPageContent ctx={ctx} />
    </Suspense>
  );
}
