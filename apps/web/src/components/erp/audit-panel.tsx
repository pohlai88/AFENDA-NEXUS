import * as React from 'react';
import { User, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatRelativeTime, formatDateTime } from '@/lib/format';
import type { AuditEntry } from '@/lib/types';

// ─── Types ───────────────────────────────────────────────────────────────────

interface AuditPanelProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Chronological list of audit trail entries. */
  entries: AuditEntry[];
}

// ─── Component ───────────────────────────────────────────────────────────────

const AuditPanel = React.forwardRef<HTMLDivElement, AuditPanelProps>(
  ({ entries, className, ...props }, ref) => {
    if (entries.length === 0) {
      return (
        <div
          ref={ref}
          role="status"
          className={cn('py-8 text-center text-sm text-muted-foreground', className)}
          {...props}
        >
          No audit history available.
        </div>
      );
    }

    return (
      <div ref={ref} className={cn('space-y-0', className)} {...props}>
        <h4 className="mb-3 text-sm font-semibold">Audit Trail</h4>
        <ol className="relative border-l border-border" aria-label="Audit history">
          {entries.map((entry) => (
            <li key={entry.id} className="mb-4 ml-4">
              <div className="absolute -left-1.5 mt-1.5 h-3 w-3 rounded-full border border-background bg-border" />
              <div className="flex items-center gap-2 text-sm">
                <span className="font-medium">{entry.action}</span>
                <span className="text-muted-foreground">
                  <time dateTime={entry.timestamp} title={formatDateTime(entry.timestamp)}>
                    {formatRelativeTime(entry.timestamp)}
                  </time>
                </span>
              </div>
              <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1">
                  <User className="h-3 w-3" aria-hidden="true" />
                  {entry.userName ?? entry.userId}
                </span>
                {entry.correlationId && (
                  <span className="inline-flex items-center gap-1">
                    <Clock className="h-3 w-3" aria-hidden="true" />
                    <code className="font-mono">{entry.correlationId.slice(0, 8)}</code>
                  </span>
                )}
              </div>
              {entry.details && (
                <p className="mt-1 text-xs text-muted-foreground">{entry.details}</p>
              )}
            </li>
          ))}
        </ol>
      </div>
    );
  },
);
AuditPanel.displayName = 'AuditPanel';

export { AuditPanel };
export type { AuditPanelProps };
