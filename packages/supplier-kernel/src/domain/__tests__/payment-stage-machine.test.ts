import { describe, expect, it } from 'vitest';

import {
  assertPaymentTransition,
  getValidNextStages,
  hasHigherPrecedence,
  InvalidPaymentTransitionError,
  isTerminalStage,
  isValidPaymentTransition,
  PAYMENT_SOURCES,
  PAYMENT_STAGES,
} from '../payment-stage-machine.js';

describe('SP-4002: Payment Stage Machine', () => {
  // ─── Valid Transitions ──────────────────────────────────────────────────

  describe('isValidPaymentTransition', () => {
    const validPairs: [string, string][] = [
      ['SCHEDULED', 'APPROVED'],
      ['SCHEDULED', 'ON_HOLD'],
      ['APPROVED', 'PROCESSING'],
      ['APPROVED', 'ON_HOLD'],
      ['PROCESSING', 'SENT'],
      ['PROCESSING', 'ON_HOLD'],
      ['SENT', 'CLEARED'],
      ['SENT', 'REJECTED'],
      ['ON_HOLD', 'SCHEDULED'],
      ['ON_HOLD', 'APPROVED'],
      ['ON_HOLD', 'PROCESSING'],
    ];

    it.each(validPairs)('allows %s → %s', (from, to) => {
      expect(isValidPaymentTransition(from as any, to as any)).toBe(true);
    });

    const invalidPairs: [string, string][] = [
      ['SCHEDULED', 'CLEARED'],
      ['SCHEDULED', 'SENT'],
      ['CLEARED', 'SCHEDULED'],
      ['CLEARED', 'SENT'],
      ['REJECTED', 'SCHEDULED'],
      ['REJECTED', 'CLEARED'],
      ['SENT', 'SCHEDULED'],
      ['APPROVED', 'SCHEDULED'],
    ];

    it.each(invalidPairs)('rejects %s → %s', (from, to) => {
      expect(isValidPaymentTransition(from as any, to as any)).toBe(false);
    });
  });

  // ─── Assert Transition ──────────────────────────────────────────────────

  describe('assertPaymentTransition', () => {
    it('does not throw for valid transitions', () => {
      expect(() => assertPaymentTransition('SCHEDULED', 'APPROVED')).not.toThrow();
    });

    it('throws InvalidPaymentTransitionError for invalid transitions', () => {
      expect(() => assertPaymentTransition('CLEARED', 'SCHEDULED')).toThrow(
        InvalidPaymentTransitionError
      );
    });

    it('error contains from/to and code', () => {
      try {
        assertPaymentTransition('CLEARED', 'SENT');
        expect.fail('Should have thrown');
      } catch (e) {
        expect(e).toBeInstanceOf(InvalidPaymentTransitionError);
        const err = e as InvalidPaymentTransitionError;
        expect(err.from).toBe('CLEARED');
        expect(err.to).toBe('SENT');
        expect(err.code).toBe('INVALID_PAYMENT_TRANSITION');
        expect(err.message).toContain('terminal');
      }
    });
  });

  // ─── Terminal Stages ────────────────────────────────────────────────────

  describe('isTerminalStage', () => {
    it('CLEARED is terminal', () => expect(isTerminalStage('CLEARED')).toBe(true));
    it('REJECTED is terminal', () => expect(isTerminalStage('REJECTED')).toBe(true));
    it('SCHEDULED is not terminal', () => expect(isTerminalStage('SCHEDULED')).toBe(false));
    it('ON_HOLD is not terminal', () => expect(isTerminalStage('ON_HOLD')).toBe(false));
  });

  // ─── getValidNextStages ─────────────────────────────────────────────────

  describe('getValidNextStages', () => {
    it('CLEARED has no next stages', () => {
      expect(getValidNextStages('CLEARED')).toEqual([]);
    });

    it('REJECTED has no next stages', () => {
      expect(getValidNextStages('REJECTED')).toEqual([]);
    });

    it('ON_HOLD can return to SCHEDULED, APPROVED, or PROCESSING', () => {
      const next = getValidNextStages('ON_HOLD');
      expect(next).toContain('SCHEDULED');
      expect(next).toContain('APPROVED');
      expect(next).toContain('PROCESSING');
    });
  });

  // ─── Source Precedence (SP-DB-07) ───────────────────────────────────────

  describe('hasHigherPrecedence', () => {
    it('BANK_FILE outranks ERP', () => {
      expect(hasHigherPrecedence('BANK_FILE', 'ERP')).toBe(true);
    });

    it('BANK_FILE outranks MANUAL_OVERRIDE', () => {
      expect(hasHigherPrecedence('BANK_FILE', 'MANUAL_OVERRIDE')).toBe(true);
    });

    it('ERP outranks MANUAL_OVERRIDE', () => {
      expect(hasHigherPrecedence('ERP', 'MANUAL_OVERRIDE')).toBe(true);
    });

    it('MANUAL_OVERRIDE cannot outrank BANK_FILE', () => {
      expect(hasHigherPrecedence('MANUAL_OVERRIDE', 'BANK_FILE')).toBe(false);
    });

    it('same source has equal precedence', () => {
      expect(hasHigherPrecedence('ERP', 'ERP')).toBe(true);
    });
  });

  // ─── Constants ──────────────────────────────────────────────────────────

  describe('constants', () => {
    it('PAYMENT_STAGES has 7 entries', () => {
      expect(PAYMENT_STAGES).toHaveLength(7);
    });

    it('PAYMENT_SOURCES has 3 entries', () => {
      expect(PAYMENT_SOURCES).toHaveLength(3);
    });
  });
});
