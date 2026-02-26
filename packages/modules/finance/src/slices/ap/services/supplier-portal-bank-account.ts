import type { Result } from '@afenda/core';
import { ok, err, AppError } from '@afenda/core';
import type { SupplierBankAccount } from '../entities/supplier.js';
import type { ISupplierRepo, CreateSupplierBankAccountInput } from '../ports/supplier-repo.js';
import type { IOutboxWriter } from '../../../shared/ports/outbox-writer.js';
import { FinanceEventType } from '../../../shared/events.js';

/**
 * N3: Supplier self-service bank account maintenance.
 *
 * Allows suppliers to add new bank accounts via the portal.
 * All mutations are scoped to the authenticated supplier and
 * emit an audit event for internal review.
 */

export interface SupplierAddBankAccountInput {
  readonly tenantId: string;
  readonly supplierId: string;
  readonly userId: string;
  readonly bankName: string;
  readonly accountName: string;
  readonly accountNumber: string;
  readonly iban: string | null;
  readonly swiftBic: string | null;
  readonly localBankCode: string | null;
  readonly currencyCode: string;
  readonly isPrimary: boolean;
  readonly correlationId?: string;
}

export async function supplierAddBankAccount(
  input: SupplierAddBankAccountInput,
  deps: {
    supplierRepo: ISupplierRepo;
    outboxWriter: IOutboxWriter;
  }
): Promise<Result<SupplierBankAccount>> {
  const supplierResult = await deps.supplierRepo.findById(input.supplierId);
  if (!supplierResult.ok) {
    return err(new AppError('VALIDATION', 'Supplier not found'));
  }

  if (supplierResult.value.status !== 'ACTIVE') {
    return err(new AppError('INVALID_STATE', 'Supplier is not active'));
  }

  if (!input.bankName.trim() || !input.accountNumber.trim()) {
    return err(new AppError('VALIDATION', 'Bank name and account number are required'));
  }

  if (input.iban) {
    const ibanClean = input.iban.replace(/\s/g, '');
    if (!/^[A-Z]{2}\d{2}[A-Z0-9]{4,30}$/.test(ibanClean)) {
      return err(new AppError('VALIDATION', 'Invalid IBAN format'));
    }
  }

  if (input.swiftBic) {
    if (!/^[A-Z]{4}[A-Z]{2}[A-Z0-9]{2}([A-Z0-9]{3})?$/.test(input.swiftBic)) {
      return err(
        new AppError('VALIDATION', 'Invalid SWIFT/BIC format (must be 8 or 11 characters)')
      );
    }
  }

  const createInput: CreateSupplierBankAccountInput = {
    supplierId: input.supplierId,
    bankName: input.bankName.trim(),
    accountName: input.accountName.trim(),
    accountNumber: input.accountNumber.trim(),
    iban: input.iban,
    swiftBic: input.swiftBic,
    localBankCode: input.localBankCode,
    currencyCode: input.currencyCode,
    isPrimary: input.isPrimary,
  };

  const result = await deps.supplierRepo.addBankAccount(createInput);
  if (!result.ok) return result;

  await deps.outboxWriter.write({
    tenantId: input.tenantId,
    eventType: FinanceEventType.SUPPLIER_BANK_ACCOUNT_UPDATED,
    payload: {
      supplierId: input.supplierId,
      bankAccountId: result.value.id,
      action: 'ADDED',
      userId: input.userId,
      correlationId: input.correlationId,
    },
  });

  return ok(result.value);
}
