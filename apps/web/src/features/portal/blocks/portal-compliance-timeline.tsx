'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatusBadge } from '@/components/erp/status-badge';
import {
  ShieldCheck,
  ShieldAlert,
  ShieldX,
  Bell,
  FileUp,
  RefreshCw,
  Briefcase,
} from 'lucide-react';
import type { PortalComplianceTimelineEntry } from '../queries/portal.queries';

const EVENT_ICONS: Record<string, React.ElementType> = {
  ITEM_CREATED: ShieldCheck,
  VERIFIED: ShieldCheck,
  ALERT_SENT: Bell,
  DOCUMENT_UPLOADED: FileUp,
  RENEWAL_SUBMITTED: RefreshCw,
  EXPIRED: ShieldX,
  AUTO_CASE_CREATED: Briefcase,
};

const EVENT_LABELS: Record<string, string> = {
  ITEM_CREATED: 'Compliance item created',
  VERIFIED: 'Item verified',
  ALERT_SENT: 'Expiry alert sent',
  DOCUMENT_UPLOADED: 'Document uploaded',
  RENEWAL_SUBMITTED: 'Renewal submitted',
  EXPIRED: 'Item expired',
  AUTO_CASE_CREATED: 'Case auto-created',
};

function getEventVariant(eventType: string): 'default' | 'outline' | 'destructive' | 'secondary' {
  switch (eventType) {
    case 'VERIFIED':
    case 'RENEWAL_SUBMITTED':
      return 'default';
    case 'ALERT_SENT':
      return 'outline';
    case 'EXPIRED':
    case 'AUTO_CASE_CREATED':
      return 'destructive';
    default:
      return 'secondary';
  }
}

interface PortalComplianceTimelineBlockProps {
  entries: PortalComplianceTimelineEntry[];
}

export function PortalComplianceTimelineBlock({ entries }: PortalComplianceTimelineBlockProps) {
  if (entries.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <ShieldAlert className="mx-auto h-10 w-10 text-muted-foreground" />
          <p className="mt-4 text-sm text-muted-foreground">No compliance events recorded yet.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Event Timeline</CardTitle>
      </CardHeader>
      <CardContent>
        <ol
          className="relative border-l border-muted-foreground/25 pl-6"
          aria-label="Compliance timeline"
        >
          {entries.map((entry) => {
            const Icon = EVENT_ICONS[entry.eventType] ?? ShieldAlert;
            const label = EVENT_LABELS[entry.eventType] ?? entry.eventType;
            const variant = getEventVariant(entry.eventType);

            return (
              <li key={entry.id} className="mb-8 last:mb-0">
                <span className="absolute -left-3 flex h-6 w-6 items-center justify-center rounded-full bg-background ring-2 ring-muted">
                  <Icon className="h-3.5 w-3.5 text-muted-foreground" aria-hidden />
                </span>
                <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-3">
                  <time
                    dateTime={entry.createdAt}
                    className="text-xs font-medium text-muted-foreground"
                  >
                    {new Date(entry.createdAt).toLocaleDateString('en-ZA', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </time>
                  <StatusBadge status={label} variant={variant} showIcon={false} />
                </div>
                <p className="mt-1 text-sm">
                  <span className="font-medium">{entry.itemType}</span>
                  {entry.details && Object.keys(entry.details).length > 0 && (
                    <span className="ml-1 text-muted-foreground">
                      &mdash;{' '}
                      {Object.entries(entry.details)
                        .map(([k, v]) => `${k}: ${String(v)}`)
                        .join(', ')}
                    </span>
                  )}
                </p>
              </li>
            );
          })}
        </ol>
      </CardContent>
    </Card>
  );
}
