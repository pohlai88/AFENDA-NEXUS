import type { NavGroup } from '@/lib/constants';

// ─── Module Identity ────────────────────────────────────────────────────────

export type ModuleId = 'home' | 'finance' | 'hrm' | 'crm' | 'boardroom' | 'settings' | 'admin';

export type ModuleAccent = 'emerald' | 'violet' | 'sky' | 'amber' | 'rose' | 'slate' | 'red';

// ─── Client-Safe Module Shape ───────────────────────────────────────────────

/** Serializable module shape passed from server layout → client AppShell */
export interface ClientModuleWithNav {
  id: ModuleId;
  label: string;
  href: string;
  iconName: string;
  accent: ModuleAccent;
  navGroups: NavGroup[];
}

// ─── Dashboard Scope ────────────────────────────────────────────────────────

export type DashboardScope =
  | { type: 'module'; id: ModuleId }
  | { type: 'domain'; id: string };
