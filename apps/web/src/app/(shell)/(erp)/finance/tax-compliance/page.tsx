import type { Metadata } from 'next';
import { DomainDashboardShell } from '@/lib/dashboards';
import { FINANCE_TAX_CONFIG } from '@/lib/dashboards';

export const metadata: Metadata = {
  title: 'Tax & Compliance',
  description: 'Tax Codes, Returns, WHT Certificates',
};

/**
 * Tax & Compliance — domain dashboard.
 * Two-panel layout: KPI deck (top) + feature grid (bottom).
 */
export default function TaxCompliancePage() {
  return <DomainDashboardShell config={FINANCE_TAX_CONFIG} />;
}
