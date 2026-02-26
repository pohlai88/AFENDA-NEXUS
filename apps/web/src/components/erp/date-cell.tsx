import { cn } from '@/lib/utils';
import { formatDate, formatDateTime, formatRelativeTime } from '@/lib/format';

interface DateCellProps {
  date: string | Date;
  format?: 'short' | 'medium' | 'long' | 'datetime' | 'relative';
  className?: string;
}

export function DateCell({ date, format = 'medium', className }: DateCellProps) {
  const formatted =
    format === 'datetime'
      ? formatDateTime(date)
      : format === 'relative'
        ? formatRelativeTime(date)
        : formatDate(date, format);

  return (
    <time
      dateTime={typeof date === 'string' ? date : date.toISOString()}
      className={cn('text-sm text-muted-foreground', className)}
    >
      {formatted}
    </time>
  );
}
