/**
 * Phase 1.2.6 CAP-APPT (P27) — Appointment Detail Page
 *
 * Shows full details for a single meeting request including proposed times,
 * confirmed time, agenda, location, buyer notes, and cancellation reason.
 *
 * SP-5020: /portal/appointments/[id]
 */
import { Suspense } from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, Clock, MapPin, VideoIcon, Users2, FileText, MessageSquare } from 'lucide-react';
import { getRequestContext } from '@/lib/auth';
import { getPortalAppointmentDetail } from '@/features/portal/queries/portal.queries';
import type {
  PortalMeetingRequest,
  MeetingRequestStatus,
} from '@/features/portal/queries/portal.queries';
import { PageHeader } from '@/components/erp/page-header';
import { LoadingSkeleton } from '@/components/erp/loading-skeleton';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { routes } from '@/lib/constants';
import type { RequestContext } from '@afenda/core';

export const dynamic = 'force-dynamic';

function formatDate(iso: string | null): string {
  if (!iso) return '—';
  return new Intl.DateTimeFormat('en-US', { dateStyle: 'long', timeStyle: 'short' }).format(
    new Date(iso)
  );
}

function statusBadge(status: MeetingRequestStatus) {
  const config: Record<
    MeetingRequestStatus,
    { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }
  > = {
    REQUESTED: { label: 'Pending Confirmation', variant: 'outline' },
    CONFIRMED: { label: 'Confirmed', variant: 'default' },
    COMPLETED: { label: 'Completed', variant: 'secondary' },
    CANCELLED: { label: 'Cancelled', variant: 'destructive' },
  };
  const c = config[status];
  return <Badge variant={c.variant}>{c.label}</Badge>;
}

async function AppointmentDetailContent({
  ctx,
  meetingId,
}: {
  ctx: RequestContext;
  meetingId: string;
}) {
  const result = await getPortalAppointmentDetail(ctx, meetingId);

  if (!result.ok) {
    notFound();
  }

  const m: PortalMeetingRequest = result.value;

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-3">
        <Button variant="ghost" size="icon" asChild className="-ml-2 mt-0.5">
          <Link href={routes.portal.appointments} aria-label="Back to appointments">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex-1">
          <div className="flex items-start justify-between gap-4">
            <PageHeader title={m.agenda} description={`Requested ${formatDate(m.createdAt)}`} />
            <div className="shrink-0">{statusBadge(m.status)}</div>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {/* Meeting Details */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Meeting Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              {m.meetingType === 'VIRTUAL' ? (
                <VideoIcon className="h-4 w-4 shrink-0" />
              ) : (
                <Users2 className="h-4 w-4 shrink-0" />
              )}
              <span>{m.meetingType === 'VIRTUAL' ? 'Virtual Meeting' : 'In-Person Meeting'}</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Clock className="h-4 w-4 shrink-0" />
              <span>{m.durationMinutes} minutes</span>
            </div>
            {m.location && (
              <div className="flex items-start gap-2 text-muted-foreground">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{m.location}</span>
              </div>
            )}
            {m.confirmedTime && (
              <div className="rounded-lg bg-green-50 px-3 py-2 dark:bg-green-900/20">
                <p className="text-xs font-semibold text-green-800 dark:text-green-300">
                  Confirmed Time
                </p>
                <p className="text-sm font-medium text-green-900 dark:text-green-100">
                  {formatDate(m.confirmedTime)}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Proposed Times */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Proposed Times</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {m.proposedTimes.length ? (
              m.proposedTimes.map((t, i) => (
                <div
                  key={t}
                  className={`rounded-md border px-3 py-2 text-sm ${
                    m.confirmedTime === t
                      ? 'border-green-400 bg-green-50 font-medium text-green-800 dark:border-green-700 dark:bg-green-900/20 dark:text-green-200'
                      : 'text-muted-foreground'
                  }`}
                >
                  <span className="mr-2 text-xs font-medium text-muted-foreground/60">
                    #{i + 1}
                  </span>
                  {formatDate(t)}
                  {m.confirmedTime === t && (
                    <span className="ml-2 text-xs font-semibold text-green-700 dark:text-green-300">
                      ✓ Confirmed
                    </span>
                  )}
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">No times proposed.</p>
            )}
          </CardContent>
        </Card>

        {/* Notes & Reason */}
        {(m.buyerNotes || m.cancellationReason) && (
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle className="text-sm">Notes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {m.buyerNotes && (
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    <MessageSquare className="h-3 w-3" />
                    Buyer Notes
                  </div>
                  <p className="rounded-md bg-muted px-3 py-2 text-sm">{m.buyerNotes}</p>
                </div>
              )}
              {m.cancellationReason && (
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    <FileText className="h-3 w-3" />
                    Cancellation Reason
                  </div>
                  <p className="rounded-md bg-muted px-3 py-2 text-sm italic text-muted-foreground">
                    {m.cancellationReason}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Context Links */}
        {(m.caseId || m.escalationId) && (
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle className="text-sm">Linked To</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-3">
              {m.caseId && (
                <Link
                  href={routes.portal.caseDetail(m.caseId)}
                  className="text-sm text-primary hover:underline"
                >
                  Support Case → {m.caseId.slice(0, 8)}…
                </Link>
              )}
              {m.escalationId && (
                <Link
                  href={routes.portal.escalationDetail(m.escalationId)}
                  className="text-sm text-primary hover:underline"
                >
                  Escalation → {m.escalationId.slice(0, 8)}…
                </Link>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Cancel button — only for REQUESTED or CONFIRMED */}
      {(m.status === 'REQUESTED' || m.status === 'CONFIRMED') && (
        <>
          <Separator />
          <div className="flex justify-end">
            <Button variant="destructive" size="sm" asChild>
              {/* Client-side cancel handled via form action; link to page for now */}
              <Link href={`${routes.portal.appointmentDetail(m.id)}?action=cancel`}>
                Cancel Request
              </Link>
            </Button>
          </div>
        </>
      )}
    </div>
  );
}

export default async function AppointmentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const ctx = await getRequestContext();

  return (
    <Suspense fallback={<LoadingSkeleton variant="detail" />}>
      <AppointmentDetailContent ctx={ctx} meetingId={id} />
    </Suspense>
  );
}
