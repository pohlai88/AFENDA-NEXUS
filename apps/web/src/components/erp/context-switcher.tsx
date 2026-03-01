'use client';

import * as React from 'react';
import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useTenantContext } from '@/providers/tenant-provider';
import { useListOrganizations, organization } from '@/lib/auth-client';
import { switchOrganizationAction } from '@/lib/kernel-actions';
import { Building2, Building, ChevronsUpDown, Plus, Check, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
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

interface ContextSwitcherProps {
  className?: string;
  /** Server action called when the active company changes. */
  onSwitchCompany?: (companyId: string) => Promise<void>;
}

// ─── Component ───────────────────────────────────────────────────────────────

/**
 * Unified context switcher following the shadcn sidebar-07 TeamSwitcher pattern.
 *
 * Single dropdown combining organization + company switching:
 *   - Primary display: active company name + org name subtitle
 *   - Dropdown: company list (current org) + org list (switch tenant)
 *   - Keyboard shortcuts: ⌘1–⌘9 for quick company switching
 *
 * Hierarchy: Organization (tenant) → Company (entity)
 * One org has many companies; switching org reloads the full context.
 */
function ContextSwitcher({ className, onSwitchCompany }: ContextSwitcherProps) {
  const { tenant, activeCompany, switchCompany } = useTenantContext();
  const router = useRouter();
  const { data: orgsData } = useListOrganizations();
  const [isPending, startTransition] = useTransition();
  const { isMobile } = useSidebar();

  const orgs = orgsData ?? [];

  // ─── Org switch (full session switch) ──────────────────────────────
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

  // ─── Company switch (within current org) ───────────────────────────
  function handleSwitchCompany(companyId: string) {
    if (companyId === activeCompany?.id) return;

    startTransition(async () => {
      switchCompany(companyId);
      if (onSwitchCompany) {
        await onSwitchCompany(companyId);
      }
    });
  }

  if (!tenant || !activeCompany) {
    return (
      <SidebarMenu>
        <SidebarMenuItem>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <SidebarMenuButton
                size="lg"
                className={cn(
                  'data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground',
                  className,
                )}
              >
                <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
                  <Building2 className="size-4" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">No workspace</span>
                  <span className="truncate text-xs text-muted-foreground">Get started</span>
                </div>
                <ChevronsUpDown className="ml-auto" />
              </SidebarMenuButton>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
              align="start"
              side={isMobile ? 'bottom' : 'right'}
              sideOffset={4}
            >
              {/* Existing orgs the user can switch to */}
              {orgs.length > 0 && (
                <>
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
                    </DropdownMenuItem>
                  ))}
                  <DropdownMenuSeparator />
                </>
              )}
              <DropdownMenuItem
                className="gap-2 p-2"
                onClick={() => router.push('/onboarding')}
              >
                <div className="flex size-6 items-center justify-center rounded-md border bg-transparent">
                  <Plus className="size-4" />
                </div>
                <div className="text-muted-foreground font-medium">Create workspace</div>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarMenuItem>
      </SidebarMenu>
    );
  }

  const hasMultipleOrgs = orgs.length > 1;
  const hasMultipleCompanies = tenant.companies.length > 1;

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className={cn(
                'data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground',
                className,
              )}
            >
              <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
                <Building2 className="size-4" />
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">{activeCompany.name}</span>
                <span className="truncate text-xs">{tenant.tenantName}</span>
              </div>
              {isPending ? (
                <Loader2 className="ml-auto size-4 animate-spin" aria-hidden="true" />
              ) : (
                <ChevronsUpDown className="ml-auto" />
              )}
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
            align="start"
            side={isMobile ? 'bottom' : 'right'}
            sideOffset={4}
          >
            {/* ─── Companies (current org) ─────────────────────────── */}
            {hasMultipleCompanies && (
              <>
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
              </>
            )}

            {/* ─── Organizations ────────────────────────────────────── */}
            {hasMultipleOrgs && (
              <>
                {hasMultipleCompanies && <DropdownMenuSeparator />}
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
              </>
            )}

            {/* ─── Create organization ─────────────────────────────── */}
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
ContextSwitcher.displayName = 'ContextSwitcher';

export { ContextSwitcher };
export type { ContextSwitcherProps };
