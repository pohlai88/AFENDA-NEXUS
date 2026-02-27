import { eq, and, sql } from 'drizzle-orm';
import { ok, err, AppError } from '@afenda/core';
import type { Result } from '@afenda/core';
import type { TenantTx } from '@afenda/db';
import { supplierLegalDocuments, supplierDocRequirements } from '@afenda/db';
import type { SupplierLegalDocument, SupplierDocRequirement } from '../entities/supplier-legal-doc.js';
import type { SupplierAccountGroup } from '../entities/supplier.js';
import type {
  ISupplierLegalDocRepo,
  CreateSupplierLegalDocInput,
  UpsertDocRequirementInput,
} from '../ports/supplier-legal-doc-repo.js';

type DocRow = typeof supplierLegalDocuments.$inferSelect;
type ReqRow = typeof supplierDocRequirements.$inferSelect;

function mapDocToDomain(row: DocRow): SupplierLegalDocument {
  return {
    id: row.id,
    tenantId: row.tenantId,
    supplierId: row.supplierId,
    docType: row.docType as SupplierLegalDocument['docType'],
    documentNumber: row.documentNumber ?? null,
    issuingAuthority: row.issuingAuthority ?? null,
    issueDate: row.issueDate ?? null,
    expiryDate: row.expiryDate ?? null,
    storageKey: row.storageKey ?? null,
    checksumSha256: row.checksumSha256 ?? null,
    status: row.status as SupplierLegalDocument['status'],
    rejectionReason: row.rejectionReason ?? null,
    verifiedBy: row.verifiedBy ?? null,
    verifiedAt: row.verifiedAt ?? null,
    uploadedBy: row.uploadedBy,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function mapReqToDomain(row: ReqRow): SupplierDocRequirement {
  return {
    id: row.id,
    tenantId: row.tenantId,
    accountGroup: row.accountGroup,
    docType: row.docType as SupplierDocRequirement['docType'],
    isMandatory: row.isMandatory,
    countryCode: row.countryCode ?? null,
    isActive: row.isActive,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export class DrizzleSupplierLegalDocRepo implements ISupplierLegalDocRepo {
  constructor(private readonly tx: TenantTx) { }

  async create(input: CreateSupplierLegalDocInput): Promise<Result<SupplierLegalDocument>> {
    const [row] = await this.tx
      .insert(supplierLegalDocuments)
      .values({
        tenantId: input.tenantId,
        supplierId: input.supplierId,
        docType: input.docType,
        documentNumber: input.documentNumber,
        issuingAuthority: input.issuingAuthority,
        issueDate: input.issueDate,
        expiryDate: input.expiryDate,
        storageKey: input.storageKey,
        checksumSha256: input.checksumSha256,
        uploadedBy: input.uploadedBy,
        status: 'PENDING',
      })
      .returning();
    if (!row) return err(new AppError('INTERNAL', 'Failed to insert legal document'));
    return ok(mapDocToDomain(row));
  }

  async findBySupplierId(supplierId: string): Promise<readonly SupplierLegalDocument[]> {
    const rows = await this.tx
      .select()
      .from(supplierLegalDocuments)
      .where(eq(supplierLegalDocuments.supplierId, supplierId));
    return rows.map(mapDocToDomain);
  }

  async verify(docId: string, verifiedBy: string): Promise<Result<SupplierLegalDocument>> {
    const [row] = await this.tx
      .update(supplierLegalDocuments)
      .set({ status: 'VERIFIED', verifiedBy, verifiedAt: new Date(), updatedAt: new Date() })
      .where(eq(supplierLegalDocuments.id, docId))
      .returning();

    if (!row) return err(new AppError('NOT_FOUND', 'Legal document not found'));
    return ok(mapDocToDomain(row));
  }

  async reject(docId: string, rejectionReason: string): Promise<Result<SupplierLegalDocument>> {
    const [row] = await this.tx
      .update(supplierLegalDocuments)
      .set({ status: 'REJECTED', rejectionReason, updatedAt: new Date() })
      .where(eq(supplierLegalDocuments.id, docId))
      .returning();

    if (!row) return err(new AppError('NOT_FOUND', 'Legal document not found'));
    return ok(mapDocToDomain(row));
  }

  async upsertDocRequirement(input: UpsertDocRequirementInput): Promise<Result<SupplierDocRequirement>> {
    const [row] = await this.tx
      .insert(supplierDocRequirements)
      .values({
        tenantId: input.tenantId,
        accountGroup: input.accountGroup,
        docType: input.docType,
        isMandatory: input.isMandatory,
        countryCode: input.countryCode,
        isActive: input.isActive,
      })
      .onConflictDoUpdate({
        target: [
          supplierDocRequirements.tenantId,
          supplierDocRequirements.accountGroup,
          supplierDocRequirements.docType,
          supplierDocRequirements.countryCode,
        ],
        set: {
          isMandatory: input.isMandatory,
          isActive: input.isActive,
          updatedAt: new Date(),
        },
      })
      .returning();
    if (!row) return err(new AppError('INTERNAL', 'Failed to upsert doc requirement'));
    return ok(mapReqToDomain(row));
  }

  async findDocRequirements(
    tenantId: string,
    accountGroup: SupplierAccountGroup,
    countryCode?: string
  ): Promise<readonly SupplierDocRequirement[]> {
    const conditions = [
      eq(supplierDocRequirements.tenantId, tenantId),
      eq(supplierDocRequirements.accountGroup, accountGroup),
    ];
    if (countryCode) {
      conditions.push(
        sql`(${supplierDocRequirements.countryCode} IS NULL OR ${supplierDocRequirements.countryCode} = ${countryCode})`
      );
    }
    const rows = await this.tx
      .select()
      .from(supplierDocRequirements)
      .where(and(...conditions));
    return rows.map(mapReqToDomain);
  }

  async findAllDocRequirements(tenantId: string): Promise<readonly SupplierDocRequirement[]> {
    const rows = await this.tx
      .select()
      .from(supplierDocRequirements)
      .where(eq(supplierDocRequirements.tenantId, tenantId));
    return rows.map(mapReqToDomain);
  }
}
