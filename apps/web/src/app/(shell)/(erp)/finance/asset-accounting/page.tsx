import type { Metadata } from 'next';
import { DomainDashboardShell } from '@/lib/dashboards';
import { FINANCE_ASSETS_CONFIG } from '@/lib/dashboards';

export const metadata: Metadata = {
  title: 'Asset Accounting',
  description: 'Fixed Assets, Depreciation, Intangibles',
};

/**
 * Asset Accounting — domain dashboard.
 * Two-panel layout: KPI deck (top) + feature grid (bottom).
 */
export default function AssetAccountingPage() {
  return <DomainDashboardShell config={FINANCE_ASSETS_CONFIG} />;
}
