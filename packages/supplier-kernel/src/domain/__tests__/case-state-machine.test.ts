import { describe, expect, it } from 'vitest';

import {
  assertCaseTransition,
  CASE_CATEGORIES,
  CASE_PRIORITIES,
  CASE_STATUSES,
  getValidNextStatuses,
  InvalidCaseTransitionError,
  isActiveStatus,
  isTerminalStatus,
  isValidCaseTransition,
} from '../case-state-machine.js';

describe('SP-4001: Case State Machine', () => {
  // ─── Valid Transitions ──────────────────────────────────────────────────

  describe('isValidCaseTransition', () => {
    const validPairs: [string, string][] = [
      ['DRAFT', 'SUBMITTED'],
      ['SUBMITTED', 'ASSIGNED'],
      ['ASSIGNED', 'IN_PROGRESS'],
      ['ASSIGNED', 'AWAITING_INFO'],
      ['IN_PROGRESS', 'AWAITING_INFO'],
      ['IN_PROGRESS', 'RESOLVED'],
      ['AWAITING_INFO', 'IN_PROGRESS'],
      ['AWAITING_INFO', 'RESOLVED'],
      ['RESOLVED', 'CLOSED'],
      ['RESOLVED', 'REOPENED'],
      ['CLOSED', 'REOPENED'],
      ['REOPENED', 'ASSIGNED'],
      ['REOPENED', 'IN_PROGRESS'],
    ];

    it.each(validPairs)('allows %s → %s', (from, to) => {
      expect(isValidCaseTransition(from as any, to as any)).toBe(true);
    });

    const invalidPairs: [string, string][] = [
      ['DRAFT', 'ASSIGNED'],
      ['DRAFT', 'CLOSED'],
      ['SUBMITTED', 'CLOSED'],
      ['SUBMITTED', 'DRAFT'],
      ['ASSIGNED', 'DRAFT'],
      ['IN_PROGRESS', 'DRAFT'],
      ['CLOSED', 'DRAFT'],
      ['RESOLVED', 'DRAFT'],
      ['CLOSED', 'ASSIGNED'],
    ];

    it.each(invalidPairs)('rejects %s → %s', (from, to) => {
      expect(isValidCaseTransition(from as any, to as any)).toBe(false);
    });
  });

  // ─── Assert Transition ──────────────────────────────────────────────────

  describe('assertCaseTransition', () => {
    it('does not throw for valid transitions', () => {
      expect(() => assertCaseTransition('DRAFT', 'SUBMITTED')).not.toThrow();
    });

    it('throws InvalidCaseTransitionError for invalid transitions', () => {
      expect(() => assertCaseTransition('DRAFT', 'CLOSED')).toThrow(InvalidCaseTransitionError);
    });

    it('error contains from/to and code', () => {
      try {
        assertCaseTransition('DRAFT', 'CLOSED');
        expect.fail('Should have thrown');
      } catch (e) {
        expect(e).toBeInstanceOf(InvalidCaseTransitionError);
        const err = e as InvalidCaseTransitionError;
        expect(err.from).toBe('DRAFT');
        expect(err.to).toBe('CLOSED');
        expect(err.code).toBe('INVALID_CASE_TRANSITION');
        expect(err.message).toContain('SUBMITTED');
      }
    });
  });

  // ─── getValidNextStatuses ───────────────────────────────────────────────

  describe('getValidNextStatuses', () => {
    it('returns SUBMITTED for DRAFT', () => {
      expect(getValidNextStatuses('DRAFT')).toEqual(['SUBMITTED']);
    });

    it('returns empty array for no valid transitions from CLOSED (except REOPENED)', () => {
      expect(getValidNextStatuses('CLOSED')).toEqual(['REOPENED']);
    });

    it('returns multiple options for ASSIGNED', () => {
      const next = getValidNextStatuses('ASSIGNED');
      expect(next).toContain('IN_PROGRESS');
      expect(next).toContain('AWAITING_INFO');
    });
  });

  // ─── Terminal / Active helpers ──────────────────────────────────────────

  describe('isTerminalStatus', () => {
    it('CLOSED is terminal', () => {
      expect(isTerminalStatus('CLOSED')).toBe(true);
    });

    it('RESOLVED is not terminal', () => {
      expect(isTerminalStatus('RESOLVED')).toBe(false);
    });
  });

  describe('isActiveStatus', () => {
    it('ASSIGNED is active', () => expect(isActiveStatus('ASSIGNED')).toBe(true));
    it('IN_PROGRESS is active', () => expect(isActiveStatus('IN_PROGRESS')).toBe(true));
    it('AWAITING_INFO is active', () => expect(isActiveStatus('AWAITING_INFO')).toBe(true));
    it('REOPENED is active', () => expect(isActiveStatus('REOPENED')).toBe(true));
    it('DRAFT is not active', () => expect(isActiveStatus('DRAFT')).toBe(false));
    it('CLOSED is not active', () => expect(isActiveStatus('CLOSED')).toBe(false));
  });

  // ─── Constants ──────────────────────────────────────────────────────────

  describe('constants', () => {
    it('CASE_STATUSES has 8 entries', () => {
      expect(CASE_STATUSES).toHaveLength(8);
    });

    it('CASE_CATEGORIES has 8 entries', () => {
      expect(CASE_CATEGORIES).toHaveLength(8);
    });

    it('CASE_PRIORITIES has 4 entries', () => {
      expect(CASE_PRIORITIES).toHaveLength(4);
    });
  });
});
