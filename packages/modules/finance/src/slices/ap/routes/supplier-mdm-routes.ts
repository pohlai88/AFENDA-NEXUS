import type { FastifyInstance } from 'fastify';
import {
  IdParamSchema,
  CreateSupplierBlockSchema,
  CreateSupplierBlacklistSchema,
  ReverseSupplierBlacklistSchema,
  CreateSupplierTaxRegistrationSchema,
  VerifyBankAccountSchema,
  CreateSupplierLegalDocSchema,
  RejectSupplierLegalDocSchema,
  UpsertSupplierDocRequirementSchema,
  CreateSupplierEvalTemplateSchema,
  CreateSupplierEvaluationSchema,
  CreateSupplierRiskIndicatorSchema,
  CreateSupplierDiversitySchema,
  CreateSupplierContactSchema,
  UpdateSupplierContactSchema,
  UpsertSupplierCompanyOverrideSchema,
  UpsertSupplierAccountGroupConfigSchema,
  SupplierAccountGroupSchema,
} from '@afenda/contracts';
import type { FinanceRuntime } from '../../../app/ports/finance-runtime.js';
import type { IAuthorizationPolicy } from '../../../shared/ports/authorization.js';
import { requirePermission } from '../../../shared/routes/authorization-guard.js';
import { mapErrorToStatus } from '../../../shared/routes/error-mapper.js';
import { extractIdentity } from '@afenda/api-kit';
import { AppError } from '@afenda/core';
import { z } from 'zod';

function requireRepo<T>(repo: T | undefined, name: string): T {
  if (!repo) throw new AppError('INTERNAL', `${name} repo is not configured`);
  return repo;
}

const SupplierIdCompanyIdParams = z.object({
  id: z.string().uuid(),
  companyId: z.string().uuid(),
});

export function registerSupplierMdmRoutes(
  app: FastifyInstance,
  runtime: FinanceRuntime,
  policy: IAuthorizationPolicy
): void {
  // ─── Blocks ───────────────────────────────────────────────────────────

  // POST /ap/suppliers/:id/blocks
  app.post(
    '/ap/suppliers/:id/blocks',
    { preHandler: [requirePermission(policy, 'journal:create')] },
    async (req, reply) => {
      const { id } = IdParamSchema.parse(req.params);
      const { tenantId, userId } = extractIdentity(req);
      const body = CreateSupplierBlockSchema.parse(req.body);

      const result = await runtime.withTenant({ tenantId, userId }, async (deps) => {
        const repo = requireRepo(deps.supplierBlockRepo, 'SupplierBlock');
        return repo.createBlock({
          tenantId,
          supplierId: id,
          blockType: body.blockType,
          scope: body.scope,
          companyId: body.companyId ?? null,
          siteId: body.siteId ?? null,
          reasonCode: body.reasonCode,
          reason: body.reason,
          effectiveFrom: body.effectiveFrom ? new Date(body.effectiveFrom) : new Date(),
          effectiveUntil: body.effectiveUntil ? new Date(body.effectiveUntil) : null,
          blockedBy: userId,
        });
      });

      return result.ok
        ? reply.status(201).send(result.value)
        : reply.status(mapErrorToStatus(result.error)).send({ error: result.error });
    }
  );

  // GET /ap/suppliers/:id/blocks
  app.get(
    '/ap/suppliers/:id/blocks',
    { preHandler: [requirePermission(policy, 'report:read')] },
    async (req, reply) => {
      const { id } = IdParamSchema.parse(req.params);
      const { tenantId, userId } = extractIdentity(req);

      const blocks = await runtime.withTenant({ tenantId, userId }, async (deps) => {
        const repo = requireRepo(deps.supplierBlockRepo, 'SupplierBlock');
        return repo.findActiveBlocks(id);
      });

      return reply.send(blocks);
    }
  );

  // DELETE /ap/suppliers/:id/blocks/:blockId
  app.delete(
    '/ap/suppliers/:id/blocks/:blockId',
    { preHandler: [requirePermission(policy, 'journal:create')] },
    async (req, reply) => {
      const params = z.object({ id: z.string().uuid(), blockId: z.string().uuid() }).parse(req.params);
      const { tenantId, userId } = extractIdentity(req);
      const body = z.object({ reason: z.string().min(1) }).parse(req.body);

      const result = await runtime.withTenant({ tenantId, userId }, async (deps) => {
        const repo = requireRepo(deps.supplierBlockRepo, 'SupplierBlock');
        return repo.deactivateBlock(params.blockId, userId, body.reason);
      });

      return result.ok
        ? reply.status(204).send()
        : reply.status(mapErrorToStatus(result.error)).send({ error: result.error });
    }
  );

  // GET /ap/suppliers/:id/block-history
  app.get(
    '/ap/suppliers/:id/block-history',
    { preHandler: [requirePermission(policy, 'report:read')] },
    async (req, reply) => {
      const { id } = IdParamSchema.parse(req.params);
      const { tenantId, userId } = extractIdentity(req);

      const history = await runtime.withTenant({ tenantId, userId }, async (deps) => {
        const repo = requireRepo(deps.supplierBlockRepo, 'SupplierBlock');
        return repo.getBlockHistory(id);
      });

      return reply.send(history);
    }
  );

  // ─── Blacklist ────────────────────────────────────────────────────────

  // POST /ap/suppliers/:id/blacklist
  app.post(
    '/ap/suppliers/:id/blacklist',
    { preHandler: [requirePermission(policy, 'journal:create')] },
    async (req, reply) => {
      const { id } = IdParamSchema.parse(req.params);
      const { tenantId, userId } = extractIdentity(req);
      const body = CreateSupplierBlacklistSchema.parse(req.body);

      const result = await runtime.withTenant({ tenantId, userId }, async (deps) => {
        const repo = requireRepo(deps.supplierBlockRepo, 'SupplierBlock');
        return repo.createBlacklist({
          tenantId,
          supplierId: id,
          justification: body.justification,
          blacklistedBy: userId,
          validFrom: body.validFrom ? new Date(body.validFrom) : new Date(),
          validUntil: body.validUntil ? new Date(body.validUntil) : null,
        });
      });

      return result.ok
        ? reply.status(201).send(result.value)
        : reply.status(mapErrorToStatus(result.error)).send({ error: result.error });
    }
  );

  // POST /ap/suppliers/:id/blacklist/reverse
  app.post(
    '/ap/suppliers/:id/blacklist/reverse',
    { preHandler: [requirePermission(policy, 'journal:create')] },
    async (req, reply) => {
      const { id } = IdParamSchema.parse(req.params);
      const { tenantId, userId } = extractIdentity(req);
      const body = ReverseSupplierBlacklistSchema.parse(req.body);

      const result = await runtime.withTenant({ tenantId, userId }, async (deps) => {
        const repo = requireRepo(deps.supplierBlockRepo, 'SupplierBlock');
        const blacklist = await repo.findActiveBlacklist(id);
        if (!blacklist) {
          return { ok: false as const, error: new AppError('NOT_FOUND', 'No active blacklist found') };
        }
        return repo.reverseBlacklist(blacklist.id, {
          reversalApprovedBy: userId,
          reversalReason: body.reversalReason,
        });
      });

      return result.ok
        ? reply.send(result.value)
        : reply.status(mapErrorToStatus(result.error)).send({ error: result.error });
    }
  );

  // ─── Tax Registrations ────────────────────────────────────────────────

  // POST /ap/suppliers/:id/tax-registrations
  app.post(
    '/ap/suppliers/:id/tax-registrations',
    { preHandler: [requirePermission(policy, 'journal:create')] },
    async (req, reply) => {
      const { id } = IdParamSchema.parse(req.params);
      const { tenantId, userId } = extractIdentity(req);
      const body = CreateSupplierTaxRegistrationSchema.parse(req.body);

      const result = await runtime.withTenant({ tenantId, userId }, async (deps) => {
        const repo = requireRepo(deps.supplierTaxRepo, 'SupplierTax');
        return repo.create({
          tenantId,
          supplierId: id,
          taxType: body.taxType,
          registrationNumber: body.registrationNumber,
          issuingCountry: body.issuingCountry,
          validFrom: body.validFrom ? new Date(body.validFrom) : null,
          validUntil: body.validUntil ? new Date(body.validUntil) : null,
          isPrimary: body.isPrimary,
        });
      });

      return result.ok
        ? reply.status(201).send(result.value)
        : reply.status(mapErrorToStatus(result.error)).send({ error: result.error });
    }
  );

  // GET /ap/suppliers/:id/tax-registrations
  app.get(
    '/ap/suppliers/:id/tax-registrations',
    { preHandler: [requirePermission(policy, 'report:read')] },
    async (req, reply) => {
      const { id } = IdParamSchema.parse(req.params);
      const { tenantId, userId } = extractIdentity(req);

      const regs = await runtime.withTenant({ tenantId, userId }, async (deps) => {
        const repo = requireRepo(deps.supplierTaxRepo, 'SupplierTax');
        return repo.findBySupplierId(id);
      });

      return reply.send(regs);
    }
  );

  // POST /ap/suppliers/:id/tax-registrations/:regId/verify
  app.post(
    '/ap/suppliers/:id/tax-registrations/:regId/verify',
    { preHandler: [requirePermission(policy, 'journal:create')] },
    async (req, reply) => {
      const params = z.object({ id: z.string().uuid(), regId: z.string().uuid() }).parse(req.params);
      const { tenantId, userId } = extractIdentity(req);

      const result = await runtime.withTenant({ tenantId, userId }, async (deps) => {
        const repo = requireRepo(deps.supplierTaxRepo, 'SupplierTax');
        return repo.verify(params.regId, userId);
      });

      return result.ok
        ? reply.send(result.value)
        : reply.status(mapErrorToStatus(result.error)).send({ error: result.error });
    }
  );

  // ─── Bank Account Verification ────────────────────────────────────────

  // POST /ap/suppliers/:id/bank-accounts/:bankId/verify
  app.post(
    '/ap/suppliers/:id/bank-accounts/:bankId/verify',
    { preHandler: [requirePermission(policy, 'journal:create')] },
    async (req, reply) => {
      const params = z.object({ id: z.string().uuid(), bankId: z.string().uuid() }).parse(req.params);
      const body = VerifyBankAccountSchema.parse(req.body);
      const { tenantId, userId } = extractIdentity(req);

      await runtime.withTenant({ tenantId, userId }, async (_deps) => {
        // Placeholder — full bank verification workflow will be wired to repo
      });

      return reply.send({ bankId: params.bankId, verified: true, method: body.verificationMethod });
    }
  );

  // ─── Legal Documents ──────────────────────────────────────────────────

  // POST /ap/suppliers/:id/legal-docs
  app.post(
    '/ap/suppliers/:id/legal-docs',
    { preHandler: [requirePermission(policy, 'journal:create')] },
    async (req, reply) => {
      const { id } = IdParamSchema.parse(req.params);
      const { tenantId, userId } = extractIdentity(req);
      const body = CreateSupplierLegalDocSchema.parse(req.body);

      const result = await runtime.withTenant({ tenantId, userId }, async (deps) => {
        const repo = requireRepo(deps.supplierLegalDocRepo, 'SupplierLegalDoc');
        return repo.create({
          tenantId,
          supplierId: id,
          docType: body.docType,
          documentNumber: body.documentNumber ?? null,
          issuingAuthority: body.issuingAuthority ?? null,
          issueDate: body.issueDate ? new Date(body.issueDate) : null,
          expiryDate: body.expiryDate ? new Date(body.expiryDate) : null,
          storageKey: body.storageKey ?? null,
          checksumSha256: body.checksumSha256 ?? null,
          uploadedBy: userId,
        });
      });

      return result.ok
        ? reply.status(201).send(result.value)
        : reply.status(mapErrorToStatus(result.error)).send({ error: result.error });
    }
  );

  // GET /ap/suppliers/:id/legal-docs
  app.get(
    '/ap/suppliers/:id/legal-docs',
    { preHandler: [requirePermission(policy, 'report:read')] },
    async (req, reply) => {
      const { id } = IdParamSchema.parse(req.params);
      const { tenantId, userId } = extractIdentity(req);

      const docs = await runtime.withTenant({ tenantId, userId }, async (deps) => {
        const repo = requireRepo(deps.supplierLegalDocRepo, 'SupplierLegalDoc');
        return repo.findBySupplierId(id);
      });

      return reply.send(docs);
    }
  );

  // POST /ap/suppliers/:id/legal-docs/:docId/verify
  app.post(
    '/ap/suppliers/:id/legal-docs/:docId/verify',
    { preHandler: [requirePermission(policy, 'journal:create')] },
    async (req, reply) => {
      const params = z.object({ id: z.string().uuid(), docId: z.string().uuid() }).parse(req.params);
      const { tenantId, userId } = extractIdentity(req);

      const result = await runtime.withTenant({ tenantId, userId }, async (deps) => {
        const repo = requireRepo(deps.supplierLegalDocRepo, 'SupplierLegalDoc');
        return repo.verify(params.docId, userId);
      });

      return result.ok
        ? reply.send(result.value)
        : reply.status(mapErrorToStatus(result.error)).send({ error: result.error });
    }
  );

  // POST /ap/suppliers/:id/legal-docs/:docId/reject
  app.post(
    '/ap/suppliers/:id/legal-docs/:docId/reject',
    { preHandler: [requirePermission(policy, 'journal:create')] },
    async (req, reply) => {
      const params = z.object({ id: z.string().uuid(), docId: z.string().uuid() }).parse(req.params);
      const { tenantId, userId } = extractIdentity(req);
      const body = RejectSupplierLegalDocSchema.parse(req.body);

      const result = await runtime.withTenant({ tenantId, userId }, async (deps) => {
        const repo = requireRepo(deps.supplierLegalDocRepo, 'SupplierLegalDoc');
        return repo.reject(params.docId, body.rejectionReason);
      });

      return result.ok
        ? reply.send(result.value)
        : reply.status(mapErrorToStatus(result.error)).send({ error: result.error });
    }
  );

  // ─── Doc Requirements ─────────────────────────────────────────────────

  // PUT /ap/supplier-doc-requirements
  app.put(
    '/ap/supplier-doc-requirements',
    { preHandler: [requirePermission(policy, 'journal:create')] },
    async (req, reply) => {
      const { tenantId, userId } = extractIdentity(req);
      const body = UpsertSupplierDocRequirementSchema.parse(req.body);

      const result = await runtime.withTenant({ tenantId, userId }, async (deps) => {
        const repo = requireRepo(deps.supplierLegalDocRepo, 'SupplierLegalDoc');
        return repo.upsertDocRequirement({
          tenantId,
          accountGroup: body.accountGroup,
          docType: body.docType,
          isMandatory: body.isMandatory,
          countryCode: body.countryCode ?? null,
          isActive: body.isActive,
        });
      });

      return result.ok
        ? reply.send(result.value)
        : reply.status(mapErrorToStatus(result.error)).send({ error: result.error });
    }
  );

  // GET /ap/supplier-doc-requirements
  app.get(
    '/ap/supplier-doc-requirements',
    { preHandler: [requirePermission(policy, 'report:read')] },
    async (req, reply) => {
      const { tenantId, userId } = extractIdentity(req);

      const reqs = await runtime.withTenant({ tenantId, userId }, async (deps) => {
        const repo = requireRepo(deps.supplierLegalDocRepo, 'SupplierLegalDoc');
        return repo.findAllDocRequirements(tenantId);
      });

      return reply.send(reqs);
    }
  );

  // ─── Evaluations ──────────────────────────────────────────────────────

  // POST /ap/supplier-eval-templates
  app.post(
    '/ap/supplier-eval-templates',
    { preHandler: [requirePermission(policy, 'journal:create')] },
    async (req, reply) => {
      const { tenantId, userId } = extractIdentity(req);
      const body = CreateSupplierEvalTemplateSchema.parse(req.body);

      const result = await runtime.withTenant({ tenantId, userId }, async (deps) => {
        const repo = requireRepo(deps.supplierEvalRepo, 'SupplierEval');
        return repo.createTemplate({
          tenantId,
          companyId: body.companyId ?? null,
          criteria: body.criteria.map((c) => ({
            code: c.code,
            name: c.name,
            description: c.description ?? null,
            weight: c.weight,
            maxScore: c.maxScore,
          })),
        });
      });

      return result.ok
        ? reply.status(201).send(result.value)
        : reply.status(mapErrorToStatus(result.error)).send({ error: result.error });
    }
  );

  // POST /ap/suppliers/:id/evaluations
  app.post(
    '/ap/suppliers/:id/evaluations',
    { preHandler: [requirePermission(policy, 'journal:create')] },
    async (req, reply) => {
      const { id } = IdParamSchema.parse(req.params);
      const { tenantId, userId } = extractIdentity(req);
      const body = CreateSupplierEvaluationSchema.parse(req.body);

      const result = await runtime.withTenant({ tenantId, userId }, async (deps) => {
        const repo = requireRepo(deps.supplierEvalRepo, 'SupplierEval');
        return repo.createEvaluation({
          tenantId,
          supplierId: id,
          templateVersionId: body.templateVersionId,
          periodStart: new Date(body.periodStart),
          periodEnd: new Date(body.periodEnd),
          evaluatedBy: userId,
          scores: body.scores.map((s) => ({
            criteriaId: s.criteriaId,
            score: s.score,
            notes: s.notes ?? null,
          })),
          notes: body.notes ?? null,
        });
      });

      return result.ok
        ? reply.status(201).send(result.value)
        : reply.status(mapErrorToStatus(result.error)).send({ error: result.error });
    }
  );

  // GET /ap/suppliers/:id/evaluations
  app.get(
    '/ap/suppliers/:id/evaluations',
    { preHandler: [requirePermission(policy, 'report:read')] },
    async (req, reply) => {
      const { id } = IdParamSchema.parse(req.params);
      const { tenantId, userId } = extractIdentity(req);

      const evals = await runtime.withTenant({ tenantId, userId }, async (deps) => {
        const repo = requireRepo(deps.supplierEvalRepo, 'SupplierEval');
        return repo.findEvaluationsBySupplierId(id);
      });

      return reply.send(evals);
    }
  );

  // ─── Risk Indicators ──────────────────────────────────────────────────

  // POST /ap/suppliers/:id/risk-indicators
  app.post(
    '/ap/suppliers/:id/risk-indicators',
    { preHandler: [requirePermission(policy, 'journal:create')] },
    async (req, reply) => {
      const { id } = IdParamSchema.parse(req.params);
      const { tenantId, userId } = extractIdentity(req);
      const body = CreateSupplierRiskIndicatorSchema.parse(req.body);

      const result = await runtime.withTenant({ tenantId, userId }, async (deps) => {
        const repo = requireRepo(deps.supplierRiskRepo, 'SupplierRisk');
        return repo.create({
          tenantId,
          supplierId: id,
          riskRating: body.riskRating,
          riskCategory: body.riskCategory,
          description: body.description,
          incidentDate: body.incidentDate ? new Date(body.incidentDate) : null,
          documentId: body.documentId ?? null,
          raisedBy: userId,
        });
      });

      return result.ok
        ? reply.status(201).send(result.value)
        : reply.status(mapErrorToStatus(result.error)).send({ error: result.error });
    }
  );

  // GET /ap/suppliers/:id/risk-indicators
  app.get(
    '/ap/suppliers/:id/risk-indicators',
    { preHandler: [requirePermission(policy, 'report:read')] },
    async (req, reply) => {
      const { id } = IdParamSchema.parse(req.params);
      const { tenantId, userId } = extractIdentity(req);

      const indicators = await runtime.withTenant({ tenantId, userId }, async (deps) => {
        const repo = requireRepo(deps.supplierRiskRepo, 'SupplierRisk');
        return repo.findActiveBySupplierId(id);
      });

      return reply.send(indicators);
    }
  );

  // POST /ap/suppliers/:id/risk-indicators/:indicatorId/resolve
  app.post(
    '/ap/suppliers/:id/risk-indicators/:indicatorId/resolve',
    { preHandler: [requirePermission(policy, 'journal:create')] },
    async (req, reply) => {
      const params = z.object({ id: z.string().uuid(), indicatorId: z.string().uuid() }).parse(req.params);
      const { tenantId, userId } = extractIdentity(req);

      const result = await runtime.withTenant({ tenantId, userId }, async (deps) => {
        const repo = requireRepo(deps.supplierRiskRepo, 'SupplierRisk');
        return repo.resolve(params.indicatorId, userId);
      });

      return result.ok
        ? reply.send(result.value)
        : reply.status(mapErrorToStatus(result.error)).send({ error: result.error });
    }
  );

  // ─── Diversity ────────────────────────────────────────────────────────

  // POST /ap/suppliers/:id/diversity
  app.post(
    '/ap/suppliers/:id/diversity',
    { preHandler: [requirePermission(policy, 'journal:create')] },
    async (req, reply) => {
      const { id } = IdParamSchema.parse(req.params);
      const { tenantId, userId } = extractIdentity(req);
      const body = CreateSupplierDiversitySchema.parse(req.body);

      const result = await runtime.withTenant({ tenantId, userId }, async (deps) => {
        const repo = requireRepo(deps.supplierDiversityRepo, 'SupplierDiversity');
        return repo.create({
          tenantId,
          supplierId: id,
          diversityCode: body.diversityCode,
          certificateNumber: body.certificateNumber ?? null,
          validFrom: body.validFrom ? new Date(body.validFrom) : null,
          validUntil: body.validUntil ? new Date(body.validUntil) : null,
          documentId: body.documentId ?? null,
        });
      });

      return result.ok
        ? reply.status(201).send(result.value)
        : reply.status(mapErrorToStatus(result.error)).send({ error: result.error });
    }
  );

  // GET /ap/suppliers/:id/diversity
  app.get(
    '/ap/suppliers/:id/diversity',
    { preHandler: [requirePermission(policy, 'report:read')] },
    async (req, reply) => {
      const { id } = IdParamSchema.parse(req.params);
      const { tenantId, userId } = extractIdentity(req);

      const items = await runtime.withTenant({ tenantId, userId }, async (deps) => {
        const repo = requireRepo(deps.supplierDiversityRepo, 'SupplierDiversity');
        return repo.findBySupplierId(id);
      });

      return reply.send(items);
    }
  );

  // ─── Contacts ─────────────────────────────────────────────────────────

  // POST /ap/suppliers/:id/contacts
  app.post(
    '/ap/suppliers/:id/contacts',
    { preHandler: [requirePermission(policy, 'journal:create')] },
    async (req, reply) => {
      const { id } = IdParamSchema.parse(req.params);
      const { tenantId, userId } = extractIdentity(req);
      const body = CreateSupplierContactSchema.parse(req.body);

      const result = await runtime.withTenant({ tenantId, userId }, async (deps) => {
        const repo = requireRepo(deps.supplierContactRepo, 'SupplierContact');
        return repo.create({
          tenantId,
          supplierId: id,
          siteId: body.siteId ?? null,
          role: body.role,
          firstName: body.firstName,
          lastName: body.lastName,
          email: body.email,
          phone: body.phone ?? null,
          jobTitle: body.jobTitle ?? null,
          isPrimary: body.isPrimary,
        });
      });

      return result.ok
        ? reply.status(201).send(result.value)
        : reply.status(mapErrorToStatus(result.error)).send({ error: result.error });
    }
  );

  // GET /ap/suppliers/:id/contacts
  app.get(
    '/ap/suppliers/:id/contacts',
    { preHandler: [requirePermission(policy, 'report:read')] },
    async (req, reply) => {
      const { id } = IdParamSchema.parse(req.params);
      const { tenantId, userId } = extractIdentity(req);

      const contacts = await runtime.withTenant({ tenantId, userId }, async (deps) => {
        const repo = requireRepo(deps.supplierContactRepo, 'SupplierContact');
        return repo.findBySupplierId(id);
      });

      return reply.send(contacts);
    }
  );

  // PATCH /ap/suppliers/:id/contacts/:contactId
  app.patch(
    '/ap/suppliers/:id/contacts/:contactId',
    { preHandler: [requirePermission(policy, 'journal:create')] },
    async (req, reply) => {
      const params = z.object({ id: z.string().uuid(), contactId: z.string().uuid() }).parse(req.params);
      const { tenantId, userId } = extractIdentity(req);
      const body = UpdateSupplierContactSchema.parse(req.body);

      const result = await runtime.withTenant({ tenantId, userId }, async (deps) => {
        const repo = requireRepo(deps.supplierContactRepo, 'SupplierContact');
        return repo.update(params.contactId, body);
      });

      return result.ok
        ? reply.send(result.value)
        : reply.status(mapErrorToStatus(result.error)).send({ error: result.error });
    }
  );

  // ─── Company Overrides ────────────────────────────────────────────────

  // PUT /ap/suppliers/:id/company-overrides/:companyId
  app.put(
    '/ap/suppliers/:id/company-overrides/:companyId',
    { preHandler: [requirePermission(policy, 'journal:create')] },
    async (req, reply) => {
      const params = SupplierIdCompanyIdParams.parse(req.params);
      const { tenantId, userId } = extractIdentity(req);
      const body = UpsertSupplierCompanyOverrideSchema.parse(req.body);

      const result = await runtime.withTenant({ tenantId, userId }, async (deps) => {
        const repo = requireRepo(deps.supplierCompanyOverrideRepo, 'SupplierCompanyOverride');
        return repo.upsert({
          tenantId,
          supplierId: params.id,
          companyId: params.companyId,
          defaultPaymentTermsId: body.defaultPaymentTermsId ?? null,
          defaultPaymentMethod: body.defaultPaymentMethod ?? null,
          defaultCurrencyId: body.defaultCurrencyId ?? null,
          tolerancePercent: body.tolerancePercent != null ? String(body.tolerancePercent) : null,
          isActive: body.isActive,
        });
      });

      return result.ok
        ? reply.send(result.value)
        : reply.status(mapErrorToStatus(result.error)).send({ error: result.error });
    }
  );

  // GET /ap/suppliers/:id/company-overrides
  app.get(
    '/ap/suppliers/:id/company-overrides',
    { preHandler: [requirePermission(policy, 'report:read')] },
    async (req, reply) => {
      const { id } = IdParamSchema.parse(req.params);
      const { tenantId, userId } = extractIdentity(req);

      const overrides = await runtime.withTenant({ tenantId, userId }, async (deps) => {
        const repo = requireRepo(deps.supplierCompanyOverrideRepo, 'SupplierCompanyOverride');
        return repo.findBySupplierId(id);
      });

      return reply.send(overrides);
    }
  );

  // ─── Account Group Configuration ──────────────────────────────────────

  // PUT /ap/supplier-account-groups/:accountGroup
  app.put(
    '/ap/supplier-account-groups/:accountGroup',
    { preHandler: [requirePermission(policy, 'journal:create')] },
    async (req, reply) => {
      const params = z.object({ accountGroup: SupplierAccountGroupSchema }).parse(req.params);
      const { tenantId, userId } = extractIdentity(req);
      const body = UpsertSupplierAccountGroupConfigSchema.parse(req.body);

      const result = await runtime.withTenant({ tenantId, userId }, async (deps) => {
        const repo = requireRepo(deps.supplierAccountGroupRepo, 'SupplierAccountGroup');
        return repo.upsert({
          tenantId,
          accountGroup: params.accountGroup,
          label: body.label,
          requiresApproval: body.requiresApproval,
          requiresTaxVerification: body.requiresTaxVerification,
          requiresBankVerification: body.requiresBankVerification,
          allowOneTimeUse: body.allowOneTimeUse,
          isActive: body.isActive,
        });
      });

      return result.ok
        ? reply.send(result.value)
        : reply.status(mapErrorToStatus(result.error)).send({ error: result.error });
    }
  );

  // GET /ap/supplier-account-groups
  app.get(
    '/ap/supplier-account-groups',
    { preHandler: [requirePermission(policy, 'report:read')] },
    async (req, reply) => {
      const { tenantId, userId } = extractIdentity(req);

      const configs = await runtime.withTenant({ tenantId, userId }, async (deps) => {
        const repo = requireRepo(deps.supplierAccountGroupRepo, 'SupplierAccountGroup');
        return repo.findAll(tenantId);
      });

      return reply.send(configs);
    }
  );

  // ─── Group Hierarchy ──────────────────────────────────────────────────

  // GET /ap/suppliers/:id/children
  app.get(
    '/ap/suppliers/:id/children',
    { preHandler: [requirePermission(policy, 'report:read')] },
    async (req, reply) => {
      const { id } = IdParamSchema.parse(req.params);
      const { tenantId, userId } = extractIdentity(req);

      const result = await runtime.withTenant({ tenantId, userId }, async (deps) => {
        return deps.supplierRepo.findChildren(id);
      });

      return reply.send(result);
    }
  );

  // GET /ap/supplier-groups
  app.get(
    '/ap/supplier-groups',
    { preHandler: [requirePermission(policy, 'report:read')] },
    async (req, reply) => {
      const { tenantId, userId } = extractIdentity(req);

      const result = await runtime.withTenant({ tenantId, userId }, async (deps) => {
        return deps.supplierRepo.findGroupHeaders();
      });

      return reply.send(result);
    }
  );

  // ─── Activation Gating ────────────────────────────────────────────────

  // GET /ap/suppliers/:id/activation-readiness
  app.get(
    '/ap/suppliers/:id/activation-readiness',
    { preHandler: [requirePermission(policy, 'report:read')] },
    async (req, reply) => {
      const { id } = IdParamSchema.parse(req.params);
      const { tenantId, userId } = extractIdentity(req);

      const { checkActivationReadiness } = await import('../services/supplier-activation.js');

      const result = await runtime.withTenant({ tenantId, userId }, async (deps) => {
        return checkActivationReadiness(
          { supplierId: id, tenantId },
          {
            supplierRepo: deps.supplierRepo,
            supplierTaxRepo: deps.supplierTaxRepo,
            supplierLegalDocRepo: deps.supplierLegalDocRepo,
            supplierAccountGroupRepo: deps.supplierAccountGroupRepo,
          }
        );
      });

      return result.ok
        ? reply.send(result.value)
        : reply.status(mapErrorToStatus(result.error)).send({ error: result.error });
    }
  );
}
