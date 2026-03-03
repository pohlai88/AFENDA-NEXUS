import { Suspense } from 'react';
import { getRequestContext } from '@/lib/auth';
import { getPortalSupplier } from '@/features/portal/queries/portal.queries';
import { PageHeader } from '@/components/erp/page-header';
import { PortalBulkUploadForm } from '@/features/portal/blocks/portal-bulk-upload-form';
import { LoadingSkeleton } from '@/components/erp/loading-skeleton';
import { AlertTriangle } from 'lucide-react';
import { routes } from '@/lib/constants';
import type { RequestContext } from '@afenda/core';

async function BulkUploadPageContent({ ctx }: { ctx: RequestContext }) {
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
        breadcrumbs={[
          { label: 'Portal', href: routes.portal.dashboard },
          { label: 'Invoices', href: routes.portal.invoices },
          { label: 'Bulk Upload' },
        ]}
        description="Upload multiple invoices at once. Download the template, fill in your invoice data, and upload it here."
      />

      <PortalBulkUploadForm supplierId={supplier.supplierId} supplierName={supplier.supplierName} />
    </div>
  );
}

export default async function PortalBulkUploadPage() {
  const ctx = await getRequestContext();

  return (
    <Suspense fallback={<LoadingSkeleton />}>
      <BulkUploadPageContent ctx={ctx} />
    </Suspense>
  );
}
