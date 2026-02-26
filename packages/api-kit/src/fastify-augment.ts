/**
 * Fastify module augmentation — adds `authUser` to FastifyRequest.
 *
 * This is the canonical type declaration. Any package that imports from
 * @afenda/api-kit gets this augmentation automatically.
 *
 * Note: `roles` uses `readonly string[]` here to avoid coupling api-kit
 * to @afenda/authz. The auth middleware populates it with Role values;
 * consumers that need typed roles should cast or import Role separately.
 */
declare module 'fastify' {
  interface FastifyRequest {
    authUser?: {
      userId: string;
      tenantId: string;
      roles: readonly string[];
      orgRoles: readonly string[];
    };
  }
}
