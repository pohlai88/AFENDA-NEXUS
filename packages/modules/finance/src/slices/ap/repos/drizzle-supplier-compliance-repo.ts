import { eq } from 'drizzle-orm';
import type { TenantTx } from '@afenda/db';
import { supplierComplianceItems } from '@afenda/db';
import type {
  SupplierComplianceItem,
  ComplianceStatus,
  ISupplierComplianceRepo,
} from '../services/supplier-portal-compliance.js';

type ComplianceRow = typeof supplierComplianceItems.$inferSelect;

/**
 * Compute live compliance status from DB row.
 * expiresAt determines EXPIRED / EXPIRING_SOON / VALID.
 * If no expiresAt, status is based on isCompliant flag.
 */
function computeStatus(row: ComplianceRow): ComplianceStatus {
  if (!row.isCompliant) return 'PENDING';

  if (row.expiresAt) {
    const now = new Date();
    if (row.expiresAt < now) return 'EXPIRED';

    const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;
    if (row.expiresAt.getTime() - now.getTime() < thirtyDaysMs) return 'EXPIRING_SOON';
  }

  return 'VALID';
}

function mapToDomain(row: ComplianceRow): SupplierComplianceItem {
  return {
    id: row.id,
    tenantId: row.tenantId,
    supplierId: row.supplierId,
    itemType: row.itemType as SupplierComplianceItem['itemType'],
    status: computeStatus(row),
    issuedDate: null,
    expiryDate: row.expiresAt ?? null,
    documentId: row.documentId ?? null,
    notes: row.notes ?? null,
    lastVerifiedBy: row.verifiedBy ?? null,
    lastVerifiedAt: row.verifiedAt ?? null,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export class DrizzleSupplierComplianceRepo implements ISupplierComplianceRepo {
  constructor(private readonly tx: TenantTx) {}

  async findBySupplierId(supplierId: string): Promise<readonly SupplierComplianceItem[]> {
    const rows = await this.tx.query.supplierComplianceItems.findMany({
      where: eq(supplierComplianceItems.supplierId, supplierId),
    });
    return rows.map(mapToDomain);
  }

  async findExpiringByTenant(tenantId: string): Promise<readonly SupplierComplianceItem[]> {
    const now = new Date();
    const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;
    const thirtyDaysFromNow = new Date(now.getTime() + thirtyDaysMs);

    const rows = await this.tx.query.supplierComplianceItems.findMany({
      where: (t, { eq, and, lte, isNotNull, gte }) =>
        and(
          eq(t.tenantId, tenantId),
          isNotNull(t.expiresAt),
          lte(t.expiresAt, thirtyDaysFromNow),
          gte(t.expiresAt, now)
        ),
    });

    return rows.map(mapToDomain);
  }

  async findById(id: string): Promise<SupplierComplianceItem | null> {
    const row = await this.tx.query.supplierComplianceItems.findFirst({
      where: eq(supplierComplianceItems.id, id),
    });
    return row ? mapToDomain(row) : null;
  }

  async upsert(item: SupplierComplianceItem): Promise<SupplierComplianceItem> {
    const existing = await this.tx.query.supplierComplianceItems.findFirst({
      where: eq(supplierComplianceItems.id, item.id),
    });

    if (existing) {
      await this.tx
        .update(supplierComplianceItems)
        .set({
          isCompliant: item.status === 'VALID' || item.status === 'EXPIRING_SOON',
          expiresAt: item.expiryDate,
          documentId: item.documentId,
          notes: item.notes,
          verifiedBy: item.lastVerifiedBy,
          verifiedAt: item.lastVerifiedAt,
          updatedAt: new Date(),
        })
        .where(eq(supplierComplianceItems.id, item.id));
    } else {
      await this.tx.insert(supplierComplianceItems).values({
        id: item.id,
        tenantId: item.tenantId,
        supplierId: item.supplierId,
        itemType: item.itemType as typeof supplierComplianceItems.$inferSelect.itemType,
        label: item.itemType,
        isCompliant: item.status === 'VALID' || item.status === 'EXPIRING_SOON',
        expiresAt: item.expiryDate,
        documentId: item.documentId,
        notes: item.notes,
        verifiedBy: item.lastVerifiedBy,
        verifiedAt: item.lastVerifiedAt,
      });
    }

    const updated = await this.tx.query.supplierComplianceItems.findFirst({
      where: eq(supplierComplianceItems.id, item.id),
    });
    return mapToDomain(updated!);
  }
}
