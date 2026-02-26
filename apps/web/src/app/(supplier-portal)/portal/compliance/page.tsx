import { getRequestContext } from '@/lib/auth';
import { getPortalSupplier, getPortalCompliance } from '@/features/portal/queries/portal.queries';
import { PageHeader } from '@/components/erp/page-header';
import { PortalComplianceSummaryBlock } from '@/features/portal/blocks/portal-compliance-summary';
import { AlertTriangle } from 'lucide-react';
import { routes } from '@/lib/constants';

export default async function PortalCompliancePage() {
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
  const result = await getPortalCompliance(ctx, supplier.supplierId);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Compliance"
        description="View your compliance status and document requirements."
        breadcrumbs={[{ label: 'Portal', href: routes.portal.dashboard }, { label: 'Compliance' }]}
      />

      {result.ok ? (
        <PortalComplianceSummaryBlock data={result.value} />
      ) : (
        <div className="rounded-lg border border-dashed p-12 text-center">
          <p className="text-sm text-muted-foreground">{result.error.message}</p>
        </div>
      )}
    </div>
  );
}
