/**
 * Drizzle implementation of IDirectoryRepo (Phase 1.1.6 CAP-DIR)
 */
import type { TenantTx } from '@afenda/db';
import { portalDirectoryEntries } from '@afenda/db';
import { eq, and, asc } from 'drizzle-orm';
import type {
  IDirectoryRepo,
  DirectoryEntry,
  Department,
} from '../services/supplier-portal-directory.js';

export class DrizzleDirectoryRepo implements IDirectoryRepo {
  constructor(private readonly tx: TenantTx) {}

  async findByTenantId(
    tenantId: string,
    query: { department?: Department; escalationOnly?: boolean }
  ): Promise<readonly DirectoryEntry[]> {
    const conditions = [
      eq(portalDirectoryEntries.tenantId, tenantId),
      eq(portalDirectoryEntries.isActive, true),
    ];

    if (query.department) {
      conditions.push(eq(portalDirectoryEntries.department, query.department));
    }

    if (query.escalationOnly) {
      conditions.push(eq(portalDirectoryEntries.isEscalationContact, true));
    }

    const rows = await this.tx
      .select()
      .from(portalDirectoryEntries)
      .where(and(...conditions))
      .orderBy(asc(portalDirectoryEntries.displayOrder), asc(portalDirectoryEntries.fullName));

    return rows.map((row) => this.mapToDomain(row));
  }

  async findById(id: string): Promise<DirectoryEntry | null> {
    const row = await this.tx.query.portalDirectoryEntries.findFirst({
      where: (d, { eq }) => eq(d.id, id),
    });

    return row ? this.mapToDomain(row) : null;
  }

  private mapToDomain(row: typeof portalDirectoryEntries.$inferSelect): DirectoryEntry {
    return {
      id: row.id,
      tenantId: row.tenantId,
      fullName: row.fullName,
      title: row.title,
      department: row.department as Department,
      emailAddress: row.emailAddress,
      showFullEmail: row.showFullEmail,
      phoneNumber: row.phoneNumber,
      showPhone: row.showPhone,
      availability: row.availability,
      timezone: row.timezone,
      bio: row.bio,
      isEscalationContact: row.isEscalationContact,
      displayOrder: row.displayOrder,
      isActive: row.isActive,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }
}
