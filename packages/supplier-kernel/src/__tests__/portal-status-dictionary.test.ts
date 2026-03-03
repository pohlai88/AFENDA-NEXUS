import { describe, expect, it } from 'vitest';

import {
  getAllStatuses,
  getStatusEntry,
  getStatusesByCategory,
  getStatusLabel,
  isValidStatusCode,
} from '../status/portal-status-dictionary.js';

describe('SP-1003: Status Dictionary', () => {
  // ─── getStatusEntry ─────────────────────────────────────────────────────

  describe('getStatusEntry', () => {
    it('finds INVOICE_SUBMITTED', () => {
      const entry = getStatusEntry('INVOICE_SUBMITTED');
      expect(entry).toBeDefined();
      expect(entry?.label).toBe('Submitted');
      expect(entry?.severity).toBe('info');
      expect(entry?.category).toBe('invoice');
    });

    it('finds PAYMENT_CLEARED', () => {
      const entry = getStatusEntry('PAYMENT_CLEARED');
      expect(entry).toBeDefined();
      expect(entry?.label).toBe('Cleared');
      expect(entry?.severity).toBe('success');
    });

    it('returns undefined for unknown code', () => {
      expect(getStatusEntry('NOT_A_CODE')).toBeUndefined();
    });

    it('finds CASE_AWAITING_INFO with supplier-safe label', () => {
      const entry = getStatusEntry('CASE_AWAITING_INFO');
      expect(entry).toBeDefined();
      expect(entry?.label).toBe('Awaiting Your Response');
    });

    it('INVOICE_REJECTED has supplier-safe label "Returned"', () => {
      const entry = getStatusEntry('INVOICE_REJECTED');
      expect(entry).toBeDefined();
      expect(entry?.label).toBe('Returned');
    });

    it('PAYMENT_REJECTED has supplier-safe label "Unsuccessful"', () => {
      const entry = getStatusEntry('PAYMENT_REJECTED');
      expect(entry).toBeDefined();
      expect(entry?.label).toBe('Unsuccessful');
    });
  });

  // ─── getStatusLabel ─────────────────────────────────────────────────────

  describe('getStatusLabel', () => {
    it('returns label for valid code', () => {
      expect(getStatusLabel('COMPLIANCE_VALID')).toBe('Valid');
    });

    it('returns code itself for unknown code', () => {
      expect(getStatusLabel('UNKNOWN_STATUS')).toBe('UNKNOWN_STATUS');
    });
  });

  // ─── getStatusesByCategory ──────────────────────────────────────────────

  describe('getStatusesByCategory', () => {
    it('returns invoice statuses', () => {
      const statuses = getStatusesByCategory('invoice');
      expect(statuses.length).toBeGreaterThanOrEqual(7);
      for (const s of statuses) {
        expect(s.category).toBe('invoice');
      }
    });

    it('returns case statuses', () => {
      const statuses = getStatusesByCategory('case');
      expect(statuses.length).toBeGreaterThanOrEqual(8);
    });

    it('returns bank_account statuses', () => {
      const statuses = getStatusesByCategory('bank_account');
      expect(statuses.length).toBe(3);
    });
  });

  // ─── isValidStatusCode ──────────────────────────────────────────────────

  describe('isValidStatusCode', () => {
    it('returns true for valid codes', () => {
      expect(isValidStatusCode('INVOICE_DRAFT')).toBe(true);
      expect(isValidStatusCode('PAYMENT_PROCESSING')).toBe(true);
      expect(isValidStatusCode('BANK_PROPOSED')).toBe(true);
    });

    it('returns false for invalid codes', () => {
      expect(isValidStatusCode('FRAUD_SUSPICION')).toBe(false);
      expect(isValidStatusCode('SANCTIONS_HIT')).toBe(false);
      expect(isValidStatusCode('NOT_REAL')).toBe(false);
    });
  });

  // ─── getAllStatuses ─────────────────────────────────────────────────────

  describe('getAllStatuses', () => {
    it('returns all status entries', () => {
      const all = getAllStatuses();
      expect(all.length).toBeGreaterThanOrEqual(35);
    });

    it('all entries have required fields', () => {
      for (const entry of getAllStatuses()) {
        expect(entry.code).toBeTruthy();
        expect(entry.label).toBeTruthy();
        expect(entry.severity).toBeTruthy();
        expect(entry.helpText).toBeTruthy();
        expect(entry.category).toBeTruthy();
      }
    });

    it('no internal hold reason codes exposed (SP-LANG-01)', () => {
      const codes = getAllStatuses().map((s) => s.code);
      expect(codes).not.toContain('FRAUD_SUSPICION');
      expect(codes).not.toContain('SANCTIONS_HIT');
      expect(codes).not.toContain('AML_REVIEW');
    });

    it('no supplier-hostile labels exposed', () => {
      for (const entry of getAllStatuses()) {
        expect(entry.label).not.toContain('Reject');
        expect(entry.label).not.toContain('Fraud');
        expect(entry.label).not.toContain('Sanction');
      }
    });
  });
});
