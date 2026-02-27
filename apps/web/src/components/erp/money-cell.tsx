import * as React from 'react';
import { cn } from '@/lib/utils';
import { formatMoney } from '@/lib/format';

// ─── Types ───────────────────────────────────────────────────────────────────

interface MoneyCellProps extends Omit<React.HTMLAttributes<HTMLSpanElement>, 'children'> {
  /** Monetary amount — accepts number, bigint, or numeric string. */
  amount: number | bigint | string;
  /** ISO-4217 currency code. @default 'USD' */
  currency?: string;
  /** Show currency code (e.g. "USD") after the value. @default false */
  showCode?: boolean;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function toNumber(amount: number | bigint | string): number {
  if (typeof amount === 'bigint') return Number(amount);
  if (typeof amount === 'string') return parseFloat(amount);
  return amount;
}

// ─── Component ───────────────────────────────────────────────────────────────

const MoneyCell = React.forwardRef<HTMLSpanElement, MoneyCellProps>(
  ({ amount, currency = 'USD', showCode = false, className, ...props }, ref) => {
    const isNegative = toNumber(amount) < 0;

    return (
      <span
        ref={ref}
        className={cn(
          'tabular-nums text-right font-mono text-sm',
          isNegative && 'text-destructive',
          className,
        )}
        {...props}
      >
        {formatMoney(amount, currency, { showCode })}
      </span>
    );
  },
);
MoneyCell.displayName = 'MoneyCell';

export { MoneyCell };
export type { MoneyCellProps };
