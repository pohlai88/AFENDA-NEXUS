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
  SupplierPortalCreateDisputeSchema,
  SupplierPortalUpdateNotificationPrefsSchema,
} from '@afenda/contracts';
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
  supplierCreateDispute,
  supplierListDisputes,
  supplierGetDisputeById,
} from '../services/supplier-portal-dispute.js';
import {
  supplierGetNotificationPrefs,
  supplierUpdateNotificationPrefs,
} from '../services/supplier-portal-notifications.js';
import { supplierGetComplianceSummary } from '../services/supplier-portal-compliance.js';
import { resolveSupplierIdentity } from '../services/supplier-portal-identity.js';

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
 *   N9: POST /portal/suppliers/:id/disputes           — create dispute
 *   N9: GET  /portal/suppliers/:id/disputes           — list disputes
 *   N9: GET  /portal/suppliers/:id/disputes/:disputeId — get dispute detail
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

  // ── N2: Supplier Invoice Visibility ─────────────────────────────────────

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

  // ── N9: Supplier Disputes ─────────────────────────────────────────────

  app.post(
    '/portal/suppliers/:id/disputes',
    { preHandler: [requirePermission(policy, 'supplier:submit')] },
    async (req, reply) => {
      const { id } = IdParamSchema.parse(req.params);
      const { tenantId, userId } = extractIdentity(req);
      const body = SupplierPortalCreateDisputeSchema.parse(req.body);

      const result = await runtime.withTenant({ tenantId, userId }, async (deps) => {
        if (!deps.supplierDisputeRepo) throw new Error('supplierDisputeRepo not configured');
        return supplierCreateDispute(
          {
            tenantId,
            supplierId: id,
            userId,
            invoiceId: body.invoiceId ?? null,
            paymentRunId: body.paymentRunId ?? null,
            category: body.category,
            subject: body.subject,
            description: body.description,
          },
          { ...deps, supplierDisputeRepo: deps.supplierDisputeRepo }
        );
      });

      return result.ok
        ? reply.status(201).send(result.value)
        : reply.status(mapErrorToStatus(result.error)).send({ error: result.error });
    }
  );

  app.get(
    '/portal/suppliers/:id/disputes',
    { preHandler: [requirePermission(policy, 'supplier:read')] },
    async (req, reply) => {
      const { id } = IdParamSchema.parse(req.params);
      const { tenantId, userId } = extractIdentity(req);

      const result = await runtime.withTenant({ tenantId, userId }, async (deps) => {
        if (!deps.supplierDisputeRepo) throw new Error('supplierDisputeRepo not configured');
        return supplierListDisputes(
          { tenantId, supplierId: id },
          { ...deps, supplierDisputeRepo: deps.supplierDisputeRepo }
        );
      });

      return result.ok
        ? reply.send(result.value)
        : reply.status(mapErrorToStatus(result.error)).send({ error: result.error });
    }
  );

  app.get(
    '/portal/suppliers/:id/disputes/:disputeId',
    { preHandler: [requirePermission(policy, 'supplier:read')] },
    async (req, reply) => {
      const params = req.params as { id: string; disputeId: string };
      const { tenantId, userId } = extractIdentity(req);

      const result = await runtime.withTenant({ tenantId, userId }, async (deps) => {
        if (!deps.supplierDisputeRepo) throw new Error('supplierDisputeRepo not configured');
        return supplierGetDisputeById(
          { tenantId, supplierId: params.id, disputeId: params.disputeId },
          { supplierDisputeRepo: deps.supplierDisputeRepo }
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
}
