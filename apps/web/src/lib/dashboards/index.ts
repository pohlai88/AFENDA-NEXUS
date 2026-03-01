// ─── Domain Dashboard System ────────────────────────────────────────────────
// Barrel export for the headless domain dashboard primitives.

export { DomainDashboardShell } from './domain-dashboard-shell';
export { DomainDashboardLayout } from './domain-dashboard-layout';
export { DashboardVisualsSection } from './dashboard-visuals-section';
export { FeatureGrid } from './feature-grid';
export { FeatureCard } from './feature-card';
export { KpiDeck } from './kpi-deck.client';
export { WidgetConfigDialog } from './widget-config-dialog.client';
export { saveDashboardPrefs } from './actions';
export {
  FINANCE_OVERVIEW_CONFIG,
  FINANCE_AP_CONFIG,
  FINANCE_AR_CONFIG,
  FINANCE_GL_CONFIG,
  FINANCE_BANKING_CONFIG,
  FINANCE_ASSETS_CONFIG,
  FINANCE_TRAVEL_CONFIG,
  FINANCE_TREASURY_CONFIG,
  FINANCE_CONTROLLING_CONFIG,
  FINANCE_TAX_CONFIG,
  FINANCE_IC_CONFIG,
  FINANCE_IFRS_CONFIG,
  FINANCE_CONSOLIDATION_CONFIG,
  FINANCE_SETTINGS_CONFIG,
  FINANCE_REPORTS_CONFIG,
  getDomainDashboardConfig,
} from './domain-configs';
export type {
  DomainDashboardConfig,
} from './types';
