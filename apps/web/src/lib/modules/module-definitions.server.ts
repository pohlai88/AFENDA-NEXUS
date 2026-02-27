import type { LucideIcon } from 'lucide-react';
import {
  Home,
  Landmark,
  Users,
  Handshake,
  MessageSquare,
  Settings,
  ShieldCheck,
} from 'lucide-react';
import { MODULE_SPECS, type ModuleSpec } from './module-spec';
import type { ModuleId, ClientModuleWithNav } from './types';
import type { NavGroup } from '@/lib/constants';
import {
  financeNavigationGroups,
  hrmNavigationGroups,
  crmNavigationGroups,
  boardroomNavigationGroups,
  settingsNavigationGroups,
  adminNavigationGroups,
} from '@/lib/constants';

// ─── Server-Only Module Definition ──────────────────────────────────────────
// Enriches ModuleSpec with LucideIcon, NavGroups, and dashboard config.
// NEVER import this file from client code.

interface ModuleDefinition extends ModuleSpec {
  icon: LucideIcon;
  navGroups: NavGroup[];
  dashboard: {
    kpiIds: string[];
    shortcutsFromNav: boolean;
  };
}

const ICON_MAP: Record<string, LucideIcon> = {
  Home,
  Landmark,
  Users,
  Handshake,
  MessageSquare,
  Settings,
  ShieldCheck,
};

const NAV_GROUPS_MAP: Record<ModuleId, NavGroup[]> = {
  home: [],
  finance: financeNavigationGroups,
  hrm: hrmNavigationGroups,
  crm: crmNavigationGroups,
  boardroom: boardroomNavigationGroups,
  settings: settingsNavigationGroups,
  admin: adminNavigationGroups,
};

const DASHBOARD_CONFIG: Record<ModuleId, { kpiIds: string[]; shortcutsFromNav: boolean }> = {
  home: { kpiIds: ['home.activity'], shortcutsFromNav: false },
  finance: { kpiIds: ['fin.cash', 'fin.ap', 'fin.ar', 'fin.pnl'], shortcutsFromNav: true },
  hrm: { kpiIds: ['stub.comingSoon'], shortcutsFromNav: true },
  crm: { kpiIds: ['stub.comingSoon'], shortcutsFromNav: true },
  boardroom: { kpiIds: ['stub.comingSoon'], shortcutsFromNav: true },
  settings: { kpiIds: [], shortcutsFromNav: false },
  admin: { kpiIds: ['admin.tenants', 'admin.users'], shortcutsFromNav: true },
};

export const MODULES: ModuleDefinition[] = MODULE_SPECS.map((spec) => ({
  ...spec,
  icon: ICON_MAP[spec.iconName] ?? Home,
  navGroups: NAV_GROUPS_MAP[spec.id] ?? [],
  dashboard: DASHBOARD_CONFIG[spec.id] ?? { kpiIds: [], shortcutsFromNav: false },
}));

export function getModuleById(id: ModuleId): ModuleDefinition {
  const mod = MODULES.find((m) => m.id === id);
  if (!mod) throw new Error(`Unknown module: ${id}`);
  return mod;
}

/**
 * Compute visible modules for this session. Returns serializable ClientModuleWithNav[].
 * Admin module only included when canSeeAdmin is true.
 */
export function computeVisibleModulesWithNav(canSeeAdmin: boolean): ClientModuleWithNav[] {
  return MODULES.filter(
    (m) => m.visibility === 'all' || (m.visibility === 'admin' && canSeeAdmin)
  ).map((m) => ({
    id: m.id,
    label: m.label,
    href: m.href,
    iconName: m.iconName,
    accent: m.accent,
    navGroups: m.navGroups,
  }));
}
