'use client';

import { useState, useEffect, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { AlertTriangle, CheckCircle2, Clock, RefreshCw, Siren } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { DateCell } from '@/components/erp/date-cell';
import { routes } from '@/lib/constants';
import type { PortalEscalation, EscalationStatus } from '@/features/portal/queries/portal.queries';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Props {
  supplierId: string;
  initialEscalations: PortalEscalation[];
  initialHasMore: boolean;
  refreshAction: (supplierId: string) => Promise<{
    ok: boolean;
    value?: { items: PortalEscalation[]; hasMore: boolean };
  }>;
}

// ─── Status Helpers ───────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<
  EscalationStatus,
  {
    label: string;
    variant: 'default' | 'secondary' | 'destructive' | 'outline';
    icon: React.ReactNode;
  }
> = {
  ESCALATION_REQUESTED: {
    label: 'Requested',
    variant: 'outline',
    icon: <Clock className="h-3 w-3" />,
  },
  ESCALATION_ASSIGNED: {
    label: 'Assigned',
    variant: 'default',
    icon: <Siren className="h-3 w-3" />,
  },
  ESCALATION_IN_PROGRESS: {
    label: 'In Progress',
    variant: 'default',
    icon: <AlertTriangle className="h-3 w-3" />,
  },
  ESCALATION_RESOLVED: {
    label: 'Resolved',
    variant: 'secondary',
    icon: <CheckCircle2 className="h-3 w-3" />,
  },
};

function SlaCountdown({ respondByAt, status }: { respondByAt: string; status: EscalationStatus }) {
  if (status === 'ESCALATION_RESOLVED') return null;
  const [clientNow, setClientNow] = useState(0);
  useEffect(() => {
    setClientNow(Date.now());
  }, []);
  if (!clientNow) return null;
  const ms = new Date(respondByAt).getTime() - clientNow;
  const hours = Math.round(ms / (60 * 60 * 1_000));
  const breached = hours < 0;

  return (
    <span className={cn('text-xs font-medium', breached ? 'text-destructive' : 'text-warning')}>
      {breached ? `${Math.abs(hours)}h overdue` : `${hours}h to respond`}
    </span>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * Phase 1.2.2 CAP-SOS — Escalation tracker with SLA countdown badges.
 */
export function PortalEscalationTracker({
  supplierId,
  initialEscalations,
  initialHasMore: _initialHasMore,
  refreshAction,
}: Props) {
  const router = useRouter();
  const [escalations, setEscalations] = useState<PortalEscalation[]>(initialEscalations);
  const [isPending, startTransition] = useTransition();

  function refresh() {
    startTransition(async () => {
      const result = await refreshAction(supplierId);
      if (result.ok && result.value) {
        setEscalations(result.value.items);
      }
      router.refresh();
    });
  }

  if (escalations.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-12 text-center">
        <Siren className="mx-auto h-10 w-10 text-muted-foreground" />
        <h3 className="mt-4 text-sm font-medium">No escalations</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Use the SOS button to escalate an unresolved issue to your buyer contact.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{escalations.length} escalation(s)</p>
        <Button
          variant="ghost"
          size="sm"
          onClick={refresh}
          disabled={isPending}
          className="gap-1.5"
        >
          <RefreshCw className={cn('h-3.5 w-3.5', isPending && 'animate-spin')} />
          Refresh
        </Button>
      </div>

      {escalations.map((esc) => {
        const config = STATUS_CONFIG[esc.status];
        return (
          <button
            key={esc.id}
            type="button"
            className="w-full text-left"
            onClick={() => router.push(routes.portal.escalationDetail(esc.id))}
          >
            <Card className="transition-colors hover:bg-muted/50">
              <CardContent className="flex items-start justify-between gap-3 py-4">
                <div className="flex items-start gap-3 min-w-0 flex-1">
                  <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-destructive/10 mt-0.5">
                    <Siren className="h-4 w-4 text-destructive" />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{esc.reason}</p>
                    <p className="text-xs text-muted-foreground">
                      Case #{esc.caseId.slice(0, 8)} &middot; <DateCell date={esc.createdAt} />
                    </p>
                    {esc.assignedTo && (
                      <p className="text-xs text-muted-foreground">
                        Assigned to contact {esc.assignedTo.slice(0, 8)}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                  <Badge variant={config.variant} className="gap-1">
                    {config.icon}
                    {config.label}
                  </Badge>
                  <SlaCountdown respondByAt={esc.respondByAt} status={esc.status} />
                </div>
              </CardContent>
            </Card>
          </button>
        );
      })}
    </div>
  );
}
