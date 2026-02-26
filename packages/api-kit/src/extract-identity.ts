/**
 * @afenda/api-kit — Single source of truth for request identity.
 *
 * Every route handler must use extractIdentity(req) instead of reading
 * identity headers directly. Headers are only read by the auth middleware,
 * which populates req.authUser.
 */
import type { FastifyRequest } from 'fastify/types/request.js';

export interface RequestIdentity {
  readonly tenantId: string;
  readonly userId: string;
}

/**
 * Extracts tenant and user identity from the authenticated request.
 *
 * @throws {Error} with statusCode 401 if authUser is not populated
 *   (i.e. auth middleware did not run or session is invalid).
 */
export function extractIdentity(req: FastifyRequest): RequestIdentity {
  const a = (req as FastifyRequest & { authUser?: { tenantId?: string; userId?: string } }).authUser;
  if (!a?.tenantId || !a?.userId) {
    const err = new Error('Unauthorized — missing authUser') as Error & { statusCode: number };
    err.statusCode = 401;
    throw err;
  }
  return { tenantId: a.tenantId, userId: a.userId } as const;
}
