import type { Metadata } from 'next';
import { DomainDashboardShell } from '@/lib/dashboards';
import { FINANCE_TREASURY_CONFIG } from '@/lib/dashboards';

export const metadata: Metadata = {
  title: 'Treasury',
  description: 'Cash Forecasts, FX Rates, Loans',
};

/**
 * Treasury — domain dashboard.
 * Two-panel layout: KPI deck (top) + feature grid (bottom).
 */
export default function TreasuryPage() {
  return <DomainDashboardShell config={FINANCE_TREASURY_CONFIG} />;
}
