import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import type { AppConfig } from '@afenda/platform';
import { createJwtVerifier, jwtVerifierOptionsFromEnv, type JwtVerifier } from '@afenda/platform';
import type { Role } from '@afenda/authz';

declare module 'fastify' {
  interface FastifyRequest {
    authUser?: {
      userId: string;
      tenantId: string;
      roles: readonly Role[];
      orgRoles: readonly string[];
    };
  }
}

/**
 * Fastify auth middleware — verifies Neon Auth sessions and JWTs.
 *
 * Supports two authentication modes:
 *
 * 1. **Session token** (default for browser clients): The Next.js web app
 *    extracts the session token from its Neon Auth cookie and forwards it
 *    as a Bearer token. The API validates by calling the Neon Auth API
 *    `/api/auth/get-session` endpoint server-to-server.
 *
 * 2. **JWT** (for microservices, CLI tools, cross-domain API calls):
 *    When a `Bearer` token is a valid JWT (has 3 dot-separated parts),
 *    the middleware verifies it locally using the JWKS endpoint —
 *    no HTTP roundtrip required. JWTs are signed with EdDSA (Ed25519)
 *    and expire in 15 minutes.
 *
 * In dev mode without NEON_AUTH_BASE_URL, falls back to trusted headers.
 *
 * @see https://neon.tech/docs/auth/jwt
 */
export function authPlugin(config: AppConfig) {
  const neonAuthBaseUrl = process.env.NEON_AUTH_BASE_URL;

  // Build JWT verifier once (JWKS is cached and auto-refreshed by jose)
  const jwtVerifierOpts = jwtVerifierOptionsFromEnv();
  let jwtVerifier: JwtVerifier | null = null;
  if (jwtVerifierOpts) {
    jwtVerifier = createJwtVerifier(jwtVerifierOpts);
  }

  return async function plugin(app: FastifyInstance): Promise<void> {
    app.decorateRequest('authUser', undefined as never);

    app.addHook('preHandler', async (req: FastifyRequest, reply: FastifyReply) => {
      // Skip health endpoints
      if (req.url.startsWith('/health')) return;

      // Dev mode fallback: no NEON_AUTH_BASE_URL — trust headers
      if (!neonAuthBaseUrl && config.NODE_ENV === 'development') {
        const ctx = req.tenantContext;
        if (ctx) {
          req.authUser = {
            userId: ctx.userId,
            tenantId: ctx.tenantId,
            roles: [createWildcardRole('admin')],
            orgRoles: ['admin'],
          };
        }
        return;
      }

      // Extract session token from Authorization header or cookies
      const authHeader = req.headers.authorization;
      const cookieHeader = req.headers.cookie;

      let token: string | undefined;

      if (authHeader?.startsWith('Bearer ')) {
        token = authHeader.slice(7);
      } else if (cookieHeader) {
        // Parse session token from cookies.
        // Neon Auth uses __Secure-neonauth.session_token (production, HTTPS)
        // or neonauth.session_token (localhost, HTTP).
        const match = cookieHeader.match(
          /(?:__Secure-neonauth\.session_token|neonauth\.session_token)=([^;]+)/
        );
        token = match?.[1];
      }

      if (!token) {
        return reply.status(401).send({
          error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
        });
      }

      // ── JWT path: verify locally via JWKS (no HTTP roundtrip) ───────
      // A JWT has 3 dot-separated parts. Session tokens are opaque strings.
      if (jwtVerifier && token.split('.').length === 3) {
        const payload = await jwtVerifier.verify(token);

        if (!payload || !payload.sub) {
          return reply.status(401).send({
            error: { code: 'INVALID_TOKEN', message: 'Invalid or expired JWT' },
          });
        }

        if (payload.banned) {
          return reply.status(403).send({
            error: { code: 'BANNED', message: 'User account is banned' },
          });
        }

        const tenantId = req.tenantContext?.tenantId ?? '';
        const orgRoles: string[] = typeof payload.role === 'string' ? [payload.role] : [];

        const roles =
          config.NODE_ENV === 'development'
            ? [createWildcardRole('admin')]
            : orgRoles.length > 0
              ? orgRoles.map((roleName) => createRoleFromOrgRole(roleName))
              : [createMinimalRole('authenticated')];

        req.authUser = {
          userId: payload.sub,
          tenantId,
          roles,
          orgRoles,
        };

        return;
      }

      // ── Session path: validate via Neon Auth API roundtrip ──────────
      try {
        // Validate session with Neon Auth API
        const resp = await fetch(`${neonAuthBaseUrl}/api/auth/get-session`, {
          headers: {
            cookie: `neonauth.session_token=${token}`,
          },
        });

        if (!resp.ok) {
          return reply.status(401).send({
            error: { code: 'INVALID_SESSION', message: 'Invalid or expired session' },
          });
        }

        const session = (await resp.json()) as {
          user: { id: string };
          session: { activeOrganizationId?: string; token: string };
        };

        if (!session?.user) {
          return reply.status(401).send({
            error: { code: 'INVALID_SESSION', message: 'Invalid or expired session' },
          });
        }

        const tenantId = session.session.activeOrganizationId ?? '';

        // Ensure session tenant matches header tenant (defense in depth)
        if (req.tenantContext && req.tenantContext.tenantId !== tenantId && tenantId) {
          return reply.status(403).send({
            error: {
              code: 'TENANT_MISMATCH',
              message: 'Session tenant does not match x-tenant-id',
            },
          });
        }

        // Default to admin in dev if no org roles resolved yet
        const orgRoles: string[] = config.NODE_ENV === 'development' ? ['admin'] : [];

        const roles =
          orgRoles.length > 0
            ? orgRoles.map((roleName) => createRoleFromOrgRole(roleName))
            : [createMinimalRole('authenticated')];

        req.authUser = {
          userId: session.user.id,
          tenantId,
          roles,
          orgRoles,
        };

        // Sync tenantContext with session claims
        if (tenantId) {
          req.tenantContext = { tenantId, userId: session.user.id };
        }
      } catch {
        return reply.status(401).send({
          error: { code: 'AUTH_ERROR', message: 'Authentication verification failed' },
        });
      }
    });
  };
}

// ─── Role Helpers ─────────────────────────────────────────────────────────────

const ALL_ACTIONS = ['create', 'read', 'update', 'delete', 'post', 'void', 'reverse'] as const;

/**
 * Map a Neon Auth organization role name to an RBAC Role object.
 * Owner/admin get wildcard; others get mapped permissions.
 */
function createRoleFromOrgRole(roleName: string): Role {
  switch (roleName) {
    case 'owner':
    case 'admin':
      return createWildcardRole(roleName);
    case 'accountant':
      return {
        name: 'accountant',
        permissions: [
          ...ALL_ACTIONS.filter((a) => a !== 'delete').map((action) => ({
            resource: 'journal',
            action,
          })),
          { resource: 'account', action: 'read' as const },
          { resource: 'apInvoice', action: 'create' as const },
          { resource: 'apInvoice', action: 'read' as const },
          { resource: 'apInvoice', action: 'update' as const },
          { resource: 'apInvoice', action: 'post' as const },
          { resource: 'apInvoice', action: 'void' as const },
          { resource: 'arInvoice', action: 'create' as const },
          { resource: 'arInvoice', action: 'read' as const },
          { resource: 'arInvoice', action: 'update' as const },
          { resource: 'arInvoice', action: 'post' as const },
          { resource: 'arInvoice', action: 'void' as const },
          { resource: 'payment', action: 'create' as const },
          { resource: 'payment', action: 'read' as const },
          { resource: 'payment', action: 'post' as const },
          { resource: 'trialBalance', action: 'read' as const },
          { resource: 'financialReport', action: 'read' as const },
          { resource: 'auditLog', action: 'read' as const },
        ],
      };
    case 'clerk':
      return {
        name: 'clerk',
        permissions: [
          { resource: 'journal', action: 'create' as const },
          { resource: 'journal', action: 'read' as const },
          { resource: 'journal', action: 'update' as const },
          { resource: 'account', action: 'read' as const },
          { resource: 'apInvoice', action: 'create' as const },
          { resource: 'apInvoice', action: 'read' as const },
          { resource: 'apInvoice', action: 'update' as const },
          { resource: 'arInvoice', action: 'create' as const },
          { resource: 'arInvoice', action: 'read' as const },
          { resource: 'arInvoice', action: 'update' as const },
          { resource: 'trialBalance', action: 'read' as const },
          { resource: 'financialReport', action: 'read' as const },
        ],
      };
    case 'viewer':
    case 'member':
      return createReadOnlyRole(roleName);
    default:
      return createReadOnlyRole(roleName);
  }
}

/**
 * Create a role with wildcard permissions (owner/admin).
 */
function createWildcardRole(name: string): Role {
  return {
    name,
    permissions: ALL_ACTIONS.map((action) => ({ resource: '*', action })),
  };
}

/**
 * Create a role with read-only permissions across all resources.
 */
function createReadOnlyRole(name: string): Role {
  const resources = [
    'journal',
    'account',
    'fiscalPeriod',
    'trialBalance',
    'financialReport',
    'budget',
    'apInvoice',
    'arInvoice',
    'payment',
    'icTransfer',
    'company',
    'settings',
    'auditLog',
  ];
  return {
    name,
    permissions: resources.map((resource) => ({ resource, action: 'read' as const })),
  };
}

/**
 * Minimal role for authenticated users with no org membership.
 */
function createMinimalRole(name: string): Role {
  return {
    name,
    permissions: [{ resource: 'settings', action: 'read' as const }],
  };
}
