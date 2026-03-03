import { and, asc, count, desc, eq, gt, isNull, lte, or } from 'drizzle-orm';
import type { TenantTx } from '@afenda/db';
import { portalAnnouncements } from '@afenda/db';
import type {
  Announcement,
  AnnouncementSeverity,
  CreateAnnouncementInput,
  IAnnouncementRepo,
  UpdateAnnouncementPatch,
} from '../services/supplier-portal-announcement.js';

type AnnouncementRow = typeof portalAnnouncements.$inferSelect;

/**
 * Phase 1.2.3: Announcement Repository (Drizzle implementation).
 * SP-5010: Handles CRUD for erp.portal_announcement.
 */

function mapToDomain(row: AnnouncementRow): Announcement {
  return {
    id: row.id,
    tenantId: row.tenantId,
    title: row.title,
    body: row.body,
    severity: row.severity as AnnouncementSeverity,
    pinned: row.pinned,
    validFrom: row.validFrom,
    validUntil: row.validUntil,
    createdBy: row.createdBy,
    archivedAt: row.archivedAt,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export class DrizzleAnnouncementRepo implements IAnnouncementRepo {
  constructor(private readonly tx: TenantTx) {}

  /** Active = not archived + validFrom <= now + (validUntil is null OR validUntil > now) */
  async listActive(tenantId: string): Promise<Announcement[]> {
    const now = new Date();
    const rows = await this.tx
      .select()
      .from(portalAnnouncements)
      .where(
        and(
          eq(portalAnnouncements.tenantId, tenantId),
          isNull(portalAnnouncements.archivedAt),
          lte(portalAnnouncements.validFrom, now),
          or(isNull(portalAnnouncements.validUntil), gt(portalAnnouncements.validUntil, now))
        )
      )
      // Pinned first, then newest
      .orderBy(desc(portalAnnouncements.pinned), desc(portalAnnouncements.createdAt));

    return rows.map(mapToDomain);
  }

  async listAll(
    tenantId: string,
    opts?: {
      pinned?: boolean;
      severity?: AnnouncementSeverity;
      includeArchived?: boolean;
      page?: number;
      limit?: number;
    }
  ): Promise<{ items: Announcement[]; total: number }> {
    const page = opts?.page ?? 1;
    const limit = opts?.limit ?? 20;
    const offset = (page - 1) * limit;

    const conditions = [eq(portalAnnouncements.tenantId, tenantId)];
    if (!opts?.includeArchived) conditions.push(isNull(portalAnnouncements.archivedAt));
    if (opts?.pinned !== undefined) conditions.push(eq(portalAnnouncements.pinned, opts.pinned));
    if (opts?.severity) conditions.push(eq(portalAnnouncements.severity, opts.severity as any));

    const where = and(...conditions);

    const [rows, [countRow]] = await Promise.all([
      this.tx
        .select()
        .from(portalAnnouncements)
        .where(where)
        .orderBy(desc(portalAnnouncements.pinned), desc(portalAnnouncements.createdAt))
        .limit(limit)
        .offset(offset),
      this.tx.select({ value: count() }).from(portalAnnouncements).where(where),
    ]);

    return { items: rows.map(mapToDomain), total: Number(countRow?.value ?? 0) };
  }

  async findById(tenantId: string, id: string): Promise<Announcement | null> {
    const row = await this.tx.query.portalAnnouncements.findFirst({
      where: and(eq(portalAnnouncements.tenantId, tenantId), eq(portalAnnouncements.id, id)),
    });
    return row ? mapToDomain(row) : null;
  }

  async create(input: CreateAnnouncementInput): Promise<Announcement> {
    const [row] = await this.tx
      .insert(portalAnnouncements)
      .values({
        id: input.id,
        tenantId: input.tenantId,
        title: input.title,
        body: input.body,
        severity: input.severity as any,
        pinned: input.pinned,
        validFrom: input.validFrom,
        validUntil: input.validUntil,
        createdBy: input.createdBy,
      })
      .returning();

    if (!row) throw new Error('Failed to create announcement');
    return mapToDomain(row);
  }

  async update(
    tenantId: string,
    id: string,
    patch: UpdateAnnouncementPatch
  ): Promise<Announcement> {
    const updates: Record<string, unknown> = {
      updatedAt: new Date(),
    };
    if (patch.title !== undefined) updates.title = patch.title;
    if (patch.body !== undefined) updates.body = patch.body;
    if (patch.severity !== undefined) updates.severity = patch.severity;
    if (patch.pinned !== undefined) updates.pinned = patch.pinned;
    if (patch.validFrom !== undefined) updates.validFrom = patch.validFrom;
    if ('validUntil' in patch) updates.validUntil = patch.validUntil;

    const [row] = await this.tx
      .update(portalAnnouncements)
      .set(updates as any)
      .where(and(eq(portalAnnouncements.tenantId, tenantId), eq(portalAnnouncements.id, id)))
      .returning();

    if (!row) throw new Error('Announcement not found for update');
    return mapToDomain(row);
  }

  async archive(tenantId: string, id: string): Promise<void> {
    await this.tx
      .update(portalAnnouncements)
      .set({ archivedAt: new Date(), updatedAt: new Date() } as any)
      .where(and(eq(portalAnnouncements.tenantId, tenantId), eq(portalAnnouncements.id, id)));
  }

  // Alias: needed by drizzle query builder
  async listPinned(tenantId: string): Promise<Announcement[]> {
    const now = new Date();
    const rows = await this.tx
      .select()
      .from(portalAnnouncements)
      .where(
        and(
          eq(portalAnnouncements.tenantId, tenantId),
          eq(portalAnnouncements.pinned, true),
          isNull(portalAnnouncements.archivedAt),
          lte(portalAnnouncements.validFrom, now),
          or(isNull(portalAnnouncements.validUntil), gt(portalAnnouncements.validUntil, now))
        )
      )
      .orderBy(asc(portalAnnouncements.createdAt));

    return rows.map(mapToDomain);
  }
}
