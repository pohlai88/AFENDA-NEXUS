import { eq, and, desc } from 'drizzle-orm';
import type { TenantTx } from '@afenda/db';
import { supplierDocuments } from '@afenda/db';
import type {
  SupplierDocument,
  SupplierDocumentCategory,
  ISupplierDocumentRepo,
} from '../services/supplier-portal-document-vault.js';

type DocRow = typeof supplierDocuments.$inferSelect;

function mapToDomain(row: DocRow): SupplierDocument {
  return {
    id: row.id,
    supplierId: row.supplierId,
    tenantId: row.tenantId,
    category: row.category as SupplierDocumentCategory,
    title: row.title,
    description: row.description ?? null,
    fileName: row.fileName,
    mimeType: row.mimeType,
    fileSizeBytes: row.fileSizeBytes,
    checksumSha256: row.checksumSha256,
    expiresAt: row.expiresAt ?? null,
    uploadedBy: row.uploadedBy,
    createdAt: row.createdAt,
  };
}

export class DrizzleSupplierDocumentRepo implements ISupplierDocumentRepo {
  constructor(private readonly tx: TenantTx) {}

  async create(doc: SupplierDocument): Promise<SupplierDocument> {
    const [row] = await this.tx
      .insert(supplierDocuments)
      .values({
        id: doc.id,
        tenantId: doc.tenantId,
        supplierId: doc.supplierId,
        category: doc.category as typeof supplierDocuments.$inferSelect.category,
        title: doc.title,
        description: doc.description,
        fileName: doc.fileName,
        mimeType: doc.mimeType,
        fileSizeBytes: doc.fileSizeBytes,
        checksumSha256: doc.checksumSha256,
        expiresAt: doc.expiresAt,
        uploadedBy: doc.uploadedBy,
      })
      .returning();

    return mapToDomain(row!);
  }

  async findBySupplierId(
    supplierId: string,
    category?: SupplierDocumentCategory
  ): Promise<readonly SupplierDocument[]> {
    const conditions = [eq(supplierDocuments.supplierId, supplierId)];
    if (category) {
      conditions.push(
        eq(supplierDocuments.category, category as typeof supplierDocuments.$inferSelect.category)
      );
    }

    const rows = await this.tx.query.supplierDocuments.findMany({
      where: and(...conditions),
      orderBy: [desc(supplierDocuments.createdAt)],
    });
    return rows.map(mapToDomain);
  }

  async findById(id: string): Promise<SupplierDocument | null> {
    const row = await this.tx.query.supplierDocuments.findFirst({
      where: eq(supplierDocuments.id, id),
    });
    return row ? mapToDomain(row) : null;
  }
}
