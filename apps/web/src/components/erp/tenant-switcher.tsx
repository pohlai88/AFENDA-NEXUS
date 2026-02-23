"use client";

import { useTenantContext } from "@/providers/tenant-provider";
import { Building2, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";

export function TenantSwitcher({ className }: { className?: string }) {
  const { tenant } = useTenantContext();

  if (!tenant) return null;

  return (
    <div
      className={cn(
        "flex items-center gap-2 rounded-md border px-3 py-2 text-sm",
        className,
      )}
    >
      <Building2 className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
      <span className="truncate font-medium">{tenant.tenantName}</span>
      <ChevronsUpDown className="ml-auto h-4 w-4 text-muted-foreground" aria-hidden="true" />
    </div>
  );
}
