import { getRequestContext } from '@/lib/auth';
import { getPortalSupplier } from '@/features/portal/queries/portal.queries';
import { PageHeader } from '@/components/erp/page-header';
import { PortalInvoiceSubmitForm } from '@/features/portal/forms/portal-invoice-submit-form';
import { AlertTriangle } from 'lucide-react';
import { routes } from '@/lib/constants';

export default async function PortalInvoiceSubmitPage() {
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

  return (
    <div className="space-y-6">
      <PageHeader
        title="Submit Invoice"
        description="Submit a new electronic invoice for processing."
        breadcrumbs={[
          { label: 'Portal', href: routes.portal.dashboard },
          { label: 'Invoices', href: routes.portal.invoices },
          { label: 'Submit' },
        ]}
      />

      <PortalInvoiceSubmitForm supplierId={supplierResult.value.supplierId} />
    </div>
  );
}
