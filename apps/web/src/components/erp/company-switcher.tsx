'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useTransition } from 'react';
import { useTenantContext } from '@/providers/tenant-provider';
import { Building, Check, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';

// ─── Types ───────────────────────────────────────────────────────────────────

interface CompanySwitcherProps {
  className?: string;
  /** Server action called when the active company changes. */
  onSwitchCompany?: (companyId: string) => Promise<void>;
}

// ─── Component ───────────────────────────────────────────────────────────────

function CompanySwitcher({ className, onSwitchCompany }: CompanySwitcherProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const { tenant, activeCompany, switchCompany } = useTenantContext();

  if (!tenant || !activeCompany) return null;

  async function handleSwitchCompany(companyId: string) {
    if (companyId === activeCompany?.id) return;

    switchCompany(companyId);

    if (onSwitchCompany) {
      await onSwitchCompany(companyId);
    }

    router.refresh();
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          aria-label={`Current company: ${activeCompany.name}. Click to switch.`}
          className={cn('w-full justify-start gap-2 px-3', className)}
        >
          <Building className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
          <span className="truncate font-medium">{activeCompany.name}</span>
          <span className="ml-1 text-xs text-muted-foreground">({activeCompany.baseCurrency})</span>
          <ChevronsUpDown className="ml-auto h-4 w-4 text-muted-foreground" aria-hidden="true" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-64">
        <DropdownMenuLabel>Switch Company</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {tenant.companies.map((company) => (
          <DropdownMenuItem
            key={company.id}
            disabled={isPending}
            onClick={() => {
              startTransition(async () => {
                await handleSwitchCompany(company.id);
              });
            }}
          >
            <Check
              className={cn(
                'mr-2 h-4 w-4',
                company.id === activeCompany.id ? 'opacity-100' : 'opacity-0'
              )}
            />
            <span className="truncate">{company.name}</span>
            <span className="ml-auto text-xs text-muted-foreground">{company.baseCurrency}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
CompanySwitcher.displayName = 'CompanySwitcher';

export { CompanySwitcher };
export type { CompanySwitcherProps };
