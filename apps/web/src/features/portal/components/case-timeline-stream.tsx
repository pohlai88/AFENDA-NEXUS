'use client';

import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { DateCell } from '@/components/erp/date-cell';
import { MessageSquare, ArrowRightLeft, User, Paperclip, AlertTriangle, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { PortalCaseTimelineEntry } from '@/features/portal/queries/portal.queries';

/**
 * V2 §2.4 — Unified timeline with filter chips.
 *
 * "Single 'Activity' stream with filter chips (messages only / status only / all),
 *  not separate widgets. Each entry shows: timestamp, actor (name + role badge),
 *  action text, proof-chain hash (linkable to verification page)."
 */

type FilterKey = 'all' | 'message' | 'status' | 'system';

const FILTER_CHIPS: { key: FilterKey; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'message', label: 'Messages' },
  { key: 'status', label: 'Status' },
  { key: 'system', label: 'System' },
];

const ENTRY_ICONS: Record<string, typeof MessageSquare> = {
  message: MessageSquare,
  status: ArrowRightLeft,
  system: User,
  attachment: Paperclip,
  sla_breach: AlertTriangle,
  escalation: Zap,
};

interface Props {
  entries: readonly PortalCaseTimelineEntry[];
}

export function CaseTimelineStream({ entries }: Props) {
  const [activeFilter, setActiveFilter] = useState<FilterKey>('all');

  const filtered =
    activeFilter === 'all' ? entries : entries.filter((e) => e.entryType === activeFilter);

  return (
    <div className="space-y-4">
      {/* Filter Chips */}
      <div className="flex flex-wrap gap-2">
        {FILTER_CHIPS.map((chip) => {
          const count =
            chip.key === 'all'
              ? entries.length
              : entries.filter((e) => e.entryType === chip.key).length;
          return (
            <button
              key={chip.key}
              type="button"
              onClick={() => setActiveFilter(chip.key)}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-colors',
                activeFilter === chip.key
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-border bg-background text-muted-foreground hover:bg-muted'
              )}
            >
              {chip.label}
              <span
                className={cn(
                  'rounded-full px-1.5 py-0.5 text-[10px]',
                  activeFilter === chip.key
                    ? 'bg-primary-foreground/20 text-primary-foreground'
                    : 'bg-muted text-muted-foreground'
                )}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Entries */}
      {filtered.length > 0 ? (
        <div className="space-y-4">
          {filtered.map((entry, i) => {
            const Icon = ENTRY_ICONS[entry.entryType] ?? MessageSquare;
            return (
              <div key={entry.id}>
                {i > 0 && <Separator className="mb-4" />}
                <div className="flex gap-3">
                  <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted">
                    <Icon className="h-3 w-3 text-muted-foreground" aria-hidden="true" />
                  </div>
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Badge variant="outline" className="text-[10px]">
                        {entry.actorType}
                      </Badge>
                      <span>{entry.entryType}</span>
                      <span>&middot;</span>
                      <DateCell date={entry.createdAt} format="long" />
                      {entry.proofHash && (
                        <>
                          <span>&middot;</span>
                          <span
                            className="font-mono text-[10px] text-muted-foreground/60"
                            title={`Proof hash: ${entry.proofHash}`}
                          >
                            [{entry.proofHash.slice(0, 7)}&hellip;]
                          </span>
                        </>
                      )}
                    </div>
                    {entry.content && (
                      <div className="text-sm">
                        {entry.entryType === 'message' &&
                        (entry.content as Record<string, unknown>).message ? (
                          <p className="whitespace-pre-wrap">
                            {(entry.content as Record<string, unknown>).message as string}
                          </p>
                        ) : entry.entryType === 'status' ? (
                          <p>
                            Status changed:{' '}
                            <span className="font-medium">
                              {((entry.content as Record<string, unknown>).fromStatus as string) ??
                                'N/A'}
                            </span>
                            {' → '}
                            <span className="font-medium">
                              {(entry.content as Record<string, unknown>).toStatus as string}
                            </span>
                            {!!(entry.content as Record<string, unknown>).comment && (
                              <span className="text-muted-foreground">
                                {' — '}
                                {String((entry.content as Record<string, unknown>).comment)}
                              </span>
                            )}
                          </p>
                        ) : (
                          <pre className="text-xs text-muted-foreground">
                            {JSON.stringify(entry.content, null, 2)}
                          </pre>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <p className="text-center text-sm text-muted-foreground">
          {activeFilter === 'all'
            ? 'No timeline entries yet.'
            : `No ${activeFilter} entries found.`}
        </p>
      )}
    </div>
  );
}
