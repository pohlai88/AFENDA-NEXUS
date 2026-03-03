/**
 * Phase 1.2.6 CAP-APPT (P27) — Supplier Appointments Page
 *
 * Suppliers view and manage meeting requests with buyer-side contacts.
 * Status tabs: Pending (REQUESTED) | Upcoming (CONFIRMED) | Past (COMPLETED/CANCELLED)
 *
 * SP-5020: /portal/appointments
 */
import { Suspense } from 'react';
import Link from 'next/link';
import {
  CalendarClock,
  Plus,
  Clock,
  MapPin,
  VideoIcon,
  Users2,
  MoreHorizontal,
} from 'lucide-react';
import { getRequestContext } from '@/lib/auth';
import { getPortalSupplier, getPortalAppointments } from '@/features/portal/queries/portal.queries';
import type {
  PortalMeetingRequest,
  MeetingRequestStatus,
} from '@/features/portal/queries/portal.queries';
import { PageHeader } from '@/components/erp/page-header';
import { LoadingSkeleton } from '@/components/erp/loading-skeleton';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { routes } from '@/lib/constants';
import type { RequestContext } from '@afenda/core';

export const dynamic = 'force-dynamic';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(iso: string | null): string {
  if (!iso) return '—';
  return new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(iso));
}

function statusBadge(status: MeetingRequestStatus) {
  const config: Record<MeetingRequestStatus, { label: string; class: string }> = {
    REQUESTED: {
      label: 'Pending',
      class: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
    },
    CONFIRMED: {
      label: 'Confirmed',
      class: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
    },
    COMPLETED: {
      label: 'Completed',
      class: 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300',
    },
    CANCELLED: {
      label: 'Cancelled',
      class: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
    },
  };
  const c = config[status];
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${c.class}`}
    >
      {c.label}
    </span>
  );
}

// ─── Empty State ──────────────────────────────────────────────────────────────

function EmptyMeetings({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-16 text-center">
      <CalendarClock className="h-10 w-10 text-muted-foreground/40" aria-hidden="true" />
      <h3 className="mt-4 text-sm font-semibold text-foreground">No {label} meetings</h3>
      <p className="mt-1 text-xs text-muted-foreground">
        {label === 'pending'
          ? 'Submit a meeting request to get started.'
          : 'Check back later for updates.'}
      </p>
    </div>
  );
}

// ─── Meeting Card ─────────────────────────────────────────────────────────────

function MeetingCard({ meeting }: { meeting: PortalMeetingRequest }) {
  const confirmedOrFirst = meeting.confirmedTime ?? meeting.proposedTimes[0] ?? null;

  return (
    <Card className="group transition-shadow hover:shadow-md">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 space-y-1">
            <CardTitle className="text-sm font-semibold leading-tight">{meeting.agenda}</CardTitle>
            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              {statusBadge(meeting.status)}
              <Badge variant="outline" className="text-[10px]">
                {meeting.meetingType === 'VIRTUAL' ? (
                  <VideoIcon className="mr-1 h-2.5 w-2.5" />
                ) : (
                  <Users2 className="mr-1 h-2.5 w-2.5" />
                )}
                {meeting.meetingType === 'VIRTUAL' ? 'Virtual' : 'In Person'}
              </Badge>
            </div>
          </div>
          <Link
            href={routes.portal.appointmentDetail(meeting.id)}
            className="rounded p-1 opacity-0 transition-opacity group-hover:opacity-100 hover:bg-muted"
            aria-label="View appointment"
          >
            <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
          </Link>
        </div>
      </CardHeader>
      <CardContent className="space-y-1.5 text-xs text-muted-foreground">
        {confirmedOrFirst && (
          <div className="flex items-center gap-1.5">
            <Clock className="h-3 w-3 shrink-0" />
            <span>
              {meeting.status === 'CONFIRMED' ? 'Confirmed: ' : 'Proposed: '}
              {formatDate(confirmedOrFirst)}
            </span>
            <span className="text-muted-foreground/60">· {meeting.durationMinutes} min</span>
          </div>
        )}
        {meeting.location && (
          <div className="flex items-center gap-1.5">
            <MapPin className="h-3 w-3 shrink-0" />
            <span className="truncate">{meeting.location}</span>
          </div>
        )}
        {meeting.proposedTimes.length > 1 && meeting.status === 'REQUESTED' && (
          <p className="text-muted-foreground/60">{meeting.proposedTimes.length} proposed times</p>
        )}
        {meeting.cancellationReason && (
          <p className="italic text-muted-foreground/70">Reason: {meeting.cancellationReason}</p>
        )}
        <p className="text-right text-[10px] text-muted-foreground/50">
          Requested {formatDate(meeting.createdAt)}
        </p>
      </CardContent>
    </Card>
  );
}

// ─── Meeting List ─────────────────────────────────────────────────────────────

function MeetingList({
  meetings,
  emptyLabel,
}: {
  meetings: PortalMeetingRequest[];
  emptyLabel: string;
}) {
  if (!meetings.length) return <EmptyMeetings label={emptyLabel} />;

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {meetings.map((m) => (
        <MeetingCard key={m.id} meeting={m} />
      ))}
    </div>
  );
}

// ─── Data Loader ─────────────────────────────────────────────────────────────

async function AppointmentsContent({ ctx }: { ctx: RequestContext }) {
  const supplierResult = await getPortalSupplier(ctx);

  if (!supplierResult.ok) {
    return (
      <div className="rounded-lg bg-destructive/10 p-4 text-sm text-destructive">
        {String(supplierResult.error?.message ?? 'Failed to load supplier information.')}
      </div>
    );
  }

  const supplierId = supplierResult.value.supplierId;

  const [pending, confirmed, past] = await Promise.all([
    getPortalAppointments(ctx, supplierId, { status: 'REQUESTED' }),
    getPortalAppointments(ctx, supplierId, { status: 'CONFIRMED' }),
    getPortalAppointments(ctx, supplierId, { status: 'COMPLETED', limit: 50 }),
  ]);

  const pendingItems = pending.ok ? pending.value.items : [];
  const confirmedItems = confirmed.ok ? confirmed.value.items : [];
  const pastItems = past.ok ? past.value.items : [];

  return (
    <Tabs defaultValue="pending" className="space-y-4">
      <TabsList>
        <TabsTrigger value="pending">
          Pending
          {pendingItems.length > 0 && (
            <span className="ml-1.5 inline-flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-amber-500 px-1 text-[10px] font-bold text-white">
              {pendingItems.length}
            </span>
          )}
        </TabsTrigger>
        <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
        <TabsTrigger value="past">Past</TabsTrigger>
      </TabsList>

      <TabsContent value="pending">
        <MeetingList meetings={pendingItems} emptyLabel="pending" />
      </TabsContent>

      <TabsContent value="upcoming">
        <MeetingList meetings={confirmedItems} emptyLabel="upcoming" />
      </TabsContent>

      <TabsContent value="past">
        <MeetingList meetings={pastItems} emptyLabel="past" />
      </TabsContent>
    </Tabs>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default async function AppointmentsPage() {
  const ctx = await getRequestContext();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <PageHeader
          title="Appointments"
          description="Request meetings with your buyer contacts. Propose up to 3 time slots and we'll confirm the best fit."
        />
        <Button asChild size="sm">
          <Link href={routes.portal.appointmentNew}>
            <Plus className="mr-1.5 h-4 w-4" aria-hidden="true" />
            New Request
          </Link>
        </Button>
      </div>

      <Suspense fallback={<LoadingSkeleton variant="cards" />}>
        <AppointmentsContent ctx={ctx} />
      </Suspense>
    </div>
  );
}
