import type { NavGroup } from '@/lib/constants';

// ─── Domain Dashboard Types ─────────────────────────────────────────────────
// Headless types powering the two-panel domain dashboard system.

/** Saved view preset (D365-style named views). */
export interface SavedViewPreset {
  id: string;
  label: string;
  /** KPI IDs for this preset. */
  widgetIds: string[];
  /** Chart ID (optional). */
  chartId?: string;
  /** Diagram ID (optional). */
  diagramId?: string;
}

/**
 * Static configuration for a domain dashboard.
 * Defines what KPIs and features a domain offers — NOT user state.
 */
export interface DomainDashboardConfig {
  /** Unique domain identifier (e.g. 'finance.ap', 'finance.gl'). */
  domainId: string;
  /** Human-readable domain title (e.g. 'Accounts Payable'). */
  title: string;
  /** Short description shown below the title. */
  description: string;
  /** Default KPI IDs to show when user has no preferences. */
  defaultKpiIds: string[];
  /** Role-specific default KPIs (owner/admin/member). Used when user has no saved prefs. */
  defaultKpiIdsByRole?: Partial<Record<'owner' | 'admin' | 'member', string[]>>;
  /** KPI IDs available in the Configure dialog. Defaults to defaultKpiIds when absent. */
  availableKpiIds?: string[];
  /** Max KPI cards to display (e.g. 8 for finance overview). Enforced in config dialog. */
  maxWidgets?: number;
  /** Chart IDs from chart registry (e.g. chart.cashflow). Rendered in visuals section. */
  chartSlotIds?: string[];
  /** Diagram IDs from diagram registry (e.g. diagram.arAging). Rendered in visuals section. */
  diagramSlotIds?: string[];
  /** NavGroups powering the bottom feature grid. */
  navGroups: NavGroup[];
  /** Saved view presets (e.g. "Overview", "Cash focus", "Executive"). */
  savedViewPresets?: SavedViewPreset[];
}

/**
 * Feature route card — derived from NavGroup for the bottom panel.
 * Thin wrapper for rendering; actual derivation uses `deriveShortcuts()`.
 */
export type { ShortcutCard as FeatureRouteCard } from '@/lib/modules/derive-shortcuts';
