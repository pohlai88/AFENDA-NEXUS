// ─── Search Types ─────────────────────────────────────────────────────────────
//
// Unified types for the command palette v2: entity search, action registry,
// recent navigation, and favorites integration.
//
// ─────────────────────────────────────────────────────────────────────────────

/** Broad categories displayed as groups in the command palette. */
export type SearchCategory =
  | 'recent'
  | 'favorite'
  | 'action'
  | 'navigation'
  | 'entity';

/**
 * A unified search result rendered in the command palette.
 * Each result maps to a single navigable destination or executable action.
 */
export interface SearchResult {
  /** Unique result identifier. */
  id: string;
  /** Display category — controls grouping order in the palette. */
  category: SearchCategory;
  /** Primary display text. */
  title: string;
  /** Secondary display text (e.g. module name, entity type). */
  subtitle?: string;
  /** Lucide icon name for rendering. */
  icon?: string;
  /** Navigation destination (mutually exclusive with `handler`). */
  href?: string;
  /** Module this result belongs to (for scoping / grouping). */
  moduleId?: string;
  /** Keyboard shortcut hint (e.g. "g j"). */
  shortcut?: string;
}

/** CRUD operation category for action grouping. */
export type ActionCategory = 'create' | 'view' | 'manage' | 'report' | 'utility';

/**
 * An executable action registered in the palette.
 * Actions can have both a handler (for inline execution) and an href (for navigation).
 */
export interface SearchAction {
  /** Unique action identifier (e.g. "new-journal-entry"). */
  id: string;
  /** Display text. */
  title: string;
  /** Lucide icon name. */
  icon: string;
  /** CRUD category — controls grouping in the quick-action picker. */
  category?: ActionCategory;
  /** Keyboard shortcut hint. */
  shortcut?: string;
  /** Optional scope filter — shown only when this module is active. */
  scope?: string;
  /** Execute the action. If absent, the action navigates via `href`. */
  handler?: () => void;
  /** Navigation destination (used when no handler is provided). */
  href?: string;
}

/**
 * Entity search result from the server.
 * Extends SearchResult with entity-specific metadata.
 */
export interface EntitySearchResult extends SearchResult {
  category: 'entity';
  /** The entity type for badge display (e.g. "Journal", "Account"). */
  entityType: 'journal' | 'account' | 'supplier' | 'invoice';
}
