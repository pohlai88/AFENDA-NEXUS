import { Suspense } from 'react';
import { getRequestContext } from '@/lib/auth';
import { getPortalSupplier, getPortalDashboard } from '@/features/portal/queries/portal.queries';
import { PageHeader } from '@/components/erp/page-header';
import { PortalDashboard } from '@/features/portal/blocks/portal-dashboard-summary';
import { AlertTriangle } from 'lucide-react';
import { LoadingSkeleton } from '@/components/erp/loading-skeleton';

export default async function PortalDashboardPage() {
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

  const supplier = supplierResult.value;
  const dashboardResult = await getPortalDashboard(ctx, supplier.supplierId);

  return (
    <Suspense fallback={<LoadingSkeleton />}>
    <div className="space-y-6">
      <PageHeader
        title={`Welcome back, ${supplier.supplierName}`}
        description="View your invoices, payments, and compliance status at a glance."
      />

      {dashboardResult.ok ? (
        <PortalDashboard data={dashboardResult.value} />
      ) : (
        <div className="rounded-lg border border-dashed p-12 text-center">
          <p className="text-sm text-muted-foreground">
            Dashboard data is temporarily unavailable. Please try again later.
          </p>
        </div>
      )}
    </div>
    </Suspense>
  );
}
