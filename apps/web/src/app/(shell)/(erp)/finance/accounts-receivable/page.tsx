import type { Metadata } from 'next';
import { DomainDashboardShell } from '@/lib/dashboards';
import { FINANCE_AR_CONFIG } from '@/lib/dashboards';

export const metadata: Metadata = {
  title: 'Accounts Receivable',
  description: 'Customer Invoices, Collections, Credit Control',
};

/**
 * Accounts Receivable — domain dashboard.
 * Two-panel layout: KPI deck (top) + feature grid (bottom).
 */
export default function AccountsReceivablePage() {
  return <DomainDashboardShell config={FINANCE_AR_CONFIG} />;
}
