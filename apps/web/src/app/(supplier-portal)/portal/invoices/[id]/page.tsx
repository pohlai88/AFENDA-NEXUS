import { getRequestContext } from '@/lib/auth';
import {
  getPortalSupplier,
  getPortalInvoiceDetail,
} from '@/features/portal/queries/portal.queries';
import { PageHeader } from '@/components/erp/page-header';
import { BusinessDocument } from '@/components/erp/business-document';
import { PortalInvoiceDetailHeader } from '@/features/portal/blocks/portal-invoice-detail-header';
import { PortalInvoiceLinesTable } from '@/features/portal/blocks/portal-invoice-lines-table';
import { AlertTriangle } from 'lucide-react';
import { notFound } from 'next/navigation';
import { routes } from '@/lib/constants';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function PortalInvoiceDetailPage({ params }: Props) {
  const { id } = await params;
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
  const result = await getPortalInvoiceDetail(ctx, supplier.supplierId, id);

  if (!result.ok) {
    if (result.error.statusCode === 404) notFound();
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <AlertTriangle className="h-10 w-10 text-destructive" />
        <h2 className="mt-4 text-lg font-semibold">Error loading invoice</h2>
        <p className="mt-1 text-sm text-muted-foreground">{result.error.message}</p>
      </div>
    );
  }

  const invoice = result.value;

  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumbs={[
          { label: 'Portal', href: routes.portal.dashboard },
          { label: 'Invoices', href: routes.portal.invoices },
          { label: invoice.invoiceNumber },
        ]}
      />

      <BusinessDocument
        header={<PortalInvoiceDetailHeader invoice={invoice} />}
        tabs={[
          {
            value: 'lines',
            label: 'Invoice Lines',
            content: (
              <PortalInvoiceLinesTable
                lines={invoice.lines}
                currencyCode={invoice.currencyCode}
                totalAmount={invoice.totalAmount}
              />
            ),
          },
        ]}
      />
    </div>
  );
}
