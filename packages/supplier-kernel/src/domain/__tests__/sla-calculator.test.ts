import { describe, expect, it } from 'vitest';

import {
  computeSlaDeadline,
  getSlaConfig,
  isSlaBreached,
  slaProgressPercent,
  slaRemainingMs,
} from '../sla-calculator.js';

describe('SP-4003: SLA Calculator', () => {
  const baseDate = new Date('2026-01-15T08:00:00.000Z');

  // ─── getSlaConfig ───────────────────────────────────────────────────────

  describe('getSlaConfig', () => {
    it('returns correct config for CRITICAL + PAYMENT', () => {
      const config = getSlaConfig('CRITICAL', 'PAYMENT');
      expect(config.responseHours).toBe(2);
      expect(config.resolutionHours).toBe(24);
    });

    it('returns correct config for LOW + GENERAL', () => {
      const config = getSlaConfig('LOW', 'GENERAL');
      expect(config.responseHours).toBe(72);
      expect(config.resolutionHours).toBe(240);
    });

    it('returns correct config for MEDIUM + ONBOARDING', () => {
      const config = getSlaConfig('MEDIUM', 'ONBOARDING');
      expect(config.responseHours).toBe(24);
      expect(config.resolutionHours).toBe(96);
    });

    it('returns correct config for HIGH + ESCALATION', () => {
      const config = getSlaConfig('HIGH', 'ESCALATION');
      expect(config.responseHours).toBe(4);
      expect(config.resolutionHours).toBe(48);
    });
  });

  // ─── computeSlaDeadline ─────────────────────────────────────────────────

  describe('computeSlaDeadline', () => {
    it('adds hours correctly', () => {
      const deadline = computeSlaDeadline(baseDate, 24);
      expect(deadline.getTime()).toBe(baseDate.getTime() + 24 * 60 * 60 * 1000);
    });

    it('handles fractional hours', () => {
      const deadline = computeSlaDeadline(baseDate, 0.5);
      expect(deadline.getTime()).toBe(baseDate.getTime() + 30 * 60 * 1000);
    });
  });

  // ─── isSlaBreached ──────────────────────────────────────────────────────

  describe('isSlaBreached', () => {
    it('returns false when within SLA', () => {
      const now = new Date(baseDate.getTime() + 1 * 60 * 60 * 1000); // +1 hour
      expect(isSlaBreached(baseDate, 2, now)).toBe(false);
    });

    it('returns true when SLA is exceeded', () => {
      const now = new Date(baseDate.getTime() + 3 * 60 * 60 * 1000); // +3 hours
      expect(isSlaBreached(baseDate, 2, now)).toBe(true);
    });

    it('returns false at exact deadline (not strictly greater)', () => {
      const now = new Date(baseDate.getTime() + 2 * 60 * 60 * 1000); // exactly +2 hours
      expect(isSlaBreached(baseDate, 2, now)).toBe(false);
    });
  });

  // ─── slaRemainingMs ─────────────────────────────────────────────────────

  describe('slaRemainingMs', () => {
    it('returns positive when within SLA', () => {
      const now = new Date(baseDate.getTime() + 1 * 60 * 60 * 1000); // +1 hour
      const remaining = slaRemainingMs(baseDate, 2, now);
      expect(remaining).toBe(1 * 60 * 60 * 1000);
    });

    it('returns negative when SLA is exceeded', () => {
      const now = new Date(baseDate.getTime() + 3 * 60 * 60 * 1000); // +3 hours
      const remaining = slaRemainingMs(baseDate, 2, now);
      expect(remaining).toBe(-1 * 60 * 60 * 1000);
    });
  });

  // ─── slaProgressPercent ─────────────────────────────────────────────────

  describe('slaProgressPercent', () => {
    it('returns 0 at start', () => {
      expect(slaProgressPercent(baseDate, 10, baseDate)).toBe(0);
    });

    it('returns 50 at halfway', () => {
      const half = new Date(baseDate.getTime() + 5 * 60 * 60 * 1000);
      expect(slaProgressPercent(baseDate, 10, half)).toBe(50);
    });

    it('returns 100 at deadline', () => {
      const deadline = new Date(baseDate.getTime() + 10 * 60 * 60 * 1000);
      expect(slaProgressPercent(baseDate, 10, deadline)).toBe(100);
    });

    it('returns >100 when breached', () => {
      const over = new Date(baseDate.getTime() + 15 * 60 * 60 * 1000);
      expect(slaProgressPercent(baseDate, 10, over)).toBe(150);
    });
  });
});
