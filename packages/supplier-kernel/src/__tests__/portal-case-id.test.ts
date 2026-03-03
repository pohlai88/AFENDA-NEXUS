import { describe, expect, it } from 'vitest';

import { formatCaseId, parseCaseId } from '../case-id/portal-case-id.js';

describe('SP-1008: Case ID', () => {
  // ─── formatCaseId ───────────────────────────────────────────────────────

  describe('formatCaseId', () => {
    it('formats correctly with 3-letter tenant', () => {
      expect(formatCaseId('AFD', 2026, 142)).toBe('CASE-AFD-2026-00142');
    });

    it('pads sequence to 5 digits', () => {
      expect(formatCaseId('AFD', 2026, 1)).toBe('CASE-AFD-2026-00001');
    });

    it('uppercases tenant short', () => {
      expect(formatCaseId('afd', 2026, 1)).toBe('CASE-AFD-2026-00001');
    });

    it('handles large sequences', () => {
      expect(formatCaseId('AFD', 2026, 99999)).toBe('CASE-AFD-2026-99999');
    });
  });

  // ─── parseCaseId ────────────────────────────────────────────────────────

  describe('parseCaseId', () => {
    it('parses a valid case ID', () => {
      const result = parseCaseId('CASE-AFD-2026-00142');
      expect(result).toEqual({
        tenantShort: 'AFD',
        year: 2026,
        sequence: 142,
      });
    });

    it('returns null for invalid format', () => {
      expect(parseCaseId('not-a-case-id')).toBeNull();
      expect(parseCaseId('CASE-A-2026-00001')).toBeNull(); // too short tenant
      expect(parseCaseId('CASE-AFD-26-00001')).toBeNull(); // 2-digit year
      expect(parseCaseId('CASE-AFD-2026-001')).toBeNull(); // 3-digit sequence
      expect(parseCaseId('')).toBeNull();
    });

    it('round-trips with formatCaseId', () => {
      const id = formatCaseId('XYZ', 2027, 500);
      const parsed = parseCaseId(id);
      expect(parsed).toEqual({ tenantShort: 'XYZ', year: 2027, sequence: 500 });
    });

    it('handles 5-letter tenant', () => {
      const parsed = parseCaseId('CASE-ADMIN-2026-00001');
      expect(parsed).toEqual({ tenantShort: 'ADMIN', year: 2026, sequence: 1 });
    });
  });
});
