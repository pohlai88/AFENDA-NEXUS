/**
 * JWT verification utility for Neon Auth tokens.
 *
 * Verifies JWTs using the JWKS (JSON Web Key Set) endpoint exposed
 * by Neon Auth at `<NEON_AUTH_BASE_URL>/.well-known/jwks.json`.
 *
 * Neon Auth uses **EdDSA (Ed25519)** for signing. Tokens expire in
 * 15 minutes. There is no support for custom claims at this time.
 *
 * Usage:
 *   const verifier = createJwtVerifier({ jwksUrl, issuer });
 *   const payload  = await verifier.verify(token);
 *
 * @see https://neon.tech/docs/auth/jwt
 */
import { jwtVerify, createRemoteJWKSet, type JWTPayload } from 'jose';

// ─── Types ──────────────────────────────────────────────────────────────────

export interface NeonJwtPayload extends JWTPayload {
  /** User's display name */
  name?: string;
  /** User's email address */
  email?: string;
  /** Whether the user's email has been verified */
  emailVerified?: boolean;
  /** User's avatar URL */
  image?: string | null;
  /** User creation timestamp */
  createdAt?: string;
  /** Last update timestamp */
  updatedAt?: string;
  /** Auth role (e.g., "authenticated") */
  role?: string;
  /** Whether the user is banned */
  banned?: boolean;
  /** Ban reason (if banned) */
  banReason?: string | null;
  /** Ban expiration (if temporary) */
  banExpires?: number | null;
  /** User ID (same as `sub`) */
  id?: string;
}

export interface JwtVerifierOptions {
  /**
   * Full URL to the JWKS endpoint.
   * Defaults to `${NEON_AUTH_BASE_URL}/.well-known/jwks.json`.
   */
  jwksUrl: string;
  /**
   * Expected issuer (origin of the Neon Auth URL).
   * For example: `https://ep-xxx.aws.neon.tech`
   */
  issuer: string;
}

export interface JwtVerifier {
  /**
   * Verify and decode a Neon Auth JWT.
   * Returns the decoded payload on success, `null` on failure.
   */
  verify(token: string): Promise<NeonJwtPayload | null>;
}

// ─── Factory ────────────────────────────────────────────────────────────────

/**
 * Create a reusable JWT verifier backed by a remote JWKS endpoint.
 *
 * The JWKS key set is cached and refreshed automatically by `jose`.
 *
 * @example
 * ```ts
 * const verifier = createJwtVerifier({
 *   jwksUrl: `${process.env.NEON_AUTH_BASE_URL}/.well-known/jwks.json`,
 *   issuer: new URL(process.env.NEON_AUTH_BASE_URL!).origin,
 * });
 *
 * const payload = await verifier.verify(bearerToken);
 * if (!payload) throw new Error('Invalid token');
 * ```
 */
export function createJwtVerifier(options: JwtVerifierOptions): JwtVerifier {
  const JWKS = createRemoteJWKSet(new URL(options.jwksUrl));

  return {
    async verify(token: string): Promise<NeonJwtPayload | null> {
      try {
        const { payload } = await jwtVerify(token, JWKS, {
          issuer: options.issuer,
        });
        return payload as NeonJwtPayload;
      } catch {
        return null;
      }
    },
  };
}

// ─── Convenience ────────────────────────────────────────────────────────────

/**
 * Build verifier options from `NEON_AUTH_BASE_URL` or `JWKS_URL` env vars.
 *
 * Priority:
 * 1. Explicit `JWKS_URL` env var
 * 2. Derived from `NEON_AUTH_BASE_URL` + `/.well-known/jwks.json`
 *
 * Returns `null` if neither env var is set (e.g., local dev without auth).
 */
export function jwtVerifierOptionsFromEnv(
  env: Record<string, string | undefined> = process.env
): JwtVerifierOptions | null {
  const baseUrl = env.NEON_AUTH_BASE_URL;
  const jwksUrl = env.JWKS_URL;

  if (!jwksUrl && !baseUrl) return null;

  const resolvedJwksUrl = jwksUrl ?? `${baseUrl}/.well-known/jwks.json`;
  const issuer = new URL(baseUrl ?? jwksUrl!).origin;

  return { jwksUrl: resolvedJwksUrl, issuer };
}
