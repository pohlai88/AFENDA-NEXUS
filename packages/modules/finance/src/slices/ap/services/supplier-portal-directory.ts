/**
 * Phase 1.1.6: Senior Management Directory service (CAP-DIR)
 *
 * Curated buyer contact directory for supplier escalations.
 * Email masking privacy + isEscalationContact flag for P19 CAP-SOS integration.
 */
import type { Result } from '@afenda/core';
import { ok, err, AppError } from '@afenda/core';

// ─── Domain Types ───────────────────────────────────────────────────────────

export type Department =
  | 'ACCOUNTS_PAYABLE'
  | 'PROCUREMENT'
  | 'COMPLIANCE'
  | 'FINANCE_MANAGEMENT'
  | 'EXECUTIVE'
  | 'OPERATIONS'
  | 'LEGAL';

export interface DirectoryEntry {
  readonly id: string;
  readonly tenantId: string;
  readonly fullName: string;
  readonly title: string;
  readonly department: Department;
  readonly emailAddress: string;
  readonly showFullEmail: boolean;
  readonly phoneNumber: string | null;
  readonly showPhone: boolean;
  readonly availability: string | null;
  readonly timezone: string | null;
  readonly bio: string | null;
  readonly isEscalationContact: boolean;
  readonly displayOrder: number;
  readonly isActive: boolean;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

/** Supplier-facing DTO with privacy applied. */
export interface DirectoryEntryDTO {
  readonly id: string;
  readonly fullName: string;
  readonly title: string;
  readonly department: Department;
  readonly emailAddress: string; // Masked if showFullEmail = false
  readonly masked: boolean;
  readonly phoneNumber: string | null; // Null if showPhone = false
  readonly availability: string | null;
  readonly timezone: string | null;
  readonly bio: string | null;
  readonly isEscalationContact: boolean;
}

// ─── Repository Port ────────────────────────────────────────────────────────

export interface IDirectoryRepo {
  findByTenantId(
    tenantId: string,
    query: { department?: Department; escalationOnly?: boolean }
  ): Promise<readonly DirectoryEntry[]>;
  findById(id: string): Promise<DirectoryEntry | null>;
}

// ─── Privacy Functions ──────────────────────────────────────────────────────

/**
 * Mask email: 'john.smith@company.com' → 'j.smith@...'
 * Takes first char + last segment before @ + '@...'
 */
export function maskEmail(email: string): string {
  const [local, domain] = email.split('@');
  if (!local || !domain) return email;

  const parts = local.split('.');
  if (parts.length === 1) {
    // No dot in local part: 'john@...' → 'j@...'
    return `${local.charAt(0)}@...`;
  }

  // Has dots: 'john.smith@...' → 'j.smith@...'
  const lastPart = parts[parts.length - 1];
  const masked = local.charAt(0) + '.' + lastPart;

  return `${masked}@...`;
}

/**
 * Apply privacy controls to directory entry.
 * Masks email if showFullEmail = false, hides phone if showPhone = false.
 */
function applyPrivacy(entry: DirectoryEntry): DirectoryEntryDTO {
  return {
    id: entry.id,
    fullName: entry.fullName,
    title: entry.title,
    department: entry.department,
    emailAddress: entry.showFullEmail ? entry.emailAddress : maskEmail(entry.emailAddress),
    masked: !entry.showFullEmail,
    phoneNumber: entry.showPhone ? entry.phoneNumber : null,
    availability: entry.availability,
    timezone: entry.timezone,
    bio: entry.bio,
    isEscalationContact: entry.isEscalationContact,
  };
}

// ─── Service Functions ──────────────────────────────────────────────────────

export interface DirectoryServiceDeps {
  readonly supplierRepo: any; // ISupplierRepo
  readonly directoryRepo: IDirectoryRepo;
}

export interface GetDirectoryRequest {
  tenantId: string;
  supplierId: string;
  department?: Department;
  escalationOnly?: boolean;
}

export interface GetDirectoryEntryRequest {
  tenantId: string;
  supplierId: string;
  entryId: string;
}

/**
 * List directory entries with privacy applied.
 * Optionally filter by department or escalation contacts only.
 */
export async function getDirectory(
  req: GetDirectoryRequest,
  deps: DirectoryServiceDeps
): Promise<Result<readonly DirectoryEntryDTO[]>> {
  // Validate supplier exists and belongs to tenant
  const supplierResult = await deps.supplierRepo.findById(req.supplierId);
  if (!supplierResult.ok) {
    return supplierResult;
  }
  if (supplierResult.value.tenantId !== req.tenantId) {
    return err(new AppError('AP_SUPPLIER_SCOPE_MISMATCH', 'Supplier does not belong to tenant'));
  }

  const entries = await deps.directoryRepo.findByTenantId(req.tenantId, {
    department: req.department,
    escalationOnly: req.escalationOnly,
  });

  return ok(entries.map(applyPrivacy));
}

/**
 * Get a single directory entry by ID with privacy applied.
 * Used for escalation contact lookup (P19 CAP-SOS integration).
 */
export async function getDirectoryEntry(
  req: GetDirectoryEntryRequest,
  deps: DirectoryServiceDeps
): Promise<Result<DirectoryEntryDTO>> {
  // Validate supplier exists and belongs to tenant
  const supplierResult = await deps.supplierRepo.findById(req.supplierId);
  if (!supplierResult.ok) {
    return supplierResult;
  }
  if (supplierResult.value.tenantId !== req.tenantId) {
    return err(new AppError('AP_SUPPLIER_SCOPE_MISMATCH', 'Supplier does not belong to tenant'));
  }

  const entry = await deps.directoryRepo.findById(req.entryId);
  if (!entry) {
    return err(new AppError('AP_DIRECTORY_ENTRY_NOT_FOUND', 'Directory entry not found'));
  }

  if (entry.tenantId !== req.tenantId) {
    return err(new AppError('AP_SUPPLIER_SCOPE_MISMATCH', 'Entry does not belong to tenant'));
  }

  return ok(applyPrivacy(entry));
}
