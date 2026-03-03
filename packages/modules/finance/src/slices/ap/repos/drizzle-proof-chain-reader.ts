/**
 * SP-6000: Drizzle proof chain reader.
 * Reads from erp.portal_communication_proof for the supplier verification page.
 */
import { and, asc, eq } from 'drizzle-orm';
import type { TenantTx } from '@afenda/db';
import { portalCommunicationProof } from '@afenda/db';

export interface ProofChainEntry {
  readonly id: string;
  readonly chainPosition: bigint;
  readonly eventType: string;
  readonly entityId: string;
  readonly entityType: string;
  readonly actorId: string;
  readonly actorType: string;
  readonly eventAt: Date;
  readonly contentHash: string;
  readonly previousHash: string | null;
  readonly payloadSummary: string | null;
  readonly createdAt: Date;
}

export interface IProofChainReader {
  listBySupplier(
    tenantId: string,
    supplierId: string,
    opts?: { limit?: number; offset?: number }
  ): Promise<{ items: ProofChainEntry[]; total: number }>;
}

export class DrizzleProofChainReader implements IProofChainReader {
  constructor(private readonly tx: TenantTx) {}

  async listBySupplier(
    tenantId: string,
    supplierId: string,
    opts: { limit?: number; offset?: number } = {}
  ): Promise<{ items: ProofChainEntry[]; total: number }> {
    const limit = opts.limit ?? 50;
    const offset = opts.offset ?? 0;

    const where = and(
      eq(portalCommunicationProof.tenantId, tenantId),
      eq(portalCommunicationProof.entityId, supplierId)
    );

    const [rows, countRows] = await Promise.all([
      this.tx
        .select()
        .from(portalCommunicationProof)
        .where(where)
        .orderBy(asc(portalCommunicationProof.chainPosition))
        .limit(limit)
        .offset(offset),
      this.tx
        .select({ id: portalCommunicationProof.id })
        .from(portalCommunicationProof)
        .where(where),
    ]);

    return {
      total: countRows.length,
      items: rows.map((r) => ({
        id: r.id,
        chainPosition: r.chainPosition,
        eventType: r.eventType,
        entityId: r.entityId,
        entityType: r.entityType,
        actorId: r.actorId,
        actorType: r.actorType,
        eventAt: r.eventAt,
        contentHash: r.contentHash,
        previousHash: r.previousHash ?? null,
        payloadSummary: r.payloadSummary ?? null,
        createdAt: r.createdAt,
      })),
    };
  }
}
