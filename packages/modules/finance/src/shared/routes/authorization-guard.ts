/**
 * GAP-06: Authorization guard — Fastify preHandler that checks permissions
 * and SoD constraints before route handlers execute.
 *
 * Identity resolution order:
 *   1. `req.authUser` (set by auth middleware for real authenticated requests)
 *   2. `req.headers['x-user-id']` / `req.headers['x-tenant-id']` (fallback for
 *      unit tests and legacy callers that inject headers directly)
 *
 * Usage in route registration:
 *   app.post("/journals/:id/post", {
 *     preHandler: [requirePermission(policy, "journal:post")],
 *   }, handler);
 */
import type { FastifyRequest, FastifyReply } from 'fastify';
import { can } from '@afenda/authz';
import type { IAuthorizationPolicy, FinancePermission } from '../ports/authorization.js';
import { PERMISSION_MAP } from '../authorization/permission-map.js';

/**
 * Returns a Fastify preHandler that rejects requests where the user
 * lacks the specified permission.
 */
export function requirePermission(policy: IAuthorizationPolicy, permission: FinancePermission) {
  return async (req: FastifyRequest, reply: FastifyReply) => {
    // 1. Prefer req.authUser (auth middleware), 2. Fall back to headers (tests / legacy)
    const userId = req.authUser?.userId ?? (req.headers['x-user-id'] as string);
    const tenantId = req.authUser?.tenantId ?? (req.headers['x-tenant-id'] as string) ?? '';

    if (!userId) {
      return reply.status(401).send({
        error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
      });
    }

    // Fast path: if authUser carries roles, evaluate in-memory (no DB roundtrip)
    const roles = req.authUser?.roles;
    if (roles && roles.length > 0) {
      const mapping = PERMISSION_MAP[permission];
      if (!mapping) {
        return reply.status(403).send({
          error: {
            code: 'FORBIDDEN',
            message: `User ${userId} lacks permission: ${permission}`,
          },
        });
      }

      // Wildcard resource → allow (admin/owner)
      if (roles.some((r) => r.permissions.some((p) => p.resource === '*'))) {
        return;
      }

      const allowed = can(
        { tenantId, userId, roles },
        mapping.resource,
        mapping.action
      );
      if (allowed) return;

      return reply.status(403).send({
        error: {
          code: 'FORBIDDEN',
          message: `User ${userId} lacks permission: ${permission}`,
        },
      });
    }

    // Fallback: delegate to the DB-backed policy (DrizzleRoleResolver)
    const allowed = await policy.hasPermission(tenantId, userId, permission);
    if (!allowed) {
      return reply.status(403).send({
        error: {
          code: 'FORBIDDEN',
          message: `User ${userId} lacks permission: ${permission}`,
        },
      });
    }
  };
}

/**
 * Returns a Fastify preHandler that checks SoD constraints.
 * The entityId is extracted from request params (`:id`) or body (`journalId`).
 */
export function requireSoD(
  policy: IAuthorizationPolicy,
  action: FinancePermission,
  entityType: string
) {
  return async (req: FastifyRequest, reply: FastifyReply) => {
    const tenantId = req.authUser?.tenantId ?? (req.headers['x-tenant-id'] as string) ?? '';
    const userId = req.authUser?.userId ?? (req.headers['x-user-id'] as string);

    if (!userId) return; // permission guard handles this

    const params = req.params as Record<string, string>;
    const body = req.body as Record<string, unknown> | null;
    const entityId = params?.id ?? (body?.journalId as string) ?? (body?.periodId as string) ?? '';

    if (!entityId) return; // no entity to check SoD against

    const violation = await policy.checkSoD(tenantId, userId, action, entityType, entityId);
    if (violation) {
      return reply.status(403).send({
        error: {
          code: 'SOD_VIOLATION',
          message: violation.reason,
        },
      });
    }
  };
}
