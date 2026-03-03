import { and, count, desc, eq, ilike, or, sql, type SQL } from 'drizzle-orm';
import type { TenantTx } from '@afenda/db';
import { supplierCases } from '@afenda/db';
import type { CaseStatus } from '@afenda/supplier-kernel/domain';
import type {
  SupplierCase,
  ISupplierCaseRepo,
  CaseListQuery,
} from '../services/supplier-portal-case.js';

type CaseRow = typeof supplierCases.$inferSelect;

/**
 * SP-3001: Supplier Case Repository (Drizzle implementation)
 * Phase 1.1.1 — generalizes supplier_dispute with full case lifecycle
 */

function mapToDomain(row: CaseRow): SupplierCase {
  return {
    id: row.id,
    tenantId: row.tenantId,
    ticketNumber: row.ticketNumber,
    supplierId: row.supplierId,
    category: row.category as SupplierCase['category'],
    priority: row.priority as SupplierCase['priority'],
    subject: row.subject,
    description: row.description,
    status: row.status as CaseStatus,
    assignedTo: row.assignedTo ?? null,
    coAssignees: row.coAssignees ?? [],
    linkedEntityId: row.linkedEntityId ?? null,
    linkedEntityType: row.linkedEntityType ?? null,
    slaDeadline: row.slaDeadline ?? null,
    resolution: row.resolution ?? null,
    rootCause: row.rootCause ?? null,
    correctiveAction: row.correctiveAction ?? null,
    resolvedBy: row.resolvedBy ?? null,
    resolvedAt: row.resolvedAt ?? null,
    escalationId: row.escalationId ?? null,
    proofChainHead: row.proofChainHead ?? null,
    createdBy: row.createdBy,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export class DrizzleSupplierCaseRepo implements ISupplierCaseRepo {
  constructor(private readonly tx: TenantTx) {}

  async create(caseData: SupplierCase): Promise<SupplierCase> {
    const [row] = await this.tx
      .insert(supplierCases)
      .values({
        id: caseData.id,
        tenantId: caseData.tenantId,
        ticketNumber: caseData.ticketNumber,
        supplierId: caseData.supplierId,
        category: caseData.category,
        priority: caseData.priority,
        subject: caseData.subject,
        description: caseData.description,
        status: caseData.status,
        assignedTo: caseData.assignedTo,
        coAssignees: caseData.coAssignees as string[],
        linkedEntityId: caseData.linkedEntityId,
        linkedEntityType: caseData.linkedEntityType,
        slaDeadline: caseData.slaDeadline,
        createdBy: caseData.createdBy,
      } as any)
      .returning();
    if (!row) throw new Error('Failed to create supplier case');
    return mapToDomain(row);
  }

  async findById(id: string): Promise<SupplierCase | null> {
    const row = await this.tx.query.supplierCases.findFirst({
      where: eq(supplierCases.id, id),
    });
    return row ? mapToDomain(row) : null;
  }

  async findBySupplierId(
    supplierId: string,
    query: CaseListQuery
  ): Promise<{ items: readonly SupplierCase[]; total: number }> {
    const conditions: SQL[] = [eq(supplierCases.supplierId, supplierId)];

    if (query.status) {
      conditions.push(eq(supplierCases.status, query.status));
    }
    if (query.category) {
      conditions.push(eq(supplierCases.category, query.category));
    }
    if (query.priority) {
      conditions.push(eq(supplierCases.priority, query.priority));
    }
    if (query.search) {
      conditions.push(
        or(
          ilike(supplierCases.subject, `%${query.search}%`),
          ilike(supplierCases.description, `%${query.search}%`),
          ilike(supplierCases.ticketNumber, `%${query.search}%`)
        )!
      );
    }

    const where = and(...conditions);
    const offset = (query.page - 1) * query.limit;

    const [countResult] = await this.tx.select({ count: count() }).from(supplierCases).where(where);

    const total = countResult?.count ?? 0;

    if (total === 0) {
      return { items: [], total: 0 };
    }

    const rows = await this.tx
      .select()
      .from(supplierCases)
      .where(where)
      .orderBy(desc(supplierCases.createdAt))
      .limit(query.limit)
      .offset(offset);

    return {
      items: rows.map(mapToDomain),
      total,
    };
  }

  async updateStatus(
    id: string,
    status: CaseStatus,
    resolution?: string,
    resolvedBy?: string
  ): Promise<SupplierCase | null> {
    const isResolved = status === 'RESOLVED';
    const [row] = await this.tx
      .update(supplierCases)
      .set({
        status,
        resolution: resolution ?? null,
        resolvedBy: resolvedBy ?? null,
        resolvedAt: isResolved ? new Date() : null,
        updatedAt: new Date(),
      })
      .where(eq(supplierCases.id, id))
      .returning();

    return row ? mapToDomain(row) : null;
  }

  async update(id: string, data: Partial<SupplierCase>): Promise<SupplierCase | null> {
    const updatePayload: Record<string, unknown> = { updatedAt: new Date() };

    if (data.assignedTo !== undefined) updatePayload.assignedTo = data.assignedTo;
    if (data.coAssignees !== undefined) updatePayload.coAssignees = data.coAssignees;
    if (data.status !== undefined) updatePayload.status = data.status;
    if (data.resolution !== undefined) updatePayload.resolution = data.resolution;
    if (data.rootCause !== undefined) updatePayload.rootCause = data.rootCause;
    if (data.correctiveAction !== undefined) updatePayload.correctiveAction = data.correctiveAction;
    if (data.resolvedBy !== undefined) updatePayload.resolvedBy = data.resolvedBy;
    if (data.resolvedAt !== undefined) updatePayload.resolvedAt = data.resolvedAt;
    if (data.proofChainHead !== undefined) updatePayload.proofChainHead = data.proofChainHead;

    const [row] = await this.tx
      .update(supplierCases)
      .set(updatePayload)
      .where(eq(supplierCases.id, id))
      .returning();

    return row ? mapToDomain(row) : null;
  }

  async nextTicketSequence(tenantId: string): Promise<number> {
    const currentYear = new Date().getFullYear();

    // Get max ticket number for this tenant/year
    const result = await this.tx
      .select({
        maxSeq: sql<number>`
          COALESCE(
            MAX(
              CAST(
                SPLIT_PART(${supplierCases.ticketNumber}, '-', 4) AS INTEGER
              )
            ),
            0
          )
        `,
      })
      .from(supplierCases)
      .where(
        and(
          eq(supplierCases.tenantId, tenantId),
          sql`EXTRACT(YEAR FROM ${supplierCases.createdAt}) = ${currentYear}`
        )
      );

    return (result[0]?.maxSeq ?? 0) + 1;
  }
}
