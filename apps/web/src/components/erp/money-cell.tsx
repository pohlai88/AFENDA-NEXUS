import { cn } from '@/lib/utils';
import { formatMoney } from '@/lib/format';

interface MoneyCellProps {
  amount: number | bigint | string;
  currency?: string;
  className?: string;
  showCode?: boolean;
}

export function MoneyCell({
  amount,
  currency = 'USD',
  className,
  showCode = false,
}: MoneyCellProps) {
  const numericAmount =
    typeof amount === 'bigint'
      ? Number(amount)
      : typeof amount === 'string'
        ? parseFloat(amount)
        : amount;
  const isNegative = numericAmount < 0;

  return (
    <span
      className={cn(
        'tabular-nums text-right font-mono text-sm',
        isNegative && 'text-destructive',
        className
      )}
    >
      {formatMoney(amount, currency, { showCode })}
    </span>
  );
}
