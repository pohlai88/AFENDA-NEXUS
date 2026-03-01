'use client';

import * as React from 'react';
import { useTransition } from 'react';
import { useTenantContext } from '@/providers/tenant-provider';
import { Building, ChevronsUpDown, Check, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar';

// ─── Types ───────────────────────────────────────────────────────────────────

interface CompanySwitcherProps {
  className?: string;
  /** Server action called when the active company changes. */
  onSwitchCompany?: (companyId: string) => Promise<void>;
}

// ─── Component ───────────────────────────────────────────────────────────────

/**
 * Company switcher for choosing between companies within the active organization.
 *
 * Displays the current company name and allows switching via a dropdown.
 * Keyboard shortcuts: ⌘1–⌘9 for quick company switching.
 */
function CompanySwitcher({ className, onSwitchCompany }: CompanySwitcherProps) {
  const { tenant, activeCompany, switchCompany } = useTenantContext();
  const [isPending, startTransition] = useTransition();
  const { isMobile } = useSidebar();

  function handleSwitchCompany(companyId: string) {
    if (companyId === activeCompany?.id) return;

    startTransition(async () => {
      switchCompany(companyId);
      if (onSwitchCompany) {
        await onSwitchCompany(companyId);
      }
    });
  }

  if (!tenant || !activeCompany) return null;

  const hasMultipleCompanies = tenant.companies.length > 1;

  if (!hasMultipleCompanies) {
    // Single company – show a static label, no dropdown.
    return (
      <div
        className={cn(
          'flex items-center gap-2 rounded-md px-2 py-1.5 text-sm',
          className,
        )}
      >
        <Building className="size-4 text-muted-foreground" aria-hidden="true" />
        <span className="truncate font-medium">{activeCompany.name}</span>
        <span className="ml-auto text-xs text-muted-foreground">
          {activeCompany.baseCurrency}
        </span>
      </div>
    );
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="sm"
              className={cn(
                'data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground',
                className,
              )}
            >
              <Building className="size-4 shrink-0" aria-hidden="true" />
              <span className="truncate">{activeCompany.name}</span>
              <span className="ml-auto mr-1 text-xs text-muted-foreground">
                {activeCompany.baseCurrency}
              </span>
              {isPending ? (
                <Loader2 className="size-4 animate-spin" aria-hidden="true" />
              ) : (
                <ChevronsUpDown className="size-4 shrink-0" />
              )}
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-48 rounded-lg"
            align="start"
            side={isMobile ? 'bottom' : 'right'}
            sideOffset={4}
          >
            <DropdownMenuLabel className="text-muted-foreground text-xs">
              Companies
            </DropdownMenuLabel>
            {tenant.companies.map((company, index) => (
              <DropdownMenuItem
                key={company.id}
                onClick={() => handleSwitchCompany(company.id)}
                disabled={isPending}
                className="gap-2 p-2"
              >
                <div className="flex size-6 items-center justify-center rounded-md border">
                  <Building className="size-3.5 shrink-0" />
                </div>
                <span className="truncate">{company.name}</span>
                <span className="ml-auto text-xs text-muted-foreground">
                  {company.baseCurrency}
                </span>
                {company.id === activeCompany.id && (
                  <Check className="size-4 shrink-0" aria-hidden="true" />
                )}
                {index < 9 && (
                  <DropdownMenuShortcut>⌘{index + 1}</DropdownMenuShortcut>
                )}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
CompanySwitcher.displayName = 'CompanySwitcher';

export { CompanySwitcher };
export type { CompanySwitcherProps };
