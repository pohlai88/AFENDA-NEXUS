/**
 * SP-1001: Portal Identity & Tenancy — resolve identity for portal users.
 *
 * This module defines the PORT (interface) for identity resolution.
 * The actual implementation lives in the AP module's repos/services.
 *
 * @invariant Portal routes use PortalRequestContext (SP-1010), which is
 * constructed from the resolved identity in the preHandler hook.
 */

import type { PortalRole } from '../context/portal-request-context.js';

// ─── Identity Resolution Port ───────────────────────────────────────────────

/**
 * Result of resolving a portal user's identity.
 * Extends the existing SupplierIdentityResult with role/permissions/multi-entity.
 */
export interface PortalIdentityResult {
  readonly supplierId: string;
  readonly supplierName: string;
  readonly supplierCode: string;
  readonly currencyCode: string;
  readonly status: string;
  readonly taxId: string | null;
  readonly remittanceEmail: string | null;

  // ─── Extensions over v1 SupplierIdentityResult ──────────────────────────
  /** Portal role (mapped from supplier_contact or portal_user table). */
  readonly portalRole: PortalRole;
  /** Entity IDs this user can access (multi-entity support, P9 CAP-MULTI). */
  readonly entityIds: readonly string[];
}

/**
 * Port for resolving portal identity from auth user ID.
 *
 * Implementation in AP module's repos — not in kernel.
 * Kernel defines the contract; modules implement it.
 */
export interface IPortalIdentityResolver {
  /**
   * Resolve a portal user's identity from their auth userId + tenantId.
   *
   * @returns PortalIdentityResult or null if the user is not a portal user.
   */
  resolve(tenantId: string, userId: string): Promise<PortalIdentityResult | null>;
}
