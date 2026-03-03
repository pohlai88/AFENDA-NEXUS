import { Suspense } from 'react';
import { getRequestContext } from '@/lib/auth';
import { getPortalSupplier } from '@/features/portal/queries/portal.queries';
import { PageHeader } from '@/components/erp/page-header';
import { PortalCreditDebitNoteForm } from '@/features/portal/blocks/portal-credit-debit-note-form';
import { AlertTriangle } from 'lucide-react';
import { routes } from '@/lib/constants';
import { LoadingSkeleton } from '@/components/erp/loading-skeleton';
import type { RequestContext } from '@afenda/core';

export const metadata = { title: 'Credit / Debit Note — Afenda Portal' };

/**
 * Async child component - enables Suspense streaming
 */
async function CreditDebitNoteContent({ ctx }: { ctx: RequestContext }) {
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

  const { supplierId, supplierName } = supplierResult.value;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Credit / Debit Note"
        description="Issue a credit or debit note to adjust a previously submitted invoice."
        breadcrumbs={[
          { label: 'Portal', href: routes.portal.dashboard },
          { label: 'Invoices', href: routes.portal.invoices },
          { label: 'Credit / Debit Note' },
        ]}
      />

      <PortalCreditDebitNoteForm supplierId={supplierId} supplierName={supplierName} />
    </div>
  );
}

export default async function PortalCreditDebitNoteNewPage() {
  const ctx = await getRequestContext();

  return (
    <Suspense fallback={<LoadingSkeleton />}>
      <CreditDebitNoteContent ctx={ctx} />
    </Suspense>
  );
}
