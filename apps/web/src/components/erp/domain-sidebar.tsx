'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarSeparator,
} from '@/components/ui/sidebar';
import { TenantSwitcher } from './tenant-switcher';
import { CompanySwitcher } from './company-switcher';
import { PeriodIndicator } from './period-indicator';
import { DomainNav } from './sidebar-nav';
import { getActiveModule } from '@/lib/modules/get-active-module';
import { useFavorites } from '@/hooks/use-favorites';
import type { ClientModuleWithNav } from '@/lib/modules/types';

// ─── Types ───────────────────────────────────────────────────────────────────

interface DomainSidebarProps {
  /** Visible modules with their navigation groups. */
  modules: ClientModuleWithNav[];
  /** Server action to switch the active company. */
  onSwitchCompany?: (companyId: string) => Promise<void>;
}

// ─── Domain Sidebar (Popover — sidebar-10 pattern) ───────────────────────────

/**
 * Domain sidebar rendered inside a Popover (shadcn sidebar-10 pattern).
 *
 * Key architecture detail: the `<Sidebar collapsible="none">` inside the
 * `PopoverContent` is wrapped in its own `<SidebarProvider>` to **isolate**
 * it from the outer `SidebarProvider` that controls the left module sidebar.
 * Without this isolation, every `SidebarMenuButton` (which internally calls
 * `useSidebar()`) would read from the left sidebar's context, causing:
 *   - stale `isMobile` / `state` values
 *   - tooltip visibility tied to left sidebar collapsed state
 *   - potential click handler conflicts
 */
function DomainSidebar({ modules, onSwitchCompany }: DomainSidebarProps) {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = React.useState(false);
  const activeModuleId = getActiveModule(pathname);
  const activeModule = modules.find((m) => m.id === activeModuleId);
  const { favorites } = useFavorites();

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="size-7 data-[state=open]:bg-accent"
          aria-label="Toggle domain navigation"
        >
          <Menu className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-72 overflow-hidden rounded-lg p-0"
        align="end"
        sideOffset={8}
      >
        {/* Isolated SidebarProvider prevents context bleeding from the
            outer (left module) SidebarProvider — per shadcn sidebar-10 best practice.
            open={true} + onOpenChange noop keeps state='expanded' and prevents
            the inner provider's Ctrl+B listener from writing stale cookies. */}
        <SidebarProvider
          open
          onOpenChange={() => {}}
          className="flex min-h-0 w-full"
          style={
            {
              '--sidebar-width': '100%',
              '--sidebar-width-icon': '100%',
            } as React.CSSProperties
          }
        >
          <Sidebar collapsible="none" className="w-full border-none bg-transparent">
            <SidebarHeader className="gap-2 p-3">
              <div className="space-y-2">
                <TenantSwitcher />
                <CompanySwitcher onSwitchCompany={onSwitchCompany} />
                <PeriodIndicator />
              </div>
            </SidebarHeader>

            <SidebarSeparator />

            <SidebarContent className="max-h-[60vh] overflow-y-auto">
              {/* Favorites section — shown when user has pinned pages */}
              {favorites.length > 0 && (
                <>
                  <SidebarGroup>
                    <SidebarGroupLabel className="flex items-center gap-2">
                      <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                      Favorites
                    </SidebarGroupLabel>
                    <SidebarMenu>
                      {favorites.map((fav) => (
                        <SidebarMenuItem key={fav.href}>
                          <SidebarMenuButton
                            asChild
                            isActive={pathname === fav.href}
                          >
                            <Link href={fav.href} onClick={() => setIsOpen(false)}>
                              <span>{fav.title}</span>
                            </Link>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      ))}
                    </SidebarMenu>
                  </SidebarGroup>
                  <SidebarSeparator />
                </>
              )}

              {activeModule && activeModule.navGroups.length > 0 ? (
                <DomainNav navGroups={activeModule.navGroups} />
              ) : null}
            </SidebarContent>
          </Sidebar>
        </SidebarProvider>
      </PopoverContent>
    </Popover>
  );
}
DomainSidebar.displayName = 'DomainSidebar';

export { DomainSidebar };
export type { DomainSidebarProps };
