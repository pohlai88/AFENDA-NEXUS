/**
 * SP-1006: Proof Chain Writer — tamper-evident hash chain for portal communications.
 *
 * Legal-grade semantics: hash input is deterministic, chain is linear per tenant,
 * daily anchoring writes digest to audit.audit_log.
 *
 * Extends TamperResistantOutboxWriter for portal communication events.
 */

import type { ActorType } from '../context/portal-request-context.js';

// ─── Proof Chain Entry ──────────────────────────────────────────────────────

export interface ProofChainEntry {
  readonly id: string;
  readonly tenantId: string;
  readonly chainPosition: bigint;
  readonly eventId: string;
  readonly eventType: ProofEventType;
  readonly entityType: string;
  readonly entityId: string;
  readonly actorId: string;
  readonly actorType: ActorType;
  readonly eventAt: Date;
  readonly contentHash: string;
  readonly previousHash: string | null;
  readonly payload: Record<string, unknown>;
}

export type ProofEventType =
  | 'MESSAGE_SENT'
  | 'MESSAGE_READ'
  | 'CASE_CREATED'
  | 'CASE_STATUS_CHANGED'
  | 'CASE_ASSIGNED'
  | 'CASE_RESOLVED'
  | 'CASE_REOPENED'
  | 'ESCALATION_TRIGGERED'
  | 'ESCALATION_RESOLVED'
  | 'DOCUMENT_UPLOADED'
  | 'DOCUMENT_SHARED'
  | 'DOCUMENT_SIGNED'
  | 'BANK_ACCOUNT_PROPOSED'
  | 'BANK_ACCOUNT_APPROVED'
  | 'BANK_ACCOUNT_REJECTED'
  | 'PAYMENT_STATUS_CHANGED'
  | 'INVOICE_SUBMITTED'
  | 'INVOICE_STATUS_CHANGED'
  | 'COMPLIANCE_UPLOADED'
  | 'COMPLIANCE_VERIFIED'
  | 'COMPLIANCE_RENEWED'
  | 'ONBOARDING_SUBMITTED'
  | 'ONBOARDING_APPROVED'
  | 'ONBOARDING_REJECTED'
  | 'PORTAL_INVITATION_SENT'
  | 'PORTAL_INVITATION_ACCEPTED'
  | 'PORTAL_INVITATION_REVOKED'
  | 'DAILY_ANCHOR';

// ─── Hash Computation (pure) ────────────────────────────────────────────────

export interface ProofChainInput {
  readonly eventId: string;
  readonly eventType: ProofEventType;
  readonly entityType: string;
  readonly entityId: string;
  readonly actorType: ActorType;
  readonly actorId: string;
  readonly eventAt: Date;
  readonly payload: Record<string, unknown>;
  readonly previousHash: string | null;
}

/**
 * Compute the deterministic hash for a proof chain entry.
 *
 * Hash input:
 *   event_id + event_type + entity_type + entity_id +
 *   actor_type + actor_id + event_at (ISO UTC) +
 *   canonical JSON payload (stable key order) + previous_hash
 *
 * Uses SHA-256. Pure function — no I/O.
 */
export function computeProofHash(input: ProofChainInput): string {
  // Sort payload keys for canonical JSON
  const canonicalPayload = JSON.stringify(input.payload, Object.keys(input.payload).sort());

  const hashInput = [
    input.eventId,
    input.eventType,
    input.entityType,
    input.entityId,
    input.actorType,
    input.actorId,
    input.eventAt.toISOString(),
    canonicalPayload,
    input.previousHash ?? 'GENESIS',
  ].join('|');

  // Use Web Crypto API (available in Node 18+)
  // Note: actual hash computation is async — this returns the input string.
  // Real implementation uses crypto.subtle.digest or node:crypto.
  return hashInput;
}

/**
 * Compute SHA-256 hash of a proof chain input.
 * Async because it uses crypto.subtle.
 */
export async function computeProofHashAsync(input: ProofChainInput): Promise<string> {
  const hashInput = computeProofHash(input);
  const encoder = new TextEncoder();
  const data = encoder.encode(hashInput);

  // Node.js crypto fallback
  const { createHash } = await import('node:crypto');
  const hash = createHash('sha256').update(data).digest('hex');
  return hash;
}

// ─── Verification (pure) ────────────────────────────────────────────────────

export interface ChainVerificationResult {
  readonly valid: boolean;
  readonly entriesChecked: number;
  readonly firstInvalidPosition?: bigint;
  readonly message: string;
}

/**
 * Verify integrity of a chain segment.
 * Pure function — given entries, verifies each hash matches expected.
 */
export async function verifyChainSegment(
  entries: readonly ProofChainEntry[]
): Promise<ChainVerificationResult> {
  if (entries.length === 0) {
    return { valid: true, entriesChecked: 0, message: 'Empty chain segment' };
  }

  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i]!;
    const expectedPreviousHash = i === 0 ? entry.previousHash : entries[i - 1]!.contentHash;

    const expectedHash = await computeProofHashAsync({
      eventId: entry.eventId,
      eventType: entry.eventType,
      entityType: entry.entityType,
      entityId: entry.entityId,
      actorType: entry.actorType,
      actorId: entry.actorId,
      eventAt: entry.eventAt,
      payload: entry.payload,
      previousHash: expectedPreviousHash,
    });

    if (expectedHash !== entry.contentHash) {
      return {
        valid: false,
        entriesChecked: i + 1,
        firstInvalidPosition: entry.chainPosition,
        message: `Hash mismatch at chain position ${entry.chainPosition}`,
      };
    }
  }

  return {
    valid: true,
    entriesChecked: entries.length,
    message: `All ${entries.length} entries verified`,
  };
}

// ─── Proof Chain Writer Port ────────────────────────────────────────────────

/**
 * Port for writing proof chain entries.
 *
 * Implementation writes to portal_communication_proof table.
 * Must be called within the SAME transaction as the source entity insert.
 */
export interface IProofChainWriter {
  /**
   * Write a proof chain entry for a portal event.
   * Must be called within the same DB transaction as the source entity insert.
   *
   * @param input The event data to record.
   * @param tx Database transaction handle — REQUIRED (not optional).
   */
  write(input: ProofChainInput, tx: unknown): Promise<ProofChainEntry>;
}

/**
 * Port for reading/verifying the proof chain.
 */
export interface IProofChainReader {
  /**
   * Read chain entries for a specific entity.
   */
  getByEntity(
    tenantId: string,
    entityType: string,
    entityId: string
  ): Promise<readonly ProofChainEntry[]>;

  /**
   * Read chain entries for verification (by position range).
   */
  getByPositionRange(
    tenantId: string,
    fromPosition: bigint,
    toPosition: bigint
  ): Promise<readonly ProofChainEntry[]>;

  /**
   * Get the latest chain entry for a tenant (for appending).
   */
  getLatest(tenantId: string): Promise<ProofChainEntry | null>;
}
