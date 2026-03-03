/**
 * SP-1010: PortalRequestContext — The immutable request envelope.
 *
 * Every portal service receives identity through this and only this type.
 * Constructed once in the Fastify preHandler hook from resolveSupplierIdentity()
 * + Idempotency-Key header + request metadata.
 *
 * Services NEVER construct their own identity — they receive PortalRequestContext
 * as a dependency.
 */

// ─── Portal Roles ───────────────────────────────────────────────────────────

/**
 * Supplier-side roles (inside supplier company).
 *
 * - PORTAL_OWNER: All permissions + user/API key management
 * - PORTAL_FINANCE: Invoice, bank, escalation, message
 * - PORTAL_OPERATIONS: Cases, messages, documents
 * - PORTAL_READONLY: Read-only access, no mutations, no escalation
 */
export const PORTAL_ROLES = [
  'PORTAL_OWNER',
  'PORTAL_FINANCE',
  'PORTAL_OPERATIONS',
  'PORTAL_READONLY',
] as const;

export type PortalRole = (typeof PORTAL_ROLES)[number];

/**
 * Buyer-side roles (internal staff handling portal cases/messages).
 */
export const BUYER_PORTAL_ROLES = [
  'PORTAL_AGENT',
  'PORTAL_MANAGER',
  'PORTAL_EXECUTIVE_ESCALATION',
] as const;

export type BuyerPortalRole = (typeof BUYER_PORTAL_ROLES)[number];

// ─── Portal Permissions ─────────────────────────────────────────────────────

export const PORTAL_PERMISSIONS = [
  'INVOICE_SUBMIT',
  'INVOICE_READ',
  'CASE_CREATE',
  'CASE_READ',
  'MSG_SEND',
  'MSG_READ',
  'DOCUMENT_UPLOAD',
  'DOCUMENT_READ',
  'ESCALATE',
  'BANK_ACCOUNT_MANAGE',
  'BANK_ACCOUNT_READ',
  'API_KEY_MANAGE',
  'USER_MANAGE',
  'COMPLIANCE_READ',
  'COMPLIANCE_UPLOAD',
  'PAYMENT_READ',
  'PROFILE_UPDATE',
  'NOTIFICATION_MANAGE',
  'APPOINTMENT_CREATE',
  'APPOINTMENT_READ',
] as const;

export type PortalPermission = (typeof PORTAL_PERMISSIONS)[number];

// ─── Actor Types ────────────────────────────────────────────────────────────

export const ACTOR_TYPES = ['SUPPLIER', 'BUYER', 'SYSTEM'] as const;
export type ActorType = (typeof ACTOR_TYPES)[number];

// ─── PortalRequestContext ───────────────────────────────────────────────────

/**
 * The single immutable identity envelope for all portal services.
 *
 * @invariant Constructed once in preHandler — never mutated after creation.
 * @invariant Services receive this as a parameter, never construct it themselves.
 */
export interface PortalRequestContext {
  /** Tenant ID — scopes all DB queries via RLS. */
  readonly tenantId: string;

  /** Supplier entity ID (from supplier table). */
  readonly supplierId: string;

  /** Portal user ID (from auth system). */
  readonly portalUserId: string;

  /** Entity IDs this user can access (multi-entity support, P9 CAP-MULTI). */
  readonly entityIds: readonly string[];

  /** Supplier-side role. */
  readonly portalRole: PortalRole;

  /** Derived permissions based on role. */
  readonly permissions: readonly PortalPermission[];

  /** IP + UA hash — for rate limiting / abuse detection. */
  readonly actorFingerprint: string;

  /** From Idempotency-Key header (client-generated UUID). */
  readonly idempotencyKey?: string;
}

// ─── PortalRequestContext Factory ───────────────────────────────────────────

export interface CreatePortalContextInput {
  readonly tenantId: string;
  readonly supplierId: string;
  readonly portalUserId: string;
  readonly entityIds: readonly string[];
  readonly portalRole: PortalRole;
  readonly actorFingerprint: string;
  readonly idempotencyKey?: string;
}

/**
 * Derive permissions from role. Pure function — no I/O.
 */
export function derivePermissions(role: PortalRole): readonly PortalPermission[] {
  switch (role) {
    case 'PORTAL_OWNER':
      return [...PORTAL_PERMISSIONS];
    case 'PORTAL_FINANCE':
      return [
        'INVOICE_SUBMIT',
        'INVOICE_READ',
        'CASE_CREATE',
        'CASE_READ',
        'MSG_SEND',
        'MSG_READ',
        'DOCUMENT_UPLOAD',
        'DOCUMENT_READ',
        'ESCALATE',
        'BANK_ACCOUNT_MANAGE',
        'BANK_ACCOUNT_READ',
        'COMPLIANCE_READ',
        'COMPLIANCE_UPLOAD',
        'PAYMENT_READ',
        'PROFILE_UPDATE',
        'NOTIFICATION_MANAGE',
        'APPOINTMENT_CREATE',
        'APPOINTMENT_READ',
      ];
    case 'PORTAL_OPERATIONS':
      return [
        'INVOICE_READ',
        'CASE_CREATE',
        'CASE_READ',
        'MSG_SEND',
        'MSG_READ',
        'DOCUMENT_UPLOAD',
        'DOCUMENT_READ',
        'COMPLIANCE_READ',
        'PAYMENT_READ',
        'NOTIFICATION_MANAGE',
        'APPOINTMENT_CREATE',
        'APPOINTMENT_READ',
      ];
    case 'PORTAL_READONLY':
      return [
        'INVOICE_READ',
        'CASE_READ',
        'MSG_READ',
        'DOCUMENT_READ',
        'BANK_ACCOUNT_READ',
        'COMPLIANCE_READ',
        'PAYMENT_READ',
        'APPOINTMENT_READ',
      ];
  }
}

/**
 * Create an immutable PortalRequestContext from resolved identity + request metadata.
 *
 * SP-1010: This factory is the ONLY way to construct a PortalRequestContext.
 * Called from the Fastify preHandler hook after resolveSupplierIdentity().
 */
export function createPortalContext(input: CreatePortalContextInput): PortalRequestContext {
  return Object.freeze({
    tenantId: input.tenantId,
    supplierId: input.supplierId,
    portalUserId: input.portalUserId,
    entityIds: Object.freeze([...input.entityIds]),
    portalRole: input.portalRole,
    permissions: Object.freeze(derivePermissions(input.portalRole)),
    actorFingerprint: input.actorFingerprint,
    idempotencyKey: input.idempotencyKey,
  });
}
