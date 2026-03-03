'use server';

import { cache } from 'react';
import { getRequestContext } from '@/lib/auth';
import {
  getPortalSupplier,
  getPortalDashboard,
  getPortalInvoices,
  getPortalInvoiceDetail,
  getPortalPaymentRuns,
  getPortalRemittance,
  getPortalBankAccounts,
  getPortalWhtCertificates,
  getPortalWhtCertificateDetail,
  getPortalDocuments,
  getPortalDisputes,
  getPortalDisputeDetail,
  getPortalCompliance,
  getPortalComplianceAlerts,
  getPortalComplianceTimeline,
  renewPortalComplianceItem,
  getPortalNotificationPrefs,
  submitPortalInvoice,
  addPortalBankAccount,
  updatePortalProfile,
  uploadPortalDocument,
  createPortalDispute,
  createPortalCase,
  submitPortalStatementRecon,
  updatePortalNotificationPrefs,
  getPortalOnboarding,
  savePortalOnboardingDraft,
  submitPortalOnboarding,
  getPortalActivity,
  getPortalMessageThreads,
  getPortalMessages,
  startPortalMessageThread,
  sendPortalMessage,
  markPortalMessageRead,
  getPortalEscalations,
  getPortalEscalationDetail,
  triggerPortalEscalation,
  resolvePortalEscalation,
  getPortalAnnouncements,
  getAllPortalAnnouncements,
  createPortalAnnouncement,
  updatePortalAnnouncement,
  archivePortalAnnouncement,
  getPortalProofChain,
  getPortalAppointments,
  getPortalAppointmentDetail,
  createPortalAppointment,
  cancelPortalAppointment,
  type PortalNotificationPref,
  type OnboardingStep,
  type AnnouncementSeverity,
  type ProofChainResponse,
  type MeetingRequestStatus,
  type MeetingType,
  type PortalMeetingRequest,
  type MeetingRequestListResponse,
} from '../queries/portal.queries';

// ─── Read Actions ──────────────────────────────────────────────────────────

export const getSupplierAction = cache(async () => {
  const ctx = await getRequestContext();
  return getPortalSupplier(ctx);
});

export const getDashboardAction = cache(async (supplierId: string) => {
  const ctx = await getRequestContext();
  return getPortalDashboard(ctx, supplierId);
});

export const getInvoicesAction = cache(
  async (supplierId: string, params?: { page?: string; limit?: string; status?: string }) => {
    const ctx = await getRequestContext();
    return getPortalInvoices(ctx, supplierId, params);
  }
);

export const getInvoiceDetailAction = cache(async (supplierId: string, invoiceId: string) => {
  const ctx = await getRequestContext();
  return getPortalInvoiceDetail(ctx, supplierId, invoiceId);
});

export const getPaymentRunsAction = cache(
  async (supplierId: string, params?: { page?: string; limit?: string }) => {
    const ctx = await getRequestContext();
    return getPortalPaymentRuns(ctx, supplierId, params);
  }
);

export const getRemittanceAction = cache(async (supplierId: string, runId: string) => {
  const ctx = await getRequestContext();
  return getPortalRemittance(ctx, supplierId, runId);
});

export const getBankAccountsAction = cache(async (supplierId: string) => {
  const ctx = await getRequestContext();
  return getPortalBankAccounts(ctx, supplierId);
});

export const getWhtCertificatesAction = cache(async (supplierId: string) => {
  const ctx = await getRequestContext();
  return getPortalWhtCertificates(ctx, supplierId);
});

export const getWhtCertificateDetailAction = cache(async (supplierId: string, certId: string) => {
  const ctx = await getRequestContext();
  return getPortalWhtCertificateDetail(ctx, supplierId, certId);
});

export const getDocumentsAction = cache(async (supplierId: string) => {
  const ctx = await getRequestContext();
  return getPortalDocuments(ctx, supplierId);
});

export const getDisputesAction = cache(async (supplierId: string) => {
  const ctx = await getRequestContext();
  return getPortalDisputes(ctx, supplierId);
});

export const getDisputeDetailAction = cache(async (supplierId: string, disputeId: string) => {
  const ctx = await getRequestContext();
  return getPortalDisputeDetail(ctx, supplierId, disputeId);
});

export const getComplianceAction = cache(async (supplierId: string) => {
  const ctx = await getRequestContext();
  return getPortalCompliance(ctx, supplierId);
});

export const getComplianceAlertsAction = cache(async (supplierId: string) => {
  const ctx = await getRequestContext();
  return getPortalComplianceAlerts(ctx, supplierId);
});

export const getComplianceTimelineAction = cache(async (supplierId: string) => {
  const ctx = await getRequestContext();
  return getPortalComplianceTimeline(ctx, supplierId);
});

export async function renewComplianceItemAction(
  supplierId: string,
  itemId: string,
  body: { documentId: string; newExpiryDate: string; notes?: string }
) {
  const ctx = await getRequestContext();
  return renewPortalComplianceItem(ctx, supplierId, itemId, body);
}

export const getNotificationPrefsAction = cache(async (supplierId: string) => {
  const ctx = await getRequestContext();
  return getPortalNotificationPrefs(ctx, supplierId);
});

// ─── Mutation Actions ──────────────────────────────────────────────────────

export async function submitInvoiceAction(
  supplierId: string,
  body: { invoices: Record<string, unknown>[] }
) {
  const ctx = await getRequestContext();
  return submitPortalInvoice(ctx, supplierId, body);
}

export async function addBankAccountAction(
  supplierId: string,
  body: {
    bankName: string;
    accountName: string;
    accountNumber: string;
    iban?: string;
    swiftBic?: string;
    currencyCode: string;
    isPrimary?: boolean;
  }
) {
  const ctx = await getRequestContext();
  return addPortalBankAccount(ctx, supplierId, body);
}

export async function updateProfileAction(supplierId: string, body: Record<string, unknown>) {
  const ctx = await getRequestContext();
  return updatePortalProfile(ctx, supplierId, body);
}

export async function uploadDocumentAction(
  supplierId: string,
  body: {
    category: string;
    title: string;
    fileName: string;
    mimeType: string;
    content: string;
    expiresAt?: string;
  }
) {
  const ctx = await getRequestContext();
  return uploadPortalDocument(ctx, supplierId, body);
}

export async function createDisputeAction(
  supplierId: string,
  body: {
    invoiceId?: string;
    paymentRunId?: string;
    category: string;
    subject: string;
    description: string;
  }
) {
  const ctx = await getRequestContext();
  return createPortalDispute(ctx, supplierId, body);
}

export async function submitStatementReconAction(
  supplierId: string,
  body: { lines: Record<string, unknown>[] }
) {
  const ctx = await getRequestContext();
  return submitPortalStatementRecon(ctx, supplierId, body);
}

export async function updateNotificationPrefsAction(
  supplierId: string,
  body: { preferences: PortalNotificationPref[] }
) {
  const ctx = await getRequestContext();
  return updatePortalNotificationPrefs(ctx, supplierId, body);
}

export async function createCaseAction(
  supplierId: string,
  body: {
    category: string;
    priority: string;
    subject: string;
    description: string;
    linkedEntityId?: string;
    linkedEntityType?: string;
  }
) {
  const ctx = await getRequestContext();
  return createPortalCase(ctx, supplierId, body);
}

// ─── Onboarding Actions (Phase 1.1.2 CAP-ONB) ─────────────────────────

export const getOnboardingAction = cache(async (supplierId: string) => {
  const ctx = await getRequestContext();
  return getPortalOnboarding(ctx, supplierId);
});

export async function saveOnboardingDraftAction(
  supplierId: string,
  step: OnboardingStep,
  draft: Record<string, unknown>
) {
  const ctx = await getRequestContext();
  return savePortalOnboardingDraft(ctx, supplierId, { step, draft });
}

export async function submitOnboardingAction(supplierId: string) {
  const ctx = await getRequestContext();
  return submitPortalOnboarding(ctx, supplierId);
}

// ─── Audit Trail Actions (Phase 1.1.4 CAP-AUDIT) ───────────────────────

export const getActivityAction = cache(
  async (
    supplierId: string,
    params?: { page?: string; limit?: string; action?: string; resource?: string }
  ) => {
    const ctx = await getRequestContext();
    return getPortalActivity(ctx, supplierId, params);
  }
);

// ─── Messaging Hub Actions (Phase 1.2.1 CAP-MSG) ────────────────────────

export const getMessageThreadsAction = cache(
  async (
    supplierId: string,
    params?: { caseId?: string; includeArchived?: boolean; page?: string; limit?: string }
  ) => {
    const ctx = await getRequestContext();
    return getPortalMessageThreads(ctx, supplierId, params);
  }
);

export const getMessagesAction = cache(
  async (supplierId: string, threadId: string, params?: { page?: string; limit?: string }) => {
    const ctx = await getRequestContext();
    return getPortalMessages(ctx, supplierId, threadId, params);
  }
);

export async function startThreadAction(
  supplierId: string,
  body: {
    caseId?: string;
    subject: string;
    initialMessageBody: string;
    attachmentIds?: string[];
    idempotencyKey: string;
  }
) {
  const ctx = await getRequestContext();
  return startPortalMessageThread(ctx, supplierId, body);
}

export async function sendMessageAction(
  supplierId: string,
  threadId: string,
  body: {
    body: string;
    attachmentIds?: string[];
    idempotencyKey: string;
  }
) {
  const ctx = await getRequestContext();
  return sendPortalMessage(ctx, supplierId, threadId, body);
}

export async function markMessageReadAction(supplierId: string, messageId: string, readBy: string) {
  const ctx = await getRequestContext();
  return markPortalMessageRead(ctx, supplierId, messageId, readBy);
}

// ─── Escalation Actions (Phase 1.2.2 CAP-SOS) ──────────────────────────────

export const getEscalationsAction = cache(
  async (
    supplierId: string,
    params?: { page?: string; limit?: string; status?: string; caseId?: string }
  ) => {
    const ctx = await getRequestContext();
    return getPortalEscalations(ctx, supplierId, params);
  }
);

export const getEscalationDetailAction = cache(async (supplierId: string, escalationId: string) => {
  const ctx = await getRequestContext();
  return getPortalEscalationDetail(ctx, supplierId, escalationId);
});

export async function triggerEscalationAction(
  supplierId: string,
  body: { caseId: string; reason: string }
) {
  const ctx = await getRequestContext();
  return triggerPortalEscalation(ctx, supplierId, body);
}

export async function resolveEscalationAction(
  supplierId: string,
  escalationId: string,
  body: { resolutionNotes: string }
) {
  const ctx = await getRequestContext();
  return resolvePortalEscalation(ctx, supplierId, escalationId, body);
}

// ─── Announcement Actions (Phase 1.2.3 CAP-ANNOUNCE) ───────────────────────

export const getAnnouncementsAction = cache(async (supplierId: string) => {
  const ctx = await getRequestContext();
  return getPortalAnnouncements(ctx, supplierId);
});

export const getAllAnnouncementsAction = cache(
  async (params?: {
    pinned?: boolean;
    severity?: AnnouncementSeverity;
    includeArchived?: boolean;
    page?: number;
    limit?: number;
  }) => {
    const ctx = await getRequestContext();
    return getAllPortalAnnouncements(ctx, params);
  }
);

export async function createAnnouncementAction(body: {
  title: string;
  body: string;
  severity?: AnnouncementSeverity;
  pinned?: boolean;
  validFrom?: string;
  validUntil?: string | null;
}) {
  const ctx = await getRequestContext();
  return createPortalAnnouncement(ctx, body);
}

export async function updateAnnouncementAction(
  announcementId: string,
  body: Partial<{
    title: string;
    body: string;
    severity: AnnouncementSeverity;
    pinned: boolean;
    validFrom: string;
    validUntil: string | null;
  }>
) {
  const ctx = await getRequestContext();
  return updatePortalAnnouncement(ctx, announcementId, body);
}

export async function archiveAnnouncementAction(announcementId: string) {
  const ctx = await getRequestContext();
  return archivePortalAnnouncement(ctx, announcementId);
}

// ─── SP-6000: CAP-PROOF (P25) — Proof Chain Verification ────────────────────

export { type ProofChainResponse } from '../queries/portal.queries';

export const getProofChainAction = cache(
  async (supplierId: string, opts: { page?: number; limit?: number } = {}) => {
    const ctx = await getRequestContext();
    return getPortalProofChain(ctx, supplierId, opts);
  }
);

// ─── SP-5020: CAP-APPT (P27) — Appointment Scheduling ─────────────────────

export type {
  MeetingRequestStatus,
  MeetingType,
  PortalMeetingRequest,
  MeetingRequestListResponse,
} from '../queries/portal.queries';

export const getAppointmentsAction = cache(
  async (
    supplierId: string,
    opts: { status?: MeetingRequestStatus; page?: number; limit?: number } = {}
  ) => {
    const ctx = await getRequestContext();
    return getPortalAppointments(ctx, supplierId, opts);
  }
);

export const getAppointmentDetailAction = cache(async (meetingId: string) => {
  const ctx = await getRequestContext();
  return getPortalAppointmentDetail(ctx, meetingId);
});

export async function requestMeetingAction(
  supplierId: string,
  body: {
    requestedWith?: string;
    meetingType?: MeetingType;
    agenda: string;
    location?: string;
    proposedTimes: string[];
    durationMinutes?: string;
    caseId?: string;
    escalationId?: string;
  }
) {
  const ctx = await getRequestContext();
  return createPortalAppointment(ctx, supplierId, body);
}

export async function cancelMeetingAction(
  meetingId: string,
  body: { cancellationReason?: string } = {}
) {
  const ctx = await getRequestContext();
  return cancelPortalAppointment(ctx, meetingId, body);
}
