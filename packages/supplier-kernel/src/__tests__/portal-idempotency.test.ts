import { describe, expect, it } from 'vitest';

import { extractIdempotencyKey, isValidIdempotencyKey } from '../idempotency/portal-idempotency.js';

describe('SP-1009: Idempotency', () => {
  // ─── extractIdempotencyKey ──────────────────────────────────────────────

  describe('extractIdempotencyKey', () => {
    it('extracts from string header', () => {
      const key = extractIdempotencyKey({
        'idempotency-key': '550e8400-e29b-41d4-a716-446655440000',
      });
      expect(key).toBe('550e8400-e29b-41d4-a716-446655440000');
    });

    it('extracts first value from array header', () => {
      const key = extractIdempotencyKey({
        'idempotency-key': ['first-key', 'second-key'],
      });
      expect(key).toBe('first-key');
    });

    it('returns undefined when header is missing', () => {
      expect(extractIdempotencyKey({})).toBeUndefined();
    });

    it('returns undefined when header value is undefined', () => {
      expect(extractIdempotencyKey({ 'idempotency-key': undefined })).toBeUndefined();
    });
  });

  // ─── isValidIdempotencyKey ──────────────────────────────────────────────

  describe('isValidIdempotencyKey', () => {
    it('accepts valid UUID v4', () => {
      expect(isValidIdempotencyKey('550e8400-e29b-41d4-a716-446655440000')).toBe(true);
    });

    it('accepts uppercase UUID', () => {
      expect(isValidIdempotencyKey('550E8400-E29B-41D4-A716-446655440000')).toBe(true);
    });

    it('rejects non-UUID strings', () => {
      expect(isValidIdempotencyKey('not-a-uuid')).toBe(false);
      expect(isValidIdempotencyKey('')).toBe(false);
      expect(isValidIdempotencyKey('123')).toBe(false);
    });

    it('rejects UUID without dashes', () => {
      expect(isValidIdempotencyKey('550e8400e29b41d4a716446655440000')).toBe(false);
    });
  });
});
