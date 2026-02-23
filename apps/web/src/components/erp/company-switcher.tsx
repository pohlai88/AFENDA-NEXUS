"use client";

import { useTenantContext } from "@/providers/tenant-provider";
import { Building, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";

export function CompanySwitcher({ className }: { className?: string }) {
  const { tenant, activeCompany } = useTenantContext();

  if (!tenant || !activeCompany) return null;

  return (
    <div className={cn("relative", className)}>
      <button
        type="button"
        className="flex w-full items-center gap-2 rounded-md border px-3 py-2 text-sm hover:bg-accent"
        aria-label={`Current company: ${activeCompany.name}. Click to switch.`}
      >
        <Building className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
        <span className="truncate font-medium">{activeCompany.name}</span>
        <span className="ml-1 text-xs text-muted-foreground">
          ({activeCompany.baseCurrency})
        </span>
        <ChevronsUpDown className="ml-auto h-4 w-4 text-muted-foreground" aria-hidden="true" />
      </button>
    </div>
  );
}
