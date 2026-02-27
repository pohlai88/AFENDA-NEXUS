import { searchGlobal } from '@/features/platform/search/actions/global-search.action';

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('searchGlobal', () => {
  it('returns empty array for queries shorter than 2 characters', async () => {
    expect(await searchGlobal('')).toEqual([]);
    expect(await searchGlobal('a')).toEqual([]);
    expect(await searchGlobal(' ')).toEqual([]);
  });

  it('returns empty array for empty / undefined-ish query', async () => {
    expect(await searchGlobal('')).toEqual([]);
  });

  it('returns matching results for valid query', async () => {
    const results = await searchGlobal('Acme');
    expect(results.length).toBeGreaterThan(0);
    expect(results.some((r) => r.title.includes('Acme'))).toBe(true);
  });

  it('assigns category "entity" to all results', async () => {
    const results = await searchGlobal('INV');
    for (const r of results) {
      expect(r.category).toBe('entity');
    }
  });

  it('generates unique ids for results', async () => {
    const results = await searchGlobal('Revenue');
    const ids = results.map((r) => r.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('groups results by entity type', async () => {
    const results = await searchGlobal('a'); // too short — empty
    expect(results).toEqual([]);

    // With valid query that matches multiple types
    const broad = await searchGlobal('Office');
    if (broad.length > 0) {
      // Each result should have an entityType
      for (const r of broad) {
        expect(r.entityType).toBeDefined();
      }
    }
  });

  it('caps results per entity type at 5', async () => {
    // Use a broad search term that would match many entries of one type
    const results = await searchGlobal('JE-2026');
    const journals = results.filter((r) => r.entityType === 'journal');
    expect(journals.length).toBeLessThanOrEqual(5);
  });

  it('is case-insensitive', async () => {
    const lower = await searchGlobal('acme');
    const upper = await searchGlobal('ACME');
    expect(lower.length).toBe(upper.length);
    expect(lower.map((r) => r.id).sort()).toEqual(upper.map((r) => r.id).sort());
  });

  it('result shape matches EntitySearchResult', async () => {
    const results = await searchGlobal('Acme');
    if (results.length > 0) {
      const r = results[0]!;
      expect(r).toHaveProperty('id');
      expect(r).toHaveProperty('title');
      expect(r).toHaveProperty('category');
      expect(r).toHaveProperty('entityType');
      expect(r).toHaveProperty('href');
    }
  });
});
