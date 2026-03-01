import type { Metadata } from 'next';
import { DomainDashboardShell } from '@/lib/dashboards';
import { FINANCE_BANKING_CONFIG } from '@/lib/dashboards';

export const metadata: Metadata = {
  title: 'Banking & Liquidity',
  description: 'Bank Statements, Reconciliation, Matching Rules',
};

/**
 * Banking & Liquidity — domain dashboard.
 * Two-panel layout: KPI deck (top) + feature grid (bottom).
 */
export default function BankingLiquidityPage() {
  return <DomainDashboardShell config={FINANCE_BANKING_CONFIG} />;
}
