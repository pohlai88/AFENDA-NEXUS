/**
 * SP-5020: Drizzle Meeting Request Repository (CAP-APPT P27).
 * Implements IMeetingRequestRepo against erp.portal_meeting_request.
 */
import { and, count, desc, eq } from 'drizzle-orm';
import type { TenantTx } from '@afenda/db';
import { portalMeetingRequests } from '@afenda/db';
import type {
  MeetingRequest,
  MeetingRequestStatus,
  MeetingType,
  IMeetingRequestRepo,
} from '../services/supplier-portal-appointment.js';

type MeetingRow = typeof portalMeetingRequests.$inferSelect;

function mapToDomain(row: MeetingRow): MeetingRequest {
  return {
    id: row.id,
    tenantId: row.tenantId,
    requestedBy: row.requestedBy,
    supplierId: row.supplierId,
    requestedWith: row.requestedWith ?? null,
    meetingType: row.meetingType as MeetingType,
    agenda: row.agenda,
    location: row.location ?? null,
    proposedTimes: (row.proposedTimes ?? []) as string[],
    confirmedTime: row.confirmedTime ?? null,
    durationMinutes: row.durationMinutes,
    caseId: row.caseId ?? null,
    escalationId: row.escalationId ?? null,
    status: row.status as MeetingRequestStatus,
    cancellationReason: row.cancellationReason ?? null,
    buyerNotes: row.buyerNotes ?? null,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export class DrizzleMeetingRequestRepo implements IMeetingRequestRepo {
  constructor(private readonly tx: TenantTx) {}

  async create(input: {
    id: string;
    tenantId: string;
    requestedBy: string;
    supplierId: string;
    requestedWith: string | null;
    meetingType: MeetingType;
    agenda: string;
    location: string | null;
    proposedTimes: string[];
    durationMinutes: string;
    caseId: string | null;
    escalationId: string | null;
  }): Promise<MeetingRequest> {
    const [row] = await this.tx
      .insert(portalMeetingRequests)
      .values({
        id: input.id,
        tenantId: input.tenantId,
        requestedBy: input.requestedBy,
        supplierId: input.supplierId,
        requestedWith: input.requestedWith ?? undefined,
        meetingType: input.meetingType as any,
        agenda: input.agenda,
        location: input.location ?? undefined,
        proposedTimes: input.proposedTimes,
        durationMinutes: input.durationMinutes,
        caseId: input.caseId ?? undefined,
        escalationId: input.escalationId ?? undefined,
        status: 'REQUESTED' as any,
      })
      .returning();

    if (!row) throw new Error('Failed to create meeting request');
    return mapToDomain(row);
  }

  async findById(tenantId: string, meetingId: string): Promise<MeetingRequest | null> {
    const row = await this.tx.query.portalMeetingRequests.findFirst({
      where: and(
        eq(portalMeetingRequests.tenantId, tenantId),
        eq(portalMeetingRequests.id, meetingId)
      ),
    });
    return row ? mapToDomain(row) : null;
  }

  async list(
    tenantId: string,
    opts?: {
      supplierId?: string;
      status?: MeetingRequestStatus;
      page?: number;
      limit?: number;
    }
  ): Promise<{ items: MeetingRequest[]; total: number }> {
    const page = opts?.page ?? 1;
    const limit = opts?.limit ?? 20;
    const offset = (page - 1) * limit;

    const conditions = [eq(portalMeetingRequests.tenantId, tenantId)];
    if (opts?.supplierId) conditions.push(eq(portalMeetingRequests.supplierId, opts.supplierId));
    if (opts?.status) conditions.push(eq(portalMeetingRequests.status, opts.status as any));

    const where = and(...conditions);

    const [rows, [countRow]] = await Promise.all([
      this.tx
        .select()
        .from(portalMeetingRequests)
        .where(where)
        .orderBy(desc(portalMeetingRequests.createdAt))
        .limit(limit)
        .offset(offset),
      this.tx.select({ value: count() }).from(portalMeetingRequests).where(where),
    ]);

    return { items: rows.map(mapToDomain), total: Number(countRow?.value ?? 0) };
  }

  async confirm(
    tenantId: string,
    meetingId: string,
    confirmedTime: Date,
    buyerNotes: string | null,
    location: string | null
  ): Promise<MeetingRequest> {
    const [row] = await this.tx
      .update(portalMeetingRequests)
      .set({
        status: 'CONFIRMED' as any,
        confirmedTime,
        buyerNotes: buyerNotes ?? undefined,
        location: location ?? undefined,
        updatedAt: new Date(),
      })
      .where(
        and(eq(portalMeetingRequests.tenantId, tenantId), eq(portalMeetingRequests.id, meetingId))
      )
      .returning();

    if (!row) throw new Error('Meeting not found for confirm');
    return mapToDomain(row);
  }

  async cancel(
    tenantId: string,
    meetingId: string,
    reason: string | null
  ): Promise<MeetingRequest> {
    const [row] = await this.tx
      .update(portalMeetingRequests)
      .set({
        status: 'CANCELLED' as any,
        cancellationReason: reason ?? undefined,
        updatedAt: new Date(),
      })
      .where(
        and(eq(portalMeetingRequests.tenantId, tenantId), eq(portalMeetingRequests.id, meetingId))
      )
      .returning();

    if (!row) throw new Error('Meeting not found for cancel');
    return mapToDomain(row);
  }

  async complete(tenantId: string, meetingId: string): Promise<MeetingRequest> {
    const [row] = await this.tx
      .update(portalMeetingRequests)
      .set({ status: 'COMPLETED' as any, updatedAt: new Date() })
      .where(
        and(eq(portalMeetingRequests.tenantId, tenantId), eq(portalMeetingRequests.id, meetingId))
      )
      .returning();

    if (!row) throw new Error('Meeting not found for complete');
    return mapToDomain(row);
  }
}
