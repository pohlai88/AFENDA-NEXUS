import { Suspense } from 'react';
import { AlertTriangle } from 'lucide-react';
import { getRequestContext } from '@/lib/auth';
import {
  getPortalSupplier,
  getPortalEscalations,
  getPortalCases,
} from '@/features/portal/queries/portal.queries';
import {
  getEscalationsAction,
  triggerEscalationAction,
} from '@/features/portal/actions/portal.actions';
import { PageHeader } from '@/components/erp/page-header';
import { LoadingSkeleton } from '@/components/erp/loading-skeleton';
import { PortalEscalationTracker } from '@/features/portal/blocks/portal-escalation-tracker';
import { PortalSosButton } from '@/features/portal/components/portal-sos-button';
import type { RequestContext } from '@afenda/core';

/**
 * Phase 1.2.2 CAP-SOS — Supplier Portal: Escalation tracker page.
 * Route: /portal/escalations
 */

async function EscalationsPageContent({ ctx }: { ctx: RequestContext }) {
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

  const [escalationsResult, casesResult] = await Promise.all([
    getPortalEscalations(ctx, supplier.supplierId),
    getPortalCases(ctx, supplier.supplierId, { status: 'OPEN', limit: '50' }),
  ]);

  const escalations = escalationsResult.ok ? escalationsResult.value.items : [];
  const hasMore = escalationsResult.ok ? escalationsResult.value.hasMore : false;
  const openCases = casesResult.ok
    ? casesResult.value.data.map((c) => ({
        id: c.id,
        ticketNumber: c.ticketNumber,
        subject: c.subject,
      }))
    : [];

  async function refreshEscalations(supplierId: string) {
    'use server';
    return getEscalationsAction(supplierId);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Escalations"
        description="Breakglass escalations raised for urgent unresolved issues."
        actions={
          <PortalSosButton
            supplierId={supplier.supplierId}
            openCases={openCases}
            triggerAction={triggerEscalationAction}
          />
        }
      />

      <PortalEscalationTracker
        supplierId={supplier.supplierId}
        initialEscalations={escalations}
        initialHasMore={hasMore}
        refreshAction={refreshEscalations}
      />
    </div>
  );
}

export default async function PortalEscalationsPage() {
  const ctx = await getRequestContext();

  return (
    <Suspense fallback={<LoadingSkeleton />}>
      <EscalationsPageContent ctx={ctx} />
    </Suspense>
  );
}
