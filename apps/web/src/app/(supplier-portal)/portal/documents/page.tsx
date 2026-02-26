import { getRequestContext } from '@/lib/auth';
import { getPortalSupplier, getPortalDocuments } from '@/features/portal/queries/portal.queries';
import { PageHeader } from '@/components/erp/page-header';
import { PortalDocumentTable } from '@/features/portal/blocks/portal-document-table';
import { PortalDocumentUploadForm } from '@/features/portal/forms/portal-document-upload-form';
import { AlertTriangle } from 'lucide-react';
import { routes } from '@/lib/constants';

export default async function PortalDocumentsPage() {
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
  const result = await getPortalDocuments(ctx, supplier.supplierId);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Document Vault"
        description="Upload and manage compliance documents securely."
        breadcrumbs={[{ label: 'Portal', href: routes.portal.dashboard }, { label: 'Documents' }]}
      />

      {result.ok ? (
        <PortalDocumentTable data={result.value} />
      ) : (
        <div className="rounded-lg border border-dashed p-12 text-center">
          <p className="text-sm text-muted-foreground">{result.error.message}</p>
        </div>
      )}

      <PortalDocumentUploadForm supplierId={supplier.supplierId} />
    </div>
  );
}
