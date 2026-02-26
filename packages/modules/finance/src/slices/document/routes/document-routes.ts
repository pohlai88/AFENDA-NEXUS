/**
 * Document storage routes — init, presign, complete, list, download, delete.
 */
import type { FastifyInstance } from 'fastify';
import type { IAuthorizationPolicy } from '../../../shared/ports/authorization.js';
import { requirePermission } from '../../../shared/routes/authorization-guard.js';
import {
  documentUploadRateLimitGuard,
  documentPresignRateLimitGuard,
} from '../../../shared/routes/document-rate-limit.js';
import { DocumentAttachmentService } from '../services/document-attachment-service.js';
import { z } from 'zod';
import { extractIdentity } from '@afenda/api-kit';
import { LinkedEntityTypeSchema } from '@afenda/contracts';

type LinkedEntityType = z.infer<typeof LinkedEntityTypeSchema>;

const DirectUploadFieldsSchema = z.object({
  fileName: z.string().min(1).max(255),
  entityType: z.enum([
    'JOURNAL',
    'AP_INVOICE',
    'AR_INVOICE',
    'FIXED_ASSET',
    'LEASE_CONTRACT',
    'EXPENSE_CLAIM',
    'BANK_RECONCILIATION',
    'TAX_RETURN',
    'PROVISION',
    'IC_TRANSACTION',
  ]),
  entityId: z.string().uuid(),
  linkedCompanyId: z.string().uuid().optional(),
  category: z.string().optional(),
  description: z.string().optional(),
  mimeType: z.string().optional(),
});

const InitBodySchema = z.object({
  fileName: z.string().min(1).max(255),
  fileSize: z
    .number()
    .int()
    .positive()
    .max(50 * 1024 * 1024),
  mimeType: z.string().optional(),
  category: z.string().optional(),
  description: z.string().optional(),
  entityType: z
    .enum([
      'JOURNAL',
      'AP_INVOICE',
      'AR_INVOICE',
      'FIXED_ASSET',
      'LEASE_CONTRACT',
      'EXPENSE_CLAIM',
      'BANK_RECONCILIATION',
      'TAX_RETURN',
      'PROVISION',
      'IC_TRANSACTION',
    ])
    .optional(),
  entityId: z.string().uuid().optional(),
  linkedCompanyId: z.string().uuid().optional(),
});

const CompleteBodySchema = z.object({
  entityType: z.enum([
    'JOURNAL',
    'AP_INVOICE',
    'AR_INVOICE',
    'FIXED_ASSET',
    'LEASE_CONTRACT',
    'EXPENSE_CLAIM',
    'BANK_RECONCILIATION',
    'TAX_RETURN',
    'PROVISION',
    'IC_TRANSACTION',
  ]),
  entityId: z.string().uuid(),
  linkedCompanyId: z.string().uuid().optional(),
});

const IdParamSchema = z.object({ id: z.string().uuid() });
const ListQuerySchema = z.object({
  entityType: z
    .enum([
      'JOURNAL',
      'AP_INVOICE',
      'AR_INVOICE',
      'FIXED_ASSET',
      'LEASE_CONTRACT',
      'EXPENSE_CLAIM',
      'BANK_RECONCILIATION',
      'TAX_RETURN',
      'PROVISION',
      'IC_TRANSACTION',
    ])
    .optional(),
  entityId: z.string().uuid().optional(),
  cursor: z.string().optional(),
  limit: z.coerce.number().optional().default(20),
  /** include=links — include link metadata for each document */
  include: z.enum(['links']).optional(),
});

export function getAuditContext(req: {
  ip?: string;
  headers?: Record<string, string | string[] | undefined>;
}): {
  ip?: string;
  userAgent?: string;
  traceId?: string;
} {
  const ua = req.headers?.['user-agent'];
  const trace = req.headers?.['x-trace-id'] ?? req.headers?.['x-request-id'];
  return {
    ip: req.ip,
    userAgent: Array.isArray(ua) ? ua[0] : ua,
    traceId: Array.isArray(trace) ? trace[0] : trace,
  };
}

export function registerDocumentRoutes(
  app: FastifyInstance,
  service: DocumentAttachmentService,
  policy: IAuthorizationPolicy
): void {
  // POST /documents/upload — direct upload (< 5MB), computes SHA-256, insert-first dedup
  // Requires @fastify/multipart registered on app
  const uploadRateLimit = documentUploadRateLimitGuard();
  app.post(
    '/documents/upload',
    { preHandler: [requirePermission(policy, 'document:create'), uploadRateLimit] },
    async (req, reply) => {
      const { tenantId, userId } = extractIdentity(req);
      const reqWithFile = req as {
        file?: () => Promise<
          | {
              toBuffer: () => Promise<Buffer>;
              filename?: string;
              mimetype?: string;
              fields?: Record<string, { value?: string }>;
            }
          | undefined
        >;
      };
      const data = await reqWithFile.file?.();
      if (!data) {
        return reply
          .status(400)
          .send({ error: { code: 'VALIDATION', message: 'Missing file field' } });
      }

      const getField = (name: string): string => {
        const f = (data.fields as Record<string, { value?: string }>)?.[name];
        return typeof f === 'object' && f?.value ? f.value : '';
      };
      const parsed = DirectUploadFieldsSchema.safeParse({
        fileName: getField('fileName') || data.filename || 'upload',
        entityType: getField('entityType'),
        entityId: getField('entityId'),
        linkedCompanyId: getField('linkedCompanyId') || undefined,
        category: getField('category') || undefined,
        description: getField('description') || undefined,
        mimeType: getField('mimeType') || data.mimetype || undefined,
      });
      if (!parsed.success) {
        return reply
          .status(400)
          .send({ error: { code: 'VALIDATION', message: parsed.error.message } });
      }

      const fileBuffer = await data.toBuffer();

      try {
        const result = await service.uploadDirect({
          tenantId,
          userId,
          fileBuffer,
          fileName: parsed.data.fileName,
          mimeType: parsed.data.mimeType,
          entityType: parsed.data.entityType as LinkedEntityType,
          entityId: parsed.data.entityId,
          linkedCompanyId: parsed.data.linkedCompanyId,
          category: parsed.data.category,
          description: parsed.data.description,
          auditContext: getAuditContext(req),
        });
        return reply.status(201).send(result);
      } catch (e) {
        const err = e as Error;
        if (err.message.includes('max'))
          return reply.status(413).send({ error: { code: 'TOO_LARGE', message: err.message } });
        throw e;
      }
    }
  );

  // POST /documents/init
  app.post(
    '/documents/init',
    { preHandler: [requirePermission(policy, 'document:create')] },
    async (req, reply) => {
      const body = InitBodySchema.parse(req.body);
      const { tenantId, userId } = extractIdentity(req);
      const idempotencyKey = req.headers['idempotency-key'] as string | undefined;

      try {
        const result = await service.init({
          tenantId,
          userId,
          fileName: body.fileName,
          fileSize: body.fileSize,
          mimeType: body.mimeType,
          category: body.category,
          description: body.description,
          entityType: body.entityType as LinkedEntityType | undefined,
          entityId: body.entityId,
          linkedCompanyId: body.linkedCompanyId,
          idempotencyKey,
          auditContext: getAuditContext(req),
        });
        return reply.status(201).send(result);
      } catch (e) {
        const err = e as Error;
        if (err.message.includes('too large'))
          return reply.status(413).send({ error: { code: 'TOO_LARGE', message: err.message } });
        throw e;
      }
    }
  );

  const presignRateLimit = documentPresignRateLimitGuard();
  // POST /documents/:id/presign
  app.post(
    '/documents/:id/presign',
    { preHandler: [requirePermission(policy, 'document:create'), presignRateLimit] },
    async (req, reply) => {
      const { id } = IdParamSchema.parse(req.params);
      const { tenantId, userId } = extractIdentity(req);
      const body = z
        .object({ expirySec: z.number().optional() })
        .optional()
        .parse(req.body ?? {});

      try {
        const result = await service.presign({
          tenantId,
          userId,
          documentId: id,
          expirySec: body?.expirySec,
          auditContext: getAuditContext(req),
        });
        return reply.send(result);
      } catch (e) {
        const err = e as Error;
        if (err.message.includes('deleted'))
          return reply.status(410).send({ error: { code: 'GONE', message: err.message } });
        if (err.message.includes('not found'))
          return reply.status(404).send({ error: { code: 'NOT_FOUND', message: err.message } });
        throw e;
      }
    }
  );

  // POST /documents/:id/complete
  app.post(
    '/documents/:id/complete',
    { preHandler: [requirePermission(policy, 'document:create')] },
    async (req, reply) => {
      const { id } = IdParamSchema.parse(req.params);
      const body = CompleteBodySchema.parse(req.body);
      const { tenantId, userId } = extractIdentity(req);
      const idempotencyKey = req.headers['idempotency-key'] as string | undefined;

      try {
        const result = await service.complete({
          tenantId,
          userId,
          documentId: id,
          entityType: body.entityType as LinkedEntityType,
          entityId: body.entityId,
          linkedCompanyId: body.linkedCompanyId,
          idempotencyKey,
          auditContext: getAuditContext(req),
        });
        return reply.send(result);
      } catch (e) {
        const err = e as Error;
        if (err.message.includes('deleted'))
          return reply.status(410).send({ error: { code: 'GONE', message: err.message } });
        if (err.message.includes('not found'))
          return reply.status(404).send({ error: { code: 'NOT_FOUND', message: err.message } });
        throw e;
      }
    }
  );

  // GET /documents/:id/download
  app.get(
    '/documents/:id/download',
    { preHandler: [requirePermission(policy, 'document:read')] },
    async (req, reply) => {
      const { id } = IdParamSchema.parse(req.params);
      const { tenantId, userId } = extractIdentity(req);
      const query =
        req.query && typeof req.query === 'object' ? (req.query as Record<string, unknown>) : {};
      const filename = 'filename' in query ? String(query.filename) : undefined;
      const allowNotScanned = query.allowNotScanned === 'true' || query.allowNotScanned === true;

      try {
        const url = await service.getDownloadUrl(tenantId, userId, id, filename, {
          allowNotScanned,
          auditContext: getAuditContext(req),
        });
        return reply.send({ url });
      } catch (e) {
        const err = e as Error;
        if (err.message.includes('deleted'))
          return reply.status(410).send({ error: { code: 'GONE', message: err.message } });
        if (err.message.includes('not found'))
          return reply.status(404).send({ error: { code: 'NOT_FOUND', message: err.message } });
        if (err.message.includes('not verified') || err.message.includes('not clean')) {
          return reply.status(403).send({ error: { code: 'FORBIDDEN', message: err.message } });
        }
        throw e;
      }
    }
  );

  // GET /documents
  app.get(
    '/documents',
    { preHandler: [requirePermission(policy, 'document:list')] },
    async (req, reply) => {
      const query = ListQuerySchema.parse(req.query);
      const { tenantId } = extractIdentity(req);

      if (!query.entityType || !query.entityId) {
        return reply
          .status(400)
          .send({ error: { code: 'VALIDATION', message: 'entityType and entityId required' } });
      }

      const result = await service.list({
        tenantId,
        entityType: query.entityType as LinkedEntityType,
        entityId: query.entityId,
        cursor: query.cursor,
        limit: query.limit,
        includeLinks: query.include === 'links',
      });
      return reply.send(result);
    }
  );

  // DELETE /documents/:id
  app.delete(
    '/documents/:id',
    { preHandler: [requirePermission(policy, 'document:delete')] },
    async (req, reply) => {
      const { id } = IdParamSchema.parse(req.params);
      const { tenantId, userId } = extractIdentity(req);

      try {
        await service.remove(tenantId, userId, id, getAuditContext(req));
        return reply.status(204).send();
      } catch (e) {
        const err = e as Error;
        if (err.message.includes('not found'))
          return reply.status(404).send({ error: { code: 'NOT_FOUND', message: err.message } });
        throw e;
      }
    }
  );
}
