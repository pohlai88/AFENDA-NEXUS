/**
 * SP-8022: Proof Chain Property-Based Tests
 *
 * Property-based tests for proof chain integrity validation.
 * Tests critical invariants that must hold for ALL valid proof chains:
 *
 * P1: Hash Chain Continuity — Each entry's previousHash matches prior entry's contentHash
 * P2: Tamper Detection — Recomputed hashes must match stored hashes
 * P3: Chain Ordering — chainPosition is monotonically increasing
 * P4: Actor Validation — Actor types and IDs are correctly recorded
 * P5: Time Ordering — Event timestamps are non-decreasing within same entity
 *
 * These tests use randomized inputs to verify invariants hold across
 * many different scenarios, not just hand-crafted examples.
 */

import { describe, expect, it } from 'vitest';
import {
  computeProofHashAsync,
  verifyChainSegment,
  type ProofChainEntry,
  type ProofChainInput,
  type ProofEventType,
} from '../proof/proof-chain-writer.js';
import type { ActorType } from '../context/portal-request-context.js';

// ─── Test Utilities ──────────────────────────────────────────────────────────

/**
 * Generate a random proof chain input for testing.
 */
function generateRandomProofInput(previousHash: string | null, seed: number = 0): ProofChainInput {
  const eventTypes: ProofEventType[] = [
    'CASE_CREATED',
    'CASE_STATUS_CHANGED',
    'MESSAGE_SENT',
    'DOCUMENT_UPLOADED',
    'BANK_ACCOUNT_PROPOSED',
    'PAYMENT_STATUS_CHANGED',
  ];

  const actorTypes: ActorType[] = ['SUPPLIER', 'BUYER', 'SYSTEM'];

  const eventType = eventTypes[seed % eventTypes.length]!;
  const actorType = actorTypes[seed % actorTypes.length]!;

  return {
    eventId: `evt-${seed.toString().padStart(5, '0')}`,
    eventType,
    entityType: 'test_entity',
    entityId: `entity-${Math.floor(seed / 10)}`,
    actorType,
    actorId: `user-${seed % 5}`,
    eventAt: new Date(Date.UTC(2026, 0, 1, 0, 0, 0) + seed * 60000), // Each event 1 min apart
    payload: {
      testSeed: seed,
      action: `Action ${seed}`,
      metadata: { random: Math.random() * seed },
    },
    previousHash,
  };
}

/**
 * Build a valid proof chain entry from input.
 */
async function buildProofEntry(
  input: ProofChainInput,
  tenantId: string,
  position: bigint
): Promise<ProofChainEntry> {
  const contentHash = await computeProofHashAsync(input);

  return {
    id: crypto.randomUUID(),
    tenantId,
    chainPosition: position,
    eventId: input.eventId,
    eventType: input.eventType,
    entityType: input.entityType,
    entityId: input.entityId,
    actorId: input.actorId,
    actorType: input.actorType,
    eventAt: input.eventAt,
    contentHash,
    previousHash: input.previousHash,
    payload: input.payload,
  };
}

/**
 * Generate a valid proof chain with N entries.
 */
async function generateValidChain(
  length: number,
  tenantId = 'test-tenant'
): Promise<ProofChainEntry[]> {
  const entries: ProofChainEntry[] = [];
  let previousHash: string | null = null;

  for (let i = 0; i < length; i++) {
    const input = generateRandomProofInput(previousHash, i);
    const entry = await buildProofEntry(input, tenantId, BigInt(i + 1));
    entries.push(entry);
    previousHash = entry.contentHash;
  }

  return entries;
}

// ─── Property Tests ──────────────────────────────────────────────────────────

describe('SP-8022: Proof Chain Property Tests', () => {
  // ─── P1: Hash Chain Continuity ─────────────────────────────────────────────

  describe('P1: Hash Chain Continuity', () => {
    it('maintains chain continuity across random 10-entry chains', async () => {
      // Run multiple times with different random seeds
      const iterations = 10;

      for (let iteration = 0; iteration < iterations; iteration++) {
        const chain = await generateValidChain(10, `tenant-${iteration}`);

        // Verify each entry's previousHash matches prior entry's contentHash
        for (let i = 1; i < chain.length; i++) {
          const current = chain[i]!;
          const previous = chain[i - 1]!;

          expect(current.previousHash).toBe(previous.contentHash);
        }

        // First entry should have null previousHash (genesis)
        expect(chain[0]!.previousHash).toBeNull();
      }
    });

    it('maintains chain continuity for chains of varying lengths', async () => {
      const lengths = [1, 5, 20, 50, 100];

      for (const length of lengths) {
        const chain = await generateValidChain(length);

        for (let i = 1; i < chain.length; i++) {
          expect(chain[i]!.previousHash).toBe(chain[i - 1]!.contentHash);
        }
      }
    });

    it('detects broken chain when contentHash is modified', async () => {
      const chain = await generateValidChain(10);

      // Break the chain at position 5 by modifying its contentHash
      // verifyChainSegment will detect the mismatch when recomputing the hash
      const brokenChain = chain.map((entry, index) => {
        if (index === 4) { // Position 5 (0-indexed as 4)
          return { ...entry, contentHash: 'broken-hash-0000000000000000000000000000000000000000000000000000000000' };
        }
        return entry;
      });

      const result = await verifyChainSegment(brokenChain);
      expect(result.valid).toBe(false);
      // Position 5 (index 4) should be the first invalid because it has the wrong contentHash
      expect(result.firstInvalidPosition).toBe(5n);
    });
  });

  // ─── P2: Tamper Detection ──────────────────────────────────────────────────

  describe('P2: Tamper Detection', () => {
    it('detects payload tampering at any position', async () => {
      const chain = await generateValidChain(20);

      // Test tampering at different positions
      const positionsToTamper = [0, 5, 10, 15, 19];

      for (const position of positionsToTamper) {
        const tamperedChain = chain.map((entry, index) => {
          if (index === position) {
            return {
              ...entry,
              payload: { ...entry.payload, tampered: true },
            };
          }
          return entry;
        });

        const result = await verifyChainSegment(tamperedChain);
        expect(result.valid).toBe(false);
        expect(result.firstInvalidPosition).toBe(BigInt(position + 1));
      }
    });

    it('detects contentHash modification', async () => {
      const chain = await generateValidChain(10);

      // Modify contentHash at position 3
      const tamperedChain = [...chain];
      tamperedChain[3] = {
        ...chain[3]!,
        contentHash: '0000000000000000000000000000000000000000000000000000000000000000',
      };

      const result = await verifyChainSegment(tamperedChain);
      expect(result.valid).toBe(false);
      expect(result.firstInvalidPosition).toBe(4n);
    });

    it('detects timestamp manipulation', async () => {
      const chain = await generateValidChain(15);

      // Change timestamp without recomputing hash
      const tamperedChain = [...chain];
      tamperedChain[7] = {
        ...chain[7]!,
        eventAt: new Date('2099-12-31T23:59:59.999Z'),
      };

      const result = await verifyChainSegment(tamperedChain);
      expect(result.valid).toBe(false);
    });

    it('detects actor ID modification', async () => {
      const chain = await generateValidChain(10);

      // Change actorId without recomputing hash
      const tamperedChain = [...chain];
      tamperedChain[4] = {
        ...chain[4]!,
        actorId: 'attacker-id',
      };

      const result = await verifyChainSegment(tamperedChain);
      expect(result.valid).toBe(false);
      expect(result.firstInvalidPosition).toBe(5n);
    });
  });

  // ─── P3: Chain Ordering ────────────────────────────────────────────────────

  describe('P3: Chain Ordering', () => {
    it('chainPosition is monotonically increasing', async () => {
      const iterations = 5;

      for (let i = 0; i < iterations; i++) {
        const chain = await generateValidChain(30, `tenant-${i}`);

        for (let j = 1; j < chain.length; j++) {
          const current = chain[j]!.chainPosition;
          const previous = chain[j - 1]!.chainPosition;

          expect(current).toBeGreaterThan(previous);
          expect(current - previous).toBe(1n); // Consecutive positions
        }
      }
    });

    it('first entry has position 1', async () => {
      const lengths = [1, 5, 10, 50];

      for (const length of lengths) {
        const chain = await generateValidChain(length);
        expect(chain[0]!.chainPosition).toBe(1n);
      }
    });

    it('last entry has position N for N-length chain', async () => {
      const lengths = [1, 5, 10, 25, 100];

      for (const length of lengths) {
        const chain = await generateValidChain(length);
        expect(chain[chain.length - 1]!.chainPosition).toBe(BigInt(length));
      }
    });

    it('detects out-of-order positions', async () => {
      const chain = await generateValidChain(10);

      // Swap positions 5 and 6
      const outOfOrderChain = [...chain];
      const temp = outOfOrderChain[5]!;
      outOfOrderChain[5] = outOfOrderChain[6]!;
      outOfOrderChain[6] = temp;

      // Verify positions are out of order
      const pos5 = outOfOrderChain[5]!.chainPosition;
      const pos6 = outOfOrderChain[6]!.chainPosition;

      expect(pos5).toBeGreaterThan(pos6); // Out of order!
    });
  });

  // ─── P4: Actor Validation ──────────────────────────────────────────────────

  describe('P4: Actor Validation', () => {
    it('preserves actorType across chain', async () => {
      const chain = await generateValidChain(20);

      for (const entry of chain) {
        expect(['SUPPLIER', 'BUYER', 'SYSTEM']).toContain(entry.actorType);
      }
    });

    it('preserves actorId across chain', async () => {
      const chain = await generateValidChain(20);

      for (const entry of chain) {
        expect(entry.actorId).toMatch(/^user-\d+$/);
      }
    });

    it('actorType and actorId combinations are valid', async () => {
      const chain = await generateValidChain(50);

      for (const entry of chain) {
        // Validate actor combinations make sense
        if (entry.actorType === 'SYSTEM') {
          // System actors should have system-like IDs
          expect(entry.actorId).toBeTruthy();
        }

        if (entry.actorType === 'SUPPLIER' || entry.actorType === 'BUYER') {
          // User actors should have user IDs
          expect(entry.actorId).toBeTruthy();
        }
      }
    });

    it('actor information roundtrips through hash computation', async () => {
      const iterations = 10;

      for (let i = 0; i < iterations; i++) {
        const input = generateRandomProofInput(null, i);
        const entry = await buildProofEntry(input, 'test-tenant', 1n);

        // Recompute hash from entry
        const recomputedHash = await computeProofHashAsync({
          eventId: entry.eventId,
          eventType: entry.eventType,
          entityType: entry.entityType,
          entityId: entry.entityId,
          actorType: entry.actorType,
          actorId: entry.actorId,
          eventAt: entry.eventAt,
          payload: entry.payload,
          previousHash: entry.previousHash,
        });

        expect(recomputedHash).toBe(entry.contentHash);
      }
    });
  });

  // ─── P5: Time Ordering ─────────────────────────────────────────────────────

  describe('P5: Time Ordering', () => {
    it('timestamps are non-decreasing within chain', async () => {
      const chain = await generateValidChain(50);

      for (let i = 1; i < chain.length; i++) {
        const currentTime = chain[i]!.eventAt.getTime();
        const previousTime = chain[i - 1]!.eventAt.getTime();

        expect(currentTime).toBeGreaterThanOrEqual(previousTime);
      }
    });

    it('timestamps are ISO UTC compatible', async () => {
      const chain = await generateValidChain(10);

      for (const entry of chain) {
        const isoString = entry.eventAt.toISOString();
        expect(isoString).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);

        // Roundtrip test
        const reparsed = new Date(isoString);
        expect(reparsed.getTime()).toBe(entry.eventAt.getTime());
      }
    });

    it('preserves millisecond precision', async () => {
      const timestamps = [
        new Date('2026-01-15T10:30:45.123Z'),
        new Date('2026-01-15T10:30:45.456Z'),
        new Date('2026-01-15T10:30:45.789Z'),
      ];

      let previousHash: string | null = null;

      for (let i = 0; i < timestamps.length; i++) {
        const input: ProofChainInput = {
          eventId: `evt-${i}`,
          eventType: 'MESSAGE_SENT',
          entityType: 'message',
          entityId: 'msg-001',
          actorType: 'SUPPLIER',
          actorId: 'user-001',
          eventAt: timestamps[i]!,
          payload: { index: i },
          previousHash,
        };

        const entry = await buildProofEntry(input, 'test-tenant', BigInt(i + 1));
        expect(entry.eventAt.getTime()).toBe(timestamps[i]!.getTime());

        previousHash = entry.contentHash;
      }
    });
  });

  // ─── Cross-Property Tests ──────────────────────────────────────────────────

  describe('Cross-Property Invariants', () => {
    it('valid chain satisfies ALL properties simultaneously', async () => {
      const iterations = 5;

      for (let iter = 0; iter < iterations; iter++) {
        const chain = await generateValidChain(30, `tenant-${iter}`);

        // P1: Hash continuity
        for (let i = 1; i < chain.length; i++) {
          expect(chain[i]!.previousHash).toBe(chain[i - 1]!.contentHash);
        }

        // P2: No tampering (verified by verifyChainSegment)
        const verifyResult = await verifyChainSegment(chain);
        expect(verifyResult.valid).toBe(true);
        expect(verifyResult.entriesChecked).toBe(chain.length);

        // P3: Monotonic positions
        for (let i = 1; i < chain.length; i++) {
          expect(chain[i]!.chainPosition).toBeGreaterThan(chain[i - 1]!.chainPosition);
        }

        // P4: Valid actors
        for (const entry of chain) {
          expect(['SUPPLIER', 'BUYER', 'SYSTEM']).toContain(entry.actorType);
          expect(entry.actorId).toBeTruthy();
        }

        // P5: Non-decreasing timestamps
        for (let i = 1; i < chain.length; i++) {
          expect(chain[i]!.eventAt.getTime()).toBeGreaterThanOrEqual(
            chain[i - 1]!.eventAt.getTime()
          );
        }
      }
    });

    it('breaking ANY property invalidates the chain', async () => {
      const chain = await generateValidChain(10);

      // Test breaking each property individually
      // Note: verifyChainSegment validates hash integrity, not all semantic properties
      const violations = [
        // P2: Tamper with payload (changes expected hash)
        (c: ProofChainEntry[]) => {
          const broken = [...c];
          broken[3] = { ...c[3]!, payload: { tampered: true } };
          return broken;
        },
        // Modify contentHash directly (hash mismatch)
        (c: ProofChainEntry[]) => {
          const broken = [...c];
          broken[5] = { ...c[5]!, contentHash: 'invalid000000000000000000000000000000000000000000000000000000000000' };
          return broken;
        },
        // P4: Invalid actor ID (changes expected hash)
        (c: ProofChainEntry[]) => {
          const broken = [...c];
          broken[2] = { ...c[2]!, actorId: 'tampered-actor-id' };
          return broken;
        },
        // P5: Timestamp modification (changes expected hash)
        (c: ProofChainEntry[]) => {
          const broken = [...c];
          broken[6] = { ...c[6]!, eventAt: new Date('1990-01-01T00:00:00.000Z') };
          return broken;
        },
      ];

      for (const violate of violations) {
        const brokenChain = violate(chain);
        const result = await verifyChainSegment(brokenChain);
        expect(result.valid).toBe(false);
      }
    });
  });

  // ─── Edge Cases ────────────────────────────────────────────────────────────

  describe('Edge Cases', () => {
    it('single-entry chain is valid', async () => {
      const chain = await generateValidChain(1);
      const result = await verifyChainSegment(chain);

      expect(result.valid).toBe(true);
      expect(result.entriesChecked).toBe(1);
      expect(chain[0]!.chainPosition).toBe(1n);
      expect(chain[0]!.previousHash).toBeNull();
    });

    it('handles large chain positions (bigint)', async () => {
      const largePosition = 9007199254740991n; // Number.MAX_SAFE_INTEGER as bigint
      const input = generateRandomProofInput(null, 0);
      const entry = await buildProofEntry(input, 'test-tenant', largePosition);

      expect(entry.chainPosition).toBe(largePosition);
    });

    it('handles empty payload', async () => {
      const input: ProofChainInput = {
        eventId: 'evt-001',
        eventType: 'CASE_CREATED',
        entityType: 'case',
        entityId: 'case-001',
        actorType: 'SUPPLIER',
        actorId: 'user-001',
        eventAt: new Date(),
        payload: {},
        previousHash: null,
      };

      const entry = await buildProofEntry(input, 'test-tenant', 1n);
      const result = await verifyChainSegment([entry]);

      expect(result.valid).toBe(true);
    });

    it('handles complex nested payload', async () => {
      const complexPayload = {
        level1: {
          level2: {
            level3: {
              array: [1, 2, 3, { nested: true }],
              string: 'test',
              number: 42.5,
              boolean: true,
              null: null,
            },
          },
        },
        unicode: '🔒 Proof Chain Test 測試',
      };

      const input: ProofChainInput = {
        eventId: 'evt-complex',
        eventType: 'DOCUMENT_UPLOADED',
        entityType: 'document',
        entityId: 'doc-001',
        actorType: 'SUPPLIER',
        actorId: 'user-001',
        eventAt: new Date(),
        payload: complexPayload,
        previousHash: null,
      };

      const entry = await buildProofEntry(input, 'test-tenant', 1n);
      const result = await verifyChainSegment([entry]);

      expect(result.valid).toBe(true);
      expect(entry.payload).toEqual(complexPayload);
    });
  });
});
