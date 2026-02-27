import type { DbClient } from '@afenda/db';
import { tenants, adminUsers, adminActionLogs, users, auditLogs } from '@afenda/db';
import { eq, sql, like, and, desc } from 'drizzle-orm';

// ─── Admin User Check ────────────────────────────────────────────────────────

/**
 * Check if a user is a platform admin. Returns scope or null.
 */
export async function getAdminUser(
  db: DbClient,
  userId: string
): Promise<{ scope: string } | null> {
  const [row] = await db
    .select({ scope: adminUsers.scope, isActive: adminUsers.isActive })
    .from(adminUsers)
    .where(eq(adminUsers.userId, userId))
    .limit(1);

  if (!row || !row.isActive) return null;
  return { scope: row.scope };
}

// ─── Tenant Management ───────────────────────────────────────────────────────

export interface TenantListResult {
  data: Array<{
    id: string;
    name: string;
    slug: string;
    status: string;
    planTier: string;
    createdAt: Date;
  }>;
  total: number;
}

export async function listTenants(
  db: DbClient,
  opts: { page: number; limit: number; status?: string; search?: string }
): Promise<TenantListResult> {
  const conditions = [];
  if (opts.status) {
    conditions.push(eq(tenants.status, opts.status as 'ACTIVE' | 'SUSPENDED' | 'DEACTIVATED'));
  }
  if (opts.search) {
    conditions.push(like(tenants.name, `%${opts.search}%`));
  }

  const where = conditions.length > 0 ? and(...conditions) : undefined;
  const offset = (opts.page - 1) * opts.limit;

  const [rows, countResult] = await Promise.all([
    db
      .select({
        id: tenants.id,
        name: tenants.name,
        slug: tenants.slug,
        status: tenants.status,
        planTier: tenants.planTier,
        createdAt: tenants.createdAt,
      })
      .from(tenants)
      .where(where)
      .orderBy(desc(tenants.createdAt))
      .limit(opts.limit)
      .offset(offset),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(tenants)
      .where(where),
  ]);

  return { data: rows, total: countResult[0]?.count ?? 0 };
}

export async function suspendTenant(
  db: DbClient,
  tenantId: string
): Promise<void> {
  await db
    .update(tenants)
    .set({ status: 'SUSPENDED', updatedAt: sql`now()` })
    .where(eq(tenants.id, tenantId));
}

export async function reactivateTenant(
  db: DbClient,
  tenantId: string
): Promise<void> {
  await db
    .update(tenants)
    .set({ status: 'ACTIVE', updatedAt: sql`now()` })
    .where(eq(tenants.id, tenantId));
}

export async function setPlanTier(
  db: DbClient,
  tenantId: string,
  tier: string
): Promise<void> {
  await db
    .update(tenants)
    .set({ planTier: tier, updatedAt: sql`now()` })
    .where(eq(tenants.id, tenantId));
}

// ─── Admin Action Log ────────────────────────────────────────────────────────

export async function logAdminAction(
  db: DbClient,
  entry: {
    adminUserId: string;
    action: string;
    targetTenantId?: string;
    targetUserId?: string;
    details?: Record<string, unknown>;
    requestId?: string;
  }
): Promise<void> {
  await db.insert(adminActionLogs).values({
    adminUserId: entry.adminUserId,
    action: entry.action,
    targetTenantId: entry.targetTenantId ?? null,
    targetUserId: entry.targetUserId ?? null,
    details: entry.details ?? null,
    requestId: entry.requestId ?? null,
  });
}

export async function getAdminActionLog(
  db: DbClient,
  opts: { page: number; limit: number }
): Promise<{
  data: Array<{
    id: string;
    adminUserId: string;
    action: string;
    targetTenantId: string | null;
    targetUserId: string | null;
    details: unknown;
    occurredAt: Date;
  }>;
  total: number;
}> {
  const offset = (opts.page - 1) * opts.limit;

  const [rows, countResult] = await Promise.all([
    db
      .select({
        id: adminActionLogs.id,
        adminUserId: adminActionLogs.adminUserId,
        action: adminActionLogs.action,
        targetTenantId: adminActionLogs.targetTenantId,
        targetUserId: adminActionLogs.targetUserId,
        details: adminActionLogs.details,
        occurredAt: adminActionLogs.occurredAt,
      })
      .from(adminActionLogs)
      .orderBy(desc(adminActionLogs.occurredAt))
      .limit(opts.limit)
      .offset(offset),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(adminActionLogs),
  ]);

  return { data: rows, total: countResult[0]?.count ?? 0 };
}

// ─── Tenant Detail ──────────────────────────────────────────────────────────

export async function getTenantDetail(
  db: DbClient,
  tenantId: string
): Promise<{
  id: string;
  name: string;
  slug: string;
  status: string;
  planTier: string;
  displayName: string | null;
  logoUrl: string | null;
  settingsVersion: number;
  createdAt: Date;
  updatedAt: Date;
} | null> {
  const [row] = await db
    .select({
      id: tenants.id,
      name: tenants.name,
      slug: tenants.slug,
      status: tenants.status,
      planTier: tenants.planTier,
      displayName: tenants.displayName,
      logoUrl: tenants.logoUrl,
      settingsVersion: tenants.settingsVersion,
      createdAt: tenants.createdAt,
      updatedAt: tenants.updatedAt,
    })
    .from(tenants)
    .where(eq(tenants.id, tenantId))
    .limit(1);

  return row ?? null;
}

// ─── Cross-Tenant User Management ──────────────────────────────────────────

export interface UserListResult {
  data: Array<{
    id: string;
    tenantId: string;
    email: string;
    displayName: string;
    isActive: boolean;
    createdAt: Date;
  }>;
  total: number;
}

export async function listUsers(
  db: DbClient,
  opts: { page: number; limit: number; search?: string; tenantId?: string }
): Promise<UserListResult> {
  const conditions = [];
  if (opts.tenantId) {
    conditions.push(eq(users.tenantId, opts.tenantId));
  }
  if (opts.search) {
    conditions.push(like(users.email, `%${opts.search}%`));
  }

  const where = conditions.length > 0 ? and(...conditions) : undefined;
  const offset = (opts.page - 1) * opts.limit;

  const [rows, countResult] = await Promise.all([
    db
      .select({
        id: users.id,
        tenantId: users.tenantId,
        email: users.email,
        displayName: users.displayName,
        isActive: users.isActive,
        createdAt: users.createdAt,
      })
      .from(users)
      .where(where)
      .orderBy(desc(users.createdAt))
      .limit(opts.limit)
      .offset(offset),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(users)
      .where(where),
  ]);

  return { data: rows, total: countResult[0]?.count ?? 0 };
}

export async function banUser(
  db: DbClient,
  userId: string
): Promise<void> {
  await db
    .update(users)
    .set({ isActive: false, updatedAt: sql`now()` })
    .where(eq(users.id, userId));
}

export async function unbanUser(
  db: DbClient,
  userId: string
): Promise<void> {
  await db
    .update(users)
    .set({ isActive: true, updatedAt: sql`now()` })
    .where(eq(users.id, userId));
}

// ─── Cross-Tenant Audit Log ────────────────────────────────────────────────

export async function getCrossTenantAuditLog(
  db: DbClient,
  opts: { page: number; limit: number; tenantId?: string; action?: string }
): Promise<{
  data: Array<{
    id: string;
    tenantId: string;
    userId: string | null;
    action: string;
    tableName: string;
    recordId: string | null;
    occurredAt: Date;
  }>;
  total: number;
}> {
  const conditions = [];
  if (opts.tenantId) conditions.push(eq(auditLogs.tenantId, opts.tenantId));
  if (opts.action) conditions.push(eq(auditLogs.action, opts.action));

  const where = conditions.length > 0 ? and(...conditions) : undefined;
  const offset = (opts.page - 1) * opts.limit;

  const [rows, countResult] = await Promise.all([
    db
      .select({
        id: auditLogs.id,
        tenantId: auditLogs.tenantId,
        userId: auditLogs.userId,
        action: auditLogs.action,
        tableName: auditLogs.tableName,
        recordId: auditLogs.recordId,
        occurredAt: auditLogs.occurredAt,
      })
      .from(auditLogs)
      .where(where)
      .orderBy(desc(auditLogs.occurredAt))
      .limit(opts.limit)
      .offset(offset),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(auditLogs)
      .where(where),
  ]);

  return { data: rows, total: countResult[0]?.count ?? 0 };
}
