import type { FastifyInstance } from 'fastify';
import { getOrgSettings, updateOrgSettings } from '../services/kernel/org-settings.service.js';
import { getUserPreferences, updateUserPreferences } from '../services/kernel/user-preferences.service.js';
import { getAuditLog } from '../services/kernel/audit-log.service.js';
import type { KernelDeps } from '../services/kernel/types.js';

/**
 * Kernel settings, preferences, and audit log routes.
 *
 * GET/PATCH /settings/org — tenant settings (owner/admin)
 * GET/PATCH /me/preferences — user preferences (any authenticated user)
 * GET /audit-log — tenant-scoped audit log (any authenticated user)
 */
export function registerKernelSettingsRoutes(app: FastifyInstance, deps: KernelDeps) {
  const { db } = deps;
  // ─── Org Settings ──────────────────────────────────────────────────────

  app.get('/settings/org', async (req, reply) => {
    const user = req.authUser;
    if (!user?.tenantId) return reply.status(401).send({ error: { code: 'UNAUTHORIZED' } });

    const settings = await getOrgSettings(db, user.tenantId);
    return settings;
  });

  app.patch('/settings/org', async (req, reply) => {
    const user = req.authUser;
    if (!user?.tenantId) return reply.status(401).send({ error: { code: 'UNAUTHORIZED' } });

    // Guard: only owner/admin can update settings
    const isAdmin = user.orgRoles.some((r) => r === 'owner' || r === 'admin');
    if (!isAdmin) {
      return reply.status(403).send({ error: { code: 'FORBIDDEN', message: 'Owner or admin required' } });
    }

    const { before, after } = await updateOrgSettings(
      db,
      user.tenantId,
      req.body as Record<string, unknown>,
      user.userId
    );

    return { before, after };
  });

  // ─── User Preferences ──────────────────────────────────────────────────

  app.get('/me/preferences', async (req, reply) => {
    const user = req.authUser;
    if (!user?.userId) return reply.status(401).send({ error: { code: 'UNAUTHORIZED' } });

    const preferences = await getUserPreferences(db, user.userId);
    return preferences;
  });

  app.patch('/me/preferences', async (req, reply) => {
    const user = req.authUser;
    if (!user?.userId) return reply.status(401).send({ error: { code: 'UNAUTHORIZED' } });

    const updated = await updateUserPreferences(
      db,
      user.userId,
      req.body as Record<string, unknown>
    );

    return updated;
  });

  // ─── Audit Log (tenant-scoped) ──────────────────────────────────────────

  app.get('/audit-log', async (req, reply) => {
    const user = req.authUser;
    if (!user?.tenantId) return reply.status(401).send({ error: { code: 'UNAUTHORIZED' } });

    const query = req.query as { page?: string; limit?: string; action?: string; tableName?: string };
    return getAuditLog(db, user.tenantId, {
      page: Number(query.page) || 1,
      limit: Math.min(Number(query.limit) || 20, 100),
      action: query.action,
      tableName: query.tableName,
    });
  });
}
