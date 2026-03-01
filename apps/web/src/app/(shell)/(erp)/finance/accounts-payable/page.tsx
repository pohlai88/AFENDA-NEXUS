import type { Metadata } from 'next';
import { DomainDashboardShell } from '@/lib/dashboards';
import { FINANCE_AP_CONFIG } from '@/lib/dashboards';

export const metadata: Metadata = {
  title: 'Accounts Payable',
  description: 'AP Invoices, Payment Runs, Suppliers',
};

/**
 * Accounts Payable — domain dashboard.
 * Two-panel layout: KPI deck (top) + feature grid (bottom).
 */
export default function AccountsPayablePage() {
  return <DomainDashboardShell config={FINANCE_AP_CONFIG} />;
}
