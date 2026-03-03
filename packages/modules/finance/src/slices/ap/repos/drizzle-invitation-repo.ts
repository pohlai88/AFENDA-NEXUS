import { and, eq } from 'drizzle-orm';
import type { TenantTx } from '@afenda/db';
import { portalSupplierInvitations } from '@afenda/db';
import type {
  Invitation,
  IInvitationRepo,
  InvitationStatus,
} from '../services/supplier-portal-invitation.js';

type InvitationRow = typeof portalSupplierInvitations.$inferSelect;

/**
 * Phase 1.1.7: Supplier Invitation Repository (Drizzle implementation)
 * Manages buyer-initiated magic link invitations for new suppliers
 */

function mapToDomain(row: InvitationRow): Invitation {
  return {
    id: row.id,
    tenantId: row.tenantId,
    email: row.email,
    supplierName: row.supplierName,
    token: row.token,
    tokenExpiresAt: row.tokenExpiresAt,
    status: row.status as InvitationStatus,
    sentAt: row.sentAt,
    acceptedAt: row.acceptedAt,
    revokedAt: row.revokedAt,
    supplierId: row.supplierId,
    invitedBy: row.invitedBy,
    invitationMessage: row.invitationMessage,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export class DrizzleInvitationRepo implements IInvitationRepo {
  constructor(private readonly tx: TenantTx) {}

  async findByToken(token: string): Promise<Invitation | null> {
    const row = await this.tx.query.portalSupplierInvitations.findFirst({
      where: eq(portalSupplierInvitations.token, token),
    });

    return row ? mapToDomain(row) : null;
  }

  async findById(tenantId: string, id: string): Promise<Invitation | null> {
    const row = await this.tx.query.portalSupplierInvitations.findFirst({
      where: and(
        eq(portalSupplierInvitations.tenantId, tenantId),
        eq(portalSupplierInvitations.id, id)
      ),
    });

    return row ? mapToDomain(row) : null;
  }

  async list(
    tenantId: string,
    filters: {
      status?: InvitationStatus;
      email?: string;
      page?: number;
      limit?: number;
    }
  ): Promise<{ items: readonly Invitation[]; total: number }> {
    const page = filters.page ?? 1;
    const limit = filters.limit ?? 20;
    const offset = (page - 1) * limit;

    const conditions = [eq(portalSupplierInvitations.tenantId, tenantId)];

    if (filters.status) {
      conditions.push(eq(portalSupplierInvitations.status, filters.status));
    }

    if (filters.email) {
      conditions.push(eq(portalSupplierInvitations.email, filters.email.toLowerCase().trim()));
    }

    const rows = await this.tx.query.portalSupplierInvitations.findMany({
      where: and(...conditions),
      limit,
      offset,
      orderBy: (t, { desc }) => [desc(t.sentAt)],
    });

    // Count total (in real implementation, should use COUNT query for efficiency)
    const allRows = await this.tx.query.portalSupplierInvitations.findMany({
      where: and(...conditions),
    });
    const total = allRows.length;

    return {
      items: rows.map(mapToDomain),
      total,
    };
  }

  async create(data: Invitation): Promise<Invitation> {
    const [row] = await this.tx
      .insert(portalSupplierInvitations)
      .values({
        id: data.id,
        tenantId: data.tenantId,
        email: data.email,
        supplierName: data.supplierName,
        token: data.token,
        tokenExpiresAt: data.tokenExpiresAt,
        status: data.status,
        sentAt: data.sentAt,
        acceptedAt: data.acceptedAt,
        revokedAt: data.revokedAt,
        supplierId: data.supplierId,
        invitedBy: data.invitedBy,
        invitationMessage: data.invitationMessage,
      })
      .returning();

    if (!row) {
      throw new Error('Failed to create invitation');
    }

    return mapToDomain(row);
  }

  async update(id: string, data: Partial<Invitation>): Promise<Invitation | null> {
    const updatePayload: Record<string, unknown> = { updatedAt: new Date() };

    if (data.status !== undefined) updatePayload.status = data.status;
    if (data.acceptedAt !== undefined) updatePayload.acceptedAt = data.acceptedAt;
    if (data.revokedAt !== undefined) updatePayload.revokedAt = data.revokedAt;
    if (data.supplierId !== undefined) updatePayload.supplierId = data.supplierId;

    const [row] = await this.tx
      .update(portalSupplierInvitations)
      .set(updatePayload)
      .where(eq(portalSupplierInvitations.id, id))
      .returning();

    return row ? mapToDomain(row) : null;
  }
}
