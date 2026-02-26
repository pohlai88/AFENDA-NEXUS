import type { FastifyInstance } from 'fastify';
import {
  IdParamSchema,
  CreateSupplierSchema,
  UpdateSupplierSchema,
  SupplierListQuerySchema,
  CreateSupplierSiteSchema,
  CreateSupplierBankAccountSchema,
} from '@afenda/contracts';
import type { FinanceRuntime } from '../../../app/ports/finance-runtime.js';
import type { IAuthorizationPolicy } from '../../../shared/ports/authorization.js';
import { requirePermission } from '../../../shared/routes/authorization-guard.js';
import { mapErrorToStatus } from '../../../shared/routes/error-mapper.js';
import { extractIdentity } from '@afenda/api-kit';

export function registerSupplierRoutes(
  app: FastifyInstance,
  runtime: FinanceRuntime,
  policy: IAuthorizationPolicy
): void {
  // POST /ap/suppliers — create supplier
  app.post(
    '/ap/suppliers',
    { preHandler: [requirePermission(policy, 'journal:create')] },
    async (req, reply) => {
      const { tenantId, userId } = extractIdentity(req);
      const body = CreateSupplierSchema.parse(req.body);

      const result = await runtime.withTenant({ tenantId, userId }, async (deps) => {
        return deps.supplierRepo.create({
          tenantId,
          companyId: body.companyId,
          code: body.code,
          name: body.name,
          taxId: body.taxId ?? null,
          currencyCode: body.currencyCode,
          defaultPaymentTermsId: body.defaultPaymentTermsId ?? null,
          defaultPaymentMethod: body.defaultPaymentMethod ?? null,
          whtRateId: body.whtRateId ?? null,
          remittanceEmail: body.remittanceEmail ?? null,
        });
      });

      return result.ok
        ? reply.status(201).send(result.value)
        : reply.status(mapErrorToStatus(result.error)).send({ error: result.error });
    }
  );

  // GET /ap/suppliers — paginated list
  app.get(
    '/ap/suppliers',
    { preHandler: [requirePermission(policy, 'report:read')] },
    async (req, reply) => {
      const { tenantId, userId } = extractIdentity(req);
      const query = SupplierListQuerySchema.parse(req.query);

      const result = await runtime.withTenant({ tenantId, userId }, async (deps) => {
        if (query.status) {
          return deps.supplierRepo.findByStatus(query.status, query);
        }
        return deps.supplierRepo.findAll(query);
      });

      return reply.send(result);
    }
  );

  // GET /ap/suppliers/:id
  app.get(
    '/ap/suppliers/:id',
    { preHandler: [requirePermission(policy, 'report:read')] },
    async (req, reply) => {
      const { id } = IdParamSchema.parse(req.params);
      const { tenantId, userId } = extractIdentity(req);

      const result = await runtime.withTenant({ tenantId, userId }, async (deps) => {
        return deps.supplierRepo.findById(id);
      });

      return result.ok
        ? reply.send(result.value)
        : reply.status(mapErrorToStatus(result.error)).send({ error: result.error });
    }
  );

  // PATCH /ap/suppliers/:id — update supplier
  app.patch(
    '/ap/suppliers/:id',
    { preHandler: [requirePermission(policy, 'journal:create')] },
    async (req, reply) => {
      const { id } = IdParamSchema.parse(req.params);
      const { tenantId, userId } = extractIdentity(req);
      const body = UpdateSupplierSchema.parse(req.body);

      const result = await runtime.withTenant({ tenantId, userId }, async (deps) => {
        return deps.supplierRepo.update(id, body);
      });

      return result.ok
        ? reply.send(result.value)
        : reply.status(mapErrorToStatus(result.error)).send({ error: result.error });
    }
  );

  // POST /ap/suppliers/:id/sites — add site
  app.post(
    '/ap/suppliers/:id/sites',
    { preHandler: [requirePermission(policy, 'journal:create')] },
    async (req, reply) => {
      const { id } = IdParamSchema.parse(req.params);
      const { tenantId, userId } = extractIdentity(req);
      const body = CreateSupplierSiteSchema.parse(req.body);

      const result = await runtime.withTenant({ tenantId, userId }, async (deps) => {
        return deps.supplierRepo.addSite({
          supplierId: id,
          siteCode: body.siteCode,
          name: body.name,
          addressLine1: body.addressLine1,
          addressLine2: body.addressLine2 ?? null,
          city: body.city,
          region: body.region ?? null,
          postalCode: body.postalCode ?? null,
          countryCode: body.countryCode,
          isPrimary: body.isPrimary,
        });
      });

      return result.ok
        ? reply.status(201).send(result.value)
        : reply.status(mapErrorToStatus(result.error)).send({ error: result.error });
    }
  );

  // POST /ap/suppliers/:id/bank-accounts — add bank account
  app.post(
    '/ap/suppliers/:id/bank-accounts',
    { preHandler: [requirePermission(policy, 'journal:create')] },
    async (req, reply) => {
      const { id } = IdParamSchema.parse(req.params);
      const { tenantId, userId } = extractIdentity(req);
      const body = CreateSupplierBankAccountSchema.parse(req.body);

      const result = await runtime.withTenant({ tenantId, userId }, async (deps) => {
        return deps.supplierRepo.addBankAccount({
          supplierId: id,
          bankName: body.bankName,
          accountName: body.accountName,
          accountNumber: body.accountNumber,
          iban: body.iban ?? null,
          swiftBic: body.swiftBic ?? null,
          localBankCode: body.localBankCode ?? null,
          currencyCode: body.currencyCode,
          isPrimary: body.isPrimary,
        });
      });

      return result.ok
        ? reply.status(201).send(result.value)
        : reply.status(mapErrorToStatus(result.error)).send({ error: result.error });
    }
  );
}
