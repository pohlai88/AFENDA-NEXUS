import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Format number as currency */
export function formatCurrency(value: number, currency = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

/**
 * Format compact value for chart axes/tooltips (e.g. $1,000K, $1.5M).
 * Uses Intl for currency symbol — no hardcoded symbols.
 */
export function formatChartValue(value: number, currency = 'USD'): string {
  const symbol = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  })
    .formatToParts(0)
    .find((p) => p.type === 'currency')?.value ?? '$';
  if (Math.abs(value) >= 1_000_000) return `${symbol}${(value / 1_000_000).toFixed(2)}M`;
  if (Math.abs(value) >= 1_000) return `${symbol}${(value / 1_000).toFixed(0)}K`;
  return new Intl.NumberFormat('en-US').format(value);
}

/** Format date for display */
export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(d);
}

/**
 * Re-export from `@/lib/format` — the canonical formatting module.
 * Kept here for backward-compatible imports (`import { formatRelativeTime } from '@/lib/utils'`).
 */
export { formatRelativeTime } from '@/lib/format';
