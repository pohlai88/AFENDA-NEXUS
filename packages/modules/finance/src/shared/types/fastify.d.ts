/**
 * Fastify request augmentation for the finance module.
 *
 * Centralises the `authUser` and `tenantContext` shapes so that guards,
 * routes, and plugins can access them without unsafe double-casts.
 *
 * The auth middleware in apps/api decorates these on every request;
 * they are optional here because unit-test Fastify instances don't
 * register the auth plugin.
 */
import type { Role } from '@afenda/authz';

declare module 'fastify' {
  interface FastifyRequest {
    authUser?: {
      userId: string;
      tenantId: string;
      roles: readonly Role[];
      orgRoles: readonly string[];
    };
    tenantContext?: { tenantId: string; userId: string };
    correlationId?: string;
  }
}
