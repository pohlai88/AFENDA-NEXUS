'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, Star, ChevronRight } from 'lucide-react';
import { getIcon } from '@/lib/modules/icon-map';
import { getActiveModule } from '@/lib/modules/get-active-module';
import { useFavorites } from '@/hooks/use-favorites';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarProvider,
  SidebarSeparator,
} from '@/components/ui/sidebar';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { TenantSwitcher } from './tenant-switcher';
import { CompanySwitcher } from './company-switcher';
import { PeriodIndicator } from './period-indicator';
import type { ClientModuleWithNav } from '@/lib/modules/types';
import type { NavGroup, NavItem } from '@/lib/constants';

// ─── Shortcut Hints ──────────────────────────────────────────────────────────

const SHORTCUT_HINTS: Record<string, string> = {
  '/finance/journals': 'g j',
  '/finance/accounts': 'g a',
  '/finance/periods': 'g p',
  '/finance/ledgers': 'g l',
  '/finance/banking': 'g b',
  '/finance/expenses': 'g x',
  '/settings': 'g s',
  '/': 'g d',
};

// ─── Accent Colour Maps ─────────────────────────────────────────────────────

const ACCENT_TEXT: Record<string, string> = {
  emerald: 'text-emerald-600 dark:text-emerald-400',
  violet: 'text-violet-600 dark:text-violet-400',
  sky: 'text-sky-600 dark:text-sky-400',
  amber: 'text-amber-600 dark:text-amber-400',
  rose: 'text-rose-600 dark:text-rose-400',
  slate: 'text-foreground',
  red: 'text-red-600 dark:text-red-400',
} as const;

// ─── Icon Helper ─────────────────────────────────────────────────────────────

function NavIcon({ name, className }: { name: string; className?: string }) {
  const Icon = getIcon(name);
  return <Icon className={cn('h-4 w-4', className)} />;
}
NavIcon.displayName = 'NavIcon';

// ─── Types ───────────────────────────────────────────────────────────────────

interface DomainPopoverProps {
  /** Visible modules with their navigation groups. */
  modules: ClientModuleWithNav[];
  /** Server action to switch the active company. */
  onSwitchCompany?: (companyId: string) => Promise<void>;
}

// ─── Domain Popover Sidebar (sidebar-10 pattern) ─────────────────────────────

/**
 * Right-side popover sidebar following the sidebar-10 pattern.
 *
 * Shows domain-level detail navigation for the active module:
 *   Header  → Tenant / Company / Period switchers + Module label
 *   Content → Favorites + NavGroups (collapsible per SAP SOD domain)
 *
 * Uses an isolated `SidebarProvider` inside the `PopoverContent` to
 * prevent context bleeding from the left module rail's `SidebarProvider`.
 * `open={true}` + noop `onOpenChange` keeps the inner provider in a
 * permanently expanded state without writing stale cookies.
 */
function DomainPopover({ modules, onSwitchCompany }: DomainPopoverProps) {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = React.useState(false);
  const activeModuleId = getActiveModule(pathname);
  const activeModule = modules.find((m) => m.id === activeModuleId);
  const { favorites } = useFavorites();

  const moduleAccent = activeModule?.accent ?? 'slate';
  const moduleLabel = activeModule?.label ?? 'Navigation';

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
        className="w-80 overflow-hidden rounded-lg p-0"
        align="end"
        sideOffset={8}
      >
        {/* Isolated SidebarProvider — per shadcn sidebar-10 best practice */}
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
            {/* Context Switchers */}
            <SidebarHeader className="gap-2 p-3">
              <div className="space-y-2">
                <TenantSwitcher />
                <CompanySwitcher onSwitchCompany={onSwitchCompany} />
                <PeriodIndicator />
              </div>
            </SidebarHeader>

            <SidebarSeparator />

            <SidebarContent className="max-h-[70vh] overflow-y-auto">
              {/* Module label header */}
              {activeModule && (
                <SidebarGroup>
                  <SidebarGroupLabel className={cn('text-xs font-semibold uppercase tracking-wider', ACCENT_TEXT[moduleAccent])}>
                    {moduleLabel}
                  </SidebarGroupLabel>
                </SidebarGroup>
              )}

              {/* Favorites */}
              {favorites.length > 0 && (
                <>
                  <SidebarGroup>
                    <SidebarGroupLabel className="flex items-center gap-2">
                      <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                      Favorites
                    </SidebarGroupLabel>
                    <SidebarMenu>
                      {favorites.slice(0, 8).map((fav) => (
                        <SidebarMenuItem key={fav.href}>
                          <SidebarMenuButton
                            asChild
                            isActive={pathname === fav.href}
                          >
                            <Link href={fav.href} onClick={() => setIsOpen(false)}>
                              <span className="truncate text-xs">{fav.title}</span>
                            </Link>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      ))}
                    </SidebarMenu>
                  </SidebarGroup>
                  <SidebarSeparator />
                </>
              )}

              {/* Domain navigation groups */}
              {activeModule && activeModule.navGroups.length > 0 && (
                activeModule.navGroups.map((group) => (
                  <NavGroupSection
                    key={group.title}
                    group={group}
                    pathname={pathname}
                    onNavigate={() => setIsOpen(false)}
                  />
                ))
              )}
            </SidebarContent>
          </Sidebar>
        </SidebarProvider>
      </PopoverContent>
    </Popover>
  );
}
DomainPopover.displayName = 'DomainPopover';

// ─── NavGroupSection ─────────────────────────────────────────────────────────

function NavGroupSection({
  group,
  pathname,
  onNavigate,
}: {
  group: NavGroup;
  pathname: string;
  onNavigate: () => void;
}) {
  const isActive = group.items.some(
    (item) => pathname === item.href || pathname.startsWith(`${item.href}/`),
  );

  return (
    <SidebarGroup>
      {group.collapsible ? (
        <Collapsible defaultOpen={isActive}>
          <SidebarGroupLabel asChild>
            <CollapsibleTrigger className="flex w-full cursor-pointer items-center gap-2 rounded-md px-2 py-1 hover:bg-accent/50">
              <NavIcon name={group.icon} className="h-3.5 w-3.5" />
              <span className="flex-1 text-left">{group.title}</span>
              <ChevronRight className="h-3.5 w-3.5 transition-transform duration-200 data-[state=open]:rotate-90" />
            </CollapsibleTrigger>
          </SidebarGroupLabel>
          <CollapsibleContent>
            <SidebarGroupContent>
              <SidebarMenu className="mt-1">
                {group.items.map((item) => (
                  <DomainNavItem
                    key={item.href}
                    item={item}
                    pathname={pathname}
                    onNavigate={onNavigate}
                  />
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </CollapsibleContent>
        </Collapsible>
      ) : (
        <>
          <SidebarGroupLabel className="flex items-center gap-2">
            <NavIcon name={group.icon} className="h-3.5 w-3.5" />
            {group.title}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {group.items.map((item) => (
                <DomainNavItem
                  key={item.href}
                  item={item}
                  pathname={pathname}
                  onNavigate={onNavigate}
                />
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </>
      )}
    </SidebarGroup>
  );
}
NavGroupSection.displayName = 'NavGroupSection';

// ─── DomainNavItem ───────────────────────────────────────────────────────────

function DomainNavItem({
  item,
  pathname,
  onNavigate,
}: {
  item: NavItem;
  pathname: string;
  onNavigate: () => void;
}) {
  const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);

  if (item.children && item.children.length > 0) {
    return (
      <Collapsible asChild defaultOpen={isActive}>
        <SidebarMenuItem>
          <SidebarMenuButton asChild isActive={isActive} tooltip={item.title}>
            <Link href={item.href} onClick={onNavigate}>
              <NavIcon name={item.icon} />
              <span>{item.title}</span>
              {item.badge && item.badge > 0 && (
                <Badge
                  variant={item.badgeVariant ?? 'secondary'}
                  className="ml-auto h-5 min-w-5 justify-center px-1.5 text-xs"
                >
                  {item.badge}
                </Badge>
              )}
            </Link>
          </SidebarMenuButton>
          <CollapsibleTrigger asChild>
            <button
              type="button"
              className="absolute right-1 top-1.5 rounded-sm p-0.5 text-sidebar-foreground/50 hover:text-sidebar-foreground transition-colors"
            >
              <ChevronRight className="h-3.5 w-3.5 transition-transform duration-200 data-[state=open]:rotate-90" />
            </button>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <SidebarMenuSub>
              {item.children.map((child) => (
                <SidebarMenuSubItem key={child.href}>
                  <SidebarMenuSubButton asChild isActive={pathname === child.href}>
                    <Link href={child.href} onClick={onNavigate}>
                      <span>{child.title}</span>
                    </Link>
                  </SidebarMenuSubButton>
                </SidebarMenuSubItem>
              ))}
            </SidebarMenuSub>
          </CollapsibleContent>
        </SidebarMenuItem>
      </Collapsible>
    );
  }

  return (
    <SidebarMenuItem>
      <SidebarMenuButton asChild isActive={isActive} tooltip={item.title}>
        <Link href={item.href} onClick={onNavigate}>
          <NavIcon name={item.icon} />
          <span>{item.title}</span>
          {item.badge && item.badge > 0 && (
            <Badge
              variant={item.badgeVariant ?? 'secondary'}
              className="ml-auto h-5 min-w-5 justify-center px-1.5 text-xs"
            >
              {item.badge}
            </Badge>
          )}
          {!item.badge && SHORTCUT_HINTS[item.href] && (
            <kbd className="ml-auto hidden h-5 select-none items-center rounded border bg-muted/60 px-1.5 font-mono text-[10px] font-medium text-muted-foreground md:inline-flex">
              {SHORTCUT_HINTS[item.href]}
            </kbd>
          )}
        </Link>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}
DomainNavItem.displayName = 'DomainNavItem';

export { DomainPopover };
export type { DomainPopoverProps };
