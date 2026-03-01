'use client';

import * as React from 'react';
import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useTenantContext } from '@/providers/tenant-provider';
import { useListOrganizations, organization } from '@/lib/auth-client';
import { switchOrganizationAction } from '@/lib/kernel-actions';
import { Building2, ChevronsUpDown, Plus, Check, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar';

// ─── Types ───────────────────────────────────────────────────────────────────

interface TenantSwitcherProps {
  className?: string;
}

// ─── Component ───────────────────────────────────────────────────────────────

/**
 * Tenant (organization) switcher for the domain popover sidebar.
 *
 * Displays the active organization name and allows switching between
 * organizations via a dropdown. Switching orgs triggers a full session
 * reload via `switchOrganizationAction`.
 */
function TenantSwitcher({ className }: TenantSwitcherProps) {
  const { tenant } = useTenantContext();
  const router = useRouter();
  const { data: orgsData } = useListOrganizations();
  const [isPending, startTransition] = useTransition();
  const { isMobile } = useSidebar();

  const orgs = orgsData ?? [];

  function handleSwitchOrg(orgId: string) {
    if (orgId === tenant?.tenantId) return;

    startTransition(async () => {
      const { error } = await organization.setActive({ organizationId: orgId });
      if (error) return;

      const result = await switchOrganizationAction();
      if (result.ok) {
        router.refresh();
      }
    });
  }

  if (!tenant) return null;

  const hasMultipleOrgs = orgs.length > 1;

  if (!hasMultipleOrgs) {
    // Single org – show a static label, no dropdown.
    return (
      <div
        className={cn(
          'flex items-center gap-2 rounded-md px-2 py-1.5 text-sm',
          className,
        )}
      >
        <Building2 className="size-4 text-muted-foreground" aria-hidden="true" />
        <span className="truncate font-medium">{tenant.tenantName}</span>
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
              <Building2 className="size-4 shrink-0" aria-hidden="true" />
              <span className="truncate">{tenant.tenantName}</span>
              {isPending ? (
                <Loader2 className="ml-auto size-4 animate-spin" aria-hidden="true" />
              ) : (
                <ChevronsUpDown className="ml-auto size-4 shrink-0" />
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
              Organizations
            </DropdownMenuLabel>
            {orgs.map((org) => (
              <DropdownMenuItem
                key={org.id}
                onClick={() => handleSwitchOrg(org.id)}
                disabled={isPending}
                className="gap-2 p-2"
              >
                <div className="flex size-6 items-center justify-center rounded-sm border">
                  <Building2 className="size-3.5 shrink-0" />
                </div>
                <span className="truncate">{org.name}</span>
                {org.id === tenant.tenantId && (
                  <Check className="ml-auto size-4 shrink-0" aria-hidden="true" />
                )}
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="gap-2 p-2"
              onClick={() => router.push('/onboarding')}
            >
              <div className="flex size-6 items-center justify-center rounded-md border bg-transparent">
                <Plus className="size-4" />
              </div>
              <div className="text-muted-foreground font-medium">Add organization</div>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
TenantSwitcher.displayName = 'TenantSwitcher';

export { TenantSwitcher };
export type { TenantSwitcherProps };
