import { Suspense } from 'react';
import { getRequestContext } from '@/lib/auth';
import {
  getPortalSupplier,
  getPortalComplianceTimeline,
} from '@/features/portal/queries/portal.queries';
import { PageHeader } from '@/components/erp/page-header';
import { PortalComplianceTimelineBlock } from '@/features/portal/blocks/portal-compliance-timeline';
import { PortalComplianceNav } from '@/features/portal/blocks/portal-compliance-nav';
import { AlertTriangle } from 'lucide-react';
import { routes } from '@/lib/constants';
import { LoadingSkeleton } from '@/components/erp/loading-skeleton';
import type { RequestContext } from '@afenda/core';

async function ComplianceTimelinePageContent({ ctx }: { ctx: RequestContext }) {
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
  const result = await getPortalComplianceTimeline(ctx, supplier.supplierId);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Compliance Timeline"
        description="Track all compliance events, alerts, and status changes."
        breadcrumbs={[
          { label: 'Portal', href: routes.portal.dashboard },
          { label: 'Compliance', href: routes.portal.compliance },
          { label: 'Timeline' },
        ]}
      />

      <PortalComplianceNav activeTab="timeline" />

      {result.ok ? (
        <PortalComplianceTimelineBlock entries={result.value} />
      ) : (
        <div className="rounded-lg border border-dashed p-12 text-center">
          <p className="text-sm text-muted-foreground">{result.error.message}</p>
        </div>
      )}
    </div>
  );
}

export default async function ComplianceTimelinePage() {
  const ctx = await getRequestContext();

  return (
    <Suspense fallback={<LoadingSkeleton />}>
      <ComplianceTimelinePageContent ctx={ctx} />
    </Suspense>
  );
}
