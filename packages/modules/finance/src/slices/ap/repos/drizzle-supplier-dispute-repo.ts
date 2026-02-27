import { eq, desc } from 'drizzle-orm';
import type { TenantTx } from '@afenda/db';
import { supplierDisputes } from '@afenda/db';
import type {
  SupplierDispute,
  DisputeStatus,
  ISupplierDisputeRepo,
} from '../services/supplier-portal-dispute.js';

type DisputeRow = typeof supplierDisputes.$inferSelect;

function mapToDomain(row: DisputeRow): SupplierDispute {
  return {
    id: row.id,
    tenantId: row.tenantId,
    supplierId: row.supplierId,
    invoiceId: row.invoiceId ?? null,
    paymentRunId: row.paymentRunId ?? null,
    category: row.category as SupplierDispute['category'],
    subject: row.subject,
    description: row.description,
    status: row.status as DisputeStatus,
    resolution: row.resolution ?? null,
    resolvedBy: row.resolvedBy ?? null,
    resolvedAt: row.resolvedAt ?? null,
    createdBy: row.createdBy,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export class DrizzleSupplierDisputeRepo implements ISupplierDisputeRepo {
  constructor(private readonly tx: TenantTx) { }

  async create(dispute: SupplierDispute): Promise<SupplierDispute> {
    const [row] = await this.tx
      .insert(supplierDisputes)
      .values({
        id: dispute.id,
        tenantId: dispute.tenantId,
        supplierId: dispute.supplierId,
        invoiceId: dispute.invoiceId,
        paymentRunId: dispute.paymentRunId,
        category: dispute.category as typeof supplierDisputes.$inferSelect.category,
        subject: dispute.subject,
        description: dispute.description,
        status: dispute.status as typeof supplierDisputes.$inferSelect.status,
        createdBy: dispute.createdBy,
      })
      .returning();

    return mapToDomain(row!);
  }

  async findById(id: string): Promise<SupplierDispute | null> {
    const row = await this.tx.query.supplierDisputes.findFirst({
      where: eq(supplierDisputes.id, id),
    });
    return row ? mapToDomain(row) : null;
  }

  async findBySupplierId(supplierId: string): Promise<readonly SupplierDispute[]> {
    const rows = await this.tx.query.supplierDisputes.findMany({
      where: eq(supplierDisputes.supplierId, supplierId),
      orderBy: [desc(supplierDisputes.createdAt)],
    });
    return rows.map(mapToDomain);
  }

  async updateStatus(
    id: string,
    status: DisputeStatus,
    resolution?: string,
    resolvedBy?: string
  ): Promise<SupplierDispute | null> {
    const existing = await this.tx.query.supplierDisputes.findFirst({
      where: eq(supplierDisputes.id, id),
    });
    if (!existing) return null;

    await this.tx
      .update(supplierDisputes)
      .set({
        status: status as typeof supplierDisputes.$inferSelect.status,
        resolution: resolution ?? null,
        resolvedBy: resolvedBy ?? null,
        resolvedAt: status === 'RESOLVED' || status === 'REJECTED' ? new Date() : null,
        updatedAt: new Date(),
      })
      .where(eq(supplierDisputes.id, id));

    const updated = await this.tx.query.supplierDisputes.findFirst({
      where: eq(supplierDisputes.id, id),
    });
    return updated ? mapToDomain(updated) : null;
  }
}
