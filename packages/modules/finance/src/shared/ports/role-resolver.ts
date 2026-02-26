/**
 * GAP-A1: Role resolver port.
 *
 * Resolves the RBAC roles for a user within a specific tenant/organization.
 * Implementations query the auth membership store and map to @afenda/authz RoleDefinition.
 *
 * Unknown role names MUST result in an empty array (deny), not a fallback.
 */
import type { RoleDefinition } from '@afenda/authz';

export interface IRoleResolver {
  resolveRoles(tenantId: string, userId: string): Promise<readonly RoleDefinition[]>;
}
