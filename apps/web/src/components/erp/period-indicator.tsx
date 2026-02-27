'use client';

import * as React from 'react';
import { useTenantContext } from '@/providers/tenant-provider';
import { Calendar } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { getStatusConfig } from '@/lib/constants';
import { cn } from '@/lib/utils';

// ─── Types ───────────────────────────────────────────────────────────────────

interface PeriodIndicatorProps {
  className?: string;
}

// ─── Component ───────────────────────────────────────────────────────────────

function PeriodIndicator({ className }: PeriodIndicatorProps) {
  const { activePeriod } = useTenantContext();

  if (!activePeriod) {
    return (
      <div className={cn('flex items-center gap-2 text-xs text-muted-foreground', className)}>
        <Calendar className="h-3.5 w-3.5" aria-hidden="true" />
        <span>No active period</span>
      </div>
    );
  }

  const config = getStatusConfig(activePeriod.status);

  return (
    <div className={cn('flex items-center gap-2 text-xs', className)}>
      <Calendar className="h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />
      <span className="font-medium">{activePeriod.name}</span>
      <Badge variant={config.variant} className="px-1.5 py-0 text-[10px]">
        {config.label}
      </Badge>
    </div>
  );
}
PeriodIndicator.displayName = 'PeriodIndicator';

export { PeriodIndicator };
export type { PeriodIndicatorProps };
