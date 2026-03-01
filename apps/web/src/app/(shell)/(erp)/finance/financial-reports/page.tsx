import type { Metadata } from 'next';
import { DomainDashboardShell } from '@/lib/dashboards';
import { FINANCE_REPORTS_CONFIG } from '@/lib/dashboards';

export const metadata: Metadata = {
  title: 'Financial Reports',
  description: 'Balance Sheet, Income Statement, Cash Flow',
};

/**
 * Financial Reports — domain dashboard.
 * Two-panel layout: KPI deck (top) + feature grid (bottom).
 */
export default function FinancialReportsPage() {
  return <DomainDashboardShell config={FINANCE_REPORTS_CONFIG} />;
}
