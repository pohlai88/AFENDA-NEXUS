import type { FastifyInstance } from 'fastify';
import {
  IdParamSchema,
  PaginationSchema,
  CreateSupplierBankAccountSchema,
  SupplierPortalInvoiceSubmitSchema,
  SupplierPortalProfileUpdateSchema,
  SupplierPortalAgingQuerySchema,
  SupplierPortalStatementReconSchema,
  SupplierPortalDocumentUploadSchema,
  SupplierPortalDocumentListQuerySchema,
  SupplierPortalUpdateNotificationPrefsSchema,
} from '@afenda/contracts';
import {
  CreateCaseSchema,
  CaseListQuerySchema,
  TransitionCaseStatusSchema,
  AssignCaseSchema,
  AddTimelineMessageSchema,
  SaveOnboardingDraftSchema,
  RejectOnboardingSchema,
  RenewComplianceItemSchema,
  ComplianceAlertListQuerySchema,
  AuditLogListQuerySchema,
  LocationListQuerySchema,
  LocationListResponseSchema,
  DirectoryListQuerySchema,
  DirectoryListResponseSchema,
  SendInvitationRequestSchema,
  AcceptInvitationRequestSchema,
  InvitationListQuerySchema,
  StartThreadRequestSchema,
  SendMessageRequestSchema,
  ThreadListQuerySchema,
  MessageListQuerySchema,
  MarkReadRequestSchema,
  TriggerEscalationRequestSchema,
  EscalationListQuerySchema,
  ResolveEscalationRequestSchema,
} from '@afenda/contracts/portal';
import type { FinanceRuntime } from '../../../app/ports/finance-runtime.js';
import type { IAuthorizationPolicy } from '../../../shared/ports/authorization.js';
import { requirePermission } from '../../../shared/routes/authorization-guard.js';
import { mapErrorToStatus } from '../../../shared/routes/error-mapper.js';
import { extractIdentity } from '@afenda/api-kit';
import {
  getSupplierInvoices,
  getSupplierAging,
  getSupplierPaymentRunReport,
} from '../services/supplier-portal-visibility.js';
import { supplierAddBankAccount } from '../services/supplier-portal-bank-account.js';
import { supplierDownloadRemittance } from '../services/supplier-portal-remittance.js';
import {
  getSupplierWhtCertificates,
  getSupplierWhtCertificateById,
} from '../services/supplier-portal-wht.js';
import { supplierSubmitInvoices } from '../services/supplier-portal-invoice-submit.js';
import { supplierUpdateProfile } from '../services/supplier-portal-profile.js';
import { supplierStatementRecon } from '../services/supplier-portal-statement-recon.js';
import {
  supplierUploadDocument,
  supplierListDocuments,
} from '../services/supplier-portal-document-vault.js';
import {
  supplierGetNotificationPrefs,
  supplierUpdateNotificationPrefs,
} from '../services/supplier-portal-notifications.js';
import {
  supplierGetComplianceSummary,
  renewComplianceItem,
  getComplianceAlerts,
  getComplianceTimeline,
} from '../services/supplier-portal-compliance.js';
import { resolveSupplierIdentity } from '../services/supplier-portal-identity.js';
import {
  supplierCreateCase,
  supplierGetCase,
  supplierListCases,
  supplierTransitionCase,
  supplierAssignCase,
  supplierAddTimelineMessage,
  supplierGetCaseTimeline,
} from '../services/supplier-portal-case.js';
import {
  supplierGetOnboarding,
  supplierSaveOnboardingDraft,
  supplierSubmitOnboarding,
  approveOnboarding,
  rejectOnboarding,
} from '../services/supplier-portal-onboarding.js';
import { getSupplierAuditLog } from '../services/supplier-portal-audit.js';
import {
  getCompanyLocations,
  getCompanyLocationById,
} from '../services/supplier-portal-location.js';
import { getDirectory, getDirectoryEntry } from '../services/supplier-portal-directory.js';
import {
  sendInvitation,
  acceptInvitation,
  revokeInvitation,
  listInvitations,
} from '../services/supplier-portal-invitation.js';
import {
  startThread,
  sendMessage,
  listThreads,
  listMessages,
  markMessageRead,
} from '../services/supplier-portal-messaging.js';
import {
  triggerEscalation,
  listEscalations,
  getEscalation,
  resolveEscalation,
} from '../services/supplier-portal-escalation.js';
import {
  getActiveAnnouncements,
  listAllAnnouncements,
  createAnnouncement,
  updateAnnouncement,
  archiveAnnouncement,
} from '../services/supplier-portal-announcement.js';
import {
  CreateAnnouncementSchema,
  UpdateAnnouncementSchema,
  AnnouncementListQuerySchema,
  CreateMeetingRequestSchema,
  ConfirmMeetingRequestSchema,
  CancelMeetingRequestSchema,
  MeetingRequestListQuerySchema,
} from '@afenda/contracts/portal';
import {
  requestMeeting,
  listMeetingRequests,
  getMeetingRequest,
  confirmMeeting,
  cancelMeeting,
} from '../services/supplier-portal-appointment.js';
import {
  getPaymentStatusTimeline,
  getCurrentPaymentStatus,
  getInvoicePaymentStatus,
  recordPaymentStatus,
} from '../services/supplier-portal-payment-tracking.js';
import {
  listEarlyPaymentOffers,
  getEarlyPaymentOffer,
  acceptEarlyPaymentOffer,
  declineEarlyPaymentOffer,
  createEarlyPaymentOffer,
} from '../services/supplier-portal-scf.js';
import { processBulkUpload } from '../services/supplier-portal-bulk-upload.js';
import { submitCreditDebitNote } from '../services/supplier-portal-crdb.js';
import {
  listWebhooks,
  createWebhook,
  updateWebhook,
  pauseWebhook,
  resumeWebhook,
  deleteWebhook,
  rotateWebhookSecret,
} from '../services/supplier-portal-webhook.js';
import { listSupplierAssociations } from '../services/supplier-portal-multi-entity.js';
import {
  PaymentStageSchema,
  PaymentSourceSchema,
  EarlyPaymentOfferListQuerySchema,
  CreateEarlyPaymentOfferSchema,
  BulkUploadBatchSchema,
  SubmitCreditDebitNoteSchema,
} from '@afenda/contracts/portal';

/**
 * Supplier Portal routes — self-service endpoints scoped to the
 * authenticated supplier's own data.
 *
 * All routes require a `supplierId` path param that MUST match
 * the supplier linked to the authenticated user. The portal auth
 * foundation enforces this via the `supplier:read`, `supplier:write`,
 * and `supplier:submit` permissions.
 *
 * Endpoints:
 *   N2: GET  /portal/suppliers/:id/invoices       — view own invoices
 *   N2: GET  /portal/suppliers/:id/aging           — view own aging
 *   N2: GET  /portal/suppliers/:id/payment-runs/:runId — view payment run detail
 *   N3: POST /portal/suppliers/:id/bank-accounts   — add bank account
 *   N4: GET  /portal/suppliers/:id/payment-runs/:runId/remittance — download remittance
 *   N5: GET  /portal/suppliers/:id/wht-certificates — list WHT certificates
 *   N5: GET  /portal/suppliers/:id/wht-certificates/:certId — get WHT certificate
 *   N1: POST /portal/suppliers/:id/invoices/submit  — submit invoices electronically
 *   N6: PATCH /portal/suppliers/:id/profile         — update profile
 *   N7: POST /portal/suppliers/:id/statement-recon   — upload statement + reconcile
 *   N8: POST /portal/suppliers/:id/documents         — upload document with SHA-256
 *   N8: GET  /portal/suppliers/:id/documents         — list documents
 *  N10: GET  /portal/suppliers/:id/notification-prefs — get notification prefs
 *  N10: PUT  /portal/suppliers/:id/notification-prefs — update notification prefs
 *  N11: GET  /portal/suppliers/:id/compliance         — get compliance summary
 *       GET  /portal/me                                — resolve supplier from session
 */
export function registerSupplierPortalRoutes(
  app: FastifyInstance,
  runtime: FinanceRuntime,
  policy: IAuthorizationPolicy
): void {
  // ── Portal Identity: resolve authenticated user → supplier ─────────────

  app.get(
    '/portal/me',
    { preHandler: [requirePermission(policy, 'supplier:read')] },
    async (req, reply) => {
      const { tenantId, userId } = extractIdentity(req);

      const result = await runtime.withTenant({ tenantId, userId }, async (deps) => {
        return resolveSupplierIdentity({ tenantId, userId }, deps);
      });

      return result.ok
        ? reply.send(result.value)
        : reply.status(mapErrorToStatus(result.error)).send({ error: result.error });
    }
  );

  // ── CAP-MULTI: Multi-Entity Associations (SP-5022) ───────────────────────
  // GET /portal/me/associations — all supplier+tenant combos for this user.
  // Used by the entity switcher dropdown in the portal topbar.

  app.get(
    '/portal/me/associations',
    { preHandler: [requirePermission(policy, 'supplier:read')] },
    async (req, reply) => {
      const { tenantId, userId } = extractIdentity(req);

      const result = await runtime.withTenant({ tenantId, userId }, async (deps) => {
        return listSupplierAssociations(
          { supplierAssociationRepo: deps.supplierAssociationRepo! },
          userId
        );
      });

      return result.ok
        ? reply.send({ data: result.value })
        : reply.status(result.error.code === 'NOT_FOUND' ? 404 : 500).send({ error: result.error });
    }
  );

  app.get(
    '/portal/suppliers/:id/invoices',
    { preHandler: [requirePermission(policy, 'supplier:read')] },
    async (req, reply) => {
      const { id } = IdParamSchema.parse(req.params);
      const { tenantId, userId } = extractIdentity(req);
      const query = PaginationSchema.parse(req.query);

      const result = await runtime.withTenant({ tenantId, userId }, async (deps) => {
        return getSupplierInvoices(
          { tenantId, supplierId: id, page: query.page, limit: query.limit },
          deps
        );
      });

      return result.ok
        ? reply.send(result.value)
        : reply.status(mapErrorToStatus(result.error)).send({ error: result.error });
    }
  );

  // ── N2: Supplier Aging Visibility ───────────────────────────────────────

  app.get(
    '/portal/suppliers/:id/aging',
    { preHandler: [requirePermission(policy, 'supplier:read')] },
    async (req, reply) => {
      const { id } = IdParamSchema.parse(req.params);
      const { tenantId, userId } = extractIdentity(req);
      const query = SupplierPortalAgingQuerySchema.parse(req.query);

      const result = await runtime.withTenant({ tenantId, userId }, async (deps) => {
        return getSupplierAging(
          {
            tenantId,
            supplierId: id,
            asOfDate: query.asOfDate ? new Date(query.asOfDate) : undefined,
          },
          deps
        );
      });

      return result.ok
        ? reply.send(result.value)
        : reply.status(mapErrorToStatus(result.error)).send({ error: result.error });
    }
  );

  // ── N2: Supplier Payment Run Detail ─────────────────────────────────────

  app.get(
    '/portal/suppliers/:id/payment-runs/:runId',
    { preHandler: [requirePermission(policy, 'supplier:read')] },
    async (req, reply) => {
      const params = req.params as { id: string; runId: string };
      const { tenantId, userId } = extractIdentity(req);

      const result = await runtime.withTenant({ tenantId, userId }, async (deps) => {
        return getSupplierPaymentRunReport(
          { tenantId, supplierId: params.id, paymentRunId: params.runId },
          deps
        );
      });

      return result.ok
        ? reply.send(result.value)
        : reply.status(mapErrorToStatus(result.error)).send({ error: result.error });
    }
  );

  // ── N3: Supplier Bank Account Self-Maintenance ──────────────────────────

  app.post(
    '/portal/suppliers/:id/bank-accounts',
    { preHandler: [requirePermission(policy, 'supplier:write')] },
    async (req, reply) => {
      const { id } = IdParamSchema.parse(req.params);
      const { tenantId, userId } = extractIdentity(req);
      const body = CreateSupplierBankAccountSchema.parse(req.body);

      const result = await runtime.withTenant({ tenantId, userId }, async (deps) => {
        return supplierAddBankAccount(
          {
            tenantId,
            supplierId: id,
            userId,
            bankName: body.bankName,
            accountName: body.accountName,
            accountNumber: body.accountNumber,
            iban: body.iban ?? null,
            swiftBic: body.swiftBic ?? null,
            localBankCode: body.localBankCode ?? null,
            currencyCode: body.currencyCode,
            isPrimary: body.isPrimary,
          },
          deps
        );
      });

      return result.ok
        ? reply.status(201).send(result.value)
        : reply.status(mapErrorToStatus(result.error)).send({ error: result.error });
    }
  );

  // ── N4: Supplier Remittance Advice Download ─────────────────────────────

  app.get(
    '/portal/suppliers/:id/payment-runs/:runId/remittance',
    { preHandler: [requirePermission(policy, 'supplier:read')] },
    async (req, reply) => {
      const params = req.params as { id: string; runId: string };
      const { tenantId, userId } = extractIdentity(req);

      const result = await runtime.withTenant({ tenantId, userId }, async (deps) => {
        return supplierDownloadRemittance(
          {
            tenantId,
            supplierId: params.id,
            userId,
            paymentRunId: params.runId,
          },
          deps
        );
      });

      return result.ok
        ? reply.send(result.value)
        : reply.status(mapErrorToStatus(result.error)).send({ error: result.error });
    }
  );

  // ── N5: Supplier WHT Certificates ───────────────────────────────────────

  app.get(
    '/portal/suppliers/:id/wht-certificates',
    { preHandler: [requirePermission(policy, 'supplier:read')] },
    async (req, reply) => {
      const { id } = IdParamSchema.parse(req.params);
      const { tenantId, userId } = extractIdentity(req);

      const result = await runtime.withTenant({ tenantId, userId }, async (deps) => {
        return getSupplierWhtCertificates({ tenantId, supplierId: id }, deps);
      });

      return result.ok
        ? reply.send(result.value)
        : reply.status(mapErrorToStatus(result.error)).send({ error: result.error });
    }
  );

  app.get(
    '/portal/suppliers/:id/wht-certificates/:certId',
    { preHandler: [requirePermission(policy, 'supplier:read')] },
    async (req, reply) => {
      const params = req.params as { id: string; certId: string };
      const { tenantId, userId } = extractIdentity(req);

      const result = await runtime.withTenant({ tenantId, userId }, async (deps) => {
        return getSupplierWhtCertificateById(
          { tenantId, supplierId: params.id, certificateId: params.certId },
          deps
        );
      });

      return result.ok
        ? reply.send(result.value)
        : reply.status(mapErrorToStatus(result.error)).send({ error: result.error });
    }
  );

  // ── N1: Supplier Electronic Invoice Submission ──────────────────────────

  app.post(
    '/portal/suppliers/:id/invoices/submit',
    { preHandler: [requirePermission(policy, 'supplier:submit')] },
    async (req, reply) => {
      const { id } = IdParamSchema.parse(req.params);
      const { tenantId, userId } = extractIdentity(req);
      const body = SupplierPortalInvoiceSubmitSchema.parse(req.body);

      const result = await runtime.withTenant({ tenantId, userId }, async (deps) => {
        return supplierSubmitInvoices(
          {
            tenantId,
            supplierId: id,
            userId,
            rows: body.rows.map((r) => ({
              ...r,
              supplierRef: r.supplierRef ?? null,
              description: r.description ?? null,
              poRef: r.poRef ?? null,
              receiptRef: r.receiptRef ?? null,
              paymentTermsId: r.paymentTermsId ?? null,
              lines: r.lines.map((l) => ({
                ...l,
                description: l.description ?? null,
              })),
            })),
            correlationId: body.correlationId,
          },
          deps
        );
      });

      return result.ok
        ? reply.send(result.value)
        : reply.status(mapErrorToStatus(result.error)).send({ error: result.error });
    }
  );

  // ── N6: Supplier Profile Update ─────────────────────────────────────────

  app.patch(
    '/portal/suppliers/:id/profile',
    { preHandler: [requirePermission(policy, 'supplier:write')] },
    async (req, reply) => {
      const { id } = IdParamSchema.parse(req.params);
      const { tenantId, userId } = extractIdentity(req);
      const body = SupplierPortalProfileUpdateSchema.parse(req.body);

      const result = await runtime.withTenant({ tenantId, userId }, async (deps) => {
        return supplierUpdateProfile(
          {
            tenantId,
            supplierId: id,
            userId,
            updates: body,
          },
          deps
        );
      });

      return result.ok
        ? reply.send(result.value)
        : reply.status(mapErrorToStatus(result.error)).send({ error: result.error });
    }
  );

  // ── N7: Supplier Statement Upload + Reconciliation ────────────────────

  app.post(
    '/portal/suppliers/:id/statement-recon',
    { preHandler: [requirePermission(policy, 'supplier:submit')] },
    async (req, reply) => {
      const { id } = IdParamSchema.parse(req.params);
      const { tenantId, userId } = extractIdentity(req);
      const body = SupplierPortalStatementReconSchema.parse(req.body);

      const result = await runtime.withTenant({ tenantId, userId }, async (deps) => {
        return supplierStatementRecon(
          {
            tenantId,
            supplierId: id,
            userId,
            asOfDate: body.asOfDate,
            statementLines: body.statementLines.map((sl) => ({
              lineRef: sl.lineRef,
              date: sl.date,
              description: sl.description,
              amount: sl.amount,
              currencyCode: sl.currencyCode,
            })),
            dateTolerance: body.dateTolerance,
          },
          deps
        );
      });

      return result.ok
        ? reply.send(result.value)
        : reply.status(mapErrorToStatus(result.error)).send({ error: result.error });
    }
  );

  // ── N8: Supplier Document Vault ───────────────────────────────────────

  app.post(
    '/portal/suppliers/:id/documents',
    { preHandler: [requirePermission(policy, 'supplier:write')] },
    async (req, reply) => {
      const { id } = IdParamSchema.parse(req.params);
      const { tenantId, userId } = extractIdentity(req);
      const body = SupplierPortalDocumentUploadSchema.parse(req.body);

      const result = await runtime.withTenant({ tenantId, userId }, async (deps) => {
        if (!deps.supplierDocumentRepo) throw new Error('supplierDocumentRepo not configured');
        return supplierUploadDocument(
          {
            tenantId,
            supplierId: id,
            userId,
            category: body.category,
            title: body.title,
            description: body.description ?? null,
            fileName: body.fileName,
            mimeType: body.mimeType,
            fileContent: Buffer.alloc(0),
            expiresAt: body.expiresAt ?? null,
          },
          { ...deps, supplierDocumentRepo: deps.supplierDocumentRepo }
        );
      });

      return result.ok
        ? reply.status(201).send(result.value)
        : reply.status(mapErrorToStatus(result.error)).send({ error: result.error });
    }
  );

  app.get(
    '/portal/suppliers/:id/documents',
    { preHandler: [requirePermission(policy, 'supplier:read')] },
    async (req, reply) => {
      const { id } = IdParamSchema.parse(req.params);
      const { tenantId, userId } = extractIdentity(req);
      const query = SupplierPortalDocumentListQuerySchema.parse(req.query);

      const result = await runtime.withTenant({ tenantId, userId }, async (deps) => {
        if (!deps.supplierDocumentRepo) throw new Error('supplierDocumentRepo not configured');
        return supplierListDocuments(
          { tenantId, supplierId: id, category: query.category },
          { ...deps, supplierDocumentRepo: deps.supplierDocumentRepo }
        );
      });

      return result.ok
        ? reply.send(result.value)
        : reply.status(mapErrorToStatus(result.error)).send({ error: result.error });
    }
  );

  // ── N10: Supplier Notification Preferences ────────────────────────────

  app.get(
    '/portal/suppliers/:id/notification-prefs',
    { preHandler: [requirePermission(policy, 'supplier:read')] },
    async (req, reply) => {
      const { id } = IdParamSchema.parse(req.params);
      const { tenantId, userId } = extractIdentity(req);

      const result = await runtime.withTenant({ tenantId, userId }, async (deps) => {
        if (!deps.supplierNotificationPrefRepo)
          throw new Error('supplierNotificationPrefRepo not configured');
        return supplierGetNotificationPrefs(
          { tenantId, supplierId: id },
          { ...deps, supplierNotificationPrefRepo: deps.supplierNotificationPrefRepo }
        );
      });

      return result.ok
        ? reply.send(result.value)
        : reply.status(mapErrorToStatus(result.error)).send({ error: result.error });
    }
  );

  app.put(
    '/portal/suppliers/:id/notification-prefs',
    { preHandler: [requirePermission(policy, 'supplier:write')] },
    async (req, reply) => {
      const { id } = IdParamSchema.parse(req.params);
      const { tenantId, userId } = extractIdentity(req);
      const body = SupplierPortalUpdateNotificationPrefsSchema.parse(req.body);

      const result = await runtime.withTenant({ tenantId, userId }, async (deps) => {
        if (!deps.supplierNotificationPrefRepo)
          throw new Error('supplierNotificationPrefRepo not configured');
        return supplierUpdateNotificationPrefs(
          {
            tenantId,
            supplierId: id,
            preferences: body.preferences,
          },
          { ...deps, supplierNotificationPrefRepo: deps.supplierNotificationPrefRepo }
        );
      });

      return result.ok
        ? reply.send(result.value)
        : reply.status(mapErrorToStatus(result.error)).send({ error: result.error });
    }
  );

  // ── N11: Supplier Compliance Summary ──────────────────────────────────

  app.get(
    '/portal/suppliers/:id/compliance',
    { preHandler: [requirePermission(policy, 'supplier:read')] },
    async (req, reply) => {
      const { id } = IdParamSchema.parse(req.params);
      const { tenantId, userId } = extractIdentity(req);

      const result = await runtime.withTenant({ tenantId, userId }, async (deps) => {
        if (!deps.supplierComplianceRepo) throw new Error('supplierComplianceRepo not configured');
        return supplierGetComplianceSummary(
          { tenantId, supplierId: id },
          { ...deps, supplierComplianceRepo: deps.supplierComplianceRepo }
        );
      });

      return result.ok
        ? reply.send(result.value)
        : reply.status(mapErrorToStatus(result.error)).send({ error: result.error });
    }
  );

  // ── Phase 1.1.3: Compliance Expiry Alerts (CAP-COMPL) ──────────────────

  app.post(
    '/portal/suppliers/:id/compliance/:itemId/renew',
    { preHandler: [requirePermission(policy, 'supplier:write')] },
    async (req, reply) => {
      const { id } = IdParamSchema.parse(req.params);
      const itemId = (req.params as { id: string; itemId: string }).itemId;
      const { tenantId, userId } = extractIdentity(req);
      const body = RenewComplianceItemSchema.parse(req.body);

      const result = await runtime.withTenant({ tenantId, userId }, async (deps) => {
        if (!deps.supplierComplianceRepo || !deps.complianceAlertLogRepo)
          throw new Error('supplierComplianceRepo / complianceAlertLogRepo not configured');
        return renewComplianceItem(
          {
            tenantId,
            supplierId: id,
            userId,
            complianceItemId: itemId,
            documentId: body.documentId,
            newExpiryDate: new Date(body.newExpiryDate),
            notes: body.notes,
          },
          {
            supplierRepo: deps.supplierRepo,
            supplierComplianceRepo: deps.supplierComplianceRepo,
            complianceAlertLogRepo: deps.complianceAlertLogRepo,
            outboxWriter: deps.outboxWriter,
            proofChainWriter: deps.proofChainWriter,
          }
        );
      });

      return result.ok
        ? reply.status(200).send(result.value)
        : reply.status(mapErrorToStatus(result.error)).send({ error: result.error });
    }
  );

  app.get(
    '/portal/suppliers/:id/compliance/alerts',
    { preHandler: [requirePermission(policy, 'supplier:read')] },
    async (req, reply) => {
      const { id } = IdParamSchema.parse(req.params);
      const { tenantId, userId } = extractIdentity(req);
      const query = ComplianceAlertListQuerySchema.parse(req.query);

      const result = await runtime.withTenant({ tenantId, userId }, async (deps) => {
        if (!deps.complianceAlertLogRepo) throw new Error('complianceAlertLogRepo not configured');
        return getComplianceAlerts(
          {
            tenantId,
            supplierId: id,
            alertType: query.alertType,
            activeOnly: query.active,
          },
          {
            supplierRepo: deps.supplierRepo,
            complianceAlertLogRepo: deps.complianceAlertLogRepo,
          }
        );
      });

      return result.ok
        ? reply.send(result.value)
        : reply.status(mapErrorToStatus(result.error)).send({ error: result.error });
    }
  );

  app.get(
    '/portal/suppliers/:id/compliance/timeline',
    { preHandler: [requirePermission(policy, 'supplier:read')] },
    async (req, reply) => {
      const { id } = IdParamSchema.parse(req.params);
      const { tenantId, userId } = extractIdentity(req);

      const result = await runtime.withTenant({ tenantId, userId }, async (deps) => {
        if (!deps.supplierComplianceRepo || !deps.complianceAlertLogRepo)
          throw new Error('supplierComplianceRepo / complianceAlertLogRepo not configured');
        return getComplianceTimeline(
          { tenantId, supplierId: id },
          {
            supplierRepo: deps.supplierRepo,
            supplierComplianceRepo: deps.supplierComplianceRepo,
            complianceAlertLogRepo: deps.complianceAlertLogRepo,
          }
        );
      });

      return result.ok
        ? reply.send(result.value)
        : reply.status(mapErrorToStatus(result.error)).send({ error: result.error });
    }
  );

  // ── Phase 1.1.4: Audit Trail (CAP-AUDIT) ──────────────────────────────

  app.get(
    '/portal/suppliers/:id/activity',
    { preHandler: [requirePermission(policy, 'supplier:read')] },
    async (req, reply) => {
      const { id } = IdParamSchema.parse(req.params);
      const { tenantId, userId } = extractIdentity(req);
      const query = AuditLogListQuerySchema.parse(req.query);

      const result = await runtime.withTenant({ tenantId, userId }, async (deps) => {
        if (!deps.auditLogRepo) throw new Error('auditLogRepo not configured');
        return getSupplierAuditLog(
          {
            tenantId,
            supplierId: id,
            page: query.page,
            limit: query.limit,
            action: query.action,
            resource: query.resource,
          },
          {
            supplierRepo: deps.supplierRepo,
            auditLogRepo: deps.auditLogRepo,
          }
        );
      });

      return result.ok
        ? reply.send(result.value)
        : reply.status(mapErrorToStatus(result.error)).send({ error: result.error });
    }
  );

  // ── Phase 1.1.5: Company Location Directory (CAP-LOC) ─────────────────

  app.get(
    '/portal/suppliers/:id/locations',
    { preHandler: [requirePermission(policy, 'supplier:read')] },
    async (req, reply) => {
      const { id } = IdParamSchema.parse(req.params);
      const { tenantId, userId } = extractIdentity(req);
      const query = LocationListQuerySchema.parse(req.query);

      const result = await runtime.withTenant({ tenantId, userId }, async (deps) => {
        if (!deps.companyLocationRepo) throw new Error('companyLocationRepo not configured');
        return getCompanyLocations(
          {
            tenantId,
            supplierId: id,
            locationType: query.locationType,
            includeInactive: query.includeInactive,
          },
          {
            supplierRepo: deps.supplierRepo,
            companyLocationRepo: deps.companyLocationRepo,
          }
        );
      });

      return result.ok
        ? reply.send(result.value)
        : reply.status(mapErrorToStatus(result.error)).send({ error: result.error });
    }
  );

  app.get(
    '/portal/suppliers/:id/locations/:locationId',
    { preHandler: [requirePermission(policy, 'supplier:read')] },
    async (req, reply) => {
      const { id } = IdParamSchema.parse(req.params);
      const locationId = (req.params as Record<string, string>).locationId!;
      const { tenantId, userId } = extractIdentity(req);

      const result = await runtime.withTenant({ tenantId, userId }, async (deps) => {
        if (!deps.companyLocationRepo) throw new Error('companyLocationRepo not configured');
        return getCompanyLocationById(
          {
            tenantId,
            supplierId: id,
            locationId,
          },
          {
            supplierRepo: deps.supplierRepo,
            companyLocationRepo: deps.companyLocationRepo,
          }
        );
      });

      return result.ok
        ? reply.send(result.value)
        : reply.status(mapErrorToStatus(result.error)).send({ error: result.error });
    }
  );

  // ── Phase 1.1.6: Senior Management Directory (CAP-DIR) ────────────────

  app.get(
    '/portal/suppliers/:id/directory',
    { preHandler: [requirePermission(policy, 'supplier:read')] },
    async (req, reply) => {
      const { id } = IdParamSchema.parse(req.params);
      const { tenantId, userId } = extractIdentity(req);
      const query = DirectoryListQuerySchema.parse(req.query);

      const result = await runtime.withTenant({ tenantId, userId }, async (deps) => {
        if (!deps.directoryRepo) throw new Error('directoryRepo not configured');
        return getDirectory(
          {
            tenantId,
            supplierId: id,
            department: query.department,
            escalationOnly: query.escalationOnly,
          },
          {
            supplierRepo: deps.supplierRepo,
            directoryRepo: deps.directoryRepo,
          }
        );
      });

      return result.ok
        ? reply.send(result.value)
        : reply.status(mapErrorToStatus(result.error)).send({ error: result.error });
    }
  );

  app.get(
    '/portal/suppliers/:id/directory/:entryId',
    { preHandler: [requirePermission(policy, 'supplier:read')] },
    async (req, reply) => {
      const { id } = IdParamSchema.parse(req.params);
      const entryId = (req.params as Record<string, string>).entryId!;
      const { tenantId, userId } = extractIdentity(req);

      const result = await runtime.withTenant({ tenantId, userId }, async (deps) => {
        if (!deps.directoryRepo) throw new Error('directoryRepo not configured');
        return getDirectoryEntry(
          {
            tenantId,
            supplierId: id,
            entryId,
          },
          {
            supplierRepo: deps.supplierRepo,
            directoryRepo: deps.directoryRepo,
          }
        );
      });

      return result.ok
        ? reply.send(result.value)
        : reply.status(mapErrorToStatus(result.error)).send({ error: result.error });
    }
  );

  // ── Phase 1.1.1: Case Management ────────────────────────────────────────

  app.post(
    '/portal/suppliers/:id/cases',
    { preHandler: [requirePermission(policy, 'supplier:write')] },
    async (req, reply) => {
      const { id } = IdParamSchema.parse(req.params);
      const { tenantId, userId } = extractIdentity(req);
      const body = CreateCaseSchema.parse(req.body);

      const result = await runtime.withTenant({ tenantId, userId }, async (deps) => {
        if (!deps.supplierCaseRepo || !deps.caseTimelineRepo)
          throw new Error('supplierCaseRepo / caseTimelineRepo not configured');
        return supplierCreateCase(
          {
            tenantId,
            supplierId: id,
            userId,
            category: body.category,
            priority: body.priority,
            subject: body.subject,
            description: body.description,
            linkedEntityType: body.linkedEntityType,
            linkedEntityId: body.linkedEntityId,
          },
          {
            supplierRepo: deps.supplierRepo,
            supplierCaseRepo: deps.supplierCaseRepo,
            caseTimelineRepo: deps.caseTimelineRepo,
            outboxWriter: deps.outboxWriter,
            proofChainWriter: deps.proofChainWriter,
          }
        );
      });

      return result.ok
        ? reply.status(201).send(result.value)
        : reply.status(mapErrorToStatus(result.error)).send({ error: result.error });
    }
  );

  app.get(
    '/portal/suppliers/:id/cases',
    { preHandler: [requirePermission(policy, 'supplier:read')] },
    async (req, reply) => {
      const { id } = IdParamSchema.parse(req.params);
      const { tenantId, userId } = extractIdentity(req);
      const query = CaseListQuerySchema.parse(req.query);

      const result = await runtime.withTenant({ tenantId, userId }, async (deps) => {
        if (!deps.supplierCaseRepo) throw new Error('supplierCaseRepo not configured');
        return supplierListCases(
          { tenantId, supplierId: id, query },
          {
            supplierRepo: deps.supplierRepo,
            supplierCaseRepo: deps.supplierCaseRepo,
          }
        );
      });

      return result.ok
        ? reply.send({
            ...result.value,
            page: query.page,
            limit: query.limit,
            hasMore: result.value.total > query.page * query.limit,
          })
        : reply.status(mapErrorToStatus(result.error)).send({ error: result.error });
    }
  );

  app.get(
    '/portal/suppliers/:id/cases/:caseId',
    { preHandler: [requirePermission(policy, 'supplier:read')] },
    async (req, reply) => {
      const { id } = IdParamSchema.parse(req.params);
      const caseId = (req.params as Record<string, string>).caseId!;
      const { tenantId, userId } = extractIdentity(req);

      const result = await runtime.withTenant({ tenantId, userId }, async (deps) => {
        if (!deps.supplierCaseRepo) throw new Error('supplierCaseRepo not configured');
        return supplierGetCase(
          { tenantId, supplierId: id, caseId },
          { supplierCaseRepo: deps.supplierCaseRepo }
        );
      });

      return result.ok
        ? reply.send(result.value)
        : reply.status(mapErrorToStatus(result.error)).send({ error: result.error });
    }
  );

  app.patch(
    '/portal/suppliers/:id/cases/:caseId/status',
    { preHandler: [requirePermission(policy, 'supplier:write')] },
    async (req, reply) => {
      const { id } = IdParamSchema.parse(req.params);
      const caseId = (req.params as Record<string, string>).caseId!;
      const { tenantId, userId } = extractIdentity(req);
      const body = TransitionCaseStatusSchema.parse(req.body);

      const result = await runtime.withTenant({ tenantId, userId }, async (deps) => {
        if (!deps.supplierCaseRepo || !deps.caseTimelineRepo)
          throw new Error('supplierCaseRepo / caseTimelineRepo not configured');
        return supplierTransitionCase(
          {
            tenantId,
            supplierId: id,
            userId,
            caseId,
            targetStatus: body.status,
            comment: body.comment,
          },
          {
            supplierRepo: deps.supplierRepo,
            supplierCaseRepo: deps.supplierCaseRepo,
            caseTimelineRepo: deps.caseTimelineRepo,
            outboxWriter: deps.outboxWriter,
            proofChainWriter: deps.proofChainWriter,
          }
        );
      });

      return result.ok
        ? reply.send(result.value)
        : reply.status(mapErrorToStatus(result.error)).send({ error: result.error });
    }
  );

  app.patch(
    '/portal/suppliers/:id/cases/:caseId/assign',
    { preHandler: [requirePermission(policy, 'supplier:write')] },
    async (req, reply) => {
      const { id } = IdParamSchema.parse(req.params);
      const caseId = (req.params as Record<string, string>).caseId!;
      const { tenantId, userId } = extractIdentity(req);
      const body = AssignCaseSchema.parse(req.body);

      const result = await runtime.withTenant({ tenantId, userId }, async (deps) => {
        if (!deps.supplierCaseRepo || !deps.caseTimelineRepo)
          throw new Error('supplierCaseRepo / caseTimelineRepo not configured');
        return supplierAssignCase(
          {
            tenantId,
            supplierId: id,
            userId,
            caseId,
            assignedTo: body.assignedTo,
            coAssignees: body.coAssignees,
            comment: body.comment,
          },
          {
            supplierRepo: deps.supplierRepo,
            supplierCaseRepo: deps.supplierCaseRepo,
            caseTimelineRepo: deps.caseTimelineRepo,
            outboxWriter: deps.outboxWriter,
            proofChainWriter: deps.proofChainWriter,
          }
        );
      });

      return result.ok
        ? reply.send(result.value)
        : reply.status(mapErrorToStatus(result.error)).send({ error: result.error });
    }
  );

  // ── Case Timeline ───────────────────────────────────────────────────────

  app.get(
    '/portal/suppliers/:id/cases/:caseId/timeline',
    { preHandler: [requirePermission(policy, 'supplier:read')] },
    async (req, reply) => {
      const { id } = IdParamSchema.parse(req.params);
      const caseId = (req.params as Record<string, string>).caseId!;
      const { tenantId, userId } = extractIdentity(req);
      const query = PaginationSchema.parse(req.query);

      const result = await runtime.withTenant({ tenantId, userId }, async (deps) => {
        if (!deps.supplierCaseRepo || !deps.caseTimelineRepo)
          throw new Error('supplierCaseRepo / caseTimelineRepo not configured');
        return supplierGetCaseTimeline(
          {
            tenantId,
            supplierId: id,
            caseId,
            page: query.page,
            limit: query.limit,
          },
          {
            supplierCaseRepo: deps.supplierCaseRepo,
            caseTimelineRepo: deps.caseTimelineRepo,
          }
        );
      });

      return result.ok
        ? reply.send({
            ...result.value,
            page: query.page,
            limit: query.limit,
            hasMore: result.value.total > query.page * query.limit,
          })
        : reply.status(mapErrorToStatus(result.error)).send({ error: result.error });
    }
  );

  app.post(
    '/portal/suppliers/:id/cases/:caseId/timeline',
    { preHandler: [requirePermission(policy, 'supplier:write')] },
    async (req, reply) => {
      const { id } = IdParamSchema.parse(req.params);
      const caseId = (req.params as Record<string, string>).caseId!;
      const { tenantId, userId } = extractIdentity(req);
      const body = AddTimelineMessageSchema.parse(req.body);

      const result = await runtime.withTenant({ tenantId, userId }, async (deps) => {
        if (!deps.supplierCaseRepo || !deps.caseTimelineRepo)
          throw new Error('supplierCaseRepo / caseTimelineRepo not configured');
        return supplierAddTimelineMessage(
          {
            tenantId,
            supplierId: id,
            userId,
            caseId,
            content: body.content,
            actorType: 'SUPPLIER',
          },
          {
            supplierCaseRepo: deps.supplierCaseRepo,
            caseTimelineRepo: deps.caseTimelineRepo,
            outboxWriter: deps.outboxWriter,
            proofChainWriter: deps.proofChainWriter,
          }
        );
      });

      return result.ok
        ? reply.status(201).send(result.value)
        : reply.status(mapErrorToStatus(result.error)).send({ error: result.error });
    }
  );

  // ─── N12: Onboarding Wizard (Phase 1.1.2 CAP-ONB) ──────────────────────

  // GET /portal/suppliers/:id/onboarding — get or create onboarding submission
  app.get(
    '/portal/suppliers/:id/onboarding',
    { preHandler: requirePermission(policy, 'PROFILE_UPDATE') },
    async (req, reply) => {
      const { id } = IdParamSchema.parse(req.params);
      const { tenantId, userId } = extractIdentity(req);

      const result = await runtime.withTenant({ tenantId, userId }, async (deps) => {
        if (!deps.onboardingRepo) throw new Error('onboardingRepo not configured');
        return supplierGetOnboarding(
          {
            supplierRepo: deps.supplierRepo,
            onboardingRepo: deps.onboardingRepo,
            outboxWriter: deps.outboxWriter,
            proofChainWriter: deps.proofChainWriter,
          },
          { tenantId, supplierId: id, userId }
        );
      });

      return result.ok
        ? reply.send(result.value)
        : reply.status(mapErrorToStatus(result.error)).send({ error: result.error });
    }
  );

  // PUT /portal/suppliers/:id/onboarding/draft — save draft for a wizard step
  app.put(
    '/portal/suppliers/:id/onboarding/draft',
    { preHandler: requirePermission(policy, 'PROFILE_UPDATE') },
    async (req, reply) => {
      const { id } = IdParamSchema.parse(req.params);
      const { tenantId, userId } = extractIdentity(req);
      const body = SaveOnboardingDraftSchema.parse(req.body);

      const result = await runtime.withTenant({ tenantId, userId }, async (deps) => {
        if (!deps.onboardingRepo) throw new Error('onboardingRepo not configured');
        return supplierSaveOnboardingDraft(
          {
            supplierRepo: deps.supplierRepo,
            onboardingRepo: deps.onboardingRepo,
            outboxWriter: deps.outboxWriter,
            proofChainWriter: deps.proofChainWriter,
          },
          { tenantId, supplierId: id, userId, step: body.step, draft: body.draft }
        );
      });

      return result.ok
        ? reply.send(result.value)
        : reply.status(mapErrorToStatus(result.error)).send({ error: result.error });
    }
  );

  // POST /portal/suppliers/:id/onboarding/submit — submit onboarding for review
  app.post(
    '/portal/suppliers/:id/onboarding/submit',
    { preHandler: requirePermission(policy, 'PROFILE_UPDATE') },
    async (req, reply) => {
      const { id } = IdParamSchema.parse(req.params);
      const { tenantId, userId } = extractIdentity(req);

      const result = await runtime.withTenant({ tenantId, userId }, async (deps) => {
        if (!deps.onboardingRepo) throw new Error('onboardingRepo not configured');
        return supplierSubmitOnboarding(
          {
            supplierRepo: deps.supplierRepo,
            onboardingRepo: deps.onboardingRepo,
            outboxWriter: deps.outboxWriter,
            proofChainWriter: deps.proofChainWriter,
          },
          { tenantId, supplierId: id, userId }
        );
      });

      return result.ok
        ? reply.send(result.value)
        : reply.status(mapErrorToStatus(result.error)).send({ error: result.error });
    }
  );

  // POST /portal/suppliers/:id/onboarding/approve — approve onboarding (buyer admin)
  app.post(
    '/portal/suppliers/:id/onboarding/approve',
    { preHandler: requirePermission(policy, 'USER_MANAGE') },
    async (req, reply) => {
      const { id } = IdParamSchema.parse(req.params);
      const { tenantId, userId } = extractIdentity(req);

      const result = await runtime.withTenant({ tenantId, userId }, async (deps) => {
        if (!deps.onboardingRepo) throw new Error('onboardingRepo not configured');
        return approveOnboarding(
          {
            supplierRepo: deps.supplierRepo,
            onboardingRepo: deps.onboardingRepo,
            outboxWriter: deps.outboxWriter,
            proofChainWriter: deps.proofChainWriter,
          },
          { tenantId, supplierId: id, reviewerId: userId }
        );
      });

      return result.ok
        ? reply.send(result.value)
        : reply.status(mapErrorToStatus(result.error)).send({ error: result.error });
    }
  );

  // POST /portal/suppliers/:id/onboarding/reject — reject onboarding (buyer admin)
  app.post(
    '/portal/suppliers/:id/onboarding/reject',
    { preHandler: requirePermission(policy, 'USER_MANAGE') },
    async (req, reply) => {
      const { id } = IdParamSchema.parse(req.params);
      const { tenantId, userId } = extractIdentity(req);
      const body = RejectOnboardingSchema.parse(req.body);

      const result = await runtime.withTenant({ tenantId, userId }, async (deps) => {
        if (!deps.onboardingRepo) throw new Error('onboardingRepo not configured');
        return rejectOnboarding(
          {
            supplierRepo: deps.supplierRepo,
            onboardingRepo: deps.onboardingRepo,
            outboxWriter: deps.outboxWriter,
            proofChainWriter: deps.proofChainWriter,
          },
          { tenantId, supplierId: id, reviewerId: userId, reason: body.reason }
        );
      });

      return result.ok
        ? reply.send(result.value)
        : reply.status(mapErrorToStatus(result.error)).send({ error: result.error });
    }
  );

  // ── Phase 1.1.7: Supplier Invitation Flow (CAP-INV) ────────────────────

  // POST /portal/invitations — send supplier invitation (buyer admin)
  app.post(
    '/portal/invitations',
    { preHandler: requirePermission(policy, 'USER_MANAGE') },
    async (req, reply) => {
      const { tenantId, userId } = extractIdentity(req);
      const body = SendInvitationRequestSchema.parse(req.body);

      const result = await runtime.withTenant({ tenantId, userId }, async (deps) => {
        if (!deps.invitationRepo) throw new Error('invitationRepo not configured');
        return sendInvitation(
          {
            tenantId,
            email: body.email,
            supplierName: body.supplierName,
            invitedBy: userId,
            invitationMessage: body.invitationMessage,
          },
          {
            invitationRepo: deps.invitationRepo,
            supplierRepo: deps.supplierRepo,
            outboxWriter: deps.outboxWriter,
            proofChainWriter: deps.proofChainWriter,
          }
        );
      });

      return result.ok
        ? reply.status(201).send(result.value)
        : reply.status(mapErrorToStatus(result.error)).send({ error: result.error });
    }
  );

  // GET /portal/invitations — list supplier invitations (buyer admin)
  app.get(
    '/portal/invitations',
    { preHandler: requirePermission(policy, 'USER_MANAGE') },
    async (req, reply) => {
      const { tenantId, userId } = extractIdentity(req);
      const query = InvitationListQuerySchema.parse(req.query);

      const result = await runtime.withTenant({ tenantId, userId }, async (deps) => {
        if (!deps.invitationRepo) throw new Error('invitationRepo not configured');
        return listInvitations(
          {
            tenantId,
            status: query.status,
            email: query.email,
            page: query.page,
            limit: query.limit,
          },
          {
            invitationRepo: deps.invitationRepo,
            supplierRepo: deps.supplierRepo,
            outboxWriter: deps.outboxWriter,
            proofChainWriter: deps.proofChainWriter,
          }
        );
      });

      return result.ok
        ? reply.send(result.value)
        : reply.status(mapErrorToStatus(result.error)).send({ error: result.error });
    }
  );

  // POST /portal/invitations/:id/revoke — revoke supplier invitation (buyer admin)
  app.post(
    '/portal/invitations/:id/revoke',
    { preHandler: requirePermission(policy, 'USER_MANAGE') },
    async (req, reply) => {
      const { id } = IdParamSchema.parse(req.params);
      const { tenantId, userId } = extractIdentity(req);

      const result = await runtime.withTenant({ tenantId, userId }, async (deps) => {
        if (!deps.invitationRepo) throw new Error('invitationRepo not configured');
        return revokeInvitation(
          {
            tenantId,
            invitationId: id,
            revokedBy: userId,
          },
          {
            invitationRepo: deps.invitationRepo,
            supplierRepo: deps.supplierRepo,
            outboxWriter: deps.outboxWriter,
            proofChainWriter: deps.proofChainWriter,
          }
        );
      });

      return result.ok
        ? reply.send(result.value)
        : reply.status(mapErrorToStatus(result.error)).send({ error: result.error });
    }
  );

  // POST /public/accept-invitation — accept invitation via magic link (no auth, public)
  app.post('/public/accept-invitation', async (req, reply) => {
    const body = AcceptInvitationRequestSchema.parse(req.body);

    // Use a dummy tenant context — the service function will find tenant from token
    const result = await runtime.withTenant(
      { tenantId: 'public', userId: 'system' },
      async (deps) => {
        if (!deps.invitationRepo) throw new Error('invitationRepo not configured');
        return acceptInvitation(
          { token: body.token },
          {
            invitationRepo: deps.invitationRepo,
            supplierRepo: deps.supplierRepo,
            outboxWriter: deps.outboxWriter,
            proofChainWriter: deps.proofChainWriter,
          }
        );
      }
    );

    return result.ok
      ? reply.send(result.value)
      : reply.status(mapErrorToStatus(result.error)).send({ error: result.error });
  });

  // ── SP-2009: Messaging Hub (Phase 1.2.1 CAP-MSG) ────────────────────────

  // POST /portal/suppliers/:id/messages/threads — start a thread
  app.post(
    '/portal/suppliers/:id/messages/threads',
    { preHandler: [requirePermission(policy, 'supplier:write')] },
    async (req, reply) => {
      const { id } = IdParamSchema.parse(req.params);
      const { tenantId, userId } = extractIdentity(req);
      const body = StartThreadRequestSchema.parse(req.body);

      const result = await runtime.withTenant({ tenantId, userId }, async (deps) => {
        if (!deps.messageThreadRepo) throw new Error('messageThreadRepo not configured');
        if (!deps.messageRepo) throw new Error('messageRepo not configured');
        if (!deps.supplierCaseRepo) throw new Error('supplierCaseRepo not configured');
        if (!deps.caseTimelineRepo) throw new Error('caseTimelineRepo not configured');
        return startThread(
          {
            tenantId,
            supplierId: id,
            userId,
            senderType: 'SUPPLIER',
            caseId: body.caseId ?? undefined,
            subject: body.subject,
            initialMessageBody: body.initialMessageBody,
            attachmentIds: body.attachmentIds ?? [],
            idempotencyKey: body.idempotencyKey ?? undefined,
          },
          {
            messageThreadRepo: deps.messageThreadRepo,
            messageRepo: deps.messageRepo,
            supplierCaseRepo: deps.supplierCaseRepo!,
            caseTimelineRepo: deps.caseTimelineRepo!,
            supplierRepo: deps.supplierRepo,
            outboxWriter: deps.outboxWriter,
            proofChainWriter: deps.proofChainWriter,
          }
        );
      });

      return result.ok
        ? reply.status(201).send(result.value)
        : reply.status(mapErrorToStatus(result.error)).send({ error: result.error });
    }
  );

  // GET /portal/suppliers/:id/messages/threads — list threads
  app.get(
    '/portal/suppliers/:id/messages/threads',
    { preHandler: [requirePermission(policy, 'supplier:read')] },
    async (req, reply) => {
      const { id } = IdParamSchema.parse(req.params);
      const { tenantId, userId } = extractIdentity(req);
      const query = ThreadListQuerySchema.parse(req.query);

      const result = await runtime.withTenant({ tenantId, userId }, async (deps) => {
        if (!deps.messageThreadRepo) throw new Error('messageThreadRepo not configured');
        if (!deps.messageRepo) throw new Error('messageRepo not configured');
        if (!deps.supplierCaseRepo) throw new Error('supplierCaseRepo not configured');
        if (!deps.caseTimelineRepo) throw new Error('caseTimelineRepo not configured');
        return listThreads(
          {
            tenantId,
            supplierId: id,
            caseId: query.caseId ?? undefined,
            includeArchived: query.includeArchived ?? false,
            page: query.page ?? 1,
            limit: query.limit ?? 20,
          },
          {
            messageThreadRepo: deps.messageThreadRepo,
            messageRepo: deps.messageRepo,
            supplierCaseRepo: deps.supplierCaseRepo!,
            caseTimelineRepo: deps.caseTimelineRepo!,
            supplierRepo: deps.supplierRepo,
            outboxWriter: deps.outboxWriter,
            proofChainWriter: deps.proofChainWriter,
          }
        );
      });

      return result.ok
        ? reply.send(result.value)
        : reply.status(mapErrorToStatus(result.error)).send({ error: result.error });
    }
  );

  // POST /portal/suppliers/:id/messages/threads/:threadId/messages — send message
  app.post(
    '/portal/suppliers/:id/messages/threads/:threadId/messages',
    { preHandler: [requirePermission(policy, 'supplier:write')] },
    async (req, reply) => {
      const { id, threadId } = req.params as { id: string; threadId: string };
      const { tenantId, userId } = extractIdentity(req);
      const body = SendMessageRequestSchema.parse(req.body);

      const result = await runtime.withTenant({ tenantId, userId }, async (deps) => {
        if (!deps.messageThreadRepo) throw new Error('messageThreadRepo not configured');
        if (!deps.messageRepo) throw new Error('messageRepo not configured');
        if (!deps.supplierCaseRepo) throw new Error('supplierCaseRepo not configured');
        if (!deps.caseTimelineRepo) throw new Error('caseTimelineRepo not configured');
        return sendMessage(
          {
            tenantId,
            supplierId: id,
            threadId,
            userId,
            senderType: 'SUPPLIER',
            body: body.body,
            attachmentIds: body.attachmentIds ?? [],
            idempotencyKey: body.idempotencyKey ?? undefined,
          },
          {
            messageThreadRepo: deps.messageThreadRepo,
            messageRepo: deps.messageRepo,
            supplierCaseRepo: deps.supplierCaseRepo!,
            caseTimelineRepo: deps.caseTimelineRepo!,
            supplierRepo: deps.supplierRepo,
            outboxWriter: deps.outboxWriter,
            proofChainWriter: deps.proofChainWriter,
          }
        );
      });

      return result.ok
        ? reply.status(201).send(result.value)
        : reply.status(mapErrorToStatus(result.error)).send({ error: result.error });
    }
  );

  // GET /portal/suppliers/:id/messages/threads/:threadId/messages — list messages
  app.get(
    '/portal/suppliers/:id/messages/threads/:threadId/messages',
    { preHandler: [requirePermission(policy, 'supplier:read')] },
    async (req, reply) => {
      const { threadId } = req.params as { id: string; threadId: string };
      const { tenantId, userId } = extractIdentity(req);
      const query = MessageListQuerySchema.parse(req.query);

      const result = await runtime.withTenant({ tenantId, userId }, async (deps) => {
        if (!deps.messageThreadRepo) throw new Error('messageThreadRepo not configured');
        if (!deps.messageRepo) throw new Error('messageRepo not configured');
        if (!deps.supplierCaseRepo) throw new Error('supplierCaseRepo not configured');
        if (!deps.caseTimelineRepo) throw new Error('caseTimelineRepo not configured');
        return listMessages(
          {
            tenantId,
            threadId,
            page: query.page ?? 1,
            limit: query.limit ?? 50,
          },
          {
            messageThreadRepo: deps.messageThreadRepo,
            messageRepo: deps.messageRepo,
            supplierCaseRepo: deps.supplierCaseRepo!,
            caseTimelineRepo: deps.caseTimelineRepo!,
            supplierRepo: deps.supplierRepo,
            outboxWriter: deps.outboxWriter,
            proofChainWriter: deps.proofChainWriter,
          }
        );
      });

      return result.ok
        ? reply.send(result.value)
        : reply.status(mapErrorToStatus(result.error)).send({ error: result.error });
    }
  );

  // PATCH /portal/suppliers/:id/messages/:messageId/read — mark message read
  app.patch(
    '/portal/suppliers/:id/messages/:messageId/read',
    { preHandler: [requirePermission(policy, 'supplier:write')] },
    async (req, reply) => {
      const { messageId } = req.params as { id: string; messageId: string };
      const { tenantId, userId } = extractIdentity(req);
      const body = MarkReadRequestSchema.parse(req.body);

      const result = await runtime.withTenant({ tenantId, userId }, async (deps) => {
        if (!deps.messageThreadRepo) throw new Error('messageThreadRepo not configured');
        if (!deps.messageRepo) throw new Error('messageRepo not configured');
        if (!deps.supplierCaseRepo) throw new Error('supplierCaseRepo not configured');
        if (!deps.caseTimelineRepo) throw new Error('caseTimelineRepo not configured');

        // Need to find the message first to get threadId
        const message = await deps.messageRepo.findById(tenantId, messageId);
        if (!message) {
          return {
            ok: false as const,
            error: { code: 'NOT_FOUND', message: 'Message not found' },
          };
        }

        return markMessageRead(
          {
            tenantId,
            messageId,
            threadId: message.threadId,
            readBy: body.readBy ?? userId,
            readerSide: 'supplier',
          },
          {
            messageThreadRepo: deps.messageThreadRepo,
            messageRepo: deps.messageRepo,
            supplierCaseRepo: deps.supplierCaseRepo!,
            caseTimelineRepo: deps.caseTimelineRepo!,
            supplierRepo: deps.supplierRepo,
            outboxWriter: deps.outboxWriter,
            proofChainWriter: deps.proofChainWriter,
          }
        );
      });

      return result.ok
        ? reply.send(result.value)
        : reply
            .status(mapErrorToStatus(result.error as import('@afenda/core').AppError))
            .send({ error: result.error });
    }
  );

  // GET /portal/suppliers/:id/messages/sse — SSE long-poll for new messages
  // Pattern: poll every 30s; returns unread count since ?since=<ISO>
  app.get(
    '/portal/suppliers/:id/messages/sse',
    { preHandler: [requirePermission(policy, 'supplier:read')] },
    async (req, reply) => {
      const { id } = IdParamSchema.parse(req.params);
      const { tenantId, userId } = extractIdentity(req);

      reply.raw.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
        'X-Accel-Buffering': 'no',
      });

      // Emit an initial heartbeat so the client knows the connection is live
      reply.raw.write(`data: ${JSON.stringify({ type: 'connected', supplierId: id, userId })}\n\n`);

      // Heartbeat every 25s to keep connection alive through proxies
      const heartbeat = setInterval(() => {
        if (!reply.raw.writableEnded) {
          reply.raw.write(`: heartbeat\n\n`);
        }
      }, 25_000);

      // Close cleanly when client disconnects
      req.raw.on('close', () => {
        clearInterval(heartbeat);
        if (!reply.raw.writableEnded) reply.raw.end();
      });

      // Keep connection open (Fastify won't auto-close for SSE)
      return reply;
    }
  );

  // ─── CAP-SOS: Breakglass Escalation (Phase 1.2.2) ──────────────────────────

  // POST /portal/suppliers/:id/escalations — trigger breakglass escalation
  app.post(
    '/portal/suppliers/:id/escalations',
    { preHandler: [requirePermission(policy, 'supplier:write')] },
    async (req, reply) => {
      const { id } = IdParamSchema.parse(req.params);
      const { tenantId, userId } = extractIdentity(req);
      const body = TriggerEscalationRequestSchema.parse(req.body);

      const result = await runtime.withTenant({ tenantId, userId }, async (deps) => {
        if (!deps.escalationRepo) throw new Error('escalationRepo not configured');
        if (!deps.supplierCaseRepo) throw new Error('supplierCaseRepo not configured');
        if (!deps.directoryRepo) throw new Error('directoryRepo not configured');
        return triggerEscalation(
          {
            tenantId,
            supplierId: id,
            triggeredBy: userId,
            caseId: body.caseId,
            reason: body.reason,
          },
          {
            escalationRepo: deps.escalationRepo,
            supplierCaseRepo: deps.supplierCaseRepo,
            directoryRepo: deps.directoryRepo,
            outboxWriter: deps.outboxWriter,
            proofChainWriter: deps.proofChainWriter,
          }
        );
      });

      return result.ok
        ? reply.status(201).send(result.value)
        : reply.status(mapErrorToStatus(result.error)).send({ error: result.error });
    }
  );

  // GET /portal/suppliers/:id/escalations — list escalations
  app.get(
    '/portal/suppliers/:id/escalations',
    { preHandler: [requirePermission(policy, 'supplier:read')] },
    async (req, reply) => {
      const { id } = IdParamSchema.parse(req.params);
      const { tenantId, userId } = extractIdentity(req);
      const query = EscalationListQuerySchema.parse(req.query);

      const result = await runtime.withTenant({ tenantId, userId }, async (deps) => {
        if (!deps.escalationRepo) throw new Error('escalationRepo not configured');
        return listEscalations(
          {
            tenantId,
            supplierId: id,
            page: query.page,
            limit: query.limit,
            status: query.status,
            caseId: query.caseId,
          },
          { escalationRepo: deps.escalationRepo }
        );
      });

      return result.ok
        ? reply.send(result.value)
        : reply.status(mapErrorToStatus(result.error)).send({ error: result.error });
    }
  );

  // GET /portal/suppliers/:id/escalations/:escalationId — get single escalation with SLA
  app.get(
    '/portal/suppliers/:id/escalations/:escalationId',
    { preHandler: [requirePermission(policy, 'supplier:read')] },
    async (req, reply) => {
      const { id } = IdParamSchema.parse(req.params);
      const { escalationId } = req.params as { escalationId: string };
      const { tenantId, userId } = extractIdentity(req);

      const result = await runtime.withTenant({ tenantId, userId }, async (deps) => {
        if (!deps.escalationRepo) throw new Error('escalationRepo not configured');
        return getEscalation(
          { tenantId, supplierId: id, escalationId },
          { escalationRepo: deps.escalationRepo }
        );
      });

      return result.ok
        ? reply.send(result.value)
        : reply.status(mapErrorToStatus(result.error)).send({ error: result.error });
    }
  );

  // PATCH /portal/suppliers/:id/escalations/:escalationId/resolve — resolve escalation (buyer)
  app.patch(
    '/portal/suppliers/:id/escalations/:escalationId/resolve',
    { preHandler: [requirePermission(policy, 'supplier:write')] },
    async (req, reply) => {
      const { escalationId } = req.params as { escalationId: string };
      const { tenantId, userId } = extractIdentity(req);
      const body = ResolveEscalationRequestSchema.parse(req.body);

      const result = await runtime.withTenant({ tenantId, userId }, async (deps) => {
        if (!deps.escalationRepo) throw new Error('escalationRepo not configured');
        if (!deps.supplierCaseRepo) throw new Error('supplierCaseRepo not configured');
        if (!deps.directoryRepo) throw new Error('directoryRepo not configured');
        return resolveEscalation(
          {
            tenantId,
            resolvedBy: userId,
            escalationId,
            resolutionNotes: body.resolutionNotes,
          },
          {
            escalationRepo: deps.escalationRepo,
            supplierCaseRepo: deps.supplierCaseRepo,
            directoryRepo: deps.directoryRepo,
            outboxWriter: deps.outboxWriter,
            proofChainWriter: deps.proofChainWriter,
          }
        );
      });

      return result.ok
        ? reply.send(result.value)
        : reply.status(mapErrorToStatus(result.error)).send({ error: result.error });
    }
  );

  // ─── CAP-ANNOUNCE (P24): Dashboard Announcements ─────────────────────────────

  // GET /portal/suppliers/:id/announcements — supplier reads active announcements
  app.get(
    '/portal/suppliers/:id/announcements',
    { preHandler: [requirePermission(policy, 'supplier:read')] },
    async (req, reply) => {
      const { tenantId } = extractIdentity(req);

      const result = await runtime.withTenant({ tenantId, userId: '' }, async (deps) => {
        if (!deps.announcementRepo) throw new Error('announcementRepo not configured');
        return getActiveAnnouncements({ tenantId }, { announcementRepo: deps.announcementRepo });
      });

      return result.ok
        ? reply.send(result.value)
        : reply.status(mapErrorToStatus(result.error)).send({ error: result.error });
    }
  );

  // GET /portal/announcements — buyer admin lists all announcements (with filters)
  app.get(
    '/portal/announcements',
    { preHandler: [requirePermission(policy, 'USER_MANAGE')] },
    async (req, reply) => {
      const { tenantId, userId } = extractIdentity(req);
      const query = AnnouncementListQuerySchema.parse(req.query);

      const result = await runtime.withTenant({ tenantId, userId }, async (deps) => {
        if (!deps.announcementRepo) throw new Error('announcementRepo not configured');
        return listAllAnnouncements(
          {
            tenantId,
            pinned: query.pinned,
            severity: query.severity,
            includeArchived: query.includeArchived,
            page: query.page,
            limit: query.limit,
          },
          { announcementRepo: deps.announcementRepo }
        );
      });

      return result.ok
        ? reply.send(result.value)
        : reply.status(mapErrorToStatus(result.error)).send({ error: result.error });
    }
  );

  // POST /portal/announcements — buyer admin creates announcement
  app.post(
    '/portal/announcements',
    { preHandler: [requirePermission(policy, 'USER_MANAGE')] },
    async (req, reply) => {
      const { tenantId, userId } = extractIdentity(req);
      const body = CreateAnnouncementSchema.parse(req.body);

      const result = await runtime.withTenant({ tenantId, userId }, async (deps) => {
        if (!deps.announcementRepo) throw new Error('announcementRepo not configured');
        return createAnnouncement(
          {
            tenantId,
            createdBy: userId,
            title: body.title,
            body: body.body,
            severity: body.severity,
            pinned: body.pinned,
            validFrom: body.validFrom ? new Date(body.validFrom) : new Date(),
            validUntil: body.validUntil ? new Date(body.validUntil) : null,
          },
          { announcementRepo: deps.announcementRepo }
        );
      });

      return result.ok
        ? reply.status(201).send(result.value)
        : reply.status(mapErrorToStatus(result.error)).send({ error: result.error });
    }
  );

  // PATCH /portal/announcements/:announcementId — buyer admin updates announcement
  app.patch(
    '/portal/announcements/:announcementId',
    { preHandler: [requirePermission(policy, 'USER_MANAGE')] },
    async (req, reply) => {
      const { announcementId } = req.params as { announcementId: string };
      const { tenantId, userId } = extractIdentity(req);
      const body = UpdateAnnouncementSchema.parse(req.body);

      const result = await runtime.withTenant({ tenantId, userId }, async (deps) => {
        if (!deps.announcementRepo) throw new Error('announcementRepo not configured');
        return updateAnnouncement(
          {
            tenantId,
            announcementId,
            updatedBy: userId,
            patch: {
              title: body.title,
              body: body.body,
              severity: body.severity,
              pinned: body.pinned,
              validFrom: body.validFrom ? new Date(body.validFrom) : undefined,
              validUntil:
                body.validUntil !== undefined
                  ? body.validUntil
                    ? new Date(body.validUntil)
                    : null
                  : undefined,
            },
          },
          { announcementRepo: deps.announcementRepo }
        );
      });

      return result.ok
        ? reply.send(result.value)
        : reply.status(mapErrorToStatus(result.error)).send({ error: result.error });
    }
  );

  // DELETE /portal/announcements/:announcementId — buyer admin archives announcement
  app.delete(
    '/portal/announcements/:announcementId',
    { preHandler: [requirePermission(policy, 'USER_MANAGE')] },
    async (req, reply) => {
      const { announcementId } = req.params as { announcementId: string };
      const { tenantId, userId } = extractIdentity(req);

      const result = await runtime.withTenant({ tenantId, userId }, async (deps) => {
        if (!deps.announcementRepo) throw new Error('announcementRepo not configured');
        return archiveAnnouncement(
          { tenantId, announcementId, archivedBy: userId },
          { announcementRepo: deps.announcementRepo }
        );
      });

      return result.ok
        ? reply.status(204).send()
        : reply.status(mapErrorToStatus(result.error)).send({ error: result.error });
    }
  );

  // ─── CAP-PROOF (P25): Proof Chain Verification ────────────────────────────────

  // GET /portal/suppliers/:id/proof?page=1&limit=50 — supplier reads tamper-evident proof chain
  app.get(
    '/portal/suppliers/:id/proof',
    { preHandler: [requirePermission(policy, 'supplier:read')] },
    async (req, reply) => {
      const { id: supplierId } = req.params as { id: string };
      const { tenantId } = extractIdentity(req);
      const { page = '1', limit = '50' } = req.query as { page?: string; limit?: string };
      const pageNum = Math.max(1, parseInt(page, 10) || 1);
      const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 50));
      const offset = (pageNum - 1) * limitNum;

      const result = await runtime.withTenant({ tenantId, userId: '' }, async (deps) => {
        if (!deps.proofChainReader) throw new Error('proofChainReader not configured');
        return deps.proofChainReader.listBySupplier(tenantId, supplierId, {
          limit: limitNum,
          offset,
        });
      });

      return reply.send({
        ...result,
        page: pageNum,
        limit: limitNum,
        hasMore: offset + limitNum < result.total,
      });
    }
  );

  // ─── CAP-APPT (P27): Appointment Scheduling ──────────────────────────────────

  // GET /portal/suppliers/:id/appointments — supplier lists own meeting requests
  app.get(
    '/portal/suppliers/:id/appointments',
    { preHandler: [requirePermission(policy, 'supplier:read')] },
    async (req, reply) => {
      const { id: supplierId } = req.params as { id: string };
      const { tenantId, userId } = extractIdentity(req);
      const parsed = MeetingRequestListQuerySchema.safeParse(req.query);
      if (!parsed.success) return reply.status(400).send({ error: parsed.error });

      const result = await runtime.withTenant({ tenantId, userId }, async (deps) => {
        if (!deps.meetingRequestRepo) throw new Error('meetingRequestRepo not configured');
        return listMeetingRequests(
          {
            tenantId,
            supplierId,
            status: parsed.data.status,
            page: parsed.data.page,
            limit: parsed.data.limit,
          },
          { meetingRequestRepo: deps.meetingRequestRepo }
        );
      });

      return result.ok
        ? reply.send(result.value)
        : reply.status(mapErrorToStatus(result.error)).send({ error: result.error });
    }
  );

  // POST /portal/suppliers/:id/appointments — supplier creates a meeting request
  app.post(
    '/portal/suppliers/:id/appointments',
    { preHandler: [requirePermission(policy, 'supplier:write')] },
    async (req, reply) => {
      const { id: supplierId } = req.params as { id: string };
      const { tenantId, userId } = extractIdentity(req);
      const parsed = CreateMeetingRequestSchema.safeParse(req.body);
      if (!parsed.success) return reply.status(400).send({ error: parsed.error });

      const result = await runtime.withTenant({ tenantId, userId }, async (deps) => {
        if (!deps.meetingRequestRepo) throw new Error('meetingRequestRepo not configured');
        return requestMeeting(
          {
            tenantId,
            requestedBy: userId,
            supplierId,
            requestedWith: parsed.data.requestedWith,
            meetingType: parsed.data.meetingType,
            agenda: parsed.data.agenda,
            location: parsed.data.location,
            proposedTimes: parsed.data.proposedTimes,
            durationMinutes: parsed.data.durationMinutes,
            caseId: parsed.data.caseId,
            escalationId: parsed.data.escalationId,
          },
          { meetingRequestRepo: deps.meetingRequestRepo }
        );
      });

      return result.ok
        ? reply.status(201).send(result.value)
        : reply.status(mapErrorToStatus(result.error)).send({ error: result.error });
    }
  );

  // GET /portal/appointments/:id — get meeting request detail
  app.get(
    '/portal/appointments/:id',
    { preHandler: [requirePermission(policy, 'supplier:read')] },
    async (req, reply) => {
      const { id: meetingId } = req.params as { id: string };
      const { tenantId, userId } = extractIdentity(req);

      const result = await runtime.withTenant({ tenantId, userId }, async (deps) => {
        if (!deps.meetingRequestRepo) throw new Error('meetingRequestRepo not configured');
        return getMeetingRequest(tenantId, meetingId, {
          meetingRequestRepo: deps.meetingRequestRepo,
        });
      });

      return result.ok
        ? reply.send(result.value)
        : reply.status(mapErrorToStatus(result.error)).send({ error: result.error });
    }
  );

  // POST /portal/appointments/:id/confirm — buyer confirms a proposed time slot
  app.post(
    '/portal/appointments/:id/confirm',
    { preHandler: [requirePermission(policy, 'USER_MANAGE')] },
    async (req, reply) => {
      const { id: meetingId } = req.params as { id: string };
      const { tenantId, userId } = extractIdentity(req);
      const parsed = ConfirmMeetingRequestSchema.safeParse(req.body);
      if (!parsed.success) return reply.status(400).send({ error: parsed.error });

      const result = await runtime.withTenant({ tenantId, userId }, async (deps) => {
        if (!deps.meetingRequestRepo) throw new Error('meetingRequestRepo not configured');
        return confirmMeeting(
          {
            tenantId,
            meetingId,
            confirmedTime: parsed.data.confirmedTime,
            buyerNotes: parsed.data.buyerNotes,
            location: parsed.data.location,
          },
          { meetingRequestRepo: deps.meetingRequestRepo }
        );
      });

      return result.ok
        ? reply.send(result.value)
        : reply.status(mapErrorToStatus(result.error)).send({ error: result.error });
    }
  );

  // POST /portal/appointments/:id/cancel — either party cancels a meeting
  app.post(
    '/portal/appointments/:id/cancel',
    { preHandler: [requirePermission(policy, 'supplier:write')] },
    async (req, reply) => {
      const { id: meetingId } = req.params as { id: string };
      const { tenantId, userId } = extractIdentity(req);
      const parsed = CancelMeetingRequestSchema.safeParse(req.body);
      if (!parsed.success) return reply.status(400).send({ error: parsed.error });

      const result = await runtime.withTenant({ tenantId, userId }, async (deps) => {
        if (!deps.meetingRequestRepo) throw new Error('meetingRequestRepo not configured');
        return cancelMeeting(
          {
            tenantId,
            meetingId,
            cancellationReason: parsed.data.cancellationReason,
          },
          { meetingRequestRepo: deps.meetingRequestRepo }
        );
      });

      return result.ok
        ? reply.send(result.value)
        : reply.status(mapErrorToStatus(result.error)).send({ error: result.error });
    }
  );

  // ─── CAP-PAY-ETA: Payment Status Tracking (SP-5011) ──────────────────────

  // GET /portal/payment-runs/:runId/status-timeline — supplier views full payment status history
  app.get(
    '/portal/payment-runs/:runId/status-timeline',
    { preHandler: [requirePermission(policy, 'supplier:read')] },
    async (req, reply) => {
      const { runId } = req.params as { runId: string };
      const { tenantId, userId } = extractIdentity(req);
      const qr = req.query as Record<string, string>;
      const page = qr.page ? parseInt(qr.page, 10) : 1;
      const limit = qr.limit ? parseInt(qr.limit, 10) : 20;
      const invoiceId = qr.invoiceId ?? undefined;

      const result = await runtime.withTenant({ tenantId, userId }, async (deps) => {
        if (!deps.paymentStatusFactRepo) throw new Error('paymentStatusFactRepo not configured');
        return getPaymentStatusTimeline(
          { tenantId, paymentRunId: runId, invoiceId, page, limit },
          { paymentStatusFactRepo: deps.paymentStatusFactRepo }
        );
      });

      return result.ok
        ? reply.send(result.value)
        : reply.status(mapErrorToStatus(result.error)).send({ error: result.error });
    }
  );

  // GET /portal/payment-runs/:runId/current-status — lightweight current stage lookup
  app.get(
    '/portal/payment-runs/:runId/current-status',
    { preHandler: [requirePermission(policy, 'supplier:read')] },
    async (req, reply) => {
      const { runId } = req.params as { runId: string };
      const { tenantId, userId } = extractIdentity(req);

      const result = await runtime.withTenant({ tenantId, userId }, async (deps) => {
        if (!deps.paymentStatusFactRepo) throw new Error('paymentStatusFactRepo not configured');
        return getCurrentPaymentStatus(
          { tenantId, paymentRunId: runId },
          { paymentStatusFactRepo: deps.paymentStatusFactRepo }
        );
      });

      return result.ok
        ? reply.send(result.value)
        : reply.status(mapErrorToStatus(result.error)).send({ error: result.error });
    }
  );

  // GET /portal/invoices/:invoiceId/payment-status — invoice-level payment status
  app.get(
    '/portal/invoices/:invoiceId/payment-status',
    { preHandler: [requirePermission(policy, 'supplier:read')] },
    async (req, reply) => {
      const { invoiceId } = req.params as { invoiceId: string };
      const { tenantId, userId } = extractIdentity(req);

      const result = await runtime.withTenant({ tenantId, userId }, async (deps) => {
        if (!deps.paymentStatusFactRepo) throw new Error('paymentStatusFactRepo not configured');
        return getInvoicePaymentStatus(
          { tenantId, invoiceId },
          { paymentStatusFactRepo: deps.paymentStatusFactRepo }
        );
      });

      return result.ok
        ? reply.send(result.value)
        : reply.status(mapErrorToStatus(result.error)).send({ error: result.error });
    }
  );

  // POST /portal/payment-runs/:runId/status — AP team records a new payment status event
  app.post(
    '/portal/payment-runs/:runId/status',
    { preHandler: [requirePermission(policy, 'USER_MANAGE')] },
    async (req, reply) => {
      const { runId } = req.params as { runId: string };
      const { tenantId, userId } = extractIdentity(req);

      const body = req.body as {
        id: string;
        supplierId: string;
        invoiceId?: string;
        newStage: string;
        source: string;
        reference?: string;
        holdReason?: string;
        nextActionHref?: string;
        note?: string;
        linkedCaseId?: string;
        eventAt?: string;
      };

      // Validate stage and source
      const stageParsed = PaymentStageSchema.safeParse(body.newStage);
      const sourceParsed = PaymentSourceSchema.safeParse(body.source);
      if (!stageParsed.success) return reply.status(400).send({ error: 'Invalid payment stage' });
      if (!sourceParsed.success) return reply.status(400).send({ error: 'Invalid payment source' });

      const result = await runtime.withTenant({ tenantId, userId }, async (deps) => {
        if (!deps.paymentStatusFactRepo) throw new Error('paymentStatusFactRepo not configured');
        return recordPaymentStatus(
          {
            id: body.id,
            tenantId,
            paymentRunId: runId,
            invoiceId: body.invoiceId ?? null,
            supplierId: body.supplierId,
            newStage: stageParsed.data,
            source: sourceParsed.data,
            reference: body.reference ?? null,
            holdReason: body.holdReason as any,
            nextActionHref: body.nextActionHref ?? null,
            note: body.note ?? null,
            linkedCaseId: body.linkedCaseId ?? null,
            eventAt: body.eventAt ? new Date(body.eventAt) : new Date(),
            createdBy: userId,
            createdByType: 'BUYER',
          },
          { paymentStatusFactRepo: deps.paymentStatusFactRepo }
        );
      });

      return result.ok
        ? reply.status(201).send(result.value)
        : reply.status(mapErrorToStatus(result.error)).send({ error: result.error });
    }
  );

  // ─── CAP-SCF: Supply Chain Finance / Early Payment Offers (SP-5014) ───────

  // GET /portal/suppliers/:supplierId/early-payment-offers — list offers for supplier
  app.get(
    '/portal/suppliers/:supplierId/early-payment-offers',
    { preHandler: [requirePermission(policy, 'supplier:read')] },
    async (req, reply) => {
      const { supplierId } = req.params as { supplierId: string };
      const { tenantId } = extractIdentity(req);
      const qr = req.query as Record<string, string>;

      const queryParsed = EarlyPaymentOfferListQuerySchema.safeParse({
        status: qr.status,
        page: qr.page,
        limit: qr.limit,
      });

      if (!queryParsed.success) {
        return reply.status(400).send({ error: queryParsed.error.flatten() });
      }

      const result = await runtime.withTenant({ tenantId, userId: tenantId }, async (deps) => {
        if (!deps.earlyPaymentOfferRepo) throw new Error('earlyPaymentOfferRepo not configured');
        return listEarlyPaymentOffers(deps.earlyPaymentOfferRepo, supplierId, queryParsed.data);
      });
      return result.ok
        ? reply.send(result.value)
        : reply.status(mapErrorToStatus(result.error)).send({ error: result.error });
    }
  );

  // GET /portal/suppliers/:supplierId/early-payment-offers/:offerId — get single offer
  app.get(
    '/portal/suppliers/:supplierId/early-payment-offers/:offerId',
    { preHandler: [requirePermission(policy, 'supplier:read')] },
    async (req, reply) => {
      const { supplierId, offerId } = req.params as { supplierId: string; offerId: string };
      const { tenantId, userId } = extractIdentity(req);

      const result = await runtime.withTenant({ tenantId, userId }, async (deps) => {
        if (!deps.earlyPaymentOfferRepo) throw new Error('earlyPaymentOfferRepo not configured');
        return getEarlyPaymentOffer(deps.earlyPaymentOfferRepo, offerId, supplierId);
      });
      return result.ok
        ? reply.send(result.value)
        : reply.status(mapErrorToStatus(result.error)).send({ error: result.error });
    }
  );

  // POST /portal/suppliers/:supplierId/early-payment-offers/:offerId/accept — supplier accepts
  app.post(
    '/portal/suppliers/:supplierId/early-payment-offers/:offerId/accept',
    { preHandler: [requirePermission(policy, 'supplier:write')] },
    async (req, reply) => {
      const { supplierId, offerId } = req.params as { supplierId: string; offerId: string };
      const { tenantId, userId } = extractIdentity(req);

      const result = await runtime.withTenant({ tenantId, userId }, async (deps) => {
        if (!deps.earlyPaymentOfferRepo) throw new Error('earlyPaymentOfferRepo not configured');
        return acceptEarlyPaymentOffer(deps.earlyPaymentOfferRepo, offerId, supplierId, userId);
      });
      return result.ok
        ? reply.send(result.value)
        : reply.status(mapErrorToStatus(result.error)).send({ error: result.error });
    }
  );

  // POST /portal/suppliers/:supplierId/early-payment-offers/:offerId/decline — supplier declines
  app.post(
    '/portal/suppliers/:supplierId/early-payment-offers/:offerId/decline',
    { preHandler: [requirePermission(policy, 'supplier:write')] },
    async (req, reply) => {
      const { supplierId, offerId } = req.params as { supplierId: string; offerId: string };
      const { tenantId, userId } = extractIdentity(req);
      const body = req.body as { reason?: string };

      const result = await runtime.withTenant({ tenantId, userId }, async (deps) => {
        if (!deps.earlyPaymentOfferRepo) throw new Error('earlyPaymentOfferRepo not configured');
        return declineEarlyPaymentOffer(
          deps.earlyPaymentOfferRepo,
          offerId,
          supplierId,
          body.reason
        );
      });
      return result.ok
        ? reply.send(result.value)
        : reply.status(mapErrorToStatus(result.error)).send({ error: result.error });
    }
  );

  // POST /portal/invoices/:invoiceId/early-payment-offer — AP creates offer for invoice
  app.post(
    '/portal/invoices/:invoiceId/early-payment-offer',
    { preHandler: [requirePermission(policy, 'USER_MANAGE')] },
    async (req, reply) => {
      const { invoiceId } = req.params as { invoiceId: string };
      const { tenantId, userId } = extractIdentity(req);
      const body = req.body as Record<string, unknown>;

      const parsed = CreateEarlyPaymentOfferSchema.safeParse({ ...body, invoiceId });
      if (!parsed.success) {
        return reply.status(400).send({ error: parsed.error.flatten() });
      }

      const result = await runtime.withTenant({ tenantId, userId }, async (deps) => {
        if (!deps.earlyPaymentOfferRepo) throw new Error('earlyPaymentOfferRepo not configured');
        return createEarlyPaymentOffer(deps.earlyPaymentOfferRepo, parsed.data, userId, tenantId);
      });
      return result.ok
        ? reply.status(201).send(result.value)
        : reply.status(mapErrorToStatus(result.error)).send({ error: result.error });
    }
  );

  // ─── CAP-BULK: Bulk Invoice Upload (SP-5015) ──────────────────────────────

  // POST /portal/suppliers/:id/invoices/bulk-upload
  // Accepts a JSON batch, validates + fingerprints + deduplicates rows,
  // and submits unique rows as DRAFT invoices.
  //
  // NOTE (Phase 2): The IBulkInvoiceSubmitter below is a stub that simulates
  // draft creation. Full wiring to apInvoices requires the portal_bulk_upload_batch
  // table (allows lightweight insert with supplierId + ref data only) and
  // supplier-level GL config lookup (companyId, ledgerId, currencyId).
  app.post(
    '/portal/suppliers/:id/invoices/bulk-upload',
    { preHandler: [requirePermission(policy, 'supplier:submit')] },
    async (req, reply) => {
      const { id: supplierId } = req.params as { id: string };
      const { tenantId, userId } = extractIdentity(req);

      const parsed = BulkUploadBatchSchema.safeParse(req.body);
      if (!parsed.success) {
        return reply.status(400).send({ error: parsed.error.flatten() });
      }

      // Stub submitter — Phase 2 will replace with real apInvoice insert
      const { randomUUID: uuidV4 } = await import('node:crypto');
      const stubSubmitter = {
        submitDraft: async (_params: unknown): Promise<string> => uuidV4(),
      };

      const result = await processBulkUpload(
        parsed.data,
        { supplierId, tenantId, userId },
        stubSubmitter
      );

      return reply.status(207).send(result); // 207 Multi-Status
    }
  );

  // ── CAP-CRDB: Submit a credit or debit note ─────────────────────────────
  // POST /portal/suppliers/:id/invoices/credit-debit-note
  app.post(
    '/portal/suppliers/:id/invoices/credit-debit-note',
    { preHandler: [requirePermission(policy, 'supplier:submit')] },
    async (req, reply) => {
      const { id: supplierId } = req.params as { id: string };
      const { tenantId, userId } = extractIdentity(req);

      const parsed = SubmitCreditDebitNoteSchema.safeParse(req.body);
      if (!parsed.success) {
        return reply.status(400).send({ error: parsed.error.flatten() });
      }

      const result = await runtime.withTenant({ tenantId, userId }, async (deps) => {
        // Resolve companyId + ledgerId from the original invoice
        const origResult = await deps.apInvoiceRepo.findById(parsed.data.originalInvoiceId);
        if (!origResult.ok) {
          return { _tag: 'not_found' as const };
        }

        return submitCreditDebitNote(
          {
            tenantId,
            supplierId,
            userId,
            documentType: parsed.data.documentType,
            originalInvoiceId: parsed.data.originalInvoiceId,
            noteNumber: parsed.data.noteNumber,
            noteDate: parsed.data.noteDate,
            reason: parsed.data.reason,
            adjustmentAmountMinorUnit: BigInt(parsed.data.adjustmentAmountMinorUnit),
            currencyCode: parsed.data.currencyCode,
            companyId: origResult.value.companyId,
            ledgerId: origResult.value.ledgerId,
            poRef: parsed.data.poRef,
          },
          {
            apInvoiceRepo: deps.apInvoiceRepo,
            supplierRepo: deps.supplierRepo,
          }
        );
      });

      if ('_tag' in result && result._tag === 'not_found') {
        return reply.status(404).send({ error: { message: 'Original invoice not found' } });
      }

      const crdbResult = result as Awaited<ReturnType<typeof submitCreditDebitNote>>;
      if (!crdbResult.ok) {
        const status =
          crdbResult.error.code === 'NOT_FOUND'
            ? 404
            : crdbResult.error.code === 'FORBIDDEN'
              ? 403
              : crdbResult.error.code === 'INVALID_STATE'
                ? 409
                : 422;
        return reply.status(status).send({ error: { message: crdbResult.error.message } });
      }

      const note = crdbResult.value;
      return reply.status(201).send({
        id: note.id,
        documentType: parsed.data.documentType,
        noteNumber: note.noteNumber,
        originalInvoiceId: note.originalInvoiceId,
        status: note.status,
        adjustmentAmountMinorUnit: parsed.data.adjustmentAmountMinorUnit,
        currencyCode: parsed.data.currencyCode,
        createdAt: new Date().toISOString(),
      });
    }
  );

  // ─── CAP-API: Webhook Subscriptions (SP-6010) ─────────────────────────────

  // GET /portal/suppliers/:id/webhooks — list subscriptions (no secrets)
  app.get(
    '/portal/suppliers/:id/webhooks',
    { preHandler: [requirePermission(policy, 'supplier:read')] },
    async (req, reply) => {
      const { id: supplierId } = req.params as { id: string };
      const { tenantId, userId } = extractIdentity(req);
      const result = await runtime.withTenant({ tenantId, userId }, async (deps) => {
        return listWebhooks({ webhookRepo: deps.webhookRepo! }, supplierId);
      });
      return reply.status(200).send({ data: result.ok ? result.value : [] });
    }
  );

  // POST /portal/suppliers/:id/webhooks — create subscription (returns signingSecret once)
  app.post(
    '/portal/suppliers/:id/webhooks',
    { preHandler: [requirePermission(policy, 'supplier:write')] },
    async (req, reply) => {
      const { id: supplierId } = req.params as { id: string };
      const { tenantId, userId } = extractIdentity(req);
      const body = req.body as {
        label?: string;
        endpointUrl?: string;
        eventTypes?: string[];
      };

      const result = await runtime.withTenant({ tenantId, userId }, async (deps) => {
        return createWebhook(
          { webhookRepo: deps.webhookRepo! },
          {
            tenantId,
            supplierId,
            createdBy: userId,
            label: body.label ?? '',
            endpointUrl: body.endpointUrl ?? '',
            eventTypes: (body.eventTypes ?? []) as never,
          }
        );
      });

      if (!result.ok) {
        const status =
          result.error.code === 'VALIDATION_ERROR'
            ? 400
            : result.error.code === 'LIMIT_EXCEEDED'
              ? 422
              : 400;
        return reply.status(status).send({ error: { message: result.error.message } });
      }

      // signingSecret is returned ONCE here — never retrievable after this.
      return reply.status(201).send({
        ...result.value.subscription,
        signingSecret: result.value.signingSecret,
      });
    }
  );

  // PATCH /portal/suppliers/:id/webhooks/:webhookId — update, pause, or resume
  app.patch(
    '/portal/suppliers/:id/webhooks/:webhookId',
    { preHandler: [requirePermission(policy, 'supplier:write')] },
    async (req, reply) => {
      const { id: supplierId, webhookId } = req.params as {
        id: string;
        webhookId: string;
      };
      const { tenantId, userId } = extractIdentity(req);
      const body = req.body as {
        action?: 'pause' | 'resume' | 'rotate';
        label?: string;
        endpointUrl?: string;
        eventTypes?: string[];
      };

      if (body.action === 'pause') {
        const result = await runtime.withTenant({ tenantId, userId }, async (deps) => {
          return pauseWebhook({ webhookRepo: deps.webhookRepo! }, webhookId, supplierId);
        });
        if (!result.ok) {
          return reply
            .status(result.error.code === 'NOT_FOUND' ? 404 : 403)
            .send({ error: { message: result.error.message } });
        }
        return reply.status(200).send(result.value);
      }

      if (body.action === 'resume') {
        const result = await runtime.withTenant({ tenantId, userId }, async (deps) => {
          return resumeWebhook({ webhookRepo: deps.webhookRepo! }, webhookId, supplierId);
        });
        if (!result.ok) {
          return reply
            .status(result.error.code === 'NOT_FOUND' ? 404 : 403)
            .send({ error: { message: result.error.message } });
        }
        return reply.status(200).send(result.value);
      }

      if (body.action === 'rotate') {
        const result = await runtime.withTenant({ tenantId, userId }, async (deps) => {
          return rotateWebhookSecret({ webhookRepo: deps.webhookRepo! }, webhookId, supplierId);
        });
        if (!result.ok) {
          return reply
            .status(result.error.code === 'NOT_FOUND' ? 404 : 403)
            .send({ error: { message: result.error.message } });
        }
        // Returns new secret ONCE
        return reply.status(200).send({ newSigningSecret: result.value.newSecret });
      }

      // Default: field update
      const result = await runtime.withTenant({ tenantId, userId }, async (deps) => {
        return updateWebhook(
          { webhookRepo: deps.webhookRepo! },
          webhookId,
          {
            label: body.label,
            endpointUrl: body.endpointUrl,
            eventTypes: body.eventTypes as never,
          },
          supplierId
        );
      });

      if (!result.ok) {
        const status =
          result.error.code === 'NOT_FOUND' ? 404 : result.error.code === 'FORBIDDEN' ? 403 : 422;
        return reply.status(status).send({ error: { message: result.error.message } });
      }

      return reply.status(200).send(result.value);
    }
  );

  // DELETE /portal/suppliers/:id/webhooks/:webhookId — soft delete
  app.delete(
    '/portal/suppliers/:id/webhooks/:webhookId',
    { preHandler: [requirePermission(policy, 'supplier:write')] },
    async (req, reply) => {
      const { id: supplierId, webhookId } = req.params as {
        id: string;
        webhookId: string;
      };
      const { tenantId, userId } = extractIdentity(req);

      const result = await runtime.withTenant({ tenantId, userId }, async (deps) => {
        return deleteWebhook({ webhookRepo: deps.webhookRepo! }, webhookId, supplierId);
      });

      if (!result.ok) {
        return reply
          .status(result.error.code === 'NOT_FOUND' ? 404 : 403)
          .send({ error: { message: result.error.message } });
      }

      return reply.status(204).send();
    }
  );
}
