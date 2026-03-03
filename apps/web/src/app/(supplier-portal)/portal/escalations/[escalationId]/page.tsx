import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { AlertTriangle, CheckCircle2, Clock, Siren } from 'lucide-react';
import { getRequestContext } from '@/lib/auth';
import {
  getPortalSupplier,
  getPortalEscalationDetail,
} from '@/features/portal/queries/portal.queries';
import { PageHeader } from '@/components/erp/page-header';
import { LoadingSkeleton } from '@/components/erp/loading-skeleton';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DateCell } from '@/components/erp/date-cell';
import { routes } from '@/lib/constants';
import type { RequestContext } from '@afenda/core';

interface Props {
  params: Promise<{ escalationId: string }>;
}

/**
 * Phase 1.2.2 CAP-SOS — Supplier Portal: Escalation detail with SLA countdown.
 * Route: /portal/escalations/[escalationId]
 */

async function EscalationDetailPageContent({
  ctx,
  escalationId,
}: {
  ctx: RequestContext;
  escalationId: string;
}) {
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
  const detailResult = await getPortalEscalationDetail(ctx, supplier.supplierId, escalationId);

  if (!detailResult.ok) {
    notFound();
  }

  const esc = detailResult.value;
  const { sla } = esc;
  const isResolved = esc.status === 'ESCALATION_RESOLVED';

  const statusLabel: Record<string, string> = {
    ESCALATION_REQUESTED: 'Requested',
    ESCALATION_ASSIGNED: 'Assigned',
    ESCALATION_IN_PROGRESS: 'In Progress',
    ESCALATION_RESOLVED: 'Resolved',
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Escalation Detail"
        description={`Escalation ID: ${esc.id.slice(0, 8)}`}
        breadcrumbs={[
          { label: 'Portal', href: routes.portal.dashboard },
          { label: 'Escalations', href: routes.portal.escalations },
          { label: 'Detail' },
        ]}
      />

      {/* Status + SLA card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Status</span>
            <Badge variant={isResolved ? 'secondary' : 'default'} className="gap-1">
              {isResolved ? <CheckCircle2 className="h-3 w-3" /> : <Siren className="h-3 w-3" />}
              {statusLabel[esc.status] ?? esc.status}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Respond By
            </p>
            <div className="mt-1 flex items-center gap-2">
              <Clock
                className={`h-4 w-4 ${sla.respondSlaBreached ? 'text-destructive' : 'text-amber-500'}`}
              />
              <DateCell date={esc.respondByAt} />
              {!isResolved && (
                <span
                  className={`text-xs font-medium ${sla.respondSlaBreached ? 'text-destructive' : 'text-amber-600'}`}
                >
                  {sla.respondSlaBreached
                    ? `${Math.abs(sla.hoursUntilRespond)}h overdue`
                    : `${sla.hoursUntilRespond}h remaining`}
                </span>
              )}
            </div>
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Resolve By
            </p>
            <div className="mt-1 flex items-center gap-2">
              <Clock
                className={`h-4 w-4 ${sla.resolveSlaBreached ? 'text-destructive' : 'text-muted-foreground'}`}
              />
              <DateCell date={esc.resolveByAt} />
              {!isResolved && (
                <span
                  className={`text-xs font-medium ${sla.resolveSlaBreached ? 'text-destructive' : 'text-muted-foreground'}`}
                >
                  {sla.resolveSlaBreached
                    ? `${Math.abs(sla.hoursUntilResolve)}h overdue`
                    : `${sla.hoursUntilResolve}h remaining`}
                </span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Escalation details */}
      <Card>
        <CardHeader>
          <CardTitle>Escalation Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Reason
            </p>
            <p className="mt-1 text-sm">{esc.reason}</p>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Case ID
              </p>
              <p className="mt-1 font-mono text-sm">{esc.caseId.slice(0, 8)}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Raised By
              </p>
              <p className="mt-1 font-mono text-sm">{esc.triggeredBy.slice(0, 8)}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Assigned To
              </p>
              <p className="mt-1 font-mono text-sm">
                {esc.assignedTo ? esc.assignedTo.slice(0, 8) : '—'}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Raised At
              </p>
              <p className="mt-1 text-sm">
                <DateCell date={esc.createdAt} />
              </p>
            </div>
          </div>

          {isResolved && esc.resolvedAt && (
            <div className="rounded-md border border-border bg-muted/30 p-4 space-y-2">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Resolution
              </p>
              <p className="text-sm">{esc.resolutionNotes}</p>
              <p className="text-xs text-muted-foreground">
                Resolved on <DateCell date={esc.resolvedAt!} />
              </p>
            </div>
          )}

          {esc.proofHash && (
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Proof Hash
              </p>
              <p className="mt-1 font-mono text-xs text-muted-foreground break-all">
                {esc.proofHash}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default async function PortalEscalationDetailPage({ params }: Props) {
  const { escalationId } = await params;
  const ctx = await getRequestContext();

  return (
    <Suspense fallback={<LoadingSkeleton />}>
      <EscalationDetailPageContent ctx={ctx} escalationId={escalationId} />
    </Suspense>
  );
}
