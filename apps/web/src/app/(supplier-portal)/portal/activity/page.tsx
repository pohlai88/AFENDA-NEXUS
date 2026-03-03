import { Suspense } from 'react';
import { getRequestContext } from '@/lib/auth';
import { getPortalSupplier, getPortalActivity } from '@/features/portal/queries/portal.queries';
import { PageHeader } from '@/components/erp/page-header';
import { PortalActivityTimeline } from '@/features/portal/blocks/portal-activity-timeline';
import { AlertTriangle } from 'lucide-react';
import { routes } from '@/lib/constants';
import { LoadingSkeleton } from '@/components/erp/loading-skeleton';
import type { RequestContext } from '@afenda/core';

interface PortalActivityPageProps {
  searchParams: Promise<{ page?: string; action?: string; resource?: string }>;
}

/**
 * Async child component - enables Suspense streaming
 */
async function ActivityContent({
  ctx,
  params,
}: {
  ctx: RequestContext;
  params: { page?: string; action?: string; resource?: string };
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
  const result = await getPortalActivity(ctx, supplier.supplierId, {
    page: params.page,
    action: params.action,
    resource: params.resource,
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Activity Log"
        description="Review all actions taken on your account across cases, invoices, compliance and more."
        breadcrumbs={[{ label: 'Portal', href: routes.portal.dashboard }, { label: 'Activity' }]}
      />

      {result.ok ? (
        <PortalActivityTimeline data={result.value} />
      ) : (
        <div className="rounded-lg border border-dashed p-12 text-center">
          <p className="text-sm text-muted-foreground">{result.error.message}</p>
        </div>
      )}
    </div>
  );
}

export default async function PortalActivityPage({ searchParams }: PortalActivityPageProps) {
  const [ctx, params] = await Promise.all([getRequestContext(), searchParams]);

  return (
    <Suspense fallback={<LoadingSkeleton variant="table" />}>
      <ActivityContent ctx={ctx} params={params} />
    </Suspense>
  );
}
