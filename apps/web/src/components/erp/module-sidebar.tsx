'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { getIcon } from '@/lib/modules/icon-map';
import { Star } from 'lucide-react';
import { useFavorites } from '@/hooks/use-favorites';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarSeparator,
} from '@/components/ui/sidebar';
import { cn } from '@/lib/utils';
import { getActiveModule } from '@/lib/modules/get-active-module';
import type { ClientModuleWithNav } from '@/lib/modules/types';

// ─── Accent Colour Maps ─────────────────────────────────────────────────────

/** Maps a module accent key to a foreground text class. */
const ACCENT_TEXT: Record<string, string> = {
  emerald: 'text-emerald-600 dark:text-emerald-400',
  violet: 'text-violet-600 dark:text-violet-400',
  sky: 'text-sky-600 dark:text-sky-400',
  amber: 'text-amber-600 dark:text-amber-400',
  rose: 'text-rose-600 dark:text-rose-400',
  slate: 'text-foreground',
  red: 'text-red-600 dark:text-red-400',
} as const;

/** Maps a module accent key to a background highlight class. */
const ACCENT_BG: Record<string, string> = {
  emerald: 'bg-emerald-100 dark:bg-emerald-900/30',
  violet: 'bg-violet-100 dark:bg-violet-900/30',
  sky: 'bg-sky-100 dark:bg-sky-900/30',
  amber: 'bg-amber-100 dark:bg-amber-900/30',
  rose: 'bg-rose-100 dark:bg-rose-900/30',
  slate: 'bg-accent',
  red: 'bg-red-100 dark:bg-red-900/30',
} as const;

// ─── Utility IDs ─────────────────────────────────────────────────────────────

const UTILITY_MODULE_IDS = new Set(['settings', 'admin']);

// ─── Types ───────────────────────────────────────────────────────────────────

interface ModuleSidebarProps {
  /** Visible modules with their navigation groups. */
  modules: ClientModuleWithNav[];
}

interface ModuleItemProps {
  /** The module to render. */
  module: ClientModuleWithNav;
  /** Whether this module is currently active. */
  isActive: boolean;
}

// ─── Module Sidebar (Left Edge) ──────────────────────────────────────────────

function ModuleSidebar({ modules }: ModuleSidebarProps) {
  const pathname = usePathname();
  const activeModuleId = getActiveModule(pathname);
  const { favorites } = useFavorites();

  // Split modules into main (top) and utility (bottom: settings, admin)
  const mainModules = modules.filter((m) => !UTILITY_MODULE_IDS.has(m.id));
  const utilityModules = modules.filter((m) => UTILITY_MODULE_IDS.has(m.id));

  return (
    <Sidebar side="left" collapsible="icon">
      <SidebarHeader className="p-3">
        <div className="flex items-center gap-2 px-1">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary text-primary-foreground text-sm font-bold">
            A
          </div>
          <span className="text-lg font-bold tracking-tight group-data-[collapsible=icon]:hidden">
            Afenda
          </span>
        </div>
      </SidebarHeader>

      <SidebarSeparator />

      <SidebarContent>
        {/* Favorites — only visible when sidebar is expanded */}
        {favorites.length > 0 && (
          <SidebarGroup className="group-data-[collapsible=icon]:hidden">
            <SidebarGroupLabel className="flex items-center gap-1.5 text-xs">
              <Star className="h-3 w-3" />
              Favorites
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu className="px-2">
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
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {favorites.length > 0 && <SidebarSeparator />}

        <SidebarMenu className="px-2 py-1">
          {mainModules.map((mod) => (
            <ModuleItem key={mod.id} module={mod} isActive={activeModuleId === mod.id} />
          ))}
        </SidebarMenu>
      </SidebarContent>

      {utilityModules.length > 0 && (
        <SidebarFooter className="px-2 pb-3">
          <SidebarSeparator className="mb-2" />
          <SidebarMenu>
            {utilityModules.map((mod) => (
              <ModuleItem key={mod.id} module={mod} isActive={activeModuleId === mod.id} />
            ))}
          </SidebarMenu>
        </SidebarFooter>
      )}

      <SidebarRail />
    </Sidebar>
  );
}
ModuleSidebar.displayName = 'ModuleSidebar';

// ─── Module Item ─────────────────────────────────────────────────────────────

function ModuleItem({ module: mod, isActive }: ModuleItemProps) {
  const Icon = getIcon(mod.iconName);

  return (
    <SidebarMenuItem>
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
}
ModuleItem.displayName = 'ModuleItem';

export { ModuleSidebar };
export type { ModuleSidebarProps, ModuleItemProps };
