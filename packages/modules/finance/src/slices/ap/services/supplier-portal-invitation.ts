/**
 * Phase 1.1.7: Supplier Invitation Flow service (CAP-INV).
 *
 * Buyer-initiated magic link invitations:
 *   1. Buyer sends invitation → secure token generated (64-char hex)
 *   2. Email sent with magic link (7-day expiry)
 *   3. Supplier clicks link → validates token
 *   4. System creates supplier account (PROSPECT status)
 *   5. Redirect to onboarding wizard (Phase 1.1.2 integration)
 *
 * Security: Cryptographically secure tokens, time-limited, single-use.
 * Integration: Onboarding wizard, notification system, proof chain.
 */
import type { Result } from '@afenda/core';
import { ok, err, AppError, ValidationError, NotFoundError } from '@afenda/core';
import type { IProofChainWriter, ProofEventType } from '@afenda/supplier-kernel';
import type { ISupplierRepo } from '../ports/supplier-repo.js';
import type { IOutboxWriter } from '../../../shared/ports/outbox-writer.js';
import { FinanceEventType } from '../../../shared/events.js';
import { randomBytes } from 'node:crypto';

// ─── Domain Types ───────────────────────────────────────────────────────────

export type InvitationStatus =
  | 'PENDING' // Sent, awaiting acceptance
  | 'ACCEPTED' // Supplier clicked link and started onboarding
  | 'EXPIRED' // Token expired (default: 7 days)
  | 'REVOKED'; // Buyer cancelled invitation

export interface Invitation {
  readonly id: string;
  readonly tenantId: string;
  readonly email: string;
  readonly supplierName: string;
  readonly token: string; // 64-char hex (crypto-secure)
  readonly tokenExpiresAt: Date;
  readonly status: InvitationStatus;
  readonly sentAt: Date;
  readonly acceptedAt: Date | null;
  readonly revokedAt: Date | null;
  readonly supplierId: string | null; // Set after acceptance
  readonly invitedBy: string; // Buyer user ID
  readonly invitationMessage: string | null;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

// ─── Repository Port ────────────────────────────────────────────────────────

export interface IInvitationRepo {
  /** Find invitation by token (for magic link validation) */
  findByToken(token: string): Promise<Invitation | null>;

  /** Find invitation by ID */
  findById(tenantId: string, id: string): Promise<Invitation | null>;

  /** List invitations with optional filters */
  list(
    tenantId: string,
    filters: {
      status?: InvitationStatus;
      email?: string;
      page?: number;
      limit?: number;
    }
  ): Promise<{ items: readonly Invitation[]; total: number }>;

  /** Create new invitation */
  create(data: Invitation): Promise<Invitation>;

  /** Update invitation (for status changes) */
  update(id: string, data: Partial<Invitation>): Promise<Invitation | null>;
}

// ─── Input DTOs ─────────────────────────────────────────────────────────────

export interface SendInvitationInput {
  readonly tenantId: string;
  readonly email: string;
  readonly supplierName: string;
  readonly invitedBy: string; // Buyer user ID
  readonly invitationMessage?: string;
}

export interface AcceptInvitationInput {
  readonly token: string;
}

export interface RevokeInvitationInput {
  readonly tenantId: string;
  readonly invitationId: string;
  readonly revokedBy: string; // Buyer user ID
}

export interface ListInvitationsInput {
  readonly tenantId: string;
  readonly status?: InvitationStatus;
  readonly email?: string;
  readonly page?: number;
  readonly limit?: number;
}

// ─── Service Dependencies ───────────────────────────────────────────────────

export interface InvitationServiceDeps {
  readonly invitationRepo: IInvitationRepo;
  readonly supplierRepo: ISupplierRepo;
  readonly outboxWriter: IOutboxWriter;
  readonly proofChainWriter?: IProofChainWriter;
}

// ─── Constants ──────────────────────────────────────────────────────────────

const TOKEN_EXPIRY_DAYS = 7;
const TOKEN_LENGTH_BYTES = 32; // → 64-char hex string

// ─── Helpers ────────────────────────────────────────────────────────────────

/** Generate cryptographically secure random token (64-char hex) */
function generateSecureToken(): string {
  return randomBytes(TOKEN_LENGTH_BYTES).toString('hex');
}

/** Calculate token expiry date (7 days from now) */
function calculateExpiryDate(): Date {
  const now = new Date();
  return new Date(now.getTime() + TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000);
}

/** Check if token is expired */
function isTokenExpired(expiresAt: Date): boolean {
  return new Date() > expiresAt;
}

/** Write proof chain entry for invitation events */
async function writeProofEntry(
  writer: IProofChainWriter | undefined,
  input: {
    eventType: ProofEventType;
    entityId: string;
    actorId: string;
    payload?: Record<string, unknown>;
  }
): Promise<string | null> {
  if (!writer) return null;
  const result = await writer.write(
    {
      eventId: crypto.randomUUID(),
      eventType: input.eventType,
      entityType: 'supplier_invitation',
      entityId: input.entityId,
      actorType: 'BUYER',
      actorId: input.actorId,
      eventAt: new Date(),
      payload: input.payload ?? {},
      previousHash: null,
    },
    undefined
  );
  return result?.contentHash ?? null;
}

// ─── Service Functions ──────────────────────────────────────────────────────

/**
 * Send supplier invitation (buyer-initiated).
 *
 * Flow:
 *   1. Generate secure token (64-char hex)
 *   2. Create invitation record (PENDING status)
 *   3. Emit event for email sending (via outbox)
 *   4. Write proof chain entry
 *
 * @returns Invitation record with magic link details
 */
export async function sendInvitation(
  input: SendInvitationInput,
  deps: InvitationServiceDeps
): Promise<Result<Invitation>> {
  const token = generateSecureToken();
  const tokenExpiresAt = calculateExpiryDate();

  const invitation: Invitation = {
    id: crypto.randomUUID(),
    tenantId: input.tenantId,
    email: input.email.toLowerCase().trim(),
    supplierName: input.supplierName.trim(),
    token,
    tokenExpiresAt,
    status: 'PENDING',
    sentAt: new Date(),
    acceptedAt: null,
    revokedAt: null,
    supplierId: null,
    invitedBy: input.invitedBy,
    invitationMessage: input.invitationMessage ?? null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  // Create invitation record
  const created = await deps.invitationRepo.create(invitation);

  // Write proof chain entry
  await writeProofEntry(deps.proofChainWriter, {
    eventType: 'PORTAL_INVITATION_SENT',
    entityId: created.id,
    actorId: input.invitedBy,
    payload: {
      email: created.email,
      supplierName: created.supplierName,
      expiresAt: created.tokenExpiresAt.toISOString(),
    },
  });

  // Emit event for email sending (via outbox)
  await deps.outboxWriter.write({
    tenantId: created.tenantId,
    eventType: FinanceEventType.SUPPLIER_INVITED,
    payload: {
      invitationId: created.id,
      tenantId: created.tenantId,
      email: created.email,
      supplierName: created.supplierName,
      token: created.token,
      expiresAt: created.tokenExpiresAt.toISOString(),
      invitationMessage: created.invitationMessage,
    },
  });

  return ok(created);
}

/**
 * Accept supplier invitation (supplier-initiated, public route).
 *
 * Flow:
 *   1. Validate token (exists, not expired, status PENDING)
 *   2. Create supplier account (PROSPECT status)
 *   3. Update invitation (status → ACCEPTED, link supplierId)
 *   4. Write proof chain entry
 *   5. Return redirect URL to onboarding wizard
 *
 * @returns Supplier ID and onboarding redirect URL
 */
export async function acceptInvitation(
  input: AcceptInvitationInput,
  deps: InvitationServiceDeps
): Promise<
  Result<{ supplierId: string; supplierName: string; email: string; onboardingRedirectUrl: string }>
> {
  // 1. Find invitation by token
  const invitation = await deps.invitationRepo.findByToken(input.token);
  if (!invitation) {
    return err(new ValidationError('Invalid or expired invitation token'));
  }

  // 2. Validate invitation status
  if (invitation.status !== 'PENDING') {
    return err(new ValidationError(`Invitation already ${invitation.status.toLowerCase()}`));
  }

  // 3. Check token expiry
  if (isTokenExpired(invitation.tokenExpiresAt)) {
    // Auto-expire invitation
    await deps.invitationRepo.update(invitation.id, { status: 'EXPIRED' });
    return err(new ValidationError('Invitation token has expired'));
  }

  // 4. Check if supplier already exists with this email (via taxId or name search)
  // Note: Proper duplicate detection would use normalized names, phonetic matching, etc.
  // For now, we skip this check and rely on buyer approval workflow to catch duplicates.

  // 5. Create supplier account (PROSPECT status)
  const supplierResult = await deps.supplierRepo.create({
    tenantId: invitation.tenantId,
    companyId: 'default', // TODO: Map from invitation tenantId
    code: `SUP-${Date.now()}`, // Temporary code; buyer will assign proper code
    name: invitation.supplierName,
    tradingName: null,
    registrationNumber: null,
    countryOfIncorporation: null,
    legalForm: null,
    taxId: null,
    currencyCode: 'USD', // Default; will be updated in onboarding
    defaultPaymentTermsId: null,
    defaultPaymentMethod: null,
    whtRateId: null,
    remittanceEmail: invitation.email,
  });

  if (!supplierResult.ok) {
    return err(supplierResult.error);
  }

  const newSupplier = supplierResult.value;

  // 6. Update invitation (status → ACCEPTED)
  const updated = await deps.invitationRepo.update(invitation.id, {
    status: 'ACCEPTED',
    acceptedAt: new Date(),
    supplierId: newSupplier.id,
  });

  if (!updated) {
    return err(
      new AppError('UPDATE_FAILED', 'Failed to update invitation after supplier  creation')
    );
  }

  // 7. Write proof chain entry
  await writeProofEntry(deps.proofChainWriter, {
    eventType: 'PORTAL_INVITATION_ACCEPTED',
    entityId: updated.id,
    actorId: newSupplier.id,
    payload: {
      supplierId: newSupplier.id,
      acceptedAt: updated.acceptedAt!.toISOString(),
    },
  });

  // 8. Emit event for supplier creation
  await deps.outboxWriter.write({
    tenantId: newSupplier.tenantId,
    eventType: FinanceEventType.SUPPLIER_CREATED,
    payload: {
      supplierId: newSupplier.id,
      tenantId: newSupplier.tenantId,
      supplierName: newSupplier.name,
      email: newSupplier.remittanceEmail,
      invitationId: updated.id,
    },
  });

  // 9. Return redirect URL to onboarding wizard
  const onboardingRedirectUrl = `/portal/onboarding?supplierId=${newSupplier.id}`;

  return ok({
    supplierId: newSupplier.id,
    supplierName: newSupplier.name,
    email: newSupplier.remittanceEmail!,
    onboardingRedirectUrl,
  });
}

/**
 * Revoke supplier invitation (buyer-initiated).
 *
 * Flow:
 *   1. Find invitation by ID
 *   2. Validate status (must be PENDING)
 *   3. Update status → REVOKED
 *   4. Write proof chain entry
 *
 * @returns Updated invitation record
 */
export async function revokeInvitation(
  input: RevokeInvitationInput,
  deps: InvitationServiceDeps
): Promise<Result<Invitation>> {
  // 1. Find invitation
  const invitation = await deps.invitationRepo.findById(input.tenantId, input.invitationId);
  if (!invitation) {
    return err(new NotFoundError('Invitation', input.invitationId));
  }

  // 2. Validate status
  if (invitation.status !== 'PENDING') {
    return err(new ValidationError('Can only revoke pending invitations'));
  }

  // 3. Update status → REVOKED
  const updated = await deps.invitationRepo.update(invitation.id, {
    status: 'REVOKED',
    revokedAt: new Date(),
  });

  if (!updated) {
    return err(new AppError('UPDATE_FAILED', 'Failed to revoke invitation'));
  }

  // 4. Write proof chain entry
  await writeProofEntry(deps.proofChainWriter, {
    eventType: 'PORTAL_INVITATION_REVOKED',
    entityId: updated.id,
    actorId: input.revokedBy,
    payload: {
      revokedAt: updated.revokedAt!.toISOString(),
    },
  });

  return ok(updated);
}

/**
 * List invitations (buyer view).
 *
 * Filters:
 *   - status (optional): Filter by invitation status
 *   - email (optional): Filter by email address
 *   - page/limit: Pagination
 *
 * @returns Paginated list of invitations
 */
export async function listInvitations(
  input: ListInvitationsInput,
  deps: InvitationServiceDeps
): Promise<
  Result<{
    items: readonly Invitation[];
    total: number;
    page: number;
    limit: number;
    hasMore: boolean;
  }>
> {
  const page = input.page ?? 1;
  const limit = input.limit ?? 20;

  const result = await deps.invitationRepo.list(input.tenantId, {
    status: input.status,
    email: input.email,
    page,
    limit,
  });

  const hasMore = result.total > page * limit;

  return ok({
    items: result.items,
    total: result.total,
    page,
    limit,
    hasMore,
  });
}
