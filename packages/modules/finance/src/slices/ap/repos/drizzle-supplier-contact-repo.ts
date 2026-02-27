import { eq } from 'drizzle-orm';
import { ok, err, AppError } from '@afenda/core';
import type { Result } from '@afenda/core';
import type { TenantTx } from '@afenda/db';
import { supplierContacts } from '@afenda/db';
import type { SupplierContact } from '../entities/supplier-contact.js';
import type {
  ISupplierContactRepo,
  CreateSupplierContactInput,
  UpdateSupplierContactInput,
} from '../ports/supplier-contact-repo.js';

type ContactRow = typeof supplierContacts.$inferSelect;

function mapToDomain(row: ContactRow): SupplierContact {
  return {
    id: row.id,
    tenantId: row.tenantId,
    supplierId: row.supplierId,
    siteId: row.siteId ?? null,
    role: row.role as SupplierContact['role'],
    firstName: row.firstName,
    lastName: row.lastName,
    email: row.email,
    phone: row.phone ?? null,
    jobTitle: row.jobTitle ?? null,
    isPrimary: row.isPrimary,
    isActive: row.isActive,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export class DrizzleSupplierContactRepo implements ISupplierContactRepo {
  constructor(private readonly tx: TenantTx) {}

  async create(input: CreateSupplierContactInput): Promise<Result<SupplierContact>> {
    const [row] = await this.tx
      .insert(supplierContacts)
      .values({
        tenantId: input.tenantId,
        supplierId: input.supplierId,
        siteId: input.siteId,
        role: input.role,
        firstName: input.firstName,
        lastName: input.lastName,
        email: input.email,
        phone: input.phone,
        jobTitle: input.jobTitle,
        isPrimary: input.isPrimary,
      })
      .returning();
    if (!row) return err(new AppError('INTERNAL', 'Failed to insert contact'));
    return ok(mapToDomain(row));
  }

  async findBySupplierId(supplierId: string): Promise<readonly SupplierContact[]> {
    const rows = await this.tx
      .select()
      .from(supplierContacts)
      .where(eq(supplierContacts.supplierId, supplierId));
    return rows.map(mapToDomain);
  }

  async update(contactId: string, input: UpdateSupplierContactInput): Promise<Result<SupplierContact>> {
    const setValues: Record<string, unknown> = { updatedAt: new Date() };
    if (input.role !== undefined) setValues.role = input.role;
    if (input.firstName !== undefined) setValues.firstName = input.firstName;
    if (input.lastName !== undefined) setValues.lastName = input.lastName;
    if (input.email !== undefined) setValues.email = input.email;
    if (input.phone !== undefined) setValues.phone = input.phone;
    if (input.jobTitle !== undefined) setValues.jobTitle = input.jobTitle;
    if (input.isPrimary !== undefined) setValues.isPrimary = input.isPrimary;
    if (input.isActive !== undefined) setValues.isActive = input.isActive;

    const [row] = await this.tx
      .update(supplierContacts)
      .set(setValues)
      .where(eq(supplierContacts.id, contactId))
      .returning();

    if (!row) return err(new AppError('NOT_FOUND', 'Contact not found'));
    return ok(mapToDomain(row));
  }

  async deactivate(contactId: string): Promise<Result<void>> {
    const [row] = await this.tx
      .update(supplierContacts)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(supplierContacts.id, contactId))
      .returning();

    if (!row) return err(new AppError('NOT_FOUND', 'Contact not found'));
    return ok(undefined);
  }
}
