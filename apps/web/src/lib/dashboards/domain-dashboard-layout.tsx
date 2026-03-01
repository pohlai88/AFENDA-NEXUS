import * as React from 'react';
import { Separator } from '@/components/ui/separator';

// ─── Domain Dashboard Layout ────────────────────────────────────────────────
// ERPNext-style two-panel layout:
//   Top panel:  KPI deck (bento, drag-drop) + charts/diagrams
//   Separator:  Clean visual divider
//   Bottom panel: Features & Functions (actionable when scrolled down)
// Server component — receives pre-built panels as children.

interface DomainDashboardLayoutProps {
  /** Domain title (e.g. 'Accounts Payable'). */
  title: string;
  /** Short description shown below the title. */
  description: string;
  /** Optional header bar (time range, plain language). */
  headerBar?: React.ReactNode;
  /** Top panel — KPI deck (client component). */
  kpiDeck: React.ReactNode;
  /** Bottom panel — Feature grid (server component). */
  featureGrid: React.ReactNode;
  /** Optional charts/diagrams (rendered in top panel, above separator). */
  visualsSection?: React.ReactNode;
}

function DomainDashboardLayout({
  title,
  description,
  headerBar,
  kpiDeck,
  featureGrid,
  visualsSection,
}: DomainDashboardLayoutProps) {
  return (
    <div className="flex flex-col gap-6">
      {/* ── Header ── */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        <p className="text-muted-foreground">{description}</p>
      </div>

      {/* ── Header Bar: Time range + Plain language ── */}
      {headerBar}

      {/* ── Top Panel: KPI Deck + Charts/Diagrams ── */}
      <div className="flex flex-col gap-6">
        {kpiDeck}
        {visualsSection}
      </div>

      <Separator />

      {/* ── Bottom Panel: Features & Functions (actionable when scrolled) ── */}
      {featureGrid}
    </div>
  );
}
DomainDashboardLayout.displayName = 'DomainDashboardLayout';

export { DomainDashboardLayout };
export type { DomainDashboardLayoutProps };
