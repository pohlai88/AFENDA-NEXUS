import { Suspense } from 'react';
import { getRequestContext } from '@/lib/auth';
import { getPortalSupplier, getPortalCompliance } from '@/features/portal/queries/portal.queries';
import { PageHeader } from '@/components/erp/page-header';
import { PortalComplianceSummaryBlock } from '@/features/portal/blocks/portal-compliance-summary';
import { PortalComplianceNav } from '@/features/portal/blocks/portal-compliance-nav';
import { AlertTriangle } from 'lucide-react';
import { routes } from '@/lib/constants';
import { LoadingSkeleton } from '@/components/erp/loading-skeleton';
import type { Metadata } from 'next';
import type { RequestContext } from '@afenda/core';

export const metadata: Metadata = {
  title: 'Compliance | Supplier Portal',
};

/**
 * Async child component - enables Suspense streaming
 * Fetches data inside the Suspense boundary for proper progressive rendering
 */
async function ComplianceContent({ ctx }: { ctx: RequestContext }) {
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
    <>
      <PortalComplianceNav activeTab="summary" />

      {result.ok ? (
        <PortalComplianceSummaryBlock data={result.value} supplierId={supplier.supplierId} />
      ) : (
        <div className="rounded-lg border border-dashed p-12 text-center">
          <p className="text-sm text-muted-foreground">{result.error.message}</p>
        </div>
      )}
    </>
  );
}

export default async function PortalCompliancePage() {
  // Only await critical, non-blocking context
  const ctx = await getRequestContext();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Compliance"
        description="View your compliance status and document requirements."
        breadcrumbs={[{ label: 'Portal', href: routes.portal.dashboard }, { label: 'Compliance' }]}
      />

      {/* Suspense wraps async child component for proper streaming */}
      <Suspense fallback={<LoadingSkeleton />}>
        <ComplianceContent ctx={ctx} />
      </Suspense>
    </div>
  );
}
