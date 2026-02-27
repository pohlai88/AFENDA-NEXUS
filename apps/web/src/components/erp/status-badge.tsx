import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import {
  FileEdit,
  CheckCircle,
  Undo2,
  XCircle,
  Clock,
  ShieldCheck,
  Lock,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { getStatusConfig } from '@/lib/constants';

// ─── Status Icon Map ─────────────────────────────────────────────────────────

const STATUS_ICONS: Record<string, React.ElementType> = {
  DRAFT: FileEdit,
  POSTED: CheckCircle,
  REVERSED: Undo2,
  VOIDED: XCircle,
  PENDING_APPROVAL: Clock,
  APPROVED: ShieldCheck,
  PAID: CheckCircle,
  PARTIALLY_PAID: Clock,
  CANCELLED: XCircle,
  WRITTEN_OFF: XCircle,
  OPEN: CheckCircle,
  CLOSED: Lock,
  LOCKED: Lock,
};

// ─── Variants ────────────────────────────────────────────────────────────────

const statusBadgeVariants = cva(
  'inline-flex items-center gap-1.5 rounded-md border px-2.5 py-0.5 text-xs font-medium transition-colors',
  {
    variants: {
      variant: {
        default: 'bg-success/10 text-success border-success/20',
        secondary: 'bg-muted text-muted-foreground border-border',
        destructive: 'bg-destructive/10 text-destructive border-destructive/20',
        outline: 'bg-info/10 text-info border-info/20',
      },
    },
    defaultVariants: {
      variant: 'secondary',
    },
  },
);

// ─── Types ───────────────────────────────────────────────────────────────────

interface StatusBadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof statusBadgeVariants> {
  /** The document status key (e.g. "DRAFT", "POSTED"). */
  status: string;
  /** Whether to show the status icon. @default true */
  showIcon?: boolean;
}

// ─── Component ───────────────────────────────────────────────────────────────

const StatusBadge = React.forwardRef<HTMLSpanElement, StatusBadgeProps>(
  ({ status, showIcon = true, className, variant: _variant, ...props }, ref) => {
    const config = getStatusConfig(status);
    const Icon = STATUS_ICONS[status];
    const resolvedVariant = (config.variant ?? 'secondary') as StatusBadgeProps['variant'];

    return (
      <span
        ref={ref}
        className={cn(statusBadgeVariants({ variant: resolvedVariant }), className)}
        {...props}
      >
        {showIcon && Icon && <Icon className="h-3 w-3" aria-hidden="true" />}
        {config.label}
      </span>
    );
  },
);
StatusBadge.displayName = 'StatusBadge';

export { StatusBadge, statusBadgeVariants };
export type { StatusBadgeProps };
