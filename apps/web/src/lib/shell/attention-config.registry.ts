/**
 * Attention popover labels — no hardcoded strings in components.
 */

export const ATTENTION_LABELS = {
  title: 'Needs Attention',
  critical: 'critical',
  warning: 'warning',
  none: 'Needs attention (none)',
  items: (n: number) =>
    n === 1 ? '1 item needs attention' : `${n} items need attention`,
  tooltip: (n: number) =>
    n === 1 ? '1 item needs attention' : `${n} items need attention`,
} as const;
