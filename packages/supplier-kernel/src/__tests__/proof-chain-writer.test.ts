import { describe, expect, it } from 'vitest';

import {
  computeProofHash,
  computeProofHashAsync,
  verifyChainSegment,
  type ProofChainEntry,
  type ProofChainInput,
} from '../proof/proof-chain-writer.js';

describe('SP-1006: Proof Chain Writer', () => {
  const baseInput: ProofChainInput = {
    eventId: 'evt-001',
    eventType: 'CASE_CREATED',
    entityType: 'supplier_case',
    entityId: 'case-001',
    actorType: 'SUPPLIER',
    actorId: 'user-001',
    eventAt: new Date('2026-01-15T10:00:00.000Z'),
    payload: { subject: 'Payment issue', priority: 'HIGH' },
    previousHash: null,
  };

  // ─── computeProofHash (synchronous, returns hash input) ───────────────

  describe('computeProofHash', () => {
    it('returns a deterministic string', () => {
      const h1 = computeProofHash(baseInput);
      const h2 = computeProofHash(baseInput);
      expect(h1).toBe(h2);
    });

    it('includes GENESIS when previousHash is null', () => {
      const result = computeProofHash(baseInput);
      expect(result).toContain('GENESIS');
    });

    it('includes previousHash when provided', () => {
      const input = { ...baseInput, previousHash: 'abc123' };
      const result = computeProofHash(input);
      expect(result).toContain('abc123');
      expect(result).not.toContain('GENESIS');
    });

    it('sorts payload keys for canonical JSON', () => {
      const input1 = {
        ...baseInput,
        payload: { b: 2, a: 1 },
      };
      const input2 = {
        ...baseInput,
        payload: { a: 1, b: 2 },
      };
      expect(computeProofHash(input1)).toBe(computeProofHash(input2));
    });

    it('different eventType yields different hash input', () => {
      const other = { ...baseInput, eventType: 'CASE_RESOLVED' as const };
      expect(computeProofHash(baseInput)).not.toBe(computeProofHash(other));
    });
  });

  // ─── computeProofHashAsync (SHA-256) ──────────────────────────────────

  describe('computeProofHashAsync', () => {
    it('produces valid SHA-256 hex string', async () => {
      const hash = await computeProofHashAsync(baseInput);
      expect(hash).toMatch(/^[0-9a-f]{64}$/);
    });

    it('is deterministic', async () => {
      const h1 = await computeProofHashAsync(baseInput);
      const h2 = await computeProofHashAsync(baseInput);
      expect(h1).toBe(h2);
    });

    it('different inputs produce different hashes', async () => {
      const other = { ...baseInput, entityId: 'case-002' };
      const h1 = await computeProofHashAsync(baseInput);
      const h2 = await computeProofHashAsync(other);
      expect(h1).not.toBe(h2);
    });
  });

  // ─── verifyChainSegment ───────────────────────────────────────────────

  describe('verifyChainSegment', () => {
    it('returns valid for empty chain', async () => {
      const result = await verifyChainSegment([]);
      expect(result.valid).toBe(true);
      expect(result.entriesChecked).toBe(0);
    });

    it('verifies a single-entry chain', async () => {
      // Build entry where contentHash matches the computed hash
      const hash = await computeProofHashAsync(baseInput);
      const entry: ProofChainEntry = {
        id: 'entry-001',
        tenantId: 'tenant-001',
        chainPosition: 1n,
        eventId: baseInput.eventId,
        eventType: baseInput.eventType,
        entityType: baseInput.entityType,
        entityId: baseInput.entityId,
        actorId: baseInput.actorId,
        actorType: baseInput.actorType,
        eventAt: baseInput.eventAt,
        contentHash: hash,
        previousHash: null,
        payload: baseInput.payload,
      };

      const result = await verifyChainSegment([entry]);
      expect(result.valid).toBe(true);
      expect(result.entriesChecked).toBe(1);
    });

    it('detects tampered hash', async () => {
      const entry: ProofChainEntry = {
        id: 'entry-001',
        tenantId: 'tenant-001',
        chainPosition: 1n,
        eventId: baseInput.eventId,
        eventType: baseInput.eventType,
        entityType: baseInput.entityType,
        entityId: baseInput.entityId,
        actorId: baseInput.actorId,
        actorType: baseInput.actorType,
        eventAt: baseInput.eventAt,
        contentHash: 'tampered-hash-value',
        previousHash: null,
        payload: baseInput.payload,
      };

      const result = await verifyChainSegment([entry]);
      expect(result.valid).toBe(false);
      expect(result.firstInvalidPosition).toBe(1n);
    });

    it('verifies a multi-entry chain', async () => {
      // Build entry 1 (genesis)
      const hash1 = await computeProofHashAsync(baseInput);
      const entry1: ProofChainEntry = {
        id: 'entry-001',
        tenantId: 'tenant-001',
        chainPosition: 1n,
        eventId: baseInput.eventId,
        eventType: baseInput.eventType,
        entityType: baseInput.entityType,
        entityId: baseInput.entityId,
        actorId: baseInput.actorId,
        actorType: baseInput.actorType,
        eventAt: baseInput.eventAt,
        contentHash: hash1,
        previousHash: null,
        payload: baseInput.payload,
      };

      // Build entry 2 (chains from entry 1)
      const input2: ProofChainInput = {
        ...baseInput,
        eventId: 'evt-002',
        eventType: 'CASE_STATUS_CHANGED',
        previousHash: hash1,
      };
      const hash2 = await computeProofHashAsync(input2);
      const entry2: ProofChainEntry = {
        id: 'entry-002',
        tenantId: 'tenant-001',
        chainPosition: 2n,
        eventId: input2.eventId,
        eventType: input2.eventType,
        entityType: input2.entityType,
        entityId: input2.entityId,
        actorId: input2.actorId,
        actorType: input2.actorType,
        eventAt: input2.eventAt,
        contentHash: hash2,
        previousHash: hash1,
        payload: input2.payload,
      };

      const result = await verifyChainSegment([entry1, entry2]);
      expect(result.valid).toBe(true);
      expect(result.entriesChecked).toBe(2);
    });
  });
});
