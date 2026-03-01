import { z } from 'zod';

// ─── Dashboard Preferences ───────────────────────────────────────────────────
// Per-domain dashboard layout preferences (widget visibility, order, overrides).

/** Bento grid layout item (react-grid-layout compatible). */
export const WidgetLayoutItemSchema = z.object({
  i: z.string(),
  x: z.number(),
  y: z.number(),
  w: z.number(),
  h: z.number(),
});
export type WidgetLayoutItem = z.infer<typeof WidgetLayoutItemSchema>;

/** Time range for KPI aggregation (MTD/QTD/YTD/Custom). */
export const TimeRangeSchema = z.enum(['mtd', 'qtd', 'ytd', 'custom']);
export type TimeRange = z.infer<typeof TimeRangeSchema>;

export const DashboardPrefsSchema = z.object({
  /** KPI widget IDs the user has enabled (subset of the domain's catalog). */
  selectedWidgetIds: z.array(z.string()).optional(),
  /** Display ordering of widgets (KPI IDs). */
  widgetOrder: z.array(z.string()).optional(),
  /** Bento grid layout: position and size per widget (w,h in grid units). */
  widgetLayout: z.array(WidgetLayoutItemSchema).optional(),
  /** Whether the KPI deck (top panel) is collapsed. */
  topCollapsed: z.boolean().optional(),
  /** Time range for KPI aggregation. */
  timeRange: TimeRangeSchema.optional(),
  /** Use plain language labels (e.g. "Money owed" vs "Total Payables"). */
  plainLanguage: z.boolean().optional(),
  /** Selected chart ID from registry (e.g. chart.cashflow). Pick 1. */
  selectedChartId: z.string().optional(),
  /** Selected diagram ID from registry (e.g. diagram.arAging). Pick 1. */
  selectedDiagramId: z.string().optional(),
  /** Active saved view preset ID. "custom" when user has customized. */
  savedViewId: z.string().optional(),
  /** Comparison mode: vs prior period, vs budget, vs plan (NetSuite-style). */
  comparisonMode: z.enum(['none', 'vs_prior_period', 'vs_budget', 'vs_plan']).optional(),
});
export type DashboardPrefs = z.infer<typeof DashboardPrefsSchema>;

// ─── User Preferences (UX only) ──────────────────────────────────────────────
// User-scoped, non-audited. Pure UX: theme, density, sidebar state, etc.

export const UserPreferencesSchema = z.object({
  theme: z.enum(['system', 'light', 'dark']).default('system'),
  density: z.enum(['default', 'compact', 'ultra']).default('default'),
  sidebarCollapsed: z.boolean().default(false),
  lastActiveOrgId: z.string().uuid().optional(),
  tablePresets: z.record(z.string(), z.any()).default({}),
  /** Per-domain dashboard layout prefs, keyed by domain ID (e.g. 'finance.ap'). */
  dashboards: z.record(z.string(), DashboardPrefsSchema).default({}),
});
export type UserPreferences = z.infer<typeof UserPreferencesSchema>;

export const UpdateUserPreferencesSchema = UserPreferencesSchema.partial();
export type UpdateUserPreferences = z.infer<typeof UpdateUserPreferencesSchema>;
