import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { PageHeader } from '@/components/erp/page-header';
import { BusinessDocument } from '@/components/erp/business-document';
import { AuditPanel } from '@/components/erp/audit-panel';
import { ApInvoiceDetailHeader } from '@/features/finance/payables/blocks/ap-invoice-detail-header';
import { ApThreeWayMatchCard } from '@/features/finance/payables/blocks/ap-three-way-match-card';
import { ApInvoiceLinesTable } from '@/features/finance/payables/blocks/ap-invoice-lines-table';
import { ApInvoiceActions } from '@/features/finance/payables/blocks/ap-invoice-actions';
import { getRequestContext } from '@/lib/auth';
import { handleApiError } from '@/lib/api-error.server';
import { getApInvoice, getInvoiceEarlyDiscount } from '@/features/finance/payables/queries/ap.queries';
import { getApInvoiceAuditAction } from '@/features/finance/payables/actions/ap.actions';
import { getInvoiceTimeline, getInvoiceHolds } from '@/features/finance/payables/queries/ap-hold.queries';
import { ApInvoiceTimeline } from '@/features/finance/payables/blocks/ap-invoice-timeline';
import { ApHoldTable } from '@/features/finance/payables/blocks/ap-hold-table';
import { routes } from '@/lib/constants';
import { LoadingSkeleton } from '@/components/erp/loading-skeleton';

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const ctx = await getRequestContext();
  const r = await getApInvoice(ctx, id);
  if (!r.ok) return { title: 'Payable | Payables' };
  return { title: `${r.value.invoiceNumber} | Payables | Finance` };
}

export default async function PayableDetailPage({ params }: Props) {
  const { id } = await params;
  const ctx = await getRequestContext();
  const result = await getApInvoice(ctx, id);
  if (!result.ok) { if (result.error.statusCode === 404) notFound(); handleApiError(result, 'Failed to load payable invoice'); }
  const inv = result.value;

  const [audit, timeline, holds, earlyDiscountResult] = await Promise.all([
    getApInvoiceAuditAction(id),
    getInvoiceTimeline(ctx, id),
    getInvoiceHolds(ctx, id),
    getInvoiceEarlyDiscount(ctx, id),
  ]);
  const auditEntries = audit.ok ? audit.value : [];
  const timelineEntries = timeline.ok ? timeline.value : [];
  const holdEntries = holds.ok ? holds.value : [];
  const earlyDiscount = earlyDiscountResult.ok ? earlyDiscountResult.value : null;

  return (
    <Suspense fallback={<LoadingSkeleton />}>
    <div className="space-y-6">
      <PageHeader title={inv.invoiceNumber} breadcrumbs={[{ label: 'Finance' }, { label: 'Payables', href: routes.finance.payables }, { label: inv.invoiceNumber }]} />

      <BusinessDocument
        header={
          <div className="space-y-4">
            <ApInvoiceDetailHeader invoice={inv} earlyDiscount={earlyDiscount} />
            <ApThreeWayMatchCard invoice={inv} holds={holdEntries} />
          </div>
        }
        tabs={[
          { value: 'lines', label: 'Lines', content: <ApInvoiceLinesTable lines={inv.lines} currency={inv.currencyCode} totalAmount={inv.totalAmount} totalTax={inv.totalTax} /> },
          { value: 'timeline', label: 'Timeline', content: <ApInvoiceTimeline entries={timelineEntries} /> },
          { value: 'holds', label: `Holds (${holdEntries.length})`, content: <ApHoldTable data={holdEntries} /> },
          { value: 'audit', label: 'Audit Trail', content: <AuditPanel entries={auditEntries} /> },
        ]}
        defaultTab="lines"
        rightRail={<ApInvoiceActions invoiceId={inv.id} status={inv.status} />}
      />
    </div>
  </Suspense>
  );
}
