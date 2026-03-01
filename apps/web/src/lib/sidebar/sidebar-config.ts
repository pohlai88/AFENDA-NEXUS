/**
 * @module sidebar-config
 *
 * Canonical sidebar constants shared across ModuleRail, DomainPopover,
 * and any future sidebar components (e.g. AppSidebar).
 *
 * @see {@link @/lib/constants} for canonical route paths.
 *
 * Eliminates duplication of accent maps, shortcut hints, and the
 * NavIcon helper that previously lived in 3+ files.
 */

import type { ModuleAccent, ModuleId } from '@/lib/modules/types';
import type { ShellShortcut } from '@/components/afenda/shell.tokens';
import { routes } from '@/lib/constants';

// ─── Accent Colour Maps ─────────────────────────────────────────────────────

/** Module-accent → foreground text colour (light + dark mode). */
export const ACCENT_TEXT: Record<ModuleAccent, string> = {
  emerald: 'text-emerald-600 dark:text-emerald-400',
  violet: 'text-violet-600 dark:text-violet-400',
  sky: 'text-sky-600 dark:text-sky-400',
  amber: 'text-amber-600 dark:text-amber-400',
  rose: 'text-rose-600 dark:text-rose-400',
  slate: 'text-foreground',
  red: 'text-red-600 dark:text-red-400',
} as const;

/** Module-accent → background highlight colour (light + dark mode). */
export const ACCENT_BG: Record<ModuleAccent, string> = {
  emerald: 'bg-emerald-100 dark:bg-emerald-900/30',
  violet: 'bg-violet-100 dark:bg-violet-900/30',
  sky: 'bg-sky-100 dark:bg-sky-900/30',
  amber: 'bg-amber-100 dark:bg-amber-900/30',
  rose: 'bg-rose-100 dark:bg-rose-900/30',
  slate: 'bg-accent',
  red: 'bg-red-100 dark:bg-red-900/30',
} as const;

// ─── Module Classification ───────────────────────────────────────────────────

/** Module IDs that render in the sidebar footer (settings, admin). */
export const UTILITY_MODULE_IDS = new Set(['settings', 'admin']);

// ─── Config-Driven Navigation Shortcuts ─────────────────────────────────────

/**
 * Canonical shell shortcuts — single source of truth.
 * Label is explicit: no heuristics, no guessing from route segments.
 */
export const SHELL_SHORTCUTS: ShellShortcut[] = [
  { id: 'nav-home', keys: 'g d', href: routes.home, label: 'Dashboard', scope: 'global' },
  { id: 'nav-journals', keys: 'g j', href: routes.finance.journals, label: 'Journals', scope: 'global' },
  { id: 'nav-accounts', keys: 'g a', href: routes.finance.accounts, label: 'Accounts', scope: 'global' },
  { id: 'nav-periods', keys: 'g p', href: routes.finance.periods, label: 'Periods', scope: 'global' },
  { id: 'nav-ledgers', keys: 'g l', href: routes.finance.ledgers, label: 'Ledgers', scope: 'global' },
  { id: 'nav-banking', keys: 'g b', href: routes.finance.banking, label: 'Banking', scope: 'global' },
  { id: 'nav-expenses', keys: 'g x', href: routes.finance.expenses, label: 'Expenses', scope: 'global' },
  { id: 'nav-settings', keys: 'g s', href: routes.settings, label: 'Settings', scope: 'global' },
];

/**
 * Lookup table: href → keyboard shortcut hint string.
 * Used by DomainPopover to render <Kbd> hints next to nav items.
 */
export const SHORTCUT_HINTS: Record<string, string> = Object.fromEntries(
  SHELL_SHORTCUTS.map((s) => [s.href, s.keys]),
);

// ─── Sidebar Nav-Main Items ──────────────────────────────────────────────────

/**
 * Static definition for the top-level quick-access items (Home, Approvals).
 *
 * **badge is intentionally omitted** — it must come from live data
 * (e.g. AttentionSummary.total or a pending-approval count query),
 * never hardcoded.
 */
export interface NavMainItemDef {
  title: string;
  href: string;
  icon: string;
  /** 3D emoji shown in sidebar (matches category emoji style). */
  emoji: string;
}

export const NAV_MAIN_ITEMS: NavMainItemDef[] = [
  { title: 'Home', href: '/home', icon: 'Home', emoji: '🏠' },
  { title: 'Approvals', href: routes.finance.approvals, icon: 'CheckCircle', emoji: '📋' },
];

// ─── Sidebar Category Definitions ────────────────────────────────────────────

/**
 * Category grouping for the Navigation section.
 *
 * Hierarchy: Category → Module(s).
 *   🏢 ERP          → Finance, HRM, CRM
 *   🏛️ Boardroom    → Boardroom
 *   ⚙️ Configuration → Settings, Admin
 */
export interface CategoryDef {
  label: string;
  emoji: string;
  icon: string;
  moduleIds: readonly ModuleId[];
}

export const CATEGORY_DEFS: CategoryDef[] = [
  { label: 'ERP', emoji: '🏢', icon: 'Landmark', moduleIds: ['finance', 'hrm', 'crm'] },
  { label: 'Boardroom', emoji: '🏛️', icon: 'MessageSquare', moduleIds: ['boardroom'] },
  { label: 'Configuration', emoji: '⚙️', icon: 'Settings', moduleIds: ['settings', 'admin'] },
];

// ─── Secondary Nav Items ─────────────────────────────────────────────────────

/**
 * Definitions for bottom-bar items gated by module visibility.
 * Each entry maps a moduleId to its sidebar appearance.
 */
export interface SecondaryItemDef {
  moduleId: ModuleId;
  title: string;
  href: string;
  icon: string;
}

export const SECONDARY_ITEM_DEFS: SecondaryItemDef[] = [
  { moduleId: 'settings', title: 'Settings', href: '/settings', icon: 'Settings' },
  { moduleId: 'admin', title: 'Admin', href: '/admin', icon: 'ShieldCheck' },
];

