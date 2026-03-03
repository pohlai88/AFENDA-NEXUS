'use server';
// rbp-allow:no-auth — stub returns static data; will add getRequestContext when wired to API

import type { EntitySearchResult } from '@/lib/search/search.types';
import { routes } from '@/lib/constants';

// ─── Global Search Server Action ──────────────────────────────────────────────
//
// Cross-entity search for the command palette v2. Searches journals, accounts,
// suppliers, and invoices. Currently uses demo data — wire to
// real DB queries via createApiClient(ctx) when backends are ready.
//
// ─────────────────────────────────────────────────────────────────────────────

/** Maximum results per entity type. */
const PER_TYPE_LIMIT = 5;

/** Demo data representing different entity types for dev/preview purposes. */
const DEMO_ENTITIES: Omit<EntitySearchResult, 'id' | 'category'>[] = [
  // Journals
  {
    title: 'JE-2026-001',
    subtitle: 'Monthly salary allocation',
    entityType: 'journal',
    href: routes.finance.journalDetail('je-2026-001'),
    icon: 'BookOpen',
    moduleId: 'finance',
  },
  {
    title: 'JE-2026-002',
    subtitle: 'Office rent accrual',
    entityType: 'journal',
    href: routes.finance.journalDetail('je-2026-002'),
    icon: 'BookOpen',
    moduleId: 'finance',
  },
  {
    title: 'JE-2026-003',
    subtitle: 'Depreciation - Q1',
    entityType: 'journal',
    href: routes.finance.journalDetail('je-2026-003'),
    icon: 'BookOpen',
    moduleId: 'finance',
  },
  {
    title: 'JE-2026-004',
    subtitle: 'Revenue recognition Feb',
    entityType: 'journal',
    href: routes.finance.journalDetail('je-2026-004'),
    icon: 'BookOpen',
    moduleId: 'finance',
  },
  {
    title: 'JE-2026-005',
    subtitle: 'FX revaluation',
    entityType: 'journal',
    href: routes.finance.journalDetail('je-2026-005'),
    icon: 'BookOpen',
    moduleId: 'finance',
  },

  // Accounts
  {
    title: '1000 - Cash & Equivalents',
    subtitle: 'Asset',
    entityType: 'account',
    href: routes.finance.accountDetail('1000'),
    icon: 'Landmark',
    moduleId: 'finance',
  },
  {
    title: '1200 - Accounts Receivable',
    subtitle: 'Asset',
    entityType: 'account',
    href: routes.finance.accountDetail('1200'),
    icon: 'Landmark',
    moduleId: 'finance',
  },
  {
    title: '2000 - Accounts Payable',
    subtitle: 'Liability',
    entityType: 'account',
    href: routes.finance.accountDetail('2000'),
    icon: 'Landmark',
    moduleId: 'finance',
  },
  {
    title: '4000 - Revenue',
    subtitle: 'Revenue',
    entityType: 'account',
    href: routes.finance.accountDetail('4000'),
    icon: 'Landmark',
    moduleId: 'finance',
  },
  {
    title: '5000 - Cost of Goods Sold',
    subtitle: 'Expense',
    entityType: 'account',
    href: routes.finance.accountDetail('5000'),
    icon: 'Landmark',
    moduleId: 'finance',
  },

  // Suppliers
  {
    title: 'Acme Corporation',
    subtitle: 'Active supplier',
    entityType: 'supplier',
    href: routes.finance.supplierDetail('acme'),
    icon: 'Building2',
    moduleId: 'finance',
  },
  {
    title: 'Global Logistics Ltd',
    subtitle: 'Active supplier',
    entityType: 'supplier',
    href: routes.finance.supplierDetail('global-logistics'),
    icon: 'Building2',
    moduleId: 'finance',
  },
  {
    title: 'TechParts Inc',
    subtitle: 'Pending onboarding',
    entityType: 'supplier',
    href: routes.finance.supplierDetail('techparts'),
    icon: 'Building2',
    moduleId: 'finance',
  },
  {
    title: 'Office Supplies Co',
    subtitle: 'Active supplier',
    entityType: 'supplier',
    href: routes.finance.supplierDetail('office-supplies'),
    icon: 'Building2',
    moduleId: 'finance',
  },

  // Invoices
  {
    title: 'INV-2026-0142',
    subtitle: 'Acme Corporation - $14,500',
    entityType: 'invoice',
    href: routes.finance.payableDetail('inv-2026-0142'),
    icon: 'FileText',
    moduleId: 'finance',
  },
  {
    title: 'INV-2026-0143',
    subtitle: 'Global Logistics - $8,200',
    entityType: 'invoice',
    href: routes.finance.payableDetail('inv-2026-0143'),
    icon: 'FileText',
    moduleId: 'finance',
  },
  {
    title: 'INV-2026-0144',
    subtitle: 'Office Supplies Co - $320',
    entityType: 'invoice',
    href: routes.finance.payableDetail('inv-2026-0144'),
    icon: 'FileText',
    moduleId: 'finance',
  },
  {
    title: 'AR-2026-0089',
    subtitle: 'Customer A - $22,000',
    entityType: 'invoice',
    href: routes.finance.receivableDetail('ar-2026-0089'),
    icon: 'FileText',
    moduleId: 'finance',
  },
];

/**
 * Search across all entity types. Returns matching results grouped by type.
 * Uses demo data for command palette preview.
 */
export async function searchGlobal(query: string): Promise<EntitySearchResult[]> {
  // Simulate network latency
  await new Promise((r) => setTimeout(r, 150));

  if (!query || query.trim().length < 2) return [];

  const q = query.toLowerCase().trim();

  const matches = DEMO_ENTITIES.filter(
    (e) => e.title.toLowerCase().includes(q) || (e.subtitle?.toLowerCase().includes(q) ?? false)
  );

  // Group by entity type and cap per type
  const grouped = new Map<string, EntitySearchResult[]>();
  for (const match of matches) {
    const list = grouped.get(match.entityType) ?? [];
    if (list.length < PER_TYPE_LIMIT) {
      list.push({
        ...match,
        id: `entity-${match.entityType}-${match.href}`,
        category: 'entity' as const,
      });
    }
    grouped.set(match.entityType, list);
  }

  return Array.from(grouped.values()).flat();
}
