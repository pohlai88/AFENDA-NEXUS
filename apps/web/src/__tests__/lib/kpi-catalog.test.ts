import { describe, expect, it } from 'vitest';
import {
  getKPICatalogEntries,
  getCatalogEntry,
  getAllCatalogEntries,
  getCatalogByGroup,
  getCatalogByTag,
  getHeroEligibleEntries,
  getQuickActions,
} from '@/lib/kpis/kpi-catalog';
import { validateKpiCatalog } from '@/lib/kpis/kpi-catalog.validate';

describe('KPI Catalog', () => {
  it('returns catalog entries for given IDs', () => {
    const entries = getKPICatalogEntries(['fin.cash', 'fin.ap', 'unknown']);
    expect(entries).toHaveLength(3);
    expect(entries[0]?.id).toBe('fin.cash');
    expect(entries[0]?.title).toBe('Cash Position');
    expect(entries[1]?.id).toBe('fin.ap');
    expect(entries[2]?.id).toBe('unknown');
    expect(entries[2]?.template).toBe('stub');
  });

  it('getCatalogEntry returns single entry or undefined', () => {
    expect(getCatalogEntry('fin.cash')?.title).toBe('Cash Position');
    expect(getCatalogEntry('unknown')).toBeUndefined();
  });

  it('getAllCatalogEntries returns all entries', () => {
    const entries = getAllCatalogEntries();
    expect(entries.length).toBeGreaterThan(50);
  });

  it('getCatalogByGroup filters by group', () => {
    const cash = getCatalogByGroup('cash');
    expect(cash.length).toBeGreaterThan(0);
    expect(cash.every((e) => e.group === 'cash')).toBe(true);
  });

  it('getCatalogByTag filters by tag', () => {
    const attention = getCatalogByTag('attention');
    expect(attention.length).toBeGreaterThan(0);
    expect(attention.every((e) => e.tags?.includes('attention'))).toBe(true);
  });

  it('getHeroEligibleEntries returns hero-eligible entries', () => {
    const hero = getHeroEligibleEntries();
    expect(hero.length).toBeGreaterThan(0);
    expect(hero.every((e) => e.heroEligible)).toBe(true);
  });

  it('getQuickActions supports quickActions and quickAction', () => {
    const cash = getCatalogEntry('fin.cash');
    expect(cash).toBeDefined();
    const actions = getQuickActions(cash!);
    expect(actions).toHaveLength(1);
    expect(actions[0]?.label).toBe('Reconcile');

    const apTotal = getCatalogEntry('fin.ap.total');
    expect(apTotal).toBeDefined();
    const apActions = getQuickActions(apTotal!);
    expect(apActions.length).toBeGreaterThanOrEqual(1);
  });
});

describe('KPI Catalog Validation', () => {
  it('all catalog entries have resolvers', () => {
    const result = validateKpiCatalog();
    expect(result.catalogWithoutResolver).toEqual([]);
  });

  it('validation passes', () => {
    const result = validateKpiCatalog();
    expect(result.ok).toBe(true);
  });
});
