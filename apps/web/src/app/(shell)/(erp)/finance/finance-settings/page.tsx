import type { Metadata } from 'next';
import { DomainDashboardShell } from '@/lib/dashboards';
import { FINANCE_SETTINGS_CONFIG } from '@/lib/dashboards';

export const metadata: Metadata = {
  title: 'Finance Settings',
  description: 'Payment Terms, Match Tolerances, Settings',
};

/**
 * Finance Settings — domain dashboard.
 * Two-panel layout: KPI deck (top) + feature grid (bottom).
 */
export default function FinanceSettingsPage() {
  return <DomainDashboardShell config={FINANCE_SETTINGS_CONFIG} />;
}
