import type { Metadata } from 'next';
import { DomainDashboardShell } from '@/lib/dashboards';
import { FINANCE_CONSOLIDATION_CONFIG } from '@/lib/dashboards';

export const metadata: Metadata = {
  title: 'Consolidation',
  description: 'Group Entities, Eliminations, Goodwill',
};

/**
 * Consolidation — domain dashboard.
 * Two-panel layout: KPI deck (top) + feature grid (bottom).
 */
export default function ConsolidationPage() {
  return <DomainDashboardShell config={FINANCE_CONSOLIDATION_CONFIG} />;
}
