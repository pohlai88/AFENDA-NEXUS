/**
 * Semantic status color mappings using CSS variables from the design system.
 *
 * These replace hardcoded Tailwind palette colors (e.g. bg-green-100 text-green-800)
 * with theme-aware CSS variable classes that respect light/dark mode automatically.
 *
 * Usage in status config objects:
 *   import { statusColor } from '@/lib/status-colors';
 *   const config = { active: { label: 'Active', color: statusColor.success } };
 *
 * Usage inline:
 *   <span className={cn(statusColor.warning, 'px-2 py-1 rounded')}>Draft</span>
 *
 * The `bg` variants provide background + text pairs for badges/pills.
 * The `text` variants provide text-only coloring for inline indicators.
 * The `border` variants provide border coloring for alerts/cards.
 */

// ─── Badge/Pill Colors (background + foreground pairs) ──────────────────────
// These map to the semantic CSS variables in globals.css §2/§3/§5.
// Each provides a light bg + contrasting text that works in both light & dark mode.

export const statusColor = {
  // System-level semantic status (maps to --success, --warning, --info, --destructive)
  success: 'bg-success/15 text-success dark:bg-success/20',
  warning: 'bg-warning/15 text-warning dark:bg-warning/20',
  info: 'bg-info/15 text-info dark:bg-info/20',
  danger: 'bg-destructive/15 text-destructive dark:bg-destructive/20',
  neutral: 'bg-muted text-muted-foreground',

  // Extended palette for multi-state workflows
  purple: 'bg-accent text-accent-foreground',
  muted: 'bg-muted text-muted-foreground',
} as const;

// ─── Text-Only Colors ───────────────────────────────────────────────────────
// For inline text indicators (trend arrows, amounts, percentages).

export const statusText = {
  success: 'text-success',
  warning: 'text-warning',
  info: 'text-info',
  danger: 'text-destructive',
  neutral: 'text-muted-foreground',
} as const;

// ─── Border Colors ──────────────────────────────────────────────────────────
// For alert/card borders.

export const statusBorder = {
  success: 'border-success/30',
  warning: 'border-warning/30',
  info: 'border-info/30',
  danger: 'border-destructive/30',
  neutral: 'border-border',
} as const;

export type StatusIntent = keyof typeof statusColor;
