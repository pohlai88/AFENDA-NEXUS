import type { IIdempotencyStore } from './idempotency-store.js';
import type { IOutboxWriter } from './outbox-writer.js';
import type { IAuthorizationPolicy } from './authorization.js';
import type { ISoDActionLogRepo } from './sod-action-log-repo.js';
import type { IRoleResolver } from './role-resolver.js';
import type { IApprovalPolicyRepo } from './approval-policy-repo.js';
import type { IApprovalRequestRepo } from './approval-request-repo.js';

export interface SharedDeps {
  readonly idempotencyStore: IIdempotencyStore;
  readonly outboxWriter: IOutboxWriter;
  readonly authorizationPolicy: IAuthorizationPolicy;
  readonly sodActionLogRepo: ISoDActionLogRepo;
  readonly roleResolver: IRoleResolver;
  readonly approvalPolicyRepo?: IApprovalPolicyRepo;
  readonly approvalRequestRepo?: IApprovalRequestRepo;
}
