'use client';

import * as React from 'react';
import { ContextSwitcher } from '@/components/erp/context-switcher';
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarRail,
  SidebarSeparator,
} from '@/components/ui/sidebar';
import { NavMain } from './nav-main';
import { NavFavorites } from './nav-favorites';
import { NavPortals } from './nav-portals';
import { NavCategories, type SidebarCategory } from './nav-categories';
import { NavSecondary, type NavSecondaryItem } from './nav-secondary';
import { NavQuickActions } from './nav-quick-actions';
import type { ClientModuleWithNav } from '@/lib/modules/types';
import type { AttentionSummary } from '@/lib/attention/attention.types';
import {
  NAV_MAIN_ITEMS,
  CATEGORY_DEFS,
  PORTAL_DEFS,
  SECONDARY_ITEM_DEFS,
} from '@/lib/sidebar/sidebar-config';

// ─── Category Builder ────────────────────────────────────────────────────────

/**
 * Build sidebar categories from the config-driven CATEGORY_DEFS + module data.
 *
 * Hierarchy: Category → Module (not NavGroup).
 * Each module entry links to its landing page. Users drill into domains
 * (NavGroups) from within the module page itself.
 */
function buildCategories(modules: ClientModuleWithNav[]): SidebarCategory[] {
  const moduleMap = new Map(modules.map((m) => [m.id, m]));

  return CATEGORY_DEFS.map((def) => {
    const mods = def.moduleIds
      .map((id) => moduleMap.get(id))
      .filter((m): m is ClientModuleWithNav => m != null)
      .map((m) => ({
        id: m.id,
        label: m.label,
        href: m.href,
        icon: m.iconName,
      }));

    return {
      label: def.label,
      emoji: def.emoji,
      icon: def.icon,
      modules: mods,
    };
  }).filter((c) => c.modules.length > 0);
}

// ─── Types ───────────────────────────────────────────────────────────────────

interface AfendaSidebarProps extends React.ComponentProps<typeof Sidebar> {
  /** Visible modules with their navigation groups. */
  modules: ClientModuleWithNav[];
  /** Server action called when the active company changes. */
  onSwitchCompany?: (companyId: string) => Promise<void>;
  /** Live attention summary — drives the Approvals badge count. */
  attentionSummary?: AttentionSummary;
}

// ─── AfendaSidebar ───────────────────────────────────────────────────────────

/**
 * Afenda application sidebar — shadcn sidebar-10 pattern.
 *
 * Layout (top → bottom):
 *   SidebarHeader
 *     ├── ContextSwitcher (org/company multi-tenancy)
 *     ├── SidebarSeparator
 *     └── NavMain (Home, Approvals — live badge from AttentionSummary)
 *   SidebarContent
 *     ├── NavQuickActions (configurable CRUD shortcuts — Ctrl+1…9)
 *     ├── NavFavorites (user-pinned pages with picker dialog)
 *     ├── NavPortals (Customer, Supplier, Investor, Franchisee portals)
 *     ├── NavCategories (Category → Module — config-driven)
 *     └── NavSecondary (Settings, Admin — config-driven, mt-auto)
 *   SidebarRail (icon-only collapsed mode)
 */
function AfendaSidebar({
  modules,
  onSwitchCompany,
  attentionSummary,
  ...props
}: AfendaSidebarProps) {
  const categories = React.useMemo(() => buildCategories(modules), [modules]);

  // Build nav-main items with live badge from attentionSummary
  const navMainItems = React.useMemo(() => {
    const pendingCount = attentionSummary?.total;
    return NAV_MAIN_ITEMS.map((item) => ({
      ...item,
      // Attach the live pending count to the Approvals item
      badge: item.icon === 'CheckCircle' && pendingCount ? String(pendingCount) : undefined,
    }));
  }, [attentionSummary]);

  // Secondary items — config-driven, filtered to visible modules
  const secondaryItems = React.useMemo<NavSecondaryItem[]>(() => {
    const visibleIds = new Set(modules.map((m) => m.id));
    return SECONDARY_ITEM_DEFS.filter((def) => visibleIds.has(def.moduleId)).map(
      ({ title, href, icon }) => ({ title, href, icon })
    );
  }, [modules]);

  return (
    <Sidebar collapsible="icon" className="border-r-0" {...props}>
      {/* ─── Header: Multi-tenancy → Quick-access ─── */}
      <SidebarHeader>
        <ContextSwitcher onSwitchCompany={onSwitchCompany} />
        <SidebarSeparator className="mx-0" />
        <NavMain items={navMainItems} />
      </SidebarHeader>

      {/* ─── Content: Quick Actions → Favorites → Portals → Categories → Secondary ─── */}
      <SidebarContent>
        <NavQuickActions />
        <NavFavorites modules={modules} />
        <NavPortals portals={PORTAL_DEFS} />
        <NavCategories categories={categories} />
        <NavSecondary items={secondaryItems} className="mt-auto" />
      </SidebarContent>

      <SidebarRail />
    </Sidebar>
  );
}
AfendaSidebar.displayName = 'AfendaSidebar';

export { AfendaSidebar };
export type { AfendaSidebarProps };
