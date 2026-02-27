'use server';

import type { EntitySearchResult } from '@/lib/search/search.types';

// ─── Global Search Server Action ──────────────────────────────────────────────
//
// Cross-entity search for the command palette v2. Searches journals, accounts,
// suppliers, and invoices using ilike queries. Currently stubbed — wire to
// real DB queries via createApiClient(ctx) when backends are ready.
//
// ─────────────────────────────────────────────────────────────────────────────

/** Maximum results per entity type. */
const PER_TYPE_LIMIT = 5;

/** Stub data representing different entity types for demo/dev purposes. */
const STUB_ENTITIES: Omit<EntitySearchResult, 'id' | 'category'>[] = [
  // Journals
  { title: 'JE-2026-001', subtitle: 'Monthly salary allocation', entityType: 'journal', href: '/finance/journals/je-2026-001', icon: 'BookOpen', moduleId: 'finance' },
  { title: 'JE-2026-002', subtitle: 'Office rent accrual', entityType: 'journal', href: '/finance/journals/je-2026-002', icon: 'BookOpen', moduleId: 'finance' },
  { title: 'JE-2026-003', subtitle: 'Depreciation - Q1', entityType: 'journal', href: '/finance/journals/je-2026-003', icon: 'BookOpen', moduleId: 'finance' },
  { title: 'JE-2026-004', subtitle: 'Revenue recognition Feb', entityType: 'journal', href: '/finance/journals/je-2026-004', icon: 'BookOpen', moduleId: 'finance' },
  { title: 'JE-2026-005', subtitle: 'FX revaluation', entityType: 'journal', href: '/finance/journals/je-2026-005', icon: 'BookOpen', moduleId: 'finance' },

  // Accounts
  { title: '1000 - Cash & Equivalents', subtitle: 'Asset', entityType: 'account', href: '/finance/accounts/1000', icon: 'Landmark', moduleId: 'finance' },
  { title: '1200 - Accounts Receivable', subtitle: 'Asset', entityType: 'account', href: '/finance/accounts/1200', icon: 'Landmark', moduleId: 'finance' },
  { title: '2000 - Accounts Payable', subtitle: 'Liability', entityType: 'account', href: '/finance/accounts/2000', icon: 'Landmark', moduleId: 'finance' },
  { title: '4000 - Revenue', subtitle: 'Revenue', entityType: 'account', href: '/finance/accounts/4000', icon: 'Landmark', moduleId: 'finance' },
  { title: '5000 - Cost of Goods Sold', subtitle: 'Expense', entityType: 'account', href: '/finance/accounts/5000', icon: 'Landmark', moduleId: 'finance' },

  // Suppliers
  { title: 'Acme Corporation', subtitle: 'Active supplier', entityType: 'supplier', href: '/finance/payables/suppliers/acme', icon: 'Building2', moduleId: 'finance' },
  { title: 'Global Logistics Ltd', subtitle: 'Active supplier', entityType: 'supplier', href: '/finance/payables/suppliers/global-logistics', icon: 'Building2', moduleId: 'finance' },
  { title: 'TechParts Inc', subtitle: 'Pending onboarding', entityType: 'supplier', href: '/finance/payables/suppliers/techparts', icon: 'Building2', moduleId: 'finance' },
  { title: 'Office Supplies Co', subtitle: 'Active supplier', entityType: 'supplier', href: '/finance/payables/suppliers/office-supplies', icon: 'Building2', moduleId: 'finance' },

  // Invoices
  { title: 'INV-2026-0142', subtitle: 'Acme Corporation - $14,500', entityType: 'invoice', href: '/finance/payables/inv-2026-0142', icon: 'FileText', moduleId: 'finance' },
  { title: 'INV-2026-0143', subtitle: 'Global Logistics - $8,200', entityType: 'invoice', href: '/finance/payables/inv-2026-0143', icon: 'FileText', moduleId: 'finance' },
  { title: 'INV-2026-0144', subtitle: 'Office Supplies Co - $320', entityType: 'invoice', href: '/finance/payables/inv-2026-0144', icon: 'FileText', moduleId: 'finance' },
  { title: 'AR-2026-0089', subtitle: 'Customer A - $22,000', entityType: 'invoice', href: '/finance/receivables/ar-2026-0089', icon: 'FileText', moduleId: 'finance' },
];

/**
 * Search across all entity types. Returns matching results grouped by type.
 *
 * TODO: Replace with real DB queries:
 *   const client = createApiClient(ctx);
 *   const [journals, accounts, suppliers, invoices] = await Promise.all([
 *     client.get('/gl/journals', { search: query, limit: PER_TYPE_LIMIT }),
 *     client.get('/gl/accounts', { search: query, limit: PER_TYPE_LIMIT }),
 *     client.get('/ap/suppliers', { search: query, limit: PER_TYPE_LIMIT }),
 *     client.get('/ap/invoices', { search: query, limit: PER_TYPE_LIMIT }),
 *   ]);
 */
export async function searchGlobal(query: string): Promise<EntitySearchResult[]> {
  // Simulate network latency
  await new Promise((r) => setTimeout(r, 150));

  if (!query || query.trim().length < 2) return [];

  const q = query.toLowerCase().trim();

  const matches = STUB_ENTITIES.filter(
    (e) =>
      e.title.toLowerCase().includes(q) ||
      (e.subtitle?.toLowerCase().includes(q) ?? false),
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
