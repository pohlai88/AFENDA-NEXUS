import { describe, expect, it } from 'vitest';

import {
  computeRowFingerprint,
  computeRowFingerprintInput,
  DEDUPE_POLICIES,
  type BulkUploadRow,
} from '../bulk-upload-fingerprint.js';

describe('SP-4004: Bulk Upload Fingerprint', () => {
  const sampleRow: BulkUploadRow = {
    supplierId: '550e8400-e29b-41d4-a716-446655440000',
    invoiceNumber: 'INV-2026-001',
    invoiceDate: '2026-01-15',
    amount: '12500.00',
    currency: 'THB',
    vendorReference: 'PO-2026-500',
  };

  // ─── Fingerprint Input ──────────────────────────────────────────────────

  describe('computeRowFingerprintInput', () => {
    it('joins fields with pipe separator', () => {
      const input = computeRowFingerprintInput(sampleRow);
      expect(input).toBe(
        '550e8400-e29b-41d4-a716-446655440000|INV-2026-001|2026-01-15|12500.00|THB|PO-2026-500'
      );
    });

    it('is deterministic — same input → same output', () => {
      expect(computeRowFingerprintInput(sampleRow)).toBe(computeRowFingerprintInput(sampleRow));
    });

    it('different rows produce different input', () => {
      const other: BulkUploadRow = { ...sampleRow, invoiceNumber: 'INV-2026-002' };
      expect(computeRowFingerprintInput(sampleRow)).not.toBe(computeRowFingerprintInput(other));
    });
  });

  // ─── SHA-256 Fingerprint ────────────────────────────────────────────────

  describe('computeRowFingerprint', () => {
    it('produces valid SHA-256 hex string', async () => {
      const hash = await computeRowFingerprint(sampleRow);
      expect(hash).toMatch(/^[0-9a-f]{64}$/);
    });

    it('is deterministic — same row → same hash', async () => {
      const hash1 = await computeRowFingerprint(sampleRow);
      const hash2 = await computeRowFingerprint(sampleRow);
      expect(hash1).toBe(hash2);
    });

    it('different rows produce different hashes', async () => {
      const other: BulkUploadRow = { ...sampleRow, amount: '9999.00' };
      const h1 = await computeRowFingerprint(sampleRow);
      const h2 = await computeRowFingerprint(other);
      expect(h1).not.toBe(h2);
    });
  });

  // ─── Constants ──────────────────────────────────────────────────────────

  describe('constants', () => {
    it('DEDUPE_POLICIES has 3 entries', () => {
      expect(DEDUPE_POLICIES).toHaveLength(3);
    });

    it('contains expected policies', () => {
      expect(DEDUPE_POLICIES).toContain('SKIP_DUPLICATES');
      expect(DEDUPE_POLICIES).toContain('UPDATE_DRAFT');
      expect(DEDUPE_POLICIES).toContain('REJECT_CONFLICTS');
    });
  });
});
