import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { createHmac, timingSafeEqual } from "node:crypto";
import type { AppConfig } from "@afenda/platform";
import type { Role } from "@afenda/authz";

interface JwtPayload {
  sub: string;
  tid: string;
  roles?: string[];
  iat?: number;
  exp?: number;
}

declare module "fastify" {
  interface FastifyRequest {
    authUser: {
      userId: string;
      tenantId: string;
      roles: readonly Role[];
    };
  }
}

/**
 * Lightweight HMAC-SHA256 JWT verification (no external deps).
 *
 * In production with JWKS (e.g. Neon Auth), replace with jose/jwks.
 * For dev mode without JWT_SECRET, falls back to x-tenant-id / x-user-id headers.
 */
export function authPlugin(config: AppConfig) {
  return async function plugin(app: FastifyInstance): Promise<void> {
    app.decorateRequest("authUser", undefined as never);

    app.addHook("preHandler", async (req: FastifyRequest, reply: FastifyReply) => {
      // Skip health endpoints
      if (req.url.startsWith("/health")) return;

      // Dev mode: no JWT_SECRET configured — trust headers (already validated by tenant-context plugin)
      if (!config.JWT_SECRET) {
        const ctx = req.tenantContext;
        if (ctx) {
          req.authUser = {
            userId: ctx.userId,
            tenantId: ctx.tenantId,
            roles: [{ name: "admin", permissions: [{ resource: "*", action: "create" as const }, { resource: "*", action: "read" as const }, { resource: "*", action: "update" as const }, { resource: "*", action: "delete" as const }, { resource: "*", action: "post" as const }, { resource: "*", action: "void" as const }, { resource: "*", action: "reverse" as const }] }],
          };
        }
        return;
      }

      // Production mode: verify JWT
      const authHeader = req.headers.authorization;
      if (!authHeader?.startsWith("Bearer ")) {
        return reply.status(401).send({
          error: { code: "UNAUTHORIZED", message: "Authorization: Bearer <token> required" },
        });
      }

      const token = authHeader.slice(7);
      const payload = verifyHmacJwt(token, config.JWT_SECRET);
      if (!payload) {
        return reply.status(401).send({
          error: { code: "INVALID_TOKEN", message: "Invalid or expired JWT" },
        });
      }

      // Ensure JWT tenant matches header tenant (defense in depth)
      if (req.tenantContext && req.tenantContext.tenantId !== payload.tid) {
        return reply.status(403).send({
          error: { code: "TENANT_MISMATCH", message: "JWT tenant does not match x-tenant-id" },
        });
      }

      req.authUser = {
        userId: payload.sub,
        tenantId: payload.tid,
        roles: (payload.roles ?? ["admin"]).map((name) => ({
          name,
          permissions: [
            { resource: "*", action: "create" as const },
            { resource: "*", action: "read" as const },
            { resource: "*", action: "update" as const },
            { resource: "*", action: "delete" as const },
            { resource: "*", action: "post" as const },
            { resource: "*", action: "void" as const },
            { resource: "*", action: "reverse" as const },
          ],
        })),
      };

      // Sync tenantContext with JWT claims
      req.tenantContext = { tenantId: payload.tid, userId: payload.sub };
    });
  };
}

function verifyHmacJwt(token: string, secret: string): JwtPayload | null {
  const parts = token.split(".");
  if (parts.length !== 3) return null;

  const [headerB64, payloadB64, signatureB64] = parts;
  const expected = createHmac("sha256", secret)
    .update(`${headerB64}.${payloadB64}`)
    .digest("base64url");

  const sigBuf = Buffer.from(signatureB64!, "base64url");
  const expBuf = Buffer.from(expected, "base64url");
  if (sigBuf.length !== expBuf.length || !timingSafeEqual(sigBuf, expBuf)) {
    return null;
  }

  try {
    const payload = JSON.parse(
      Buffer.from(payloadB64!, "base64url").toString("utf8"),
    ) as JwtPayload;

    // Check expiry
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
      return null;
    }

    if (!payload.sub || !payload.tid) return null;
    return payload;
  } catch {
    return null;
  }
}
