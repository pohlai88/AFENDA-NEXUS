import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
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
import { LoadingSkeleton } from '@/components/erp/loading-skeleton';

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const [{ id }, ctx] = await Promise.all([params, getRequestContext()]);
  const r = await getArInvoice(ctx, id);
  if (!r.ok) return { title: 'Receivable | Receivables' };
  return { title: `${r.value.invoiceNumber} | Receivables | Finance` };
}

export default async function ReceivableDetailPage({ params }: Props) {
  const [{ id }, ctx] = await Promise.all([params, getRequestContext()]);
  const result = await getArInvoice(ctx, id);
  if (!result.ok) { if (result.error.statusCode === 404) notFound(); handleApiError(result, 'Failed to load receivable invoice'); }
  const inv = result.value;

  const auditResult = await getArInvoiceAuditAction(id);
  const auditEntries = auditResult.ok ? auditResult.value : [];

  return (
    <Suspense fallback={<LoadingSkeleton />}>
    <div className="space-y-6">
      <PageHeader title={inv.invoiceNumber} breadcrumbs={[{ label: 'Finance' }, { label: 'Receivables', href: routes.finance.receivables }, { label: inv.invoiceNumber }]} />

      <BusinessDocument
        header={<ArInvoiceDetailHeader invoice={inv} />}
        tabs={[
          { value: 'lines', label: 'Lines', content: <ArInvoiceLinesTable lines={inv.lines} currency={inv.currencyCode} totalAmount={inv.totalAmount} totalTax={inv.totalTax} /> },
          { value: 'audit', label: 'Audit Trail', content: <AuditPanel entries={auditEntries} /> },
        ]}
        defaultTab="lines"
        rightRail={<ArInvoiceActions invoiceId={inv.id} status={inv.status} />}
      />
    </div>
  </Suspense>
  );
}
