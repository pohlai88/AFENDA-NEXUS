/**
 * SP-5022: Portal Multi-Entity Association Service (CAP-MULTI P19)
 *
 * Allows a single user to be linked to multiple supplier tenants.
 * Used to power the entity-switcher in the portal topbar.
 *
 * Architecture notes:
 *   - A user may be registered as a contact in more than one supplier profile
 *     (common for consultants, group procurement teams, shared email logins).
 *   - This service returns a lightweight list of all supplier associations —
 *     sufficient to render the entity switcher without loading full profiles.
 *   - Session-level "active entity" selection is persisted as a cookie/URL param
 *     at the Next.js layer (not here).
 */
import type { Result } from '@afenda/core';
import { ok, err, AppError } from '@afenda/core';

// ─── Domain Types ─────────────────────────────────────────────────────────────

export interface SupplierAssociation {
  /** The supplier's unique ID. */
  readonly supplierId: string;
  /** The supplier's display name. */
  readonly supplierName: string;
  /** A short code / abbreviation. */
  readonly supplierCode: string;
  /** The tenant this supplier belongs to. */
  readonly tenantId: string;
  /** Human-readable tenant name (for multi-tenant scenarios). */
  readonly tenantName: string;
  /** The supplier's current status in this tenant. */
  readonly status: 'ACTIVE' | 'INACTIVE' | 'PENDING';
}

// ─── Repository Port ──────────────────────────────────────────────────────────

export interface ISupplierAssociationRepo {
  /**
   * Find all supplier profiles linked to the given user ID.
   * Returns an empty array if the user has no supplier associations.
   */
  findAllByUserId(userId: string): Promise<readonly SupplierAssociation[]>;
}

// ─── Service ─────────────────────────────────────────────────────────────────

export interface MultiEntityServiceDeps {
  readonly supplierAssociationRepo: ISupplierAssociationRepo;
}

export type MultiEntityError = { code: 'NOT_FOUND'; message: string };

/**
 * List all supplier/tenant associations for the authenticated user.
 * Active associations are sorted first.
 *
 * Returns at minimum 1 association (the primary supplier).
 * If the user has no linked suppliers, returns NOT_FOUND.
 */
export async function listSupplierAssociations(
  deps: MultiEntityServiceDeps,
  userId: string
): Promise<Result<readonly SupplierAssociation[], MultiEntityError>> {
  const associations = await deps.supplierAssociationRepo.findAllByUserId(userId);

  if (associations.length === 0) {
    return err({
      code: 'NOT_FOUND',
      message: 'No supplier profiles are linked to your account.',
    });
  }

  // Sort: ACTIVE first, then PENDING, then INACTIVE
  const sorted = [...associations].sort((a, b) => {
    const order = { ACTIVE: 0, PENDING: 1, INACTIVE: 2 } as const;
    return (order[a.status] ?? 3) - (order[b.status] ?? 3);
  });

  return ok(sorted);
}
