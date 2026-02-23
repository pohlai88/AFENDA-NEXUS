"use client";

import { useTenantContext } from "@/providers/tenant-provider";
import { Calendar } from "lucide-react";
import { StatusBadge } from "./status-badge";
import { cn } from "@/lib/utils";

export function PeriodIndicator({ className }: { className?: string }) {
  const { activePeriod } = useTenantContext();

  if (!activePeriod) {
    return (
      <div className={cn("flex items-center gap-2 text-xs text-muted-foreground", className)}>
        <Calendar className="h-3.5 w-3.5" aria-hidden="true" />
        <span>No active period</span>
      </div>
    );
  }

  return (
    <div className={cn("flex items-center gap-2 text-xs", className)}>
      <Calendar className="h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />
      <span className="font-medium">{activePeriod.name}</span>
      <StatusBadge status={activePeriod.status} showIcon={false} />
    </div>
  );
}
