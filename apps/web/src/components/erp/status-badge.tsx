import { cn } from '@/lib/utils';
import { getStatusConfig } from '@/lib/constants';
import { FileEdit, CheckCircle, Undo2, XCircle, Clock, ShieldCheck, Lock } from 'lucide-react';

const statusIcons: Record<string, React.ElementType> = {
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

const variantStyles: Record<string, string> = {
  default: 'bg-success/10 text-success border-success/20',
  secondary: 'bg-muted text-muted-foreground border-border',
  destructive: 'bg-destructive/10 text-destructive border-destructive/20',
  outline: 'bg-info/10 text-info border-info/20',
};

interface StatusBadgeProps {
  status: string;
  className?: string;
  showIcon?: boolean;
}

export function StatusBadge({ status, className, showIcon = true }: StatusBadgeProps) {
  const config = getStatusConfig(status);
  const Icon = statusIcons[status];

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-md border px-2.5 py-0.5 text-xs font-medium',
        variantStyles[config.variant] ?? variantStyles.secondary,
        className
      )}
    >
      {showIcon && Icon && <Icon className="h-3 w-3" aria-hidden="true" />}
      {config.label}
    </span>
  );
}
