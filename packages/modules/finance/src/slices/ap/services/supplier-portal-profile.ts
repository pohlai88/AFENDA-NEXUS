import type { Result } from '@afenda/core';
import { ok, err, AppError } from '@afenda/core';
import type { Supplier } from '../entities/supplier.js';
import type { ISupplierRepo, UpdateSupplierInput } from '../ports/supplier-repo.js';
import type { IOutboxWriter } from '../../../shared/ports/outbox-writer.js';
import { FinanceEventType } from '../../../shared/events.js';

/**
 * N6: Supplier self-service profile update.
 *
 * Allows suppliers to update a restricted set of their own profile fields:
 * - remittanceEmail
 * - name (display name)
 * - taxId
 *
 * Restricted fields (status, payment terms, payment method, WHT rate)
 * can only be changed by internal admin users.
 */

const ALLOWED_FIELDS = new Set<string>(['remittanceEmail', 'name', 'taxId']);

export interface SupplierProfileUpdateInput {
  readonly tenantId: string;
  readonly supplierId: string;
  readonly userId: string;
  readonly updates: {
    readonly name?: string;
    readonly taxId?: string | null;
    readonly remittanceEmail?: string | null;
  };
  readonly correlationId?: string;
}

export async function supplierUpdateProfile(
  input: SupplierProfileUpdateInput,
  deps: {
    supplierRepo: ISupplierRepo;
    outboxWriter: IOutboxWriter;
  }
): Promise<Result<Supplier>> {
  const supplierResult = await deps.supplierRepo.findById(input.supplierId);
  if (!supplierResult.ok) {
    return err(new AppError('VALIDATION', 'Supplier not found'));
  }

  if (supplierResult.value.status !== 'ACTIVE') {
    return err(new AppError('INVALID_STATE', 'Supplier is not active — cannot update profile'));
  }

  const updateKeys = Object.keys(input.updates).filter(
    (k) => (input.updates as Record<string, unknown>)[k] !== undefined
  );

  const disallowed = updateKeys.filter((k) => !ALLOWED_FIELDS.has(k));
  if (disallowed.length > 0) {
    return err(
      new AppError(
        'VALIDATION',
        `Restricted fields cannot be updated via portal: ${disallowed.join(', ')}`
      )
    );
  }

  if (updateKeys.length === 0) {
    return ok(supplierResult.value);
  }

  const updateInput: UpdateSupplierInput = {};
  if (input.updates.name !== undefined) {
    if (!input.updates.name.trim()) {
      return err(new AppError('VALIDATION', 'Supplier name cannot be empty'));
    }
    (updateInput as Record<string, unknown>).name = input.updates.name.trim();
  }
  if (input.updates.taxId !== undefined) {
    (updateInput as Record<string, unknown>).taxId = input.updates.taxId;
  }
  if (input.updates.remittanceEmail !== undefined) {
    if (input.updates.remittanceEmail !== null) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(input.updates.remittanceEmail)) {
        return err(new AppError('VALIDATION', 'Invalid email format'));
      }
    }
    (updateInput as Record<string, unknown>).remittanceEmail = input.updates.remittanceEmail;
  }

  const result = await deps.supplierRepo.update(input.supplierId, updateInput);
  if (!result.ok) return result;

  await deps.outboxWriter.write({
    tenantId: input.tenantId,
    eventType: FinanceEventType.SUPPLIER_PROFILE_UPDATED,
    payload: {
      supplierId: input.supplierId,
      updatedFields: updateKeys,
      userId: input.userId,
      correlationId: input.correlationId,
    },
  });

  return result;
}
