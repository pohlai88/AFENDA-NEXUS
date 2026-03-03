import { describe, it, expect } from 'vitest';
import {
  validateWidgetLayout,
  computeLayout,
  mergeLayoutWithConstraints,
  widgetType,
} from './bento-kpi-deck.client';
import type { WidgetLayoutItem } from '@afenda/contracts';

// ─── widgetType ──────────────────────────────────────────────────────────────

describe('widgetType', () => {
  it('returns "chart" for chart. prefixed ids', () => {
    expect(widgetType('chart.cashflow')).toBe('chart');
    expect(widgetType('chart.revenueExpense')).toBe('chart');
  });

  it('returns "chart" for chart- prefixed ids', () => {
    expect(widgetType('chart-custom')).toBe('chart');
  });

  it('returns "diagram" for diagram. prefixed ids', () => {
    expect(widgetType('diagram.arAging')).toBe('diagram');
  });

  it('returns "diagram" for diagram- prefixed ids', () => {
    expect(widgetType('diagram-custom')).toBe('diagram');
  });

  it('returns "kpi" for everything else', () => {
    expect(widgetType('revenue')).toBe('kpi');
    expect(widgetType('net-income')).toBe('kpi');
  });
});

// ─── validateWidgetLayout ────────────────────────────────────────────────────

describe('validateWidgetLayout', () => {
  const widgetIds = new Set(['a', 'b', 'c']);

  it('returns undefined layout for empty / missing input', () => {
    expect(validateWidgetLayout({ layout: undefined, widgetIds, cols: 4 })).toEqual({
      layout: undefined,
      isValid: true,
    });
    expect(validateWidgetLayout({ layout: [], widgetIds, cols: 4 })).toEqual({
      layout: undefined,
      isValid: true,
    });
  });

  it('filters out items whose id is not in widgetIds', () => {
    const layout: WidgetLayoutItem[] = [
      { i: 'a', x: 0, y: 0, w: 1, h: 1 },
      { i: 'gone', x: 1, y: 0, w: 1, h: 1 },
    ];
    const result = validateWidgetLayout({ layout, widgetIds, cols: 4 });
    expect(result.isValid).toBe(true);
    expect(result.layout).toHaveLength(1);
    expect(result.layout![0].i).toBe('a');
  });

  it('returns undefined when all items filtered out', () => {
    const layout: WidgetLayoutItem[] = [{ i: 'gone', x: 0, y: 0, w: 1, h: 1 }];
    const result = validateWidgetLayout({ layout, widgetIds, cols: 4 });
    expect(result).toEqual({ layout: undefined, isValid: true });
  });

  it('clamps x so item stays within grid', () => {
    const layout: WidgetLayoutItem[] = [{ i: 'a', x: 10, y: 0, w: 1, h: 1 }];
    const result = validateWidgetLayout({ layout, widgetIds, cols: 4 });
    expect(result.isValid).toBe(true);
    expect(result.layout![0].x).toBeLessThanOrEqual(3); // cols(4) - w(1)
  });

  it('clamps w to [1, cols]', () => {
    const layout: WidgetLayoutItem[] = [{ i: 'a', x: 0, y: 0, w: 10, h: 1 }];
    const result = validateWidgetLayout({ layout, widgetIds, cols: 4 });
    expect(result.layout![0].w).toBe(4);
  });

  it('clamps h minimum to 1', () => {
    const layout: WidgetLayoutItem[] = [{ i: 'a', x: 0, y: 0, w: 1, h: 0 }];
    const result = validateWidgetLayout({ layout, widgetIds, cols: 4 });
    expect(result.layout![0].h).toBe(1);
  });

  it('clamps y minimum to 0', () => {
    const layout: WidgetLayoutItem[] = [{ i: 'a', x: 0, y: -5, w: 1, h: 1 }];
    const result = validateWidgetLayout({ layout, widgetIds, cols: 4 });
    expect(result.layout![0].y).toBe(0);
  });

  it('detects collisions and returns undefined layout with isValid=false', () => {
    const layout: WidgetLayoutItem[] = [
      { i: 'a', x: 0, y: 0, w: 2, h: 2 },
      { i: 'b', x: 1, y: 1, w: 1, h: 1 }, // overlaps with 'a'
    ];
    const result = validateWidgetLayout({ layout, widgetIds, cols: 4 });
    expect(result).toEqual({ layout: undefined, isValid: false });
  });

  it('accepts non-overlapping layout as valid', () => {
    const layout: WidgetLayoutItem[] = [
      { i: 'a', x: 0, y: 0, w: 1, h: 1 },
      { i: 'b', x: 1, y: 0, w: 1, h: 1 },
      { i: 'c', x: 2, y: 0, w: 1, h: 1 },
    ];
    const result = validateWidgetLayout({ layout, widgetIds, cols: 4 });
    expect(result.isValid).toBe(true);
    expect(result.layout).toHaveLength(3);
  });
});

// ─── computeLayout ───────────────────────────────────────────────────────────

describe('computeLayout', () => {
  it('assigns all widgetIds to layout items', () => {
    const ids = ['kpi-1', 'kpi-2'];
    const result = computeLayout(ids, undefined, null, null, 4);
    expect(result).toHaveLength(2);
    expect(result.map((r) => r.i)).toEqual(expect.arrayContaining(ids));
  });

  it('includes selectedChartId and selectedDiagramId', () => {
    const result = computeLayout(['kpi-1'], undefined, 'chart.cashflow', 'diagram.arAging', 4);
    const resultIds = result.map((r) => r.i);
    expect(resultIds).toContain('chart.cashflow');
    expect(resultIds).toContain('diagram.arAging');
  });

  it('charts get 2×2 default on lg (4 cols)', () => {
    const result = computeLayout([], undefined, 'chart.cashflow', null, 4);
    const chart = result.find((r) => r.i === 'chart.cashflow')!;
    expect(chart.w).toBe(2);
    expect(chart.h).toBe(2);
  });

  it('kpi gets 1×1 default', () => {
    const result = computeLayout(['revenue'], undefined, null, null, 4);
    const kpi = result.find((r) => r.i === 'revenue')!;
    expect(kpi.w).toBe(1);
    expect(kpi.h).toBe(1);
  });

  it('wraps items to next row when x >= cols', () => {
    const ids = ['a', 'b', 'c', 'd', 'e'];
    const result = computeLayout(ids, undefined, null, null, 4);
    // 5 items at 1×1 in 4 cols → last item wraps to y=1
    const fifth = result.find((r) => r.i === 'e')!;
    expect(fifth.y).toBeGreaterThan(0);
  });

  it('deduplicates saved order', () => {
    const saved: WidgetLayoutItem[] = [
      { i: 'a', x: 0, y: 0, w: 1, h: 1 },
      { i: 'a', x: 1, y: 0, w: 1, h: 1 }, // duplicate
      { i: 'b', x: 2, y: 0, w: 1, h: 1 },
    ];
    const result = computeLayout(['a', 'b'], saved, null, null, 4);
    const aItems = result.filter((r) => r.i === 'a');
    expect(aItems).toHaveLength(1);
  });
});

// ─── mergeLayoutWithConstraints ──────────────────────────────────────────────

describe('mergeLayoutWithConstraints', () => {
  it('enforces minW/minH for chart items', () => {
    const validated: WidgetLayoutItem[] = [{ i: 'chart.cashflow', x: 0, y: 0, w: 1, h: 1 }];
    const result = mergeLayoutWithConstraints(validated, new Set(['chart.cashflow']), 4);
    expect(result[0].minW).toBe(2);
    expect(result[0].minH).toBe(2);
    expect(result[0].w).toBeGreaterThanOrEqual(2); // clamped up
    expect(result[0].h).toBeGreaterThanOrEqual(2);
  });

  it('enforces minW/minH for kpi items', () => {
    const validated: WidgetLayoutItem[] = [{ i: 'revenue', x: 0, y: 0, w: 1, h: 1 }];
    const result = mergeLayoutWithConstraints(validated, new Set(['revenue']), 4);
    expect(result[0].minW).toBe(1);
    expect(result[0].minH).toBe(1);
  });

  it('caps chart minW to cols on narrow grids', () => {
    const validated: WidgetLayoutItem[] = [{ i: 'chart.cashflow', x: 0, y: 0, w: 1, h: 2 }];
    const result = mergeLayoutWithConstraints(validated, new Set(['chart.cashflow']), 1);
    expect(result[0].minW).toBe(1); // min(2, 1) = 1
  });
});
