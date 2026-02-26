import { currencyConfig } from './constants';

// ─── Money Formatting ───────────────────────────────────────────────────────

export function formatMoney(
  amount: number | bigint | string,
  currency = 'USD',
  options?: { showSymbol?: boolean; showCode?: boolean }
): string {
  const { showSymbol = true, showCode = false } = options ?? {};
  const config = currencyConfig[currency] ?? { symbol: '', decimals: 2 };

  const numericAmount =
    typeof amount === 'bigint'
      ? Number(amount) / Math.pow(10, config.decimals)
      : typeof amount === 'string'
        ? parseFloat(amount) / Math.pow(10, config.decimals)
        : amount;

  const formatted = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: config.decimals,
    maximumFractionDigits: config.decimals,
  }).format(numericAmount);

  if (showCode) return `${formatted} ${currency}`;
  if (showSymbol) return `${config.symbol}${formatted}`;
  return formatted;
}

// ─── Date Formatting ────────────────────────────────────────────────────────

export function formatDate(
  date: string | Date,
  style: 'short' | 'medium' | 'long' = 'medium'
): string {
  const d = typeof date === 'string' ? new Date(date) : date;

  const options: Intl.DateTimeFormatOptions =
    style === 'short'
      ? { year: 'numeric', month: '2-digit', day: '2-digit' }
      : style === 'medium'
        ? { year: 'numeric', month: 'short', day: 'numeric' }
        : { year: 'numeric', month: 'long', day: 'numeric' };

  return d.toLocaleDateString('en-US', options);
}

export function formatDateTime(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
}

export function formatRelativeTime(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / 60_000);
  const diffHours = Math.floor(diffMs / 3_600_000);
  const diffDays = Math.floor(diffMs / 86_400_000);

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return formatDate(d, 'short');
}

// ─── Number Formatting ──────────────────────────────────────────────────────

export function formatNumber(value: number, decimals = 0): string {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

export function formatPercent(value: number, decimals = 1): string {
  return `${(value * 100).toFixed(decimals)}%`;
}

// ─── ID Truncation (for display) ────────────────────────────────────────────

export function truncateId(id: string, chars = 8): string {
  if (id.length <= chars) return id;
  return `${id.slice(0, chars)}…`;
}
