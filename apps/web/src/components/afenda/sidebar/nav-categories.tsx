'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronRight } from 'lucide-react';
import { getIcon } from '@/lib/modules/icon-map';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from '@/components/ui/sidebar';

// ─── Types ───────────────────────────────────────────────────────────────────

/** A module entry shown under a category. */
export interface SidebarModuleEntry {
  /** Module id (e.g. 'finance'). */
  id: string;
  /** Display label (e.g. 'Finance'). */
  label: string;
  /** Navigation target (e.g. '/finance'). */
  href: string;
  /** Lucide icon name for the icon-map. */
  icon: string;
}

export interface SidebarCategory {
  /** Category label (e.g. 'ERP', 'Boardroom', 'Configuration'). */
  label: string;
  /** 3D-style emoji for category visual differentiation. */
  emoji: string;
  /** Icon name from the icon-map for collapsed mode tooltip. */
  icon: string;
  /** Modules belonging to this category. */
  modules: SidebarModuleEntry[];
}

// ─── NavCategories ───────────────────────────────────────────────────────────

/**
 * Category-based navigation — shadcn sidebar-10 NavWorkspaces pattern.
 *
 * Hierarchy: Category → Module (e.g. ERP → Finance, HRM, CRM).
 * Does NOT drill into individual NavGroups / sub-domains — users navigate
 * to the module landing page and explore domains from there.
 *
 * Categories are config-driven via CATEGORY_DEFS in sidebar-config.
 */
export function NavCategories({ categories }: { categories: SidebarCategory[] }) {
  const pathname = usePathname();

  return (
    <SidebarGroup>
      <SidebarGroupLabel>Navigation</SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {categories.map((category) => {
            // Category is active if any child module href matches
            const isCategoryActive = category.modules.some(
              (mod) =>
                pathname === mod.href ||
                pathname.startsWith(`${mod.href}/`),
            );

            return (
              <Collapsible key={category.label} defaultOpen={isCategoryActive}>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild tooltip={category.label}>
                    <CollapsibleTrigger className="w-full">
                      <span className="shrink-0 text-base leading-none" role="img" aria-hidden>
                        {category.emoji}
                      </span>
                      <span className="flex-1 text-left">{category.label}</span>
                      <ChevronRight className="ml-auto size-4 shrink-0 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                    </CollapsibleTrigger>
                  </SidebarMenuButton>

                  <CollapsibleContent>
                    <SidebarMenuSub>
                      {category.modules.map((mod) => {
                        const isActive =
                          pathname === mod.href ||
                          pathname.startsWith(`${mod.href}/`);
                        const ModIcon = getIcon(mod.icon);
                        return (
                          <SidebarMenuSubItem key={mod.id}>
                            <SidebarMenuSubButton asChild isActive={isActive}>
                              <Link href={mod.href}>
                                <ModIcon className="size-4 shrink-0" />
                                <span>{mod.label}</span>
                              </Link>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                        );
                      })}
                    </SidebarMenuSub>
                  </CollapsibleContent>
                </SidebarMenuItem>
              </Collapsible>
            );
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
NavCategories.displayName = 'NavCategories';
