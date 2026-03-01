'use client';

import * as React from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { KPICard } from '@/components/erp/kpi-card';
import type { KPICatalogEntry } from '@/lib/kpis/kpi-catalog';
import type { KPIResolverResult } from '@/lib/kpis/kpi-registry.server';
import type { DashboardPrefs } from '@afenda/contracts';

// ─── KPI Deck (Client) ─────────────────────────────────────────────────────
// Top panel of the domain dashboard. Receives server-resolved KPI data
// and renders KPICards in a collapsible grid.
//
// Client responsibilities:
//   - Collapse/expand (persisted via server action)
//   - Hosts the config dialog slot (self-contained Popover)
// Server responsibilities:
//   - KPI resolution, catalog lookup, preference loading

interface KpiDeckProps {
  /** Domain identifier (e.g. 'finance.ap'). */
  domainId: string;
  /** Catalog entries for currently active KPIs. */
  catalog: KPICatalogEntry[];
  /** Resolved data for currently active KPIs (same order as catalog). */
  resolvedKpis: KPIResolverResult[];
  /** Current dashboard prefs. */
  prefs: DashboardPrefs;
  /** Server action to save dashboard prefs. */
  onSavePrefs: (domainId: string, prefs: DashboardPrefs) => Promise<void>;
  /** Slot for the config dialog (self-contained Popover with own trigger). */
  configDialog?: React.ReactNode;
}

function KpiDeck({
  domainId,
  catalog,
  resolvedKpis,
  prefs,
  onSavePrefs,
  configDialog,
}: KpiDeckProps) {
  const [isOpen, setIsOpen] = React.useState(!prefs.topCollapsed);

  const handleToggle = React.useCallback(
    (open: boolean) => {
      setIsOpen(open);
      // Fire-and-forget persistence
      void onSavePrefs(domainId, { ...prefs, topCollapsed: !open });
    },
    [domainId, prefs, onSavePrefs],
  );

  if (catalog.length === 0) {
    return null;
  }

  return (
    <Collapsible open={isOpen} onOpenChange={handleToggle}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="sm" className="gap-1 px-2">
              {isOpen ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
              <span className="text-sm font-medium text-muted-foreground">
                Key Metrics
              </span>
            </Button>
          </CollapsibleTrigger>
          {!isOpen && (
            <span className="text-xs text-muted-foreground">
              {catalog.length} widget{catalog.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>

        {/* Config dialog — self-contained Popover with its own trigger */}
        {configDialog}
      </div>

      <CollapsibleContent className="mt-3">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {resolvedKpis.map((data, i) => (
            <KPICard key={data.id} catalog={catalog[i]!} data={data} />
          ))}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
KpiDeck.displayName = 'KpiDeck';

export { KpiDeck };
export type { KpiDeckProps };
