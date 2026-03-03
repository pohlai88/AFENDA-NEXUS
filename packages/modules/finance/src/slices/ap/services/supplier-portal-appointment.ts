/**
 * Phase 1.2.6: Appointment Scheduling service (CAP-APPT P27).
 *
 * Lightweight meeting booking between suppliers and buyer-side contacts.
 * Supplier proposes up to 3 time slots; buyer confirms one via the ERP.
 *
 * State machine:
 *   REQUESTED → CONFIRMED → COMPLETED
 *                        ↘ CANCELLED
 *             ↘ CANCELLED
 *
 * NOT in scope: recurring meetings, room booking, external calendar sync.
 *
 * SP-5020: MeetingRequest service + IMeetingRequestRepo port
 */
import type { Result } from '@afenda/core';
import { ok, err, AppError, ValidationError, NotFoundError } from '@afenda/core';

// ─── Domain Types ────────────────────────────────────────────────────────────

export type MeetingRequestStatus = 'REQUESTED' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED';
export type MeetingType = 'VIRTUAL' | 'IN_PERSON';

export interface MeetingRequest {
  readonly id: string;
  readonly tenantId: string;
  readonly requestedBy: string;
  readonly supplierId: string;
  readonly requestedWith: string | null;
  readonly meetingType: MeetingType;
  readonly agenda: string;
  readonly location: string | null;
  readonly proposedTimes: string[];
  readonly confirmedTime: Date | null;
  readonly durationMinutes: string;
  readonly caseId: string | null;
  readonly escalationId: string | null;
  readonly status: MeetingRequestStatus;
  readonly cancellationReason: string | null;
  readonly buyerNotes: string | null;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export interface CreateMeetingRequestInput {
  readonly tenantId: string;
  readonly requestedBy: string;
  readonly supplierId: string;
  readonly requestedWith?: string;
  readonly meetingType?: MeetingType;
  readonly agenda: string;
  readonly location?: string;
  readonly proposedTimes: string[];
  readonly durationMinutes?: string;
  readonly caseId?: string;
  readonly escalationId?: string;
}

export interface ConfirmMeetingInput {
  readonly tenantId: string;
  readonly meetingId: string;
  readonly confirmedTime: string; // ISO-8601
  readonly buyerNotes?: string;
  readonly location?: string;
}

export interface CancelMeetingInput {
  readonly tenantId: string;
  readonly meetingId: string;
  readonly cancellationReason?: string;
}

export interface CompleteMeetingInput {
  readonly tenantId: string;
  readonly meetingId: string;
}

export interface ListMeetingRequestsInput {
  readonly tenantId: string;
  readonly supplierId?: string;
  readonly status?: MeetingRequestStatus;
  readonly page?: number;
  readonly limit?: number;
}

// ─── Repository Port ─────────────────────────────────────────────────────────

export interface IMeetingRequestRepo {
  create(input: {
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
  }): Promise<MeetingRequest>;

  findById(tenantId: string, meetingId: string): Promise<MeetingRequest | null>;

  list(
    tenantId: string,
    opts?: {
      supplierId?: string;
      status?: MeetingRequestStatus;
      page?: number;
      limit?: number;
    }
  ): Promise<{ items: MeetingRequest[]; total: number }>;

  confirm(
    tenantId: string,
    meetingId: string,
    confirmedTime: Date,
    buyerNotes: string | null,
    location: string | null
  ): Promise<MeetingRequest>;

  cancel(tenantId: string, meetingId: string, reason: string | null): Promise<MeetingRequest>;

  complete(tenantId: string, meetingId: string): Promise<MeetingRequest>;
}

// ─── Deps ─────────────────────────────────────────────────────────────────────

export interface MeetingDeps {
  readonly meetingRequestRepo: IMeetingRequestRepo;
}

// ─── Domain Functions ─────────────────────────────────────────────────────────

/**
 * SP-5020-01: Supplier requests a meeting with a buyer contact.
 */
export async function requestMeeting(
  input: CreateMeetingRequestInput,
  deps: MeetingDeps
): Promise<Result<MeetingRequest>> {
  const { agenda, proposedTimes } = input;

  if (!agenda.trim()) return err(new ValidationError('Agenda is required'));
  if (agenda.length > 2000)
    return err(new ValidationError('Agenda must be at most 2000 characters'));
  if (!proposedTimes.length)
    return err(new ValidationError('At least one proposed time is required'));
  if (proposedTimes.length > 3)
    return err(new ValidationError('At most 3 proposed times are allowed'));

  // Validate all proposed times are valid ISO-8601 datetimes in the future
  const now = new Date();
  for (const t of proposedTimes) {
    const d = new Date(t);
    if (isNaN(d.getTime())) return err(new ValidationError(`Invalid datetime: ${t}`));
    if (d <= now) return err(new ValidationError('All proposed times must be in the future'));
  }

  try {
    const meeting = await deps.meetingRequestRepo.create({
      id: crypto.randomUUID(),
      tenantId: input.tenantId,
      requestedBy: input.requestedBy,
      supplierId: input.supplierId,
      requestedWith: input.requestedWith ?? null,
      meetingType: input.meetingType ?? 'VIRTUAL',
      agenda: agenda.trim(),
      location: input.location?.trim() ?? null,
      proposedTimes,
      durationMinutes: input.durationMinutes ?? '30',
      caseId: input.caseId ?? null,
      escalationId: input.escalationId ?? null,
    });
    return ok(meeting);
  } catch (e) {
    return err(new AppError('INTERNAL_ERROR', 'Failed to create meeting request', e));
  }
}

/**
 * SP-5020-02: List meeting requests for a supplier or all (buyer view).
 */
export async function listMeetingRequests(
  input: ListMeetingRequestsInput,
  deps: MeetingDeps
): Promise<
  Result<{ items: MeetingRequest[]; total: number; page: number; limit: number; hasMore: boolean }>
> {
  try {
    const page = input.page ?? 1;
    const limit = input.limit ?? 20;
    const { items, total } = await deps.meetingRequestRepo.list(input.tenantId, {
      supplierId: input.supplierId,
      status: input.status,
      page,
      limit,
    });
    return ok({ items, total, page, limit, hasMore: page * limit < total });
  } catch (e) {
    return err(new AppError('INTERNAL_ERROR', 'Failed to list meeting requests', e));
  }
}

/**
 * SP-5020-03: Get a single meeting request.
 */
export async function getMeetingRequest(
  tenantId: string,
  meetingId: string,
  deps: MeetingDeps
): Promise<Result<MeetingRequest>> {
  const meeting = await deps.meetingRequestRepo.findById(tenantId, meetingId);
  if (!meeting) return err(new NotFoundError('MeetingRequest', meetingId));
  return ok(meeting);
}

/**
 * SP-5020-04: Buyer confirms a proposed time slot.
 */
export async function confirmMeeting(
  input: ConfirmMeetingInput,
  deps: MeetingDeps
): Promise<Result<MeetingRequest>> {
  const existing = await deps.meetingRequestRepo.findById(input.tenantId, input.meetingId);
  if (!existing) return err(new NotFoundError('MeetingRequest', input.meetingId));
  if (existing.status !== 'REQUESTED')
    return err(new AppError('CONFLICT', `Cannot confirm a meeting in status ${existing.status}`));

  const confirmedDate = new Date(input.confirmedTime);
  if (isNaN(confirmedDate.getTime()))
    return err(new ValidationError('confirmedTime must be a valid ISO-8601 datetime'));

  try {
    const updated = await deps.meetingRequestRepo.confirm(
      input.tenantId,
      input.meetingId,
      confirmedDate,
      input.buyerNotes ?? null,
      input.location ?? null
    );
    return ok(updated);
  } catch (e) {
    return err(new AppError('INTERNAL_ERROR', 'Failed to confirm meeting', e));
  }
}

/**
 * SP-5020-05: Cancel a meeting (either party).
 */
export async function cancelMeeting(
  input: CancelMeetingInput,
  deps: MeetingDeps
): Promise<Result<MeetingRequest>> {
  const existing = await deps.meetingRequestRepo.findById(input.tenantId, input.meetingId);
  if (!existing) return err(new NotFoundError('MeetingRequest', input.meetingId));
  if (existing.status === 'CANCELLED')
    return err(new AppError('CONFLICT', 'Meeting is already cancelled'));
  if (existing.status === 'COMPLETED')
    return err(new AppError('CONFLICT', 'Cannot cancel a completed meeting'));

  try {
    const updated = await deps.meetingRequestRepo.cancel(
      input.tenantId,
      input.meetingId,
      input.cancellationReason ?? null
    );
    return ok(updated);
  } catch (e) {
    return err(new AppError('INTERNAL_ERROR', 'Failed to cancel meeting', e));
  }
}

/**
 * SP-5020-06: Mark a confirmed meeting as completed.
 */
export async function completeMeeting(
  input: CompleteMeetingInput,
  deps: MeetingDeps
): Promise<Result<MeetingRequest>> {
  const existing = await deps.meetingRequestRepo.findById(input.tenantId, input.meetingId);
  if (!existing) return err(new NotFoundError('MeetingRequest', input.meetingId));
  if (existing.status !== 'CONFIRMED')
    return err(new AppError('CONFLICT', `Cannot complete a meeting in status ${existing.status}`));

  try {
    const updated = await deps.meetingRequestRepo.complete(input.tenantId, input.meetingId);
    return ok(updated);
  } catch (e) {
    return err(new AppError('INTERNAL_ERROR', 'Failed to complete meeting', e));
  }
}
