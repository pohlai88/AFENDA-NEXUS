import type { Metadata } from 'next';
import { DomainDashboardShell } from '@/lib/dashboards';
import { FINANCE_IC_CONFIG } from '@/lib/dashboards';

export const metadata: Metadata = {
  title: 'Intercompany',
  description: 'IC Transactions, Transfer Pricing',
};

/**
 * Intercompany — domain dashboard.
 * Two-panel layout: KPI deck (top) + feature grid (bottom).
 */
export default function IntercompanyPage() {
  return <DomainDashboardShell config={FINANCE_IC_CONFIG} />;
}
