import { and, eq, ne } from 'drizzle-orm';
import type { TenantTx } from '@afenda/db';
import { supplierEscalations } from '@afenda/db';
import type {
  EscalationEntity,
  EscalationListQuery,
  EscalationStatus,
  IEscalationRepo,
} from '../services/supplier-portal-escalation.js';

type EscalationRow = typeof supplierEscalations.$inferSelect;

/**
 * Phase 1.2.2: Escalation Repository (Drizzle implementation).
 * Handles CRUD for erp.supplier_escalation.
 */

function mapToDomain(row: EscalationRow): EscalationEntity {
  return {
    id: row.id,
    tenantId: row.tenantId,
    caseId: row.caseId,
    supplierId: row.supplierId,
    triggeredBy: row.triggeredBy,
    assignedTo: row.assignedTo,
    assignedAt: row.assignedAt,
    status: row.status as EscalationStatus,
    reason: row.reason,
    respondByAt: row.respondByAt,
    resolveByAt: row.resolveByAt,
    resolvedAt: row.resolvedAt,
    resolutionNotes: row.resolutionNotes,
    proofHash: row.proofHash,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export class DrizzleEscalationRepo implements IEscalationRepo {
  constructor(private readonly tx: TenantTx) {}

  async create(data: EscalationEntity): Promise<EscalationEntity> {
    const [row] = await this.tx
      .insert(supplierEscalations)
      .values({
        id: data.id,
        tenantId: data.tenantId,
        caseId: data.caseId,
        supplierId: data.supplierId,
        triggeredBy: data.triggeredBy,
        assignedTo: data.assignedTo,
        assignedAt: data.assignedAt,
        status: data.status,
        reason: data.reason,
        respondByAt: data.respondByAt,
        resolveByAt: data.resolveByAt,
        resolvedAt: data.resolvedAt,
        resolutionNotes: data.resolutionNotes,
        proofHash: data.proofHash,
      } as any)
      .returning();

    if (!row) throw new Error('Failed to create escalation');
    return mapToDomain(row);
  }

  async findById(tenantId: string, id: string): Promise<EscalationEntity | null> {
    const row = await this.tx.query.supplierEscalations.findFirst({
      where: and(eq(supplierEscalations.tenantId, tenantId), eq(supplierEscalations.id, id)),
    });
    return row ? mapToDomain(row) : null;
  }

  /**
   * Find an active (non-resolved) escalation for a given case.
   * Used to enforce the single-active-escalation-per-case invariant.
   */
  async findActiveByCaseId(tenantId: string, caseId: string): Promise<EscalationEntity | null> {
    const row = await this.tx.query.supplierEscalations.findFirst({
      where: and(
        eq(supplierEscalations.tenantId, tenantId),
        eq(supplierEscalations.caseId, caseId),
        ne(supplierEscalations.status, 'ESCALATION_RESOLVED')
      ),
    });
    return row ? mapToDomain(row) : null;
  }

  async list(
    tenantId: string,
    supplierId: string,
    query: EscalationListQuery
  ): Promise<{ items: readonly EscalationEntity[]; total: number }> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const offset = (page - 1) * limit;

    const conditions = [
      eq(supplierEscalations.tenantId, tenantId),
      eq(supplierEscalations.supplierId, supplierId),
    ];

    if (query.status) {
      conditions.push(eq(supplierEscalations.status, query.status));
    }

    if (query.caseId) {
      conditions.push(eq(supplierEscalations.caseId, query.caseId));
    }

    const rows = await this.tx.query.supplierEscalations.findMany({
      where: and(...conditions),
      limit,
      offset,
      orderBy: (t, { desc }) => [desc(t.createdAt)],
    });

    // Count for pagination
    const allRows = await this.tx.query.supplierEscalations.findMany({
      where: and(...conditions),
    });

    return {
      items: rows.map(mapToDomain),
      total: allRows.length,
    };
  }

  async updateStatus(
    id: string,
    status: EscalationStatus,
    patch?: Partial<
      Pick<
        EscalationEntity,
        'assignedTo' | 'assignedAt' | 'resolvedAt' | 'resolutionNotes' | 'proofHash'
      >
    >
  ): Promise<EscalationEntity | null> {
    const [row] = await this.tx
      .update(supplierEscalations)
      .set({
        status,
        ...patch,
        updatedAt: new Date(),
      } as any)
      .where(eq(supplierEscalations.id, id))
      .returning();

    return row ? mapToDomain(row) : null;
  }
}
