/**
 * Afenda Shell — Centralised Design Tokens
 *
 * Single source of truth for every repeated Tailwind class pattern used
 * across the shell.  Change here → propagates everywhere.
 *
 * HOW IT WORKS
 * ─────────────────────────────────────────────────────────────────────────
 * 1. **CSS custom properties** (`--shell-header-h`, `--shell-content-max-w`,
 *    `--shell-action-gap`, `--shell-scroll-max-h`) are defined in the
 *    design system (`packages/design-system/src/styles/_tokens-light.css`)
 *    and overridden per density profile in `_density.css`.
 *
 * 2. **This file** re-exports those CSS variables as Tailwind class strings
 *    so components never hardcode a raw value.  Tailwind v4's Oxide scanner
 *    detects the class names in these string literals.
 *
 * 3. Components import tokens: `import { SHELL } from './shell.tokens';`
 *    and apply them: `className={cn(SHELL.HEADER, ...)}`
 *
 * ADDING A TOKEN
 * ─────────────────────────────────────────────────────────────────────────
 * 1. Add the CSS var default to `_tokens-light.css`.
 * 2. Override per density in `_density.css`.
 * 3. Map to Tailwind in `_theme.css` (`@theme inline`).
 * 4. Add the Tailwind class here.
 */

// ─── Types ───────────────────────────────────────────────────────────────────

/** A config-driven navigation shortcut registered in the shell. */
export interface ShellShortcut {
  /** Unique identifier for keyboard-shortcut registration. */
  id: string;
  /** Key combo string (e.g. 'g d' for Go + D). */
  keys: string;
  /** Target URL. */
  href: string;
  /** Human-readable label shown in shortcut dialog / tooltip. */
  label: string;
  /** Shortcut scope — defaults to 'global'. */
  scope?: 'dialog' | 'cmdk' | 'sheet' | 'table' | 'page' | 'global';
}

// ─── Layout ──────────────────────────────────────────────────────────────────

/** Sticky site-header: density-aware height via `--shell-header-h`. */
export const HEADER_HEIGHT = 'h-(--shell-header-h)' as const;

/** Anything that needs to stick below the header uses this offset. */
export const HEADER_OFFSET = 'top-(--shell-header-h)' as const;

/** Ultra-wide guardrail — prevents content stretching on 4K monitors. */
export const CONTENT_MAX_W = 'max-w-(--shell-content-max-w)' as const;

/** Page gutters — adapts to density via --spacing-page-x / --spacing-page-y. */
export const CONTENT_PADDING = 'px-(--spacing-page-x) py-(--spacing-page-y)' as const;

// ─── Action Cluster (header toolbar) ─────────────────────────────────────────

/** Gap between action buttons in the header toolbar. */
export const ACTION_GAP = 'gap-(--shell-action-gap)' as const;

/** Standard action button size in the header (32px). */
export const ACTION_BTN = 'size-8' as const;

// ─── Icon Scale ──────────────────────────────────────────────────────────────

/** 16px — primary icon size (toolbar, list items). */
export const ICON = 'size-4' as const;

/** 14px — secondary icon (chevrons, small indicators). */
export const ICON_SM = 'size-3.5' as const;

/** 12px — heading/group label icon. */
export const ICON_XS = 'size-3' as const;

/** 20px — module rail icon. */
export const ICON_MD = 'size-5' as const;

// ─── Module Rail ─────────────────────────────────────────────────────────────

/** Rail button hit-target (36px). */
export const RAIL_BTN = 'size-9' as const;

/** Brand logo inside the rail (28px). */
export const RAIL_LOGO = 'size-7' as const;

// ─── Scroll Areas ────────────────────────────────────────────────────────────

/** Max height for popover / dialog scroll regions — consistent at 70vh. */
export const SCROLL_MAX_H = 'max-h-(--shell-scroll-max-h)' as const;

// ─── Popover / Panel Widths ──────────────────────────────────────────────────

/** Domain navigation popover (sidebar-10 pattern). */
export const POPOVER_DOMAIN_W = 'w-80' as const;

/** Attention summary popover. */
export const POPOVER_ATTENTION_W = 'w-96' as const;

/** Notification popover (header). */
export const POPOVER_NOTIFICATION_W = 'w-80 sm:w-96' as const;

/** Display settings dropdown. */
export const DROPDOWN_DISPLAY_W = 'w-48' as const;

/** Display settings popover (improved readability). */
export const POPOVER_DISPLAY_W = 'w-56' as const;

/** Desktop search input bar. */
export const SEARCH_BAR_W = 'w-64' as const;

// ─── Badge Helpers ──────────────────────────────────────────────────────────

/** Notification counter badge (absolute-positioned pill over icon buttons). */
export const NOTIFICATION_COUNTER = 'absolute -right-0.5 -top-0.5 h-4 min-w-4 justify-center rounded-full px-1 text-xs font-bold leading-none' as const;

/** Warning badge accent — for outline badges with warning semantics. */
export const BADGE_WARNING = 'border-warning/50 text-warning' as const;

// ─── Composite helpers ───────────────────────────────────────────────────────

/**
 * Shell object — grouped re-export for destructuring.
 *
 * Usage:
 * ```ts
 * import { SHELL } from './shell.tokens';
 * <header className={cn(SHELL.HEADER, 'sticky top-0 ...')} />
 * ```
 */
export const SHELL = {
  HEADER_HEIGHT,
  HEADER_OFFSET,
  CONTENT_MAX_W,
  CONTENT_PADDING,
  ACTION_GAP,
  ACTION_BTN,
  ICON,
  ICON_SM,
  ICON_XS,
  ICON_MD,
  RAIL_BTN,
  RAIL_LOGO,
  SCROLL_MAX_H,
  POPOVER_DOMAIN_W,
  POPOVER_ATTENTION_W,
  POPOVER_NOTIFICATION_W,
  DROPDOWN_DISPLAY_W,
  POPOVER_DISPLAY_W,
  SEARCH_BAR_W,
  NOTIFICATION_COUNTER,
  BADGE_WARNING,
} as const;
