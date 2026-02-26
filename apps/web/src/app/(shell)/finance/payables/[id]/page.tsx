import { notFound } from 'next/navigation';
import { PageHeader } from '@/components/erp/page-header';
import { BusinessDocument } from '@/components/erp/business-document';
import { AuditPanel } from '@/components/erp/audit-panel';
import { ApInvoiceDetailHeader } from '@/features/finance/payables/blocks/ap-invoice-detail-header';
import { ApInvoiceLinesTable } from '@/features/finance/payables/blocks/ap-invoice-lines-table';
import { ApInvoiceActions } from '@/features/finance/payables/blocks/ap-invoice-actions';
import { getRequestContext } from '@/lib/auth';
import { handleApiError } from '@/lib/api-error.server';
import { getApInvoice } from '@/features/finance/payables/queries/ap.queries';
import { getApInvoiceAuditAction } from '@/features/finance/payables/actions/ap.actions';
import { routes } from '@/lib/constants';

export const metadata = { title: 'Payable Detail' };

export default async function PayableDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ctx = await getRequestContext();
  const result = await getApInvoice(ctx, id);

  if (!result.ok) {
    if (result.error.statusCode === 404) notFound();
    handleApiError(result, 'Failed to load payable invoice');
  }

  const invoice = result.value;

  const auditResult = await getApInvoiceAuditAction(id);
  const auditEntries = auditResult.ok ? auditResult.value : [];

  return (
    <div className="space-y-6">
      <PageHeader
        title={invoice.invoiceNumber}
        breadcrumbs={[
          { label: 'Finance' },
          { label: 'Payables', href: routes.finance.payables },
          { label: invoice.invoiceNumber },
        ]}
      />

      <BusinessDocument
        header={<ApInvoiceDetailHeader invoice={invoice} />}
        tabs={[
          {
            value: 'lines',
            label: 'Lines',
            content: (
              <ApInvoiceLinesTable
                lines={invoice.lines}
                currency={invoice.currencyCode}
                totalAmount={invoice.totalAmount}
                totalTax={invoice.totalTax}
              />
            ),
          },
          {
            value: 'audit',
            label: 'Audit Trail',
            content: <AuditPanel entries={auditEntries} />,
          },
        ]}
        defaultTab="lines"
        rightRail={<ApInvoiceActions invoiceId={invoice.id} status={invoice.status} />}
      />
    </div>
  );
}
