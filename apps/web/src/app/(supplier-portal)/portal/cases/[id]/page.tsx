import { Suspense } from 'react';
import { getRequestContext } from '@/lib/auth';
import {
  getPortalSupplier,
  getPortalCaseDetail,
  getPortalCaseTimeline,
} from '@/features/portal/queries/portal.queries';
import { PageHeader } from '@/components/erp/page-header';
import { StatusBadge } from '@/components/erp/status-badge';
import { DateCell } from '@/components/erp/date-cell';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, Clock } from 'lucide-react';
import { notFound } from 'next/navigation';
import { routes } from '@/lib/constants';
import { LoadingSkeleton } from '@/components/erp/loading-skeleton';
import { CaseTimelineStream } from '@/features/portal/components/case-timeline-stream';
import type { RequestContext } from '@afenda/core';

interface Props {
  params: Promise<{ id: string }>;
}

async function CaseDetailPageContent({ ctx, id }: { ctx: RequestContext; id: string }) {
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
  const [caseResult, timelineResult] = await Promise.all([
    getPortalCaseDetail(ctx, supplier.supplierId, id),
    getPortalCaseTimeline(ctx, supplier.supplierId, id),
  ]);

  if (!caseResult.ok) {
    if (caseResult.error.statusCode === 404) notFound();
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <AlertTriangle className="h-10 w-10 text-destructive" />
        <h2 className="mt-4 text-lg font-semibold">Error loading case</h2>
        <p className="mt-1 text-sm text-muted-foreground">{caseResult.error.message}</p>
      </div>
    );
  }

  const caseData = caseResult.value;
  const timeline = timelineResult.ok ? timelineResult.value.data : [];

  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumbs={[
          { label: 'Portal', href: routes.portal.dashboard },
          { label: 'Cases', href: routes.portal.cases },
          { label: caseData.ticketNumber },
        ]}
        actions={<StatusBadge status={caseData.status} />}
      />

      {/* Case Summary */}
      <Card>
        <CardHeader>
          <CardTitle>{caseData.subject}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <div>
              <p className="text-xs font-medium text-muted-foreground">Category</p>
              <Badge variant="outline" className="mt-1 text-xs">
                {caseData.category}
              </Badge>
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground">Priority</p>
              <Badge
                variant={caseData.priority === 'CRITICAL' ? 'destructive' : 'outline'}
                className="mt-1 text-xs"
              >
                {caseData.priority}
              </Badge>
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground">Created</p>
              <DateCell date={caseData.createdAt} format="long" />
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground">Last Updated</p>
              <DateCell date={caseData.updatedAt} format="long" />
            </div>
          </div>

          {caseData.slaDeadline && (
            <div className="flex items-center gap-2 text-sm">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">SLA Deadline:</span>
              <DateCell date={caseData.slaDeadline} format="long" />
            </div>
          )}

          {caseData.assignedTo && (
            <div>
              <p className="text-xs font-medium text-muted-foreground">Assigned To</p>
              <p className="text-sm">{caseData.assignedTo}</p>
            </div>
          )}

          <div>
            <p className="text-xs font-medium text-muted-foreground">Description</p>
            <p className="mt-1 whitespace-pre-wrap text-sm">{caseData.description}</p>
          </div>

          {caseData.resolution && (
            <div className="rounded-md border bg-muted/50 p-4">
              <p className="text-xs font-medium text-muted-foreground">Resolution</p>
              <p className="mt-1 whitespace-pre-wrap text-sm">{caseData.resolution}</p>
            </div>
          )}

          {caseData.rootCause && (
            <div>
              <p className="text-xs font-medium text-muted-foreground">Root Cause</p>
              <p className="mt-1 whitespace-pre-wrap text-sm">{caseData.rootCause}</p>
            </div>
          )}

          {caseData.correctiveAction && (
            <div>
              <p className="text-xs font-medium text-muted-foreground">Corrective Action</p>
              <p className="mt-1 whitespace-pre-wrap text-sm">{caseData.correctiveAction}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Timeline — V2 §2.4: unified stream with filter chips */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <CaseTimelineStream entries={timeline} />
        </CardContent>
      </Card>
    </div>
  );
}

export default async function PortalCaseDetailPage({ params }: Props) {
  const [{ id }, ctx] = await Promise.all([params, getRequestContext()]);

  return (
    <Suspense fallback={<LoadingSkeleton />}>
      <CaseDetailPageContent ctx={ctx} id={id} />
    </Suspense>
  );
}
