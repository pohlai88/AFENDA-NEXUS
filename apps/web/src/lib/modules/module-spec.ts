import type { ModuleId, ModuleAccent } from './types';

// ─── Module Spec (client-safe) ──────────────────────────────────────────────
// No Lucide imports. No NavGroups. Pure JSON-serializable.
// Safe to import from any client or server file.

export interface ModuleSpec {
  id: ModuleId;
  label: string;
  href: string;
  matchers: string[];
  iconName: string;
  accent: ModuleAccent;
  visibility: 'all' | 'admin';
}

/**
 * Ordered by matcher specificity (longest first). Home last.
 * This ordering ensures getActiveModule() does longest-prefix match.
 */
export const MODULE_SPECS: ModuleSpec[] = [
  { id: 'finance', label: 'Finance', href: '/finance', matchers: ['/finance'], iconName: 'Landmark', accent: 'emerald', visibility: 'all' },
  { id: 'hrm', label: 'HRM', href: '/hrm', matchers: ['/hrm'], iconName: 'Users', accent: 'violet', visibility: 'all' },
  { id: 'crm', label: 'CRM', href: '/crm', matchers: ['/crm'], iconName: 'Handshake', accent: 'sky', visibility: 'all' },
  { id: 'boardroom', label: 'Boardroom', href: '/boardroom', matchers: ['/boardroom'], iconName: 'MessageSquare', accent: 'amber', visibility: 'all' },
  { id: 'settings', label: 'Settings', href: '/settings', matchers: ['/settings'], iconName: 'Settings', accent: 'slate', visibility: 'all' },
  { id: 'admin', label: 'Admin', href: '/admin', matchers: ['/admin'], iconName: 'ShieldCheck', accent: 'red', visibility: 'admin' },
  { id: 'home', label: 'Home', href: '/', matchers: ['/'], iconName: 'Home', accent: 'slate', visibility: 'all' },
];
