/**
 * GAP-A1: Drizzle implementation of IRoleResolver.
 *
 * Queries neon_auth.member to resolve org-scoped roles for a user.
 * Neon Auth (Better Auth) stores organization membership in neon_auth.member
 * with columns: organizationId, userId, role.
 *
 * Unknown role names result in empty roles (deny), not a fallback.
 */
import { sql } from 'drizzle-orm';
import type { TenantTx } from '@afenda/db';
import { roles, type RoleDefinition } from '@afenda/authz';
import type { IRoleResolver } from '../ports/role-resolver.js';

interface RawRowsResult {
  rows: { role: string }[];
}

function hasRows(value: unknown): value is RawRowsResult {
  if (typeof value !== 'object' || value === null) return false;
  const obj = value as Record<string, unknown>;
  return Array.isArray(obj.rows);
}

interface ErrorLike {
  code?: string;
  message?: string;
  cause?: ErrorLike;
}

function isErrorLike(value: unknown): value is ErrorLike {
  return typeof value === 'object' && value !== null;
}

/**
 * Detect Postgres 42P01 ("relation does not exist") regardless of how
 * the driver / Drizzle wraps the original error.
 */
export function isMissingRelation(err: unknown): boolean {
  if (!isErrorLike(err)) return false;
  return (
    err.code === '42P01' ||
    (isErrorLike(err.cause) && err.cause.code === '42P01') ||
    String(err.message ?? '').includes('does not exist') ||
    (isErrorLike(err.cause) && String(err.cause.message ?? '').includes('does not exist'))
  );
}

export class DrizzleRoleResolver implements IRoleResolver {
  constructor(private readonly tx: TenantTx) {}

  async resolveRoles(tenantId: string, userId: string): Promise<readonly RoleDefinition[]> {
    let result;
    try {
      result = await this.tx.execute(sql`
        SELECT role FROM neon_auth.member
        WHERE "organizationId" = ${tenantId}::uuid
          AND "userId" = ${userId}::uuid
      `);
    } catch (e: unknown) {
      if (isMissingRelation(e)) return [];
      throw e;
    }

    if (!hasRows(result) || result.rows.length === 0) return [];
    const { rows } = result;

    const resolved: RoleDefinition[] = [];
    for (const row of rows) {
      const roleDef = roles[row.role as keyof typeof roles];
      if (roleDef) {
        resolved.push(roleDef);
      }
      // Unknown role name → ignored (deny by omission)
    }

    return resolved;
  }
}
