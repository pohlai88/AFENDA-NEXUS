import type { Metadata } from 'next';
import { DomainDashboardShell } from '@/lib/dashboards';
import { FINANCE_IFRS_CONFIG } from '@/lib/dashboards';

export const metadata: Metadata = {
  title: 'IFRS Standards',
  description: 'Leases, Provisions, Instruments, Hedging',
};

/**
 * IFRS & Standards — domain dashboard.
 * Two-panel layout: KPI deck (top) + feature grid (bottom).
 */
export default function IfrsStandardsPage() {
  return <DomainDashboardShell config={FINANCE_IFRS_CONFIG} />;
}
