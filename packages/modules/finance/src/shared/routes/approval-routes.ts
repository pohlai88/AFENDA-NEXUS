/**
 * GAP-A2: Shared approval workflow routes.
 *
 * POST /approvals/submit         — submit entity for approval
 * POST /approvals/:id/approve    — approve current step
 * POST /approvals/:id/reject     — reject (terminates chain)
 * POST /approvals/:id/delegate   — delegate current step
 * POST /approvals/:id/cancel     — cancel by requester
 * GET  /approvals/pending        — list pending for current user
 * GET  /approvals/entity/:entityType/:entityId — find by entity
 * POST /approval-policies        — create policy
 * GET  /approval-policies/:entityType — list policies by entity type
 */
import type { FastifyInstance } from 'fastify';
import {
  IdParamSchema,
  SubmitApprovalSchema,
  ApproveRejectSchema,
  RejectApprovalSchema,
  DelegateApprovalSchema,
  CreateApprovalPolicySchema,
} from '@afenda/contracts';
import type { FinanceRuntime } from '../../app/ports/finance-runtime.js';
import type { IAuthorizationPolicy } from '../ports/authorization.js';
import { requirePermission } from './authorization-guard.js';
import { mapErrorToStatus } from './error-mapper.js';
import { ApprovalWorkflowService } from '../services/approval-workflow-service.js';
import { extractIdentity } from '@afenda/api-kit';

export function registerApprovalRoutes(
  app: FastifyInstance,
  runtime: FinanceRuntime,
  policy: IAuthorizationPolicy
): void {
  // POST /approvals/submit — submit entity for approval
  app.post(
    '/approvals/submit',
    { preHandler: [requirePermission(policy, 'journal:create')] },
    async (req, reply) => {
      const body = SubmitApprovalSchema.parse(req.body);
      const { tenantId, userId } = extractIdentity(req);

      const result = await runtime.withTenant({ tenantId, userId }, async (deps) => {
        const workflow = new ApprovalWorkflowService(
          deps.approvalPolicyRepo!,
          deps.approvalRequestRepo!,
          deps.outboxWriter
        );
        return workflow.submit({
          tenantId,
          entityType: body.entityType,
          entityId: body.entityId,
          requestedBy: userId,
          metadata: body.metadata,
        });
      });

      return result.ok
        ? reply.status(201).send(result.value)
        : reply.status(mapErrorToStatus(result.error)).send({ error: result.error });
    }
  );

  // POST /approvals/:id/approve
  app.post(
    '/approvals/:id/approve',
    { preHandler: [requirePermission(policy, 'journal:post')] },
    async (req, reply) => {
      const { id } = IdParamSchema.parse(req.params);
      const { tenantId, userId } = extractIdentity(req);
      const body = ApproveRejectSchema.parse(req.body);

      const result = await runtime.withTenant({ tenantId, userId }, async (deps) => {
        const workflow = new ApprovalWorkflowService(
          deps.approvalPolicyRepo!,
          deps.approvalRequestRepo!,
          deps.outboxWriter
        );
        return workflow.approve(id, userId, body.reason);
      });

      return result.ok
        ? reply.send(result.value)
        : reply.status(mapErrorToStatus(result.error)).send({ error: result.error });
    }
  );

  // POST /approvals/:id/reject
  app.post(
    '/approvals/:id/reject',
    { preHandler: [requirePermission(policy, 'journal:post')] },
    async (req, reply) => {
      const { id } = IdParamSchema.parse(req.params);
      const { tenantId, userId } = extractIdentity(req);
      const body = RejectApprovalSchema.parse(req.body);

      const result = await runtime.withTenant({ tenantId, userId }, async (deps) => {
        const workflow = new ApprovalWorkflowService(
          deps.approvalPolicyRepo!,
          deps.approvalRequestRepo!,
          deps.outboxWriter
        );
        return workflow.reject(id, userId, body.reason);
      });

      return result.ok
        ? reply.send(result.value)
        : reply.status(mapErrorToStatus(result.error)).send({ error: result.error });
    }
  );

  // POST /approvals/:id/delegate
  app.post(
    '/approvals/:id/delegate',
    { preHandler: [requirePermission(policy, 'journal:post')] },
    async (req, reply) => {
      const { id } = IdParamSchema.parse(req.params);
      const { tenantId, userId } = extractIdentity(req);
      const body = DelegateApprovalSchema.parse(req.body);

      const result = await runtime.withTenant({ tenantId, userId }, async (deps) => {
        const workflow = new ApprovalWorkflowService(
          deps.approvalPolicyRepo!,
          deps.approvalRequestRepo!,
          deps.outboxWriter
        );
        return workflow.delegate(id, userId, body.delegateTo);
      });

      return result.ok
        ? reply.send(result.value)
        : reply.status(mapErrorToStatus(result.error)).send({ error: result.error });
    }
  );

  // POST /approvals/:id/cancel
  app.post('/approvals/:id/cancel', async (req, reply) => {
    const { id } = IdParamSchema.parse(req.params);
    const { tenantId, userId } = extractIdentity(req);

    const result = await runtime.withTenant({ tenantId, userId }, async (deps) => {
      const workflow = new ApprovalWorkflowService(
        deps.approvalPolicyRepo!,
        deps.approvalRequestRepo!,
        deps.outboxWriter
      );
      return workflow.cancel(id, userId);
    });

    return result.ok
      ? reply.send(result.value)
      : reply.status(mapErrorToStatus(result.error)).send({ error: result.error });
  });

  // GET /approvals/pending
  app.get('/approvals/pending', async (req, reply) => {
    const { tenantId, userId } = extractIdentity(req);

    const result = await runtime.withTenant({ tenantId, userId }, async (deps) => {
      const workflow = new ApprovalWorkflowService(
        deps.approvalPolicyRepo!,
        deps.approvalRequestRepo!,
        deps.outboxWriter
      );
      return workflow.findPendingForApprover(tenantId, userId);
    });

    return result.ok
      ? reply.send(result.value)
      : reply.status(mapErrorToStatus(result.error)).send({ error: result.error });
  });

  // GET /approvals/entity/:entityType/:entityId
  app.get('/approvals/entity/:entityType/:entityId', async (req, reply) => {
    const { entityType, entityId } = req.params as { entityType: string; entityId: string };
    const { tenantId, userId } = extractIdentity(req);

    const result = await runtime.withTenant({ tenantId, userId }, async (deps) => {
      const workflow = new ApprovalWorkflowService(
        deps.approvalPolicyRepo!,
        deps.approvalRequestRepo!,
        deps.outboxWriter
      );
      return workflow.findByEntity(tenantId, entityType, entityId);
    });

    return result.ok
      ? reply.send(result.value)
      : reply.status(mapErrorToStatus(result.error)).send({ error: result.error });
  });

  // POST /approval-policies — create policy
  app.post(
    '/approval-policies',
    { preHandler: [requirePermission(policy, 'admin:all')] },
    async (req, reply) => {
      const body = CreateApprovalPolicySchema.parse(req.body);
      const { tenantId, userId } = extractIdentity(req);

      const result = await runtime.withTenant({ tenantId, userId }, async (deps) => {
        return deps.approvalPolicyRepo!.create({
          tenantId,
          companyId: body.companyId ?? null,
          entityType: body.entityType,
          name: body.name,
          rules: body.rules,
        });
      });

      return result.ok
        ? reply.status(201).send(result.value)
        : reply.status(mapErrorToStatus(result.error)).send({ error: result.error });
    }
  );

  // GET /approval-policies/:entityType — list policies
  app.get('/approval-policies/:entityType', async (req, reply) => {
    const { entityType } = req.params as { entityType: string };
    const { tenantId, userId } = extractIdentity(req);

    const result = await runtime.withTenant({ tenantId, userId }, async (deps) => {
      return deps.approvalPolicyRepo!.findByTenantAndEntityType(tenantId, entityType);
    });

    return reply.send(result);
  });
}
