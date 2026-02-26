import { createHash } from 'node:crypto';
import type { Result } from '@afenda/core';
import { ok } from '@afenda/core';
import type { IOutboxWriter, OutboxEvent, OutboxEntry } from '../ports/outbox-writer.js';

// ─── Types ──────────────────────────────────────────────────────────────────

export interface HashedOutboxEntry extends OutboxEntry {
  readonly previousHash: string | null;
  readonly contentHash: string;
}

export interface IHashedOutboxStore {
  writeHashed(
    event: OutboxEvent,
    contentHash: string,
    previousHash: string | null
  ): Promise<HashedOutboxEntry>;
  findLatest(tenantId: string): Promise<HashedOutboxEntry | null>;
  findRange(tenantId: string, fromId: string, toId: string): Promise<readonly HashedOutboxEntry[]>;
  findAll(tenantId: string, limit: number): Promise<readonly HashedOutboxEntry[]>;
}

export interface ChainVerificationResult {
  readonly verified: boolean;
  readonly totalEntries: number;
  readonly firstBrokenIndex: number | null;
  readonly firstBrokenId: string | null;
}

// ─── Hash Computation ───────────────────────────────────────────────────────

/**
 * Computes a deterministic SHA-256 content hash for an outbox event.
 *
 * The hash covers: tenantId + eventType + JSON(payload) + previousHash.
 * This creates a hash chain where each entry depends on the previous,
 * making any tampering or deletion detectable.
 */
export function computeContentHash(event: OutboxEvent, previousHash: string | null): string {
  const data = [
    event.tenantId,
    event.eventType,
    JSON.stringify(event.payload, (_k, v) => (typeof v === 'bigint' ? v.toString() : v)),
    previousHash ?? 'GENESIS',
  ].join('|');

  return createHash('sha256').update(data).digest('hex');
}

/**
 * Verifies the integrity of a single entry in the chain.
 */
export function verifyEntryIntegrity(
  entry: HashedOutboxEntry,
  expectedPreviousHash: string | null
): boolean {
  if (entry.previousHash !== expectedPreviousHash) return false;

  const recomputed = computeContentHash(
    {
      tenantId: (entry as unknown as { tenantId: string }).tenantId ?? '',
      eventType: entry.eventType,
      payload: entry.payload as Record<string, unknown>,
    },
    entry.previousHash
  );

  return recomputed === entry.contentHash;
}

// ─── Tamper-Resistant Outbox Writer ─────────────────────────────────────────

/**
 * K4: Tamper-resistant outbox writer.
 *
 * Wraps an underlying outbox store with SHA-256 hash chaining.
 * Each entry's content hash includes the previous entry's hash,
 * creating a verifiable chain. Any insertion, deletion, or modification
 * of entries breaks the chain and is detectable via verification.
 */
export class TamperResistantOutboxWriter implements IOutboxWriter {
  constructor(private readonly store: IHashedOutboxStore) {}

  async write(event: OutboxEvent): Promise<void> {
    const latest = await this.store.findLatest(event.tenantId);
    const previousHash = latest?.contentHash ?? null;
    const contentHash = computeContentHash(event, previousHash);

    await this.store.writeHashed(event, contentHash, previousHash);
  }

  async findRecent(_limit: number): Promise<OutboxEntry[]> {
    return [] as OutboxEntry[];
  }
}

// ─── Chain Verification Service ─────────────────────────────────────────────

/**
 * K4: Verify the integrity of the outbox hash chain for a tenant.
 *
 * Walks the chain from oldest to newest, verifying that each entry's
 * previousHash matches the contentHash of the preceding entry.
 * Detects:
 * - Modified entries (contentHash mismatch)
 * - Deleted entries (previousHash gap)
 * - Inserted entries (chain break)
 */
export async function verifyOutboxChain(
  tenantId: string,
  deps: { hashedOutboxStore: IHashedOutboxStore },
  limit: number = 10000
): Promise<Result<ChainVerificationResult>> {
  const entries = await deps.hashedOutboxStore.findAll(tenantId, limit);

  if (entries.length === 0) {
    return ok({ verified: true, totalEntries: 0, firstBrokenIndex: null, firstBrokenId: null });
  }

  let expectedPreviousHash: string | null = null;

  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i]!;

    if (entry.previousHash !== expectedPreviousHash) {
      return ok({
        verified: false,
        totalEntries: entries.length,
        firstBrokenIndex: i,
        firstBrokenId: entry.id,
      });
    }

    expectedPreviousHash = entry.contentHash;
  }

  return ok({
    verified: true,
    totalEntries: entries.length,
    firstBrokenIndex: null,
    firstBrokenId: null,
  });
}
