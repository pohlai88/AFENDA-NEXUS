import * as React from 'react';
import { deriveShortcuts } from '@/lib/modules/derive-shortcuts';
import { FeatureCard } from './feature-card';
import type { NavGroup } from '@/lib/constants';

// ─── Feature Grid ────────────────────────────────────────────────────────────
// Bottom panel of the domain dashboard. Renders NavGroups as feature cards
// using the existing `deriveShortcuts()` derivation pipeline.
// Server component — no client interactivity needed.

interface FeatureGridProps {
  /** NavGroups for this domain (from DomainDashboardConfig). */
  navGroups: NavGroup[];
}

function FeatureGrid({ navGroups }: FeatureGridProps) {
  const shortcuts = deriveShortcuts(navGroups);

  if (shortcuts.length === 0) return null;

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium text-muted-foreground">
        Features &amp; Functions
      </h3>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {shortcuts.map((card) => (
          <FeatureCard key={card.title} card={card} />
        ))}
      </div>
    </div>
  );
}
FeatureGrid.displayName = 'FeatureGrid';

export { FeatureGrid };
export type { FeatureGridProps };
