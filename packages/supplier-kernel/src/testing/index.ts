/**
 * @afenda/supplier-kernel/testing — Test utilities and mocks.
 *
 * Import from '@afenda/supplier-kernel/testing' in test files.
 */

import type { PortalRequestContext } from '../context/portal-request-context.js';
import { createPortalContext } from '../context/portal-request-context.js';
import type { PortalRole } from '../context/portal-request-context.js';
import type { IPortalIdentityResolver, PortalIdentityResult } from '../identity/portal-identity.js';
import type {
  IPortalNotificationDispatcher,
  PortalNotification,
} from '../notifications/portal-notification-dispatcher.js';
import type { IPortalAuditWriter, PortalAuditEntry } from '../audit/portal-audit-hook.js';
import type {
  IProofChainReader,
  IProofChainWriter,
  ProofChainEntry,
  ProofChainInput,
} from '../proof/proof-chain-writer.js';
import type { ICaseIdGenerator } from '../case-id/portal-case-id.js';
import type {
  IPortalIdempotencyStore,
  IdempotencyClaimInput,
  IdempotencyResult,
} from '../idempotency/portal-idempotency.js';
import { formatCaseId } from '../case-id/portal-case-id.js';

// ─── Test Context Builder ───────────────────────────────────────────────────

/**
 * Create a PortalRequestContext for testing. All fields have sensible defaults.
 */
export function createTestContext(
  overrides: Partial<{
    tenantId: string;
    supplierId: string;
    portalUserId: string;
    entityIds: readonly string[];
    portalRole: PortalRole;
    actorFingerprint: string;
    idempotencyKey: string;
  }> = {}
): PortalRequestContext {
  return createPortalContext({
    tenantId: overrides.tenantId ?? '00000000-0000-0000-0000-000000000001',
    supplierId: overrides.supplierId ?? '00000000-0000-0000-0000-000000000002',
    portalUserId: overrides.portalUserId ?? '00000000-0000-0000-0000-000000000003',
    entityIds: overrides.entityIds ?? ['00000000-0000-0000-0000-000000000004'],
    portalRole: overrides.portalRole ?? 'PORTAL_OWNER',
    actorFingerprint: overrides.actorFingerprint ?? 'test-fingerprint-hash',
    idempotencyKey: overrides.idempotencyKey,
  });
}

// ─── Mock Notification Dispatcher ───────────────────────────────────────────

export class MockNotificationDispatcher implements IPortalNotificationDispatcher {
  readonly dispatched: PortalNotification[] = [];

  async dispatch(notification: PortalNotification): Promise<void> {
    this.dispatched.push(notification);
  }

  async dispatchBatch(notifications: readonly PortalNotification[]): Promise<void> {
    this.dispatched.push(...notifications);
  }

  reset(): void {
    this.dispatched.length = 0;
  }
}

// ─── Mock Audit Writer ──────────────────────────────────────────────────────

export class MockAuditWriter implements IPortalAuditWriter {
  readonly entries: PortalAuditEntry[] = [];

  async write(entry: PortalAuditEntry): Promise<void> {
    this.entries.push(entry);
  }

  reset(): void {
    this.entries.length = 0;
  }
}

// ─── Mock Proof Chain Writer ────────────────────────────────────────────────

export class MockProofChainWriter implements IProofChainWriter {
  readonly entries: ProofChainEntry[] = [];
  private _nextPosition = 1n;

  async write(input: ProofChainInput): Promise<ProofChainEntry> {
    const entry: ProofChainEntry = {
      id: crypto.randomUUID(),
      tenantId: 'test-tenant',
      chainPosition: this._nextPosition++,
      eventId: input.eventId,
      eventType: input.eventType,
      entityType: input.entityType,
      entityId: input.entityId,
      actorId: input.actorId,
      actorType: input.actorType,
      eventAt: input.eventAt,
      contentHash: `mock-hash-${this.entries.length}`,
      previousHash: input.previousHash,
      payload: input.payload,
    };
    this.entries.push(entry);
    return entry;
  }

  reset(): void {
    this.entries.length = 0;
    this._nextPosition = 1n;
  }
}

// ─── Mock Case ID Generator ────────────────────────────────────────────────

export class MockCaseIdGenerator implements ICaseIdGenerator {
  private _counter = 0;

  async next(_tenantId: string, tenantShort: string): Promise<string> {
    this._counter++;
    return formatCaseId(tenantShort, new Date().getFullYear(), this._counter);
  }

  reset(): void {
    this._counter = 0;
  }
}

// ─── Mock Idempotency Store ─────────────────────────────────────────────────

export class MockIdempotencyStore implements IPortalIdempotencyStore {
  private readonly _claims = new Map<string, string | undefined>();

  async claimOrGet(input: IdempotencyClaimInput): Promise<IdempotencyResult> {
    const key = `${input.tenantId}:${input.commandType}:${input.idempotencyKey}`;
    if (this._claims.has(key)) {
      return { claimed: false, resultRef: this._claims.get(key) };
    }
    this._claims.set(key, undefined);
    return { claimed: true };
  }

  async recordOutcome(
    tenantId: string,
    key: string,
    commandType: string,
    resultRef: string
  ): Promise<void> {
    this._claims.set(`${tenantId}:${commandType}:${key}`, resultRef);
  }

  reset(): void {
    this._claims.clear();
  }
}

// ─── Mock Portal Identity Resolver ──────────────────────────────────────────

export class MockPortalIdentityResolver implements IPortalIdentityResolver {
  private readonly _identities = new Map<string, PortalIdentityResult>();

  /** Seed a user→identity mapping for tests. */
  seed(userId: string, identity: PortalIdentityResult): void {
    this._identities.set(userId, identity);
  }

  async resolve(_tenantId: string, userId: string): Promise<PortalIdentityResult | null> {
    return this._identities.get(userId) ?? null;
  }

  reset(): void {
    this._identities.clear();
  }
}

// ─── Mock Proof Chain Reader ────────────────────────────────────────────────

export class MockProofChainReader implements IProofChainReader {
  private readonly _entries: ProofChainEntry[] = [];

  /** Seed entries for tests. */
  seed(entries: readonly ProofChainEntry[]): void {
    this._entries.push(...entries);
  }

  async getByEntity(
    tenantId: string,
    entityType: string,
    entityId: string
  ): Promise<readonly ProofChainEntry[]> {
    return this._entries.filter(
      (e) => e.tenantId === tenantId && e.entityType === entityType && e.entityId === entityId
    );
  }

  async getByPositionRange(
    tenantId: string,
    fromPosition: bigint,
    toPosition: bigint
  ): Promise<readonly ProofChainEntry[]> {
    return this._entries.filter(
      (e) =>
        e.tenantId === tenantId && e.chainPosition >= fromPosition && e.chainPosition <= toPosition
    );
  }

  async getLatest(tenantId: string): Promise<ProofChainEntry | null> {
    const tenantEntries = this._entries.filter((e) => e.tenantId === tenantId);
    if (tenantEntries.length === 0) return null;
    return tenantEntries.reduce((latest, current) =>
      current.chainPosition > latest.chainPosition ? current : latest
    );
  }

  reset(): void {
    this._entries.length = 0;
  }
}
