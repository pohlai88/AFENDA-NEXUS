import { getRequestContext } from '@/lib/auth';
import {
  getPortalSupplier,
  getPortalWhtCertificates,
} from '@/features/portal/queries/portal.queries';
import { PageHeader } from '@/components/erp/page-header';
import { PortalWhtTable } from '@/features/portal/blocks/portal-wht-table';
import { AlertTriangle } from 'lucide-react';
import { routes } from '@/lib/constants';

export default async function PortalWhtPage() {
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
  const result = await getPortalWhtCertificates(ctx, supplier.supplierId);

  return (
    <div className="space-y-6">
      <PageHeader
        title="WHT Certificates"
        description="View withholding tax certificates issued for your invoices."
        breadcrumbs={[
          { label: 'Portal', href: routes.portal.dashboard },
          { label: 'WHT Certificates' },
        ]}
      />

      {result.ok ? (
        <PortalWhtTable data={result.value} />
      ) : (
        <div className="rounded-lg border border-dashed p-12 text-center">
          <p className="text-sm text-muted-foreground">{result.error.message}</p>
        </div>
      )}
    </div>
  );
}
