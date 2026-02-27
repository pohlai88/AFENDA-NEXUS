'use client';

import * as React from 'react';
import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useTenantContext } from '@/providers/tenant-provider';
import { useListOrganizations, organization } from '@/lib/auth-client';
import { switchOrganizationAction } from '@/lib/kernel-actions';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Building2, ChevronsUpDown, Plus, Check, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

// ─── Types ───────────────────────────────────────────────────────────────────

interface TenantSwitcherProps {
  className?: string;
}

// ─── Component ───────────────────────────────────────────────────────────────

function TenantSwitcher({ className }: TenantSwitcherProps) {
  const { tenant } = useTenantContext();
  const router = useRouter();
  const { data: orgsData } = useListOrganizations();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const orgs = orgsData ?? [];

  function handleSwitchOrg(orgId: string) {
    if (orgId === tenant?.tenantId) {
      setOpen(false);
      return;
    }

    startTransition(async () => {
      const { error } = await organization.setActive({ organizationId: orgId });
      if (error) return;

      const result = await switchOrganizationAction();
      if (result.ok) {
        setOpen(false);
        router.refresh();
      }
    });
  }

  if (!tenant) return null;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          aria-label="Switch organization"
          className={cn('w-full justify-start gap-2 px-3', className)}
        >
          <Building2 className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
          <span className="truncate font-medium">{tenant.tenantName}</span>
          {isPending ? (
            <Loader2 className="ml-auto h-4 w-4 animate-spin text-muted-foreground" aria-hidden="true" />
          ) : (
            <ChevronsUpDown className="ml-auto h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-1" align="start">
        <div className="flex flex-col">
          <p className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
            Organizations
          </p>
          {orgs.map((org) => (
            <Button
              key={org.id}
              variant="ghost"
              size="sm"
              onClick={() => handleSwitchOrg(org.id)}
              disabled={isPending}
              className="w-full justify-start gap-2 px-2 font-normal"
            >
              <Building2 className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
              <span className="truncate">{org.name}</span>
              {org.id === tenant.tenantId && (
                <Check className="ml-auto h-4 w-4 shrink-0" aria-hidden="true" />
              )}
            </Button>
          ))}
          <Separator className="my-1" />
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setOpen(false);
              router.push('/onboarding');
            }}
            className="w-full justify-start gap-2 px-2 font-normal"
          >
            <Plus className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
            <span>Create new organization</span>
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
TenantSwitcher.displayName = 'TenantSwitcher';

export { TenantSwitcher };
export type { TenantSwitcherProps };
