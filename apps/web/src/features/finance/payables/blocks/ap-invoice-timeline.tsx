'use client';

import { DateCell } from '@/components/erp/date-cell';
import { Badge } from '@/components/ui/badge';
import type { InvoiceTimelineEntry } from '../queries/ap-hold.queries';

interface ApInvoiceTimelineProps {
  entries: InvoiceTimelineEntry[];
}

const ACTION_LABELS: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' | 'destructive' }> = {
  CREATED: { label: 'Created', variant: 'secondary' },
  APPROVED: { label: 'Approved', variant: 'default' },
  POSTED: { label: 'Posted', variant: 'default' },
  PAID: { label: 'Paid', variant: 'default' },
  PARTIALLY_PAID: { label: 'Partial Payment', variant: 'outline' },
  CANCELLED: { label: 'Cancelled', variant: 'destructive' },
  VOIDED: { label: 'Voided', variant: 'destructive' },
  HOLD_PLACED: { label: 'Hold Placed', variant: 'destructive' },
  HOLD_RELEASED: { label: 'Hold Released', variant: 'outline' },
  REVERSED: { label: 'Reversed', variant: 'destructive' },
};

export function ApInvoiceTimeline({ entries }: ApInvoiceTimelineProps) {
  if (entries.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        No timeline events recorded for this invoice.
      </p>
    );
  }

  return (
    <div className="relative space-y-0">
      {entries.map((entry, i) => {
        const config = ACTION_LABELS[entry.action] ?? { label: entry.action, variant: 'secondary' as const };
        const isLast = i === entries.length - 1;

        return (
          <div key={entry.id} className="relative flex gap-4 pb-6">
            {/* Timeline connector */}
            <div className="flex flex-col items-center">
              <div className="h-3 w-3 rounded-full border-2 border-primary bg-background" />
              {!isLast && <div className="w-px flex-1 bg-border" />}
            </div>

            {/* Content */}
            <div className="flex-1 -mt-0.5 space-y-1">
              <div className="flex items-center gap-2">
                <Badge variant={config.variant} className="text-xs">
                  {config.label}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  <DateCell date={entry.timestamp} format="medium" />
                </span>
              </div>
              {entry.userName && (
                <p className="text-sm text-muted-foreground">by {entry.userName}</p>
              )}
              {entry.details && (
                <p className="text-sm text-muted-foreground">{entry.details}</p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
