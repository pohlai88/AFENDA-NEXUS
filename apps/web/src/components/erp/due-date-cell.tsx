import * as React from 'react';
import { AlertTriangle, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getDueState, type DueState } from '@/lib/due-state';
import { DateCell } from './date-cell';

// ─── Styling ────────────────────────────────────────────────────────────────

const STATE_STYLES: Record<DueState, string> = {
  OVERDUE: 'text-destructive font-medium',
  DUE_SOON: 'text-warning',
  OK: '',
};

const STATE_ICONS: Record<DueState, { icon: React.ElementType; label: string } | null> = {
  OVERDUE: { icon: AlertTriangle, label: 'Overdue' },
  DUE_SOON: { icon: Clock, label: 'Due soon' },
  OK: null,
};

// ─── Types ───────────────────────────────────────────────────────────────────

interface DueDateCellProps extends Omit<React.HTMLAttributes<HTMLSpanElement>, 'children'> {
  /** ISO-8601 due date string. */
  dueDate: string;
  /** Document status — used to determine if the due date is relevant. */
  status: string;
  /** Date display format. @default 'short' */
  format?: 'short' | 'medium';
}

// ─── Component ───────────────────────────────────────────────────────────────

const DueDateCell = React.forwardRef<HTMLSpanElement, DueDateCellProps>(
  ({ dueDate, status, format = 'short', className, ...props }, ref) => {
    const state = getDueState({ dueDate, status });
    const stateIcon = STATE_ICONS[state];
    const StateIcon = stateIcon?.icon;

    return (
      <span
        ref={ref}
        className={cn('inline-flex items-center gap-1', STATE_STYLES[state], className)}
        {...props}
      >
        {StateIcon && (
          <StateIcon className="h-3 w-3 shrink-0" aria-label={stateIcon.label} />
        )}
        <DateCell date={dueDate} format={format} className={cn(STATE_STYLES[state])} />
      </span>
    );
  },
);
DueDateCell.displayName = 'DueDateCell';

export { DueDateCell };
export type { DueDateCellProps };
