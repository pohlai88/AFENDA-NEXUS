'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Star, ChevronDown, Search, Home, Settings2, ShieldCheck } from 'lucide-react';
import { getIcon } from '@/lib/modules/icon-map';
import { getActiveModule } from '@/lib/modules/get-active-module';
import { useFavorites } from '@/hooks/use-favorites';
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
  Sidebar,
  SidebarContent,
  SidebarFooter,
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
  SidebarRail,
  SidebarSeparator,
  useSidebar,
} from '@/components/ui/sidebar';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { ChevronRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { TenantSwitcher } from './tenant-switcher';
import { CompanySwitcher } from './company-switcher';
import { PeriodIndicator } from './period-indicator';
import type { ClientModuleWithNav } from '@/lib/modules/types';
import type { NavGroup, NavItem } from '@/lib/constants';

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

const ACCENT_BG: Record<string, string> = {
  emerald: 'bg-emerald-100 dark:bg-emerald-900/30',
  violet: 'bg-violet-100 dark:bg-violet-900/30',
  sky: 'bg-sky-100 dark:bg-sky-900/30',
  amber: 'bg-amber-100 dark:bg-amber-900/30',
  rose: 'bg-rose-100 dark:bg-rose-900/30',
  slate: 'bg-accent',
  red: 'bg-red-100 dark:bg-red-900/30',
} as const;

// ─── Utility Module IDs ──────────────────────────────────────────────────────

const UTILITY_MODULE_IDS = new Set(['settings', 'admin']);

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

// ─── Types ───────────────────────────────────────────────────────────────────

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  modules: ClientModuleWithNav[];
  onSwitchCompany?: (companyId: string) => Promise<void>;
  onOpenSearch?: () => void;
}

// ─── Icon Helper ─────────────────────────────────────────────────────────────

function NavIcon({ name, className }: { name: string; className?: string }) {
  const Icon = getIcon(name);
  return <Icon className={cn('h-4 w-4', className)} />;
}
NavIcon.displayName = 'NavIcon';

// ─── App Sidebar (sidebar-10 pattern) ────────────────────────────────────────

/**
 * Unified application sidebar following the shadcn sidebar-10 pattern.
 *
 * Layout:
 *   SidebarHeader  → Brand + Tenant/Company/Period switchers
 *   NavMain        → Quick-access module icons (Home, Search, active module)
 *   NavFavorites   → User-pinned pages
 *   NavDomain      → Active module's navigation groups (collapsible)
 *   NavSecondary   → Settings, Admin (utility modules) pushed to footer
 *   SidebarRail    → Collapsible icon mode
 */
function AppSidebar({
  modules,
  onSwitchCompany,
  onOpenSearch,
  ...props
}: AppSidebarProps) {
  const pathname = usePathname();
  const activeModuleId = getActiveModule(pathname);
  const activeModule = modules.find((m) => m.id === activeModuleId);
  const { favorites } = useFavorites();

  // Split modules into main (top) and utility (bottom: settings, admin)
  const mainModules = modules.filter((m) => !UTILITY_MODULE_IDS.has(m.id));
  const utilityModules = modules.filter((m) => UTILITY_MODULE_IDS.has(m.id));

  return (
    <Sidebar className="border-r-0" {...props}>
      {/* ── Header: Brand + Context Switchers ── */}
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild className="h-auto py-2">
              <Link href="/" className="flex items-center gap-2">
                <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-6 items-center justify-center rounded-md text-sm font-bold">
                  A
                </div>
                <span className="truncate text-lg font-bold tracking-tight">
                  Afenda
                </span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>

        {/* Tenant/Company/Period — hidden when sidebar is icon-collapsed */}
        <div className="space-y-1 group-data-[collapsible=icon]:hidden">
          <TenantSwitcher />
          <CompanySwitcher onSwitchCompany={onSwitchCompany} />
          <PeriodIndicator />
        </div>

        <SidebarSeparator />

        {/* Quick-access nav (search, home) */}
        <NavMain
          modules={mainModules}
          activeModuleId={activeModuleId}
          pathname={pathname}
          onOpenSearch={onOpenSearch}
        />
      </SidebarHeader>

      {/* ── Content: Favorites + Domain Nav ── */}
      <SidebarContent>
        {/* Favorites */}
        {favorites.length > 0 && (
          <NavFavorites favorites={favorites} pathname={pathname} />
        )}

        {/* Active module domain navigation */}
        {activeModule && activeModule.navGroups.length > 0 && (
          <NavDomain
            moduleLabel={activeModule.label}
            navGroups={activeModule.navGroups}
            accent={activeModule.accent}
            pathname={pathname}
          />
        )}

        {/* Utility modules pushed to bottom */}
        {utilityModules.length > 0 && (
          <NavSecondary modules={utilityModules} activeModuleId={activeModuleId} pathname={pathname} />
        )}
      </SidebarContent>

      <SidebarRail />
    </Sidebar>
  );
}
AppSidebar.displayName = 'AppSidebar';

// ─── NavMain: Quick-access Module Icons ──────────────────────────────────────

function NavMain({
  modules,
  activeModuleId,
  pathname,
  onOpenSearch,
}: {
  modules: ClientModuleWithNav[];
  activeModuleId: string;
  pathname: string;
  onOpenSearch?: () => void;
}) {
  return (
    <SidebarMenu>
      {/* Search action */}
      {onOpenSearch && (
        <SidebarMenuItem>
          <SidebarMenuButton tooltip="Search (⌘K)" onClick={onOpenSearch}>
            <Search className="h-4 w-4" />
            <span>Search</span>
          </SidebarMenuButton>
        </SidebarMenuItem>
      )}

      {/* Module items */}
      {modules.map((mod) => {
        const isActive = activeModuleId === mod.id;
        const Icon = getIcon(mod.iconName);
        return (
          <SidebarMenuItem key={mod.id}>
            <SidebarMenuButton
              asChild
              isActive={isActive}
              tooltip={mod.label}
              className={cn(isActive && ACCENT_BG[mod.accent])}
            >
              <Link href={mod.href}>
                <Icon className={cn('h-4 w-4', isActive && ACCENT_TEXT[mod.accent])} />
                <span className={cn(isActive && ACCENT_TEXT[mod.accent])}>{mod.label}</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        );
      })}
    </SidebarMenu>
  );
}
NavMain.displayName = 'NavMain';

// ─── NavFavorites ────────────────────────────────────────────────────────────

function NavFavorites({
  favorites,
  pathname,
}: {
  favorites: { href: string; title: string; icon?: string }[];
  pathname: string;
}) {
  const { isMobile } = useSidebar();

  return (
    <SidebarGroup className="group-data-[collapsible=icon]:hidden">
      <SidebarGroupLabel className="flex items-center gap-1.5">
        <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
        Favorites
      </SidebarGroupLabel>
      <SidebarMenu>
        {favorites.slice(0, 8).map((fav) => {
          const FavIcon = fav.icon ? getIcon(fav.icon) : Star;
          const isActive = pathname === fav.href;
          return (
            <SidebarMenuItem key={fav.href}>
              <SidebarMenuButton asChild isActive={isActive} tooltip={fav.title}>
                <Link href={fav.href}>
                  <FavIcon className="h-3.5 w-3.5" />
                  <span className="truncate text-xs">{fav.title}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          );
        })}
      </SidebarMenu>
    </SidebarGroup>
  );
}
NavFavorites.displayName = 'NavFavorites';

// ─── NavDomain: Active Module Navigation ─────────────────────────────────────

function NavDomain({
  moduleLabel,
  navGroups,
  accent,
  pathname,
}: {
  moduleLabel: string;
  navGroups: NavGroup[];
  accent: string;
  pathname: string;
}) {
  return (
    <SidebarGroup>
      <SidebarGroupLabel className={cn('flex items-center gap-2', ACCENT_TEXT[accent])}>
        {moduleLabel}
      </SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {navGroups.map((group) => (
            <NavGroupSection
              key={group.title}
              group={group}
              pathname={pathname}
            />
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
NavDomain.displayName = 'NavDomain';

// ─── NavGroupSection ─────────────────────────────────────────────────────────

function NavGroupSection({
  group,
  pathname,
}: {
  group: NavGroup;
  pathname: string;
}) {
  const isActive = group.items.some((item) => pathname.startsWith(item.href));

  if (group.collapsible) {
    return (
      <Collapsible asChild defaultOpen={isActive}>
        <SidebarMenuItem>
          <SidebarMenuButton asChild>
            <span className="flex items-center gap-2 cursor-default">
              <NavIcon name={group.icon} className="h-3.5 w-3.5" />
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                {group.title}
              </span>
            </span>
          </SidebarMenuButton>
          <CollapsibleTrigger asChild>
            <button
              type="button"
              className="absolute right-1 top-1.5 rounded-sm p-0.5 text-sidebar-foreground/50 hover:text-sidebar-foreground transition-colors"
            >
              <ChevronRight className="h-3.5 w-3.5 transition-transform duration-200 group-data-[state=open]:rotate-90" />
            </button>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <SidebarMenuSub>
              {group.items.map((item) => (
                <NavSubItem key={item.href} item={item} pathname={pathname} />
              ))}
            </SidebarMenuSub>
          </CollapsibleContent>
        </SidebarMenuItem>
      </Collapsible>
    );
  }

  // Non-collapsible: render items directly
  return (
    <>
      {group.items.map((item) => (
        <DomainNavItem key={item.href} item={item} pathname={pathname} />
      ))}
    </>
  );
}
NavGroupSection.displayName = 'NavGroupSection';

// ─── DomainNavItem ───────────────────────────────────────────────────────────

function DomainNavItem({
  item,
  pathname,
}: {
  item: NavItem;
  pathname: string;
}) {
  const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);

  if (item.children && item.children.length > 0) {
    return (
      <Collapsible asChild defaultOpen={isActive}>
        <SidebarMenuItem>
          <SidebarMenuButton asChild isActive={isActive} tooltip={item.title}>
            <Link href={item.href}>
              <NavIcon name={item.icon} />
              <span>{item.title}</span>
            </Link>
          </SidebarMenuButton>
          <CollapsibleTrigger asChild>
            <button
              type="button"
              className="absolute right-1 top-1.5 rounded-sm p-0.5 text-sidebar-foreground/50 hover:text-sidebar-foreground transition-colors"
            >
              <ChevronRight className="h-3.5 w-3.5 transition-transform duration-200 group-data-[state=open]:rotate-90" />
            </button>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <SidebarMenuSub>
              {item.children.map((child) => (
                <SidebarMenuSubItem key={child.href}>
                  <SidebarMenuSubButton asChild isActive={pathname === child.href}>
                    <Link href={child.href}>
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
        <Link href={item.href}>
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
            <kbd className="ml-auto hidden h-5 select-none items-center rounded border bg-muted/60 px-1.5 font-mono text-[10px] font-medium text-muted-foreground group-data-[state=expanded]:inline-flex">
              {SHORTCUT_HINTS[item.href]}
            </kbd>
          )}
        </Link>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}
DomainNavItem.displayName = 'DomainNavItem';

// ─── NavSubItem (for collapsible group children) ─────────────────────────────

function NavSubItem({
  item,
  pathname,
}: {
  item: NavItem;
  pathname: string;
}) {
  const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);

  return (
    <SidebarMenuSubItem>
      <SidebarMenuSubButton asChild isActive={isActive}>
        <Link href={item.href}>
          <NavIcon name={item.icon} className="h-3.5 w-3.5" />
          <span>{item.title}</span>
          {item.badge && item.badge > 0 && (
            <Badge
              variant={item.badgeVariant ?? 'secondary'}
              className="ml-auto h-4 min-w-4 justify-center px-1 text-[10px]"
            >
              {item.badge}
            </Badge>
          )}
        </Link>
      </SidebarMenuSubButton>
    </SidebarMenuSubItem>
  );
}
NavSubItem.displayName = 'NavSubItem';

// ─── NavSecondary: Utility Modules (bottom) ──────────────────────────────────

function NavSecondary({
  modules,
  activeModuleId,
  pathname,
}: {
  modules: ClientModuleWithNav[];
  activeModuleId: string;
  pathname: string;
}) {
  return (
    <SidebarGroup className="mt-auto">
      <SidebarGroupContent>
        <SidebarMenu>
          {modules.map((mod) => {
            const isActive = activeModuleId === mod.id;
            const Icon = getIcon(mod.iconName);
            return (
              <SidebarMenuItem key={mod.id}>
                <SidebarMenuButton asChild isActive={isActive} tooltip={mod.label}>
                  <Link href={mod.href}>
                    <Icon className="h-4 w-4" />
                    <span>{mod.label}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
NavSecondary.displayName = 'NavSecondary';

export { AppSidebar };
export type { AppSidebarProps };
