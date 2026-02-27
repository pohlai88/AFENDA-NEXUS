'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { getIcon } from '@/lib/modules/icon-map';
import { getActiveModule } from '@/lib/modules/get-active-module';
import { cn } from '@/lib/utils';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarSeparator,
} from '@/components/ui/sidebar';
import type { ClientModuleWithNav } from '@/lib/modules/types';

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

// ─── Types ───────────────────────────────────────────────────────────────────

interface ModuleRailProps extends React.ComponentProps<typeof Sidebar> {
  /** Visible modules with their navigation groups. */
  modules: ClientModuleWithNav[];
}

// ─── Module Rail (Left Edge) ─────────────────────────────────────────────────

/**
 * Left-edge module rail — SAP Fiori / Oracle Fusion style.
 *
 * Always renders in icon-collapsed mode (`collapsible="icon"`).
 * Shows only the top-level ERP module icons:
 *   Home → Finance → CRM → HRM → Boardroom
 *   ─── separator ───
 *   Settings → Admin (footer)
 *
 * Clicking a module icon navigates to that module's dashboard.
 * The active module is highlighted with its accent colour.
 * Domain-level navigation lives in the right popover sidebar.
 */
function ModuleRail({ modules, ...props }: ModuleRailProps) {
  const pathname = usePathname();
  const activeModuleId = getActiveModule(pathname);

  // Split modules into main (top) and utility (bottom: settings, admin)
  const mainModules = modules.filter((m) => !UTILITY_MODULE_IDS.has(m.id));
  const utilityModules = modules.filter((m) => UTILITY_MODULE_IDS.has(m.id));

  return (
    <Sidebar
      side="left"
      collapsible="icon"
      className="border-r-0"
      {...props}
    >
      {/* Brand */}
      <SidebarHeader className="p-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild tooltip="Afenda EMS" className="h-9 w-9 p-0 justify-center">
              <Link href="/">
                <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-7 items-center justify-center rounded-md text-sm font-bold">
                  A
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarSeparator />

      {/* Module Icons */}
      <SidebarContent className="px-1">
        <SidebarMenu className="gap-1">
          {mainModules.map((mod) => {
            const isActive = activeModuleId === mod.id;
            const Icon = getIcon(mod.iconName);
            return (
              <SidebarMenuItem key={mod.id}>
                <SidebarMenuButton
                  asChild
                  isActive={isActive}
                  tooltip={mod.label}
                  className={cn(
                    'h-9 w-9 p-0 justify-center',
                    isActive && ACCENT_BG[mod.accent],
                  )}
                >
                  <Link href={mod.href}>
                    <Icon className={cn('h-5 w-5', isActive && ACCENT_TEXT[mod.accent])} />
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarContent>

      {/* Utility modules (bottom) */}
      {utilityModules.length > 0 && (
        <SidebarFooter className="px-1 pb-2">
          <SidebarSeparator className="mb-1" />
          <SidebarMenu className="gap-1">
            {utilityModules.map((mod) => {
              const isActive = activeModuleId === mod.id;
              const Icon = getIcon(mod.iconName);
              return (
                <SidebarMenuItem key={mod.id}>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive}
                    tooltip={mod.label}
                    className="h-9 w-9 p-0 justify-center"
                  >
                    <Link href={mod.href}>
                      <Icon className="h-5 w-5" />
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              );
            })}
          </SidebarMenu>
        </SidebarFooter>
      )}

      <SidebarRail />
    </Sidebar>
  );
}
ModuleRail.displayName = 'ModuleRail';

export { ModuleRail };
export type { ModuleRailProps };
