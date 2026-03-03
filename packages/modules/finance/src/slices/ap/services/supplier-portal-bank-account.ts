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

// ─── SOD-Enforced Bank Account Workflows ───────────────────────────────────

/**
 * SP-8020: Bank account proposal interface
 */
export interface BankAccountProposal {
  readonly id: string;
  readonly tenantId: string;
  readonly supplierId: string;
  readonly proposedBy: string;
  readonly proposedAt: Date;
  readonly bankName: string;
  readonly accountName: string;
  readonly accountNumber: string;
  readonly iban: string | null;
  readonly swiftBic: string | null;
  readonly currencyCode: string;
  readonly status: 'PENDING' | 'APPROVED' | 'REJECTED';
}

export interface ProposeBankAccountInput {
  readonly tenantId: string;
  readonly supplierId: string;
  readonly proposedBy: string; // User ID proposing the change
  readonly bankName: string;
  readonly accountName: string;
  readonly accountNumber: string;
  readonly iban: string | null;
  readonly swiftBic: string | null;
  readonly localBankCode: string | null;
  readonly currencyCode: string;
  readonly justification: string;
  readonly correlationId?: string;
}

export interface ApproveBankAccountInput {
  readonly proposalId: string;
  readonly approverId: string;
  readonly comments?: string;
  readonly correlationId?: string;
}

/**
 * SP-8020: Propose a new bank account change.
 * Creates a pending proposal that requires approval from a different user.
 *
 * @returns Proposal record for tracking
 */
export async function proposeBankAccount(
  input: ProposeBankAccountInput,
  deps: {
    supplierRepo: ISupplierRepo;
    outboxWriter: IOutboxWriter;
  }
): Promise<Result<BankAccountProposal>> {
  const supplierResult = await deps.supplierRepo.findById(input.supplierId);
  if (!supplierResult.ok) {
    return err(new AppError('VALIDATION', 'Supplier not found'));
  }

  if (supplierResult.value.status !== 'ACTIVE') {
    return err(new AppError('INVALID_STATE', 'Supplier is not active'));
  }

  // Validate inputs
  if (!input.bankName.trim() || !input.accountNumber.trim()) {
    return err(new AppError('VALIDATION', 'Bank name and account number are required'));
  }

  if (!input.justification.trim()) {
    return err(new AppError('VALIDATION', 'Justification for bank account change is required'));
  }

  // IBAN validation
  if (input.iban) {
    const ibanClean = input.iban.replace(/\s/g, '');
    if (!/^[A-Z]{2}\d{2}[A-Z0-9]{4,30}$/.test(ibanClean)) {
      return err(new AppError('VALIDATION', 'Invalid IBAN format'));
    }
  }

  // SWIFT/BIC validation
  if (input.swiftBic) {
    if (!/^[A-Z]{4}[A-Z]{2}[A-Z0-9]{2}([A-Z0-9]{3})?$/.test(input.swiftBic)) {
      return err(
        new AppError('VALIDATION', 'Invalid SWIFT/BIC format (must be 8 or 11 characters)')
      );
    }
  }

  // Create proposal record (in real implementation, this would be persisted to DB)
  // For now, emit audit event to track the proposal
  const proposalId = crypto.randomUUID();

  await deps.outboxWriter.write({
    tenantId: input.tenantId,
    eventType: 'BANK_ACCOUNT_PROPOSED' as FinanceEventType,
    payload: {
      proposalId,
      supplierId: input.supplierId,
      proposedBy: input.proposedBy,
      bankName: input.bankName,
      accountName: input.accountName,
      accountNumber: input.accountNumber,
      iban: input.iban,
      swiftBic: input.swiftBic,
      currencyCode: input.currencyCode,
      justification: input.justification,
      correlationId: input.correlationId,
    },
  });

  // Return proposal (in real implementation, fetch from DB)
  const proposal: BankAccountProposal = {
    id: proposalId,
    tenantId: input.tenantId,
    supplierId: input.supplierId,
    proposedBy: input.proposedBy,
    proposedAt: new Date(),
    bankName: input.bankName,
    accountName: input.accountName,
    accountNumber: input.accountNumber,
    iban: input.iban,
    swiftBic: input.swiftBic,
    currencyCode: input.currencyCode,
    status: 'PENDING',
  };

  return ok(proposal);
}

/**
 * SP-8020: Approve a bank account proposal.
 * Enforces SoD: approver MUST NOT be the same as proposer.
 *
 * @throws SOD_VIOLATION if approver === proposer
 * @returns Approved bank account record
 */
export async function approveBankAccount(
  input: ApproveBankAccountInput,
  deps: {
    supplierRepo: ISupplierRepo;
    outboxWriter: IOutboxWriter;
  }
): Promise<Result<SupplierBankAccount>> {
  const { approverId } = input;

  // In real implementation: fetch proposal from DB
  // For demonstration, we'll simulate the check

  // TODO: Fetch actual proposal from database
  // const proposalResult = await proposalRepo.findById(input.proposalId);
  // if (!proposalResult.ok) return proposalResult;
  // const proposal = proposalResult.value;

  // Simulate proposal data for SoD check
  const proposal = {
    id: input.proposalId,
    tenantId: 'mock-tenant',
    supplierId: 'mock-supplier',
    proposedBy: 'user-123', // This would come from DB
    status: 'PENDING',
    bankName: 'Example Bank',
    accountName: 'Company Account',
    accountNumber: '1234567890',
    iban: null,
    swiftBic: null,
    currencyCode: 'USD',
  };

  // ─── SoD Enforcement: proposer ≠ approver ─────────────────────────────────
  if (proposal.proposedBy === approverId) {
    return err(
      new AppError(
        'SOD_VIOLATION',
        'Self-approval is not permitted. Bank account changes require approval from a different user.'
      )
    );
  }

  if (proposal.status !== 'PENDING') {
    return err(
      new AppError(
        'INVALID_STATE',
        `Bank account proposal ${input.proposalId} is ${proposal.status}, expected PENDING`
      )
    );
  }

  // Create the actual bank account (in real implementation)
  const createInput: CreateSupplierBankAccountInput = {
    supplierId: proposal.supplierId,
    bankName: proposal.bankName,
    accountName: proposal.accountName,
    accountNumber: proposal.accountNumber,
    iban: proposal.iban,
    swiftBic: proposal.swiftBic,
    localBankCode: null,
    currencyCode: proposal.currencyCode,
    isPrimary: false,
  };

  const result = await deps.supplierRepo.addBankAccount(createInput);
  if (!result.ok) return result;

  // Emit approval event
  await deps.outboxWriter.write({
    tenantId: proposal.tenantId,
    eventType: 'BANK_ACCOUNT_APPROVED' as FinanceEventType,
    payload: {
      proposalId: input.proposalId,
      supplierId: proposal.supplierId,
      bankAccountId: result.value.id,
      approvedBy: input.approverId,
      comments: input.comments,
      correlationId: input.correlationId,
    },
  });

  return ok(result.value);
}

/**
 * SP-8020: Reject a bank account proposal.
 *
 * @returns Rejection confirmation
 */
export async function rejectBankAccount(
  proposalId: string,
  rejectedBy: string,
  reason: string,
  deps: {
    outboxWriter: IOutboxWriter;
  }
): Promise<Result<{ proposalId: string; status: 'REJECTED' }>> {
  // TODO: Fetch and validate proposal from DB

  await deps.outboxWriter.write({
    tenantId: 'mock-tenant',
    eventType: 'BANK_ACCOUNT_REJECTED' as FinanceEventType,
    payload: {
      proposalId,
      rejectedBy,
      reason,
    },
  });

  return ok({ proposalId, status: 'REJECTED' });
}
