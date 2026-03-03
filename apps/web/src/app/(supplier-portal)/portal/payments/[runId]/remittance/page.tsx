import { Suspense } from 'react';
import { getRequestContext } from '@/lib/auth';
import { getPortalSupplier, getPortalRemittance } from '@/features/portal/queries/portal.queries';
import { PageHeader } from '@/components/erp/page-header';
import { PortalRemittanceView } from '@/features/portal/blocks/portal-remittance-view';
import { AlertTriangle } from 'lucide-react';
import { notFound } from 'next/navigation';
import { routes } from '@/lib/constants';
import { LoadingSkeleton } from '@/components/erp/loading-skeleton';
import type { RequestContext } from '@afenda/core';

interface Props {
  params: Promise<{ runId: string }>;
}

async function RemittancePageContent({ ctx, runId }: { ctx: RequestContext; runId: string }) {
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
        <h2 className="mt-4 text-lg font-semibold">Error loading remittance</h2>
        <p className="mt-1 text-sm text-muted-foreground">{result.error.message}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Remittance Advice"
        description={`Payment Run ${result.value.runNumber}`}
        breadcrumbs={[
          { label: 'Portal', href: routes.portal.dashboard },
          { label: 'Payments', href: routes.portal.payments },
          { label: result.value.runNumber, href: routes.portal.paymentDetail(runId) },
          { label: 'Remittance' },
        ]}
      />

      <PortalRemittanceView remittance={result.value} />
    </div>
  );
}

export default async function PortalRemittancePage({ params }: Props) {
  const [{ runId }, ctx] = await Promise.all([params, getRequestContext()]);

  return (
    <Suspense fallback={<LoadingSkeleton />}>
      <RemittancePageContent ctx={ctx} runId={runId} />
    </Suspense>
  );
}
