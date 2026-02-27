import * as React from 'react';
import { cn } from '@/lib/utils';
import { formatDate, formatDateTime, formatRelativeTime } from '@/lib/format';

// ─── Types ───────────────────────────────────────────────────────────────────

type DateFormat = 'short' | 'medium' | 'long' | 'datetime' | 'relative';

interface DateCellProps extends Omit<React.TimeHTMLAttributes<HTMLTimeElement>, 'children'> {
  /** ISO-8601 string or Date object. */
  date: string | Date;
  /** Display format. @default 'medium' */
  format?: DateFormat;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatByStyle(date: string | Date, style: DateFormat): string {
  switch (style) {
    case 'datetime':
      return formatDateTime(date);
    case 'relative':
      return formatRelativeTime(date);
    default:
      return formatDate(date, style);
  }
}

function toISOString(date: string | Date): string {
  return typeof date === 'string' ? date : date.toISOString();
}

// ─── Component ───────────────────────────────────────────────────────────────

const DateCell = React.forwardRef<HTMLTimeElement, DateCellProps>(
  ({ date, format = 'medium', className, ...props }, ref) => (
    <time
      ref={ref}
      dateTime={toISOString(date)}
      className={cn('text-sm text-muted-foreground', className)}
      {...props}
    >
      {formatByStyle(date, format)}
    </time>
  ),
);
DateCell.displayName = 'DateCell';

export { DateCell };
export type { DateCellProps, DateFormat };
