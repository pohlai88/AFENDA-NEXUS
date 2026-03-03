import { Suspense } from 'react';
import { getRequestContext } from '@/lib/auth';
import { getPortalSupplier } from '@/features/portal/queries/portal.queries';
import { PageHeader } from '@/components/erp/page-header';
import { PortalCaseForm } from '@/features/portal/forms/portal-case-form';
import { AlertTriangle } from 'lucide-react';
import { routes } from '@/lib/constants';
import { LoadingSkeleton } from '@/components/erp/loading-skeleton';
import type { RequestContext } from '@afenda/core';

async function NewCasePageContent({ ctx }: { ctx: RequestContext }) {
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
    <div className="space-y-6">
      <PageHeader
        title="New Case"
        description="Submit a new support case, inquiry, or issue."
        breadcrumbs={[
          { label: 'Portal', href: routes.portal.dashboard },
          { label: 'Cases', href: routes.portal.cases },
          { label: 'New Case' },
        ]}
      />

      <PortalCaseForm supplierId={supplierResult.value.supplierId} />
    </div>
  );
}

export default async function PortalNewCasePage() {
  const ctx = await getRequestContext();

  return (
    <Suspense fallback={<LoadingSkeleton />}>
      <NewCasePageContent ctx={ctx} />
    </Suspense>
  );
}
