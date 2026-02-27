import type { Result } from '@afenda/core';
import type { SupplierContact, SupplierContactRole } from '../entities/supplier-contact.js';

export interface CreateSupplierContactInput {
  readonly tenantId: string;
  readonly supplierId: string;
  readonly siteId: string | null;
  readonly role: SupplierContactRole;
  readonly firstName: string;
  readonly lastName: string;
  readonly email: string;
  readonly phone: string | null;
  readonly jobTitle: string | null;
  readonly isPrimary: boolean;
}

export interface UpdateSupplierContactInput {
  readonly role?: SupplierContactRole;
  readonly firstName?: string;
  readonly lastName?: string;
  readonly email?: string;
  readonly phone?: string | null;
  readonly jobTitle?: string | null;
  readonly isPrimary?: boolean;
  readonly isActive?: boolean;
}

export interface ISupplierContactRepo {
  create(input: CreateSupplierContactInput): Promise<Result<SupplierContact>>;
  findBySupplierId(supplierId: string): Promise<readonly SupplierContact[]>;
  update(contactId: string, input: UpdateSupplierContactInput): Promise<Result<SupplierContact>>;
  deactivate(contactId: string): Promise<Result<void>>;
}
