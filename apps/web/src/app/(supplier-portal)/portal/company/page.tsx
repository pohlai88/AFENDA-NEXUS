import { Suspense } from 'react';
import { getRequestContext } from '@/lib/auth';
import { getPortalSupplier, getPortalLocations } from '@/features/portal/queries/portal.queries';
import { PageHeader } from '@/components/erp/page-header';
import { PortalLocationCards } from '@/features/portal/blocks/portal-location-cards';
import { AlertTriangle } from 'lucide-react';
import { routes } from '@/lib/constants';
import { LoadingSkeleton } from '@/components/erp/loading-skeleton';
import type { LocationType } from '@/features/portal/queries/portal.queries';
import type { RequestContext } from '@afenda/core';

interface PortalCompanyLocationPageProps {
  searchParams: Promise<{ locationType?: LocationType }>;
}

async function CompanyPageContent({
  ctx,
  locationType,
}: {
  ctx: RequestContext;
  locationType?: LocationType;
}) {
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
  const result = await getPortalLocations(ctx, supplier.supplierId, {
    locationType,
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Company Locations"
        description="View our office, warehouse, and billing addresses for reference on invoices and delivery documentation."
        breadcrumbs={[
          { label: 'Portal', href: routes.portal.dashboard },
          { label: 'Company Locations' },
        ]}
      />

      {result.ok ? (
        result.value.length > 0 ? (
          <PortalLocationCards locations={result.value} />
        ) : (
          <div className="rounded-lg border border-dashed p-12 text-center">
            <p className="text-sm text-muted-foreground">
              No company locations are currently available.
            </p>
          </div>
        )
      ) : (
        <div className="rounded-lg border border-dashed p-12 text-center">
          <p className="text-sm text-muted-foreground">{result.error.message}</p>
        </div>
      )}
    </div>
  );
}

export default async function PortalCompanyLocationPage({
  searchParams,
}: PortalCompanyLocationPageProps) {
  const [ctx, params] = await Promise.all([getRequestContext(), searchParams]);

  return (
    <Suspense fallback={<LoadingSkeleton variant="cards" />}>
      <CompanyPageContent ctx={ctx} locationType={params.locationType} />
    </Suspense>
  );
}
