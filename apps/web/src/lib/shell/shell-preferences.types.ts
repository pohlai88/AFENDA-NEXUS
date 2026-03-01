// ─── Shell Preferences Types ─────────────────────────────────────────────────
//
// Defines the shape and persistence boundary for all shell-level state.
//
// PERSISTENCE BOUNDARY:
//   Cookie (SSR-critical, avoids FOUC / layout shift):
//     - density, leftCollapsed, rightOpen
//     - theme stays with next-themes (already cookie-backed)
//
//   localStorage (convenience, not SSR-critical):
//     - favorites, recents, dashboardLayout
//
// ─────────────────────────────────────────────────────────────────────────────

/** Density profiles matching the design system's `_density.css` pillar. */
export type DensityProfile = 'default' | 'compact' | 'ultra' | 'touch';

/**
 * SSR-critical shell preferences persisted in a single cookie (`shell_prefs`).
 * Versioned for forward-compatible migration.
 */
export interface ShellPreferences {
  /** Schema version — bump on breaking changes. */
  v: 1;
  /** Active density profile. */
  density: DensityProfile;
  /** Whether the left (module) sidebar is collapsed to icon-only rail. */
  leftCollapsed: boolean;
  /** Whether the right (domain) sidebar is visible. */
  rightOpen: boolean;
  /**
   * User-overridden keyboard shortcuts.
   * Key = shortcut id (e.g. "nav-journals"), value = new key combo (e.g. "shift+j").
   * Stored in cookie; falls back to default when absent.
   */
  shortcutOverrides?: Record<string, string>;
}

/** Default preferences used when no cookie is present. */
export const SHELL_PREFS_DEFAULTS: ShellPreferences = {
  v: 1,
  density: 'default',
  leftCollapsed: false,
  rightOpen: true,
  shortcutOverrides: {},
};

// ─── Convenience Preferences (localStorage) ─────────────────────────────────

/** A recently-visited page. No PII stored. */
export interface RecentItem {
  href: string;
  title: string;
  moduleId: string;
  ts: number;
}

/** A user-pinned (starred) page. */
export interface FavoriteItem {
  href: string;
  title: string;
  icon?: string;
  moduleId: string;
  addedAt: number;
}

/** A user-configured quick-action shortcut. */
export interface QuickActionItem {
  /** Navigation target. */
  href: string;
  /** Display label (e.g. "New Journal Entry"). */
  title: string;
  /** Lucide icon name. */
  icon: string;
  /** Source action-registry id for identity. */
  actionId: string;
  /** Position (1-based) → maps to Ctrl+1, Ctrl+2, … Ctrl+9. */
  slot: number;
  /** When the action was pinned. */
  addedAt: number;
}

/** Dashboard widget visibility toggles. */
export interface WidgetVisibility {
  kpis: boolean;
  attention: boolean;
  activity: boolean;
  shortcuts: boolean;
  charts: boolean;
}

/** Default widget visibility. */
export const DEFAULT_WIDGET_VISIBILITY: WidgetVisibility = {
  kpis: true,
  attention: true,
  activity: true,
  shortcuts: true,
  charts: true,
};
