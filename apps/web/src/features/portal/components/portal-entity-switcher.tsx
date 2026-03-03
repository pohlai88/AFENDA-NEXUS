'use client';

/**
 * SP-7016: Portal Entity Switcher (CAP-MULTI P19)
 *
 * Displays the active supplier entity in the portal topbar.
 * If the user has multiple supplier associations, renders a combobox
 * dropdown to switch between them. Single-entity users see a plain label.
 *
 * How switching works:
 *   On entity select, the user is navigated to /portal with a `?entity=supplierId`
 *   search param. The portal layout reads this and stores the active supplierId
 *   in a session cookie (handled by the auth layer / middleware).
 *
 * Note: Full cookie-based scoping is a Phase 2 deliverable.
 * This component provides the UI and navigation trigger.
 */
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Check, ChevronsUpDown, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { routes } from '@/lib/constants';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface SupplierAssociation {
  supplierId: string;
  supplierName: string;
  supplierCode: string;
  tenantId: string;
  tenantName: string;
  status: 'ACTIVE' | 'INACTIVE' | 'PENDING';
}

interface PortalEntitySwitcherProps {
  associations: readonly SupplierAssociation[];
  activeSupplierId: string;
  className?: string;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function PortalEntitySwitcher({
  associations,
  activeSupplierId,
  className,
}: PortalEntitySwitcherProps) {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  const activeAssociation =
    associations.find((a) => a.supplierId === activeSupplierId) ?? associations[0];

  // Single entity — just show the name, no switcher needed.
  if (associations.length <= 1) {
    return (
      <div className={cn('flex items-center gap-1.5 text-sm', className)}>
        <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
        <span className="font-medium">{activeAssociation?.supplierName ?? 'Supplier Portal'}</span>
      </div>
    );
  }

  const handleSelect = (supplierId: string) => {
    setOpen(false);
    if (supplierId === activeSupplierId) return;
    // Navigate to portal dashboard with the new entity scoped via URL param.
    // The middleware/layout will persist this selection as a session cookie.
    router.push(`${routes.portal.dashboard}?entity=${supplierId}`);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          role="combobox"
          aria-expanded={open}
          aria-label="Switch active entity"
          className={cn('h-8 max-w-[220px] justify-between gap-1.5 px-2 text-sm', className)}
        >
          <Building2 className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
          <span className="truncate font-medium">
            {activeAssociation?.supplierName ?? 'Select entity'}
          </span>
          <ChevronsUpDown className="ml-0.5 h-3.5 w-3.5 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[260px] p-0" align="start">
        <Command>
          <CommandInput placeholder="Search entities…" />
          <CommandList>
            <CommandEmpty>No entities found.</CommandEmpty>
            <CommandGroup heading="Your supplier entities">
              {associations.map((association) => (
                <CommandItem
                  key={association.supplierId}
                  value={`${association.supplierName} ${association.supplierCode} ${association.tenantName}`}
                  onSelect={() => handleSelect(association.supplierId)}
                  className="gap-2"
                >
                  <Check
                    className={cn(
                      'h-4 w-4 shrink-0',
                      association.supplierId === activeSupplierId ? 'opacity-100' : 'opacity-0'
                    )}
                  />
                  <div className="flex min-w-0 flex-col">
                    <span className="truncate text-sm font-medium">{association.supplierName}</span>
                    <span className="truncate text-xs text-muted-foreground">
                      {association.supplierCode} · {association.tenantName}
                    </span>
                  </div>
                  {association.status !== 'ACTIVE' && (
                    <Badge
                      variant={association.status === 'INACTIVE' ? 'destructive' : 'secondary'}
                      className="ml-auto shrink-0 text-xs"
                    >
                      {association.status}
                    </Badge>
                  )}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
