import { notFound } from 'next/navigation';
import { PageHeader } from '@/components/erp/page-header';
import { BusinessDocument } from '@/components/erp/business-document';
import { AuditPanel } from '@/components/erp/audit-panel';
import { ArInvoiceDetailHeader } from '@/features/finance/receivables/blocks/ar-invoice-detail-header';
import { ArInvoiceLinesTable } from '@/features/finance/receivables/blocks/ar-invoice-lines-table';
import { ArInvoiceActions } from '@/features/finance/receivables/blocks/ar-invoice-actions';
import { getRequestContext } from '@/lib/auth';
import { handleApiError } from '@/lib/api-error.server';
import { getArInvoice } from '@/features/finance/receivables/queries/ar.queries';
import { getArInvoiceAuditAction } from '@/features/finance/receivables/actions/ar.actions';
import { routes } from '@/lib/constants';

export const metadata = { title: 'Receivable Detail' };

export default async function ReceivableDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const ctx = await getRequestContext();
  const result = await getArInvoice(ctx, id);

  if (!result.ok) {
    if (result.error.statusCode === 404) notFound();
    handleApiError(result, 'Failed to load receivable invoice');
  }

  const invoice = result.value;

  const auditResult = await getArInvoiceAuditAction(id);
  const auditEntries = auditResult.ok ? auditResult.value : [];

  return (
    <div className="space-y-6">
      <PageHeader
        title={invoice.invoiceNumber}
        breadcrumbs={[
          { label: 'Finance' },
          { label: 'Receivables', href: routes.finance.receivables },
          { label: invoice.invoiceNumber },
        ]}
      />

      <BusinessDocument
        header={<ArInvoiceDetailHeader invoice={invoice} />}
        tabs={[
          {
            value: 'lines',
            label: 'Lines',
            content: (
              <ArInvoiceLinesTable
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
        rightRail={<ArInvoiceActions invoiceId={invoice.id} status={invoice.status} />}
      />
    </div>
  );
}
