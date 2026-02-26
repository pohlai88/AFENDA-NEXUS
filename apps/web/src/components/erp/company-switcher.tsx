'use client';

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

export function CompanySwitcher({
  className,
  onSwitchCompany,
}: {
  className?: string;
  onSwitchCompany?: (companyId: string) => Promise<void>;
}) {
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
        <button
          type="button"
          className={cn(
            'flex w-full items-center gap-2 rounded-md border px-3 py-2 text-sm hover:bg-accent',
            className
          )}
          aria-label={`Current company: ${activeCompany.name}. Click to switch.`}
        >
          <Building className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
          <span className="truncate font-medium">{activeCompany.name}</span>
          <span className="ml-1 text-xs text-muted-foreground">({activeCompany.baseCurrency})</span>
          <ChevronsUpDown className="ml-auto h-4 w-4 text-muted-foreground" aria-hidden="true" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-64">
        <DropdownMenuLabel>Switch Company</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {tenant.companies.map((company) => (
          <DropdownMenuItem
            key={company.id}
            disabled={isPending}
            onClick={() => {
              startTransition(() => {
                void handleSwitchCompany(company.id);
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
