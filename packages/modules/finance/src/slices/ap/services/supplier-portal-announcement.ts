/**
 * Phase 1.2.3: Dashboard Announcements service (CAP-ANNOUNCE P24).
 *
 * Buyer admin creates tenant-scoped announcements displayed in the supplier
 * portal. Pinned announcements appear as persistent banners across all pages;
 * non-pinned appear on the dashboard only.
 *
 * Severity levels control visual treatment:
 *   INFO     → blue informational banner
 *   WARNING  → amber attention banner
 *   CRITICAL → red urgent banner (outages, deadlines)
 *
 * Announcements are soft-deleted (archivedAt) not hard-deleted so audit
 * history is preserved.
 *
 * SP-5010: Announcement service + IAnnouncementRepo port
 */
import type { Result } from '@afenda/core';
import { ok, err, AppError, ValidationError, NotFoundError } from '@afenda/core';

// ─── Domain Types ────────────────────────────────────────────────────────────

export type AnnouncementSeverity = 'INFO' | 'WARNING' | 'CRITICAL';

export interface Announcement {
  readonly id: string;
  readonly tenantId: string;
  readonly title: string;
  readonly body: string;
  readonly severity: AnnouncementSeverity;
  readonly pinned: boolean;
  readonly validFrom: Date;
  readonly validUntil: Date | null;
  readonly createdBy: string;
  readonly archivedAt: Date | null;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export interface CreateAnnouncementInput {
  readonly id: string;
  readonly tenantId: string;
  readonly title: string;
  readonly body: string;
  readonly severity: AnnouncementSeverity;
  readonly pinned: boolean;
  readonly validFrom: Date;
  readonly validUntil: Date | null;
  readonly createdBy: string;
}

export interface UpdateAnnouncementPatch {
  readonly title?: string;
  readonly body?: string;
  readonly severity?: AnnouncementSeverity;
  readonly pinned?: boolean;
  readonly validFrom?: Date;
  readonly validUntil?: Date | null;
}

// ─── Repository Port ─────────────────────────────────────────────────────────

export interface IAnnouncementRepo {
  /**
   * Returns all currently active announcements for a tenant.
   * Active = not archived + within validity window.
   * Ordered: pinned first, then by createdAt DESC.
   */
  listActive(tenantId: string): Promise<Announcement[]>;

  /**
   * Returns all announcements for a tenant (including archived),
   * with optional filtering. For buyer admin management.
   */
  listAll(
    tenantId: string,
    opts?: {
      pinned?: boolean;
      severity?: AnnouncementSeverity;
      includeArchived?: boolean;
      page?: number;
      limit?: number;
    }
  ): Promise<{ items: Announcement[]; total: number }>;

  findById(tenantId: string, id: string): Promise<Announcement | null>;

  create(input: CreateAnnouncementInput): Promise<Announcement>;

  update(tenantId: string, id: string, patch: UpdateAnnouncementPatch): Promise<Announcement>;

  /** Soft-delete by setting archivedAt. */
  archive(tenantId: string, id: string): Promise<void>;
}

// ─── Input / Deps types ──────────────────────────────────────────────────────

export interface ListAnnouncementsInput {
  readonly tenantId: string;
  readonly pinned?: boolean;
  readonly severity?: AnnouncementSeverity;
  readonly includeArchived?: boolean;
  readonly page?: number;
  readonly limit?: number;
}

export interface GetActiveAnnouncementsInput {
  readonly tenantId: string;
}

export interface CreateAnnouncementRequest {
  readonly tenantId: string;
  readonly createdBy: string;
  readonly title: string;
  readonly body: string;
  readonly severity?: AnnouncementSeverity;
  readonly pinned?: boolean;
  readonly validFrom?: Date;
  readonly validUntil?: Date | null;
}

export interface UpdateAnnouncementRequest {
  readonly tenantId: string;
  readonly announcementId: string;
  readonly updatedBy: string;
  readonly patch: UpdateAnnouncementPatch;
}

export interface ArchiveAnnouncementRequest {
  readonly tenantId: string;
  readonly announcementId: string;
  readonly archivedBy: string;
}

export interface AnnouncementDeps {
  readonly announcementRepo: IAnnouncementRepo;
}

// ─── Domain Functions ─────────────────────────────────────────────────────────

/**
 * SP-5010-01: List active announcements for supplier view.
 * Returns currently active announcements (within validity window, not archived).
 * Pinned announcements appear first.
 */
export async function getActiveAnnouncements(
  input: GetActiveAnnouncementsInput,
  deps: AnnouncementDeps
): Promise<Result<Announcement[]>> {
  try {
    const items = await deps.announcementRepo.listActive(input.tenantId);
    return ok(items);
  } catch (e) {
    return err(new AppError('INTERNAL_ERROR', 'Failed to fetch announcements', e));
  }
}

/**
 * SP-5010-02: List all announcements for buyer admin management.
 */
export async function listAllAnnouncements(
  input: ListAnnouncementsInput,
  deps: AnnouncementDeps
): Promise<
  Result<{ items: Announcement[]; total: number; page: number; limit: number; hasMore: boolean }>
> {
  try {
    const page = input.page ?? 1;
    const limit = input.limit ?? 20;
    const { items, total } = await deps.announcementRepo.listAll(input.tenantId, {
      pinned: input.pinned,
      severity: input.severity,
      includeArchived: input.includeArchived ?? false,
      page,
      limit,
    });
    return ok({ items, total, page, limit, hasMore: page * limit < total });
  } catch (e) {
    return err(new AppError('INTERNAL_ERROR', 'Failed to list announcements', e));
  }
}

/**
 * SP-5010-03: Create a new announcement (buyer admin).
 */
export async function createAnnouncement(
  input: CreateAnnouncementRequest,
  deps: AnnouncementDeps
): Promise<Result<Announcement>> {
  const { title, body } = input;
  if (!title.trim()) return err(new ValidationError('Title is required'));
  if (!body.trim()) return err(new ValidationError('Body is required'));
  if (title.length > 120) return err(new ValidationError('Title must be at most 120 characters'));
  if (body.length > 10000) return err(new ValidationError('Body must be at most 10000 characters'));

  const validFrom = input.validFrom ?? new Date();
  if (input.validUntil && input.validUntil <= validFrom) {
    return err(new ValidationError('validUntil must be after validFrom'));
  }

  try {
    const announcement = await deps.announcementRepo.create({
      id: crypto.randomUUID(),
      tenantId: input.tenantId,
      title: title.trim(),
      body: body.trim(),
      severity: input.severity ?? 'INFO',
      pinned: input.pinned ?? false,
      validFrom,
      validUntil: input.validUntil ?? null,
      createdBy: input.createdBy,
    });
    return ok(announcement);
  } catch (e) {
    return err(new AppError('INTERNAL_ERROR', 'Failed to create announcement', e));
  }
}

/**
 * SP-5010-04: Update an announcement (buyer admin).
 */
export async function updateAnnouncement(
  input: UpdateAnnouncementRequest,
  deps: AnnouncementDeps
): Promise<Result<Announcement>> {
  const existing = await deps.announcementRepo.findById(input.tenantId, input.announcementId);
  if (!existing) return err(new NotFoundError('Announcement', input.announcementId));
  if (existing.archivedAt)
    return err(new AppError('CONFLICT', 'Cannot update an archived announcement'));

  const { patch } = input;
  if (patch.title !== undefined && patch.title.length > 120) {
    return err(new ValidationError('Title must be at most 120 characters'));
  }
  if (patch.body !== undefined && patch.body.length > 10000) {
    return err(new ValidationError('Body must be at most 10000 characters'));
  }

  const newValidFrom = patch.validFrom ?? existing.validFrom;
  const newValidUntil = patch.validUntil !== undefined ? patch.validUntil : existing.validUntil;
  if (newValidUntil && newValidUntil <= newValidFrom) {
    return err(new ValidationError('validUntil must be after validFrom'));
  }

  try {
    const updated = await deps.announcementRepo.update(input.tenantId, input.announcementId, patch);
    return ok(updated);
  } catch (e) {
    return err(new AppError('INTERNAL_ERROR', 'Failed to update announcement', e));
  }
}

/**
 * SP-5010-05: Archive (soft-delete) an announcement (buyer admin).
 */
export async function archiveAnnouncement(
  input: ArchiveAnnouncementRequest,
  deps: AnnouncementDeps
): Promise<Result<void>> {
  const existing = await deps.announcementRepo.findById(input.tenantId, input.announcementId);
  if (!existing) return err(new NotFoundError('Announcement', input.announcementId));
  if (existing.archivedAt) return err(new AppError('CONFLICT', 'Announcement is already archived'));

  try {
    await deps.announcementRepo.archive(input.tenantId, input.announcementId);
    return ok(undefined);
  } catch (e) {
    return err(new AppError('INTERNAL_ERROR', 'Failed to archive announcement', e));
  }
}
