/**
 * GAP-06: Authorization guard — Fastify preHandler that checks permissions
 * and SoD constraints before route handlers execute.
 *
 * Usage in route registration:
 *   app.post("/journals/:id/post", {
 *     preHandler: [requirePermission(policy, "journal:post")],
 *   }, handler);
 */
import type { FastifyRequest, FastifyReply } from "fastify";
import type { IAuthorizationPolicy, FinancePermission } from "../ports/authorization.js";

/**
 * Returns a Fastify preHandler that rejects requests where the user
 * lacks the specified permission.
 */
export function requirePermission(
  policy: IAuthorizationPolicy,
  permission: FinancePermission,
) {
  return async (req: FastifyRequest, reply: FastifyReply) => {
    const tenantId = req.headers["x-tenant-id"] as string;
    const userId = req.headers["x-user-id"] as string;

    if (!userId) {
      return reply.status(401).send({
        error: { code: "UNAUTHORIZED", message: "x-user-id header is required" },
      });
    }

    const allowed = await policy.hasPermission(tenantId, userId, permission);
    if (!allowed) {
      return reply.status(403).send({
        error: {
          code: "FORBIDDEN",
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
) {
  return async (req: FastifyRequest, reply: FastifyReply) => {
    const tenantId = req.headers["x-tenant-id"] as string;
    const userId = req.headers["x-user-id"] as string;

    if (!userId) return; // permission guard handles this

    const params = req.params as Record<string, string>;
    const body = req.body as Record<string, unknown> | null;
    const entityId = params?.id ?? (body?.journalId as string) ?? "";

    if (!entityId) return; // no entity to check SoD against

    const violation = await policy.checkSoD(tenantId, userId, action, entityId);
    if (violation) {
      return reply.status(403).send({
        error: {
          code: "SOD_VIOLATION",
          message: violation.reason,
        },
      });
    }
  };
}
