import type { Metadata } from 'next';
import { DomainDashboardShell } from '@/lib/dashboards';
import { FINANCE_CONTROLLING_CONFIG } from '@/lib/dashboards';

export const metadata: Metadata = {
  title: 'Controlling',
  description: 'Cost Centers, Projects, Allocations',
};

/**
 * Controlling — domain dashboard.
 * Two-panel layout: KPI deck (top) + feature grid (bottom).
 */
export default function ControllingPage() {
  return <DomainDashboardShell config={FINANCE_CONTROLLING_CONFIG} />;
}
