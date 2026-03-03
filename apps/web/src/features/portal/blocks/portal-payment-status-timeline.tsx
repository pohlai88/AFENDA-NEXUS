'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  CheckCircle2,
  Clock,
  AlertCircle,
  XCircle,
  ArrowRight,
  ExternalLink,
  Info,
} from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { routes } from '@/lib/constants';
import type {
  PaymentStage,
  PaymentSource,
  PaymentStatusTimelineItem,
  PaymentStatusTimelineResponse,
} from '../queries/portal.queries';

// ─── Stage Config ────────────────────────────────────────────────────────────

interface StageConfig {
  label: string;
  Icon: React.ElementType;
  badgeClass: string;
  dotClass: string;
}

const STAGE_CONFIG: Record<PaymentStage, StageConfig> = {
  SCHEDULED: {
    label: 'Scheduled',
    Icon: Clock,
    badgeClass: 'bg-blue-50 text-blue-700 border-blue-200',
    dotClass: 'bg-blue-400',
  },
  APPROVED: {
    label: 'Approved',
    Icon: CheckCircle2,
    badgeClass: 'bg-primary/10 text-primary border-primary/30',
    dotClass: 'bg-primary',
  },
  PROCESSING: {
    label: 'Processing',
    Icon: Clock,
    badgeClass: 'bg-secondary text-secondary-foreground border-border',
    dotClass: 'bg-secondary',
  },
  SENT: {
    label: 'Sent',
    Icon: ArrowRight,
    badgeClass: 'bg-accent text-accent-foreground border-border',
    dotClass: 'bg-accent',
  },
  CLEARED: {
    label: 'Cleared',
    Icon: CheckCircle2,
    badgeClass: 'bg-success/10 text-success border-success/30',
    dotClass: 'bg-success',
  },
  ON_HOLD: {
    label: 'On Hold',
    Icon: AlertCircle,
    badgeClass: 'bg-warning/10 text-warning border-warning/30',
    dotClass: 'bg-warning',
  },
  REJECTED: {
    label: 'Rejected',
    Icon: XCircle,
    badgeClass: 'bg-destructive/10 text-destructive border-destructive/30',
    dotClass: 'bg-destructive',
  },
};

const SOURCE_LABELS: Record<PaymentSource, string> = {
  BANK_FILE: 'Bank File',
  ERP: 'ERP',
  MANUAL_OVERRIDE: 'Manual',
};

const SOURCE_BADGE_CLASS: Record<PaymentSource, string> = {
  BANK_FILE: 'bg-muted text-muted-foreground',
  ERP: 'bg-muted text-muted-foreground',
  MANUAL_OVERRIDE: 'bg-warning/10 text-warning',
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatEventDate(iso: string): string {
  try {
    return new Intl.DateTimeFormat(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function CurrentStatusBanner({
  stage,
  supplierVisibleLabel,
}: {
  stage: PaymentStage;
  supplierVisibleLabel: string | null;
}) {
  const cfg = STAGE_CONFIG[stage];
  const Icon = cfg.Icon;

  return (
    <div className={cn('flex items-center gap-3 rounded-lg border px-4 py-3', cfg.badgeClass)}>
      <Icon className="h-5 w-5 shrink-0" aria-hidden="true" />
      <div className="min-w-0">
        <p className="text-xs font-medium uppercase tracking-wide opacity-70">Current Status</p>
        <p className="text-sm font-semibold">{supplierVisibleLabel ?? cfg.label}</p>
      </div>
    </div>
  );
}

function HoldAlert({ item }: { item: PaymentStatusTimelineItem }) {
  return (
    <Alert
      variant="destructive"
      className="border-warning/30 bg-warning/10 text-warning-foreground"
    >
      <AlertCircle className="h-4 w-4 text-warning" />
      <AlertTitle className="text-warning-foreground">Payment On Hold</AlertTitle>
      <AlertDescription className="mt-1 space-y-2">
        <p className="text-sm">
          {item.supplierVisibleLabel ??
            'Your payment is currently on hold. Please contact your AP team for details.'}
        </p>
        {item.holdDurationDays != null && item.holdDurationDays > 0 && (
          <p className="text-xs font-medium text-warning">
            Hold duration: {item.holdDurationDays} day{item.holdDurationDays !== 1 ? 's' : ''}
          </p>
        )}
        {item.nextActionHref && (
          <Button
            asChild
            size="sm"
            variant="outline"
            className="mt-2 border-warning/50 text-warning hover:bg-warning/10"
          >
            <Link href={item.nextActionHref}>
              Take Action
              <ExternalLink className="ml-2 h-3 w-3" />
            </Link>
          </Button>
        )}
      </AlertDescription>
    </Alert>
  );
}

function TimelineEntry({
  item,
  isLatest,
  isLast,
}: {
  item: PaymentStatusTimelineItem;
  isLatest: boolean;
  isLast: boolean;
}) {
  const cfg = STAGE_CONFIG[item.stage];
  const Icon = cfg.Icon;

  return (
    <div className="relative flex gap-4">
      {/* Vertical connector line */}
      {!isLast && <div className="absolute left-[17px] top-8 h-full w-px bg-border" />}

      {/* Dot */}
      <div
        className={cn(
          'relative z-10 mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 border-background ring-2',
          item.isOnHold
            ? 'bg-warning/10 ring-warning/30'
            : item.stage === 'CLEARED'
              ? 'bg-success/10 ring-success/30'
              : item.stage === 'REJECTED'
                ? 'bg-destructive/10 ring-destructive/30'
                : 'bg-muted ring-border',
          isLatest && 'ring-offset-1'
        )}
      >
        <Icon
          className={cn(
            'h-4 w-4',
            item.isOnHold
              ? 'text-warning'
              : item.stage === 'CLEARED'
                ? 'text-success'
                : item.stage === 'REJECTED'
                  ? 'text-destructive'
                  : 'text-muted-foreground'
          )}
          aria-hidden="true"
        />
      </div>

      {/* Content */}
      <div className="flex-1 pb-6">
        <div className="flex flex-wrap items-center gap-2">
          {/* Stage badge */}
          <Badge variant="outline" className={cn('text-xs font-medium', cfg.badgeClass)}>
            {item.supplierVisibleLabel ?? cfg.label}
          </Badge>

          {/* Source badge */}
          <Badge variant="secondary" className={cn('text-xs', SOURCE_BADGE_CLASS[item.source])}>
            {SOURCE_LABELS[item.source]}
          </Badge>

          {/* Latest indicator */}
          {isLatest && <span className="text-xs font-medium text-muted-foreground">— current</span>}
        </div>

        {/* Timestamp + hold duration */}
        <div className="mt-1 flex flex-wrap items-center gap-3">
          <time dateTime={item.eventAt} className="text-xs text-muted-foreground">
            {formatEventDate(item.eventAt)}
          </time>

          {item.holdDurationDays != null && item.holdDurationDays > 0 && (
            <span className="text-xs font-medium text-warning">{item.holdDurationDays}d hold</span>
          )}
        </div>

        {/* Previous stage annotation */}
        {item.previousStage && (
          <p className="mt-0.5 text-xs text-muted-foreground">
            from {STAGE_CONFIG[item.previousStage].label}
          </p>
        )}

        {/* Case link */}
        {item.linkedCaseId && (
          <p className="mt-1 text-xs">
            <Link
              href={routes.portal.caseDetail(item.linkedCaseId)}
              className="inline-flex items-center gap-1 text-primary underline-offset-2 hover:underline"
            >
              View linked case
              <ExternalLink className="h-3 w-3" />
            </Link>
          </p>
        )}
      </div>
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────

interface PortalPaymentStatusTimelineProps {
  data: PaymentStatusTimelineResponse;
}

export function PortalPaymentStatusTimeline({ data }: PortalPaymentStatusTimelineProps) {
  const { items, currentStage, supplierVisibleLabel } = data;

  // The first item in the list is the most recent event (desc ordering from API).
  const latestHoldItem = items.find((i) => i.isOnHold);

  return (
    <div className="space-y-4">
      {/* Current status banner */}
      {currentStage && (
        <CurrentStatusBanner stage={currentStage} supplierVisibleLabel={supplierVisibleLabel} />
      )}

      {/* Hold alert — shown whenever the active stage is ON_HOLD */}
      {latestHoldItem && currentStage === 'ON_HOLD' && <HoldAlert item={latestHoldItem} />}

      {/* Empty state */}
      {items.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Info className="h-8 w-8 text-muted-foreground" />
          <p className="mt-3 text-sm font-medium">No status events recorded yet</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Payment status will appear here once the run is processed.
          </p>
        </div>
      )}

      {/* Timeline entries */}
      {items.length > 0 && (
        <div className="pt-2">
          {items.map((item, idx) => (
            <TimelineEntry
              key={item.id}
              item={item}
              isLatest={idx === 0}
              isLast={idx === items.length - 1}
            />
          ))}
        </div>
      )}

      {/* Pagination hint */}
      {data.hasMore && (
        <p className="text-center text-xs text-muted-foreground">
          Showing {items.length} of {data.total} events
        </p>
      )}
    </div>
  );
}

// ─── Skeleton ────────────────────────────────────────────────────────────────

export function PortalPaymentStatusTimelineSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="h-12 rounded-lg bg-muted" />
      <div className="space-y-3 pt-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex gap-4">
            <div className="h-9 w-9 shrink-0 rounded-full bg-muted" />
            <div className="flex-1 space-y-2 pb-6">
              <div className="h-5 w-32 rounded bg-muted" />
              <div className="h-4 w-24 rounded bg-muted" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
