import type { Metadata } from 'next';
import { DomainDashboardShell } from '@/lib/dashboards';
import { FINANCE_TRAVEL_CONFIG } from '@/lib/dashboards';

export const metadata: Metadata = {
  title: 'Travel & Expenses',
  description: 'Expense Claims, Policies, Reimbursement',
};

/**
 * Travel & Expenses — domain dashboard.
 * Two-panel layout: KPI deck (top) + feature grid (bottom).
 */
export default function TravelExpensesPage() {
  return <DomainDashboardShell config={FINANCE_TRAVEL_CONFIG} />;
}
