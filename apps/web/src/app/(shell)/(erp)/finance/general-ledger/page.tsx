import type { Metadata } from 'next';
import { DomainDashboardShell } from '@/lib/dashboards';
import { FINANCE_GL_CONFIG } from '@/lib/dashboards';

export const metadata: Metadata = {
  title: 'General Ledger',
  description: 'Chart of Accounts, Journals, Fiscal Periods',
};

/**
 * General Ledger — domain dashboard.
 * Two-panel layout: KPI deck (top) + feature grid (bottom).
 */
export default function GeneralLedgerPage() {
  return <DomainDashboardShell config={FINANCE_GL_CONFIG} />;
}
