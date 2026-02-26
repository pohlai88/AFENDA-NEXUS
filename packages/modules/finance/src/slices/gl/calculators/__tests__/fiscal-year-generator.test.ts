import { describe, it, expect } from 'vitest';
import { generateFiscalYear, type FiscalYearConfig } from '../fiscal-year-generator.js';

const calendarYear: FiscalYearConfig = {
  startMonth: 1,
  startYear: 2026,
  companyId: 'co-1',
};

describe('generateFiscalYear', () => {
  // ── Monthly (calendar year) ───────────────────────────────────────────

  it('generates 12 monthly periods for calendar year', () => {
    const { result } = generateFiscalYear(calendarYear);

    expect(result.totalPeriods).toBe(12);
    expect(result.fiscalYearLabel).toBe('FY2026');
    expect(result.periods[0]!.from.getMonth()).toBe(0); // January
    expect(result.periods[11]!.to.getMonth()).toBe(11); // December
    expect(result.periods[11]!.isFinalPeriod).toBe(true);
    expect(result.periods[0]!.isFinalPeriod).toBe(false);
  });

  it('generates correct date ranges for each month', () => {
    const { result } = generateFiscalYear(calendarYear);

    // January
    expect(result.periods[0]!.from).toEqual(new Date(2026, 0, 1));
    expect(result.periods[0]!.to).toEqual(new Date(2026, 0, 31));

    // February (non-leap)
    expect(result.periods[1]!.from).toEqual(new Date(2026, 1, 1));
    expect(result.periods[1]!.to).toEqual(new Date(2026, 1, 28));

    // December
    expect(result.periods[11]!.from).toEqual(new Date(2026, 11, 1));
    expect(result.periods[11]!.to).toEqual(new Date(2026, 11, 31));
  });

  it('names periods with prefix and month', () => {
    const { result } = generateFiscalYear(calendarYear);

    expect(result.periods[0]!.name).toContain('FY-P01');
    expect(result.periods[0]!.name).toContain('2026-01');
    expect(result.periods[11]!.name).toContain('FY-P12');
  });

  // ── Monthly (non-calendar fiscal year) ────────────────────────────────

  it('generates April–March fiscal year', () => {
    const { result } = generateFiscalYear({
      startMonth: 4,
      startYear: 2025,
      companyId: 'co-1',
    });

    expect(result.totalPeriods).toBe(12);
    expect(result.fiscalYearLabel).toBe('FY2025/2026');
    // P1 = April 2025
    expect(result.periods[0]!.from).toEqual(new Date(2025, 3, 1));
    // P12 = March 2026
    expect(result.periods[11]!.from).toEqual(new Date(2026, 2, 1));
    expect(result.periods[11]!.to).toEqual(new Date(2026, 2, 31));
  });

  it('generates July–June fiscal year', () => {
    const { result } = generateFiscalYear({
      startMonth: 7,
      startYear: 2025,
      companyId: 'co-1',
    });

    expect(result.fiscalYearLabel).toBe('FY2025/2026');
    expect(result.periods[0]!.from).toEqual(new Date(2025, 6, 1));
    expect(result.periods[11]!.to).toEqual(new Date(2026, 5, 30));
  });

  // ── 13-period calendars ───────────────────────────────────────────────

  it('generates 4-4-5 week pattern', () => {
    const { result } = generateFiscalYear({
      startMonth: 1,
      startYear: 2026,
      companyId: 'co-1',
      pattern: '4-4-5',
    });

    // 4 quarters × 3 periods = 12, + 1 adjustment = 13
    expect(result.totalPeriods).toBe(13);
    // First period: 4 weeks = 28 days
    const p1Duration =
      (result.periods[0]!.to.getTime() - result.periods[0]!.from.getTime()) /
        (1000 * 60 * 60 * 24) +
      1;
    expect(p1Duration).toBe(28);

    // Third period in first quarter: 5 weeks = 35 days
    const p3Duration =
      (result.periods[2]!.to.getTime() - result.periods[2]!.from.getTime()) /
        (1000 * 60 * 60 * 24) +
      1;
    expect(p3Duration).toBe(35);
  });

  it('generates 4-5-4 week pattern', () => {
    const { result } = generateFiscalYear({
      startMonth: 1,
      startYear: 2026,
      companyId: 'co-1',
      pattern: '4-5-4',
    });

    expect(result.totalPeriods).toBe(13);
    // Second period: 5 weeks = 35 days
    const p2Duration =
      (result.periods[1]!.to.getTime() - result.periods[1]!.from.getTime()) /
        (1000 * 60 * 60 * 24) +
      1;
    expect(p2Duration).toBe(35);
  });

  it('generates 5-4-4 week pattern', () => {
    const { result } = generateFiscalYear({
      startMonth: 1,
      startYear: 2026,
      companyId: 'co-1',
      pattern: '5-4-4',
    });

    expect(result.totalPeriods).toBe(13);
    // First period: 5 weeks = 35 days
    const p1Duration =
      (result.periods[0]!.to.getTime() - result.periods[0]!.from.getTime()) /
        (1000 * 60 * 60 * 24) +
      1;
    expect(p1Duration).toBe(35);
  });

  // ── Custom prefix ─────────────────────────────────────────────────────

  it('uses custom name prefix', () => {
    const { result } = generateFiscalYear({
      ...calendarYear,
      namePrefix: 'YA',
    });

    expect(result.fiscalYearLabel).toBe('YA2026');
    expect(result.periods[0]!.name).toContain('YA-P01');
  });

  // ── Validation ────────────────────────────────────────────────────────

  it('throws on invalid start month', () => {
    expect(() => generateFiscalYear({ ...calendarYear, startMonth: 0 })).toThrow(
      'Invalid start month'
    );

    expect(() => generateFiscalYear({ ...calendarYear, startMonth: 13 })).toThrow(
      'Invalid start month'
    );
  });

  it('throws on invalid start year', () => {
    expect(() => generateFiscalYear({ ...calendarYear, startYear: 1800 })).toThrow(
      'Invalid start year'
    );
  });

  // ── Audit explanation ─────────────────────────────────────────────────

  it('provides audit explanation', () => {
    const calc = generateFiscalYear(calendarYear);
    expect(calc.explanation).toContain('Fiscal year FY2026');
    expect(calc.explanation).toContain('12 MONTHLY periods');
    expect(calc.inputs.pattern).toBe('MONTHLY');
    expect(calc.inputs.companyId).toBe('co-1');
  });

  // ── Contiguous periods ────────────────────────────────────────────────

  it('generates contiguous periods with no gaps or overlaps', () => {
    const { result } = generateFiscalYear(calendarYear);

    for (let i = 1; i < result.periods.length; i++) {
      const prevEnd = result.periods[i - 1]!.to;
      const currStart = result.periods[i]!.from;

      // Next period should start the day after previous ends
      const expectedStart = new Date(prevEnd);
      expectedStart.setDate(expectedStart.getDate() + 1);
      expect(currStart).toEqual(expectedStart);
    }
  });
});
