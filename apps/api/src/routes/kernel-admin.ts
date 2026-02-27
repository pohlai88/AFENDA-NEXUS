import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import type { KernelDeps } from '../services/kernel/types.js';
import {
  getAdminUser,
  listTenants,
  getTenantDetail,
  suspendTenant,
  reactivateTenant,
  setPlanTier,
  logAdminAction,
  getAdminActionLog,
  listUsers,
  banUser,
  unbanUser,
  getCrossTenantAuditLog,
} from '../services/kernel/admin.service.js';
import {
  getSystemConfig,
  listSystemConfig,
  setSystemConfig,
  bustSystemConfigCache,
} from '../services/kernel/system-config.service.js';
import { bustFeatureFlagsCache } from '../services/kernel/feature-flags.js';

/**
 * Platform admin routes. All guarded by super-admin check (I-KRN-07).
 * Every mutation is double-logged to admin_action_log.
 */
export function registerKernelAdminRoutes(app: FastifyInstance, deps: KernelDeps) {
  const { db } = deps;

  // ─── Super-admin guard (preHandler) ────────────────────────────────────
  const requireAdmin = async (req: FastifyRequest, reply: FastifyReply) => {
    const user = req.authUser;
    if (!user?.userId) {
      return reply.status(401).send({ error: { code: 'UNAUTHORIZED' } });
    }
    const admin = await getAdminUser(db, user.userId);
    if (!admin) {
      return reply.status(403).send({ error: { code: 'FORBIDDEN', message: 'Platform admin required' } });
    }
  };

  // ─── System Config ─────────────────────────────────────────────────────

  app.get('/admin/config', { preHandler: [requireAdmin] }, async () => {
    return listSystemConfig(db);
  });

  app.get<{ Params: { key: string } }>(
    '/admin/config/:key',
    { preHandler: [requireAdmin] },
    async (req) => {
      return getSystemConfig(db, req.params.key);
    }
  );

  app.put<{ Params: { key: string } }>(
    '/admin/config/:key',
    { preHandler: [requireAdmin] },
    async (req) => {
      const user = req.authUser!;
      const value = req.body as Record<string, unknown>;

      await setSystemConfig(db, req.params.key, value, user.userId);

      // Bust caches on config write
      bustSystemConfigCache(req.params.key);
      // I-KRN-09: also bust feature flags cache when feature_flags key is updated
      if (req.params.key === 'feature_flags') {
        bustFeatureFlagsCache();
      }

      await logAdminAction(db, {
        adminUserId: user.userId,
        action: 'system_config.set',
        details: { key: req.params.key, value },
        requestId: req.id,
      });

      return { ok: true };
    }
  );

  // ─── Tenant Management ─────────────────────────────────────────────────

  app.get('/admin/tenants', { preHandler: [requireAdmin] }, async (req) => {
    const query = req.query as { page?: string; limit?: string; status?: string; search?: string };
    return listTenants(db, {
      page: Number(query.page) || 1,
      limit: Math.min(Number(query.limit) || 20, 100),
      status: query.status,
      search: query.search,
    });
  });

  app.post<{ Params: { id: string } }>(
    '/admin/tenants/:id/suspend',
    { preHandler: [requireAdmin] },
    async (req) => {
      const user = req.authUser!;
      const reason = (req.body as { reason?: string })?.reason;

      await suspendTenant(db, req.params.id);
      await logAdminAction(db, {
        adminUserId: user.userId,
        action: 'tenant.suspend',
        targetTenantId: req.params.id,
        details: { reason },
        requestId: req.id,
      });

      return { ok: true };
    }
  );

  app.post<{ Params: { id: string } }>(
    '/admin/tenants/:id/reactivate',
    { preHandler: [requireAdmin] },
    async (req) => {
      const user = req.authUser!;

      await reactivateTenant(db, req.params.id);
      await logAdminAction(db, {
        adminUserId: user.userId,
        action: 'tenant.reactivate',
        targetTenantId: req.params.id,
        requestId: req.id,
      });

      return { ok: true };
    }
  );

  app.post<{ Params: { id: string } }>(
    '/admin/tenants/:id/plan',
    { preHandler: [requireAdmin] },
    async (req) => {
      const user = req.authUser!;
      const { tier } = req.body as { tier: string };

      await setPlanTier(db, req.params.id, tier);
      await logAdminAction(db, {
        adminUserId: user.userId,
        action: 'tenant.set_plan_tier',
        targetTenantId: req.params.id,
        details: { tier },
        requestId: req.id,
      });

      return { ok: true };
    }
  );

  // ─── Admin Action Log ──────────────────────────────────────────────────

  app.get('/admin/actions', { preHandler: [requireAdmin] }, async (req) => {
    const query = req.query as { page?: string; limit?: string };
    return getAdminActionLog(db, {
      page: Number(query.page) || 1,
      limit: Math.min(Number(query.limit) || 20, 100),
    });
  });

  // ─── Tenant Detail ──────────────────────────────────────────────────────

  app.get<{ Params: { id: string } }>(
    '/admin/tenants/:id',
    { preHandler: [requireAdmin] },
    async (req, reply) => {
      const tenant = await getTenantDetail(db, req.params.id);
      if (!tenant) {
        return reply.status(404).send({ error: { code: 'NOT_FOUND', message: 'Tenant not found' } });
      }
      return tenant;
    }
  );

  // ─── Cross-Tenant User Management ───────────────────────────────────────

  app.get('/admin/users', { preHandler: [requireAdmin] }, async (req) => {
    const query = req.query as { page?: string; limit?: string; search?: string; tenantId?: string };
    return listUsers(db, {
      page: Number(query.page) || 1,
      limit: Math.min(Number(query.limit) || 20, 100),
      search: query.search,
      tenantId: query.tenantId,
    });
  });

  app.post<{ Params: { id: string } }>(
    '/admin/users/:id/ban',
    { preHandler: [requireAdmin] },
    async (req) => {
      const user = req.authUser!;
      const reason = (req.body as { reason?: string })?.reason;

      await banUser(db, req.params.id);
      await logAdminAction(db, {
        adminUserId: user.userId,
        action: 'user.ban',
        targetUserId: req.params.id,
        details: { reason },
        requestId: req.id,
      });

      return { ok: true };
    }
  );

  app.post<{ Params: { id: string } }>(
    '/admin/users/:id/unban',
    { preHandler: [requireAdmin] },
    async (req) => {
      const user = req.authUser!;

      await unbanUser(db, req.params.id);
      await logAdminAction(db, {
        adminUserId: user.userId,
        action: 'user.unban',
        targetUserId: req.params.id,
        requestId: req.id,
      });

      return { ok: true };
    }
  );

  // ─── Cross-Tenant Audit Log ─────────────────────────────────────────────

  app.get('/admin/audit', { preHandler: [requireAdmin] }, async (req) => {
    const query = req.query as { page?: string; limit?: string; tenantId?: string; action?: string };
    return getCrossTenantAuditLog(db, {
      page: Number(query.page) || 1,
      limit: Math.min(Number(query.limit) || 20, 100),
      tenantId: query.tenantId,
      action: query.action,
    });
  });
}
