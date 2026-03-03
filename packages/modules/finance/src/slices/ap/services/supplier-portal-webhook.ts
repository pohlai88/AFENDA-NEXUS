/**
 * SP-5021: Portal Webhook Subscription Service (CAP-API P18)
 *
 * CRUD for supplier webhook subscriptions. Suppliers use this to receive
 * real-time push notifications for portal events via HTTPS callbacks.
 *
 * Security invariants:
 *   - Signing secrets are generated on creation and NEVER returned after.
 *   - A supplier can have at most MAX_SUBSCRIPTIONS_PER_SUPPLIER active subs.
 *   - Endpoint URL must be HTTPS (enforced at this layer).
 *   - Only the supplier who owns the subscription can modify or delete it.
 *
 * Supported event types (CAP-API §1.0):
 *   invoice.submitted       — invoice submitted by supplier
 *   invoice.status_changed  — AP changed invoice status
 *   payment.sent            — payment released to supplier
 *   payment.returned        — payment returned / rejected by bank
 *   case.created            — new case opened
 *   case.status_changed     — case status transition
 *   case.message_received   — new message on a case
 *   escalation.triggered    — breakglass escalation created
 *   escalation.resolved     — escalation resolved
 *   compliance.expiring     — compliance item expiring within 30 days
 *   compliance.expired      — compliance item expired
 *   announcement.published  — new portal announcement
 */
import { randomBytes, createHmac } from 'node:crypto';
import type { Result } from '@afenda/core';
import { ok, err, ValidationError, NotFoundError, AppError } from '@afenda/core';

export const SUPPORTED_EVENT_TYPES = [
  'invoice.submitted',
  'invoice.status_changed',
  'payment.sent',
  'payment.returned',
  'case.created',
  'case.status_changed',
  'case.message_received',
  'escalation.triggered',
  'escalation.resolved',
  'compliance.expiring',
  'compliance.expired',
  'announcement.published',
] as const;

export type WebhookEventType = (typeof SUPPORTED_EVENT_TYPES)[number];

export type WebhookStatus = 'ACTIVE' | 'PAUSED' | 'SUSPENDED' | 'DELETED';

const MAX_SUBSCRIPTIONS_PER_SUPPLIER = 10;

// ─── Domain Types ─────────────────────────────────────────────────────────────

export interface WebhookSubscription {
  readonly id: string;
  readonly tenantId: string;
  readonly supplierId: string;
  readonly label: string;
  readonly endpointUrl: string;
  // signingSecret is NEVER returned — omitted from this type intentionally
  readonly eventTypes: readonly WebhookEventType[];
  readonly status: WebhookStatus;
  readonly failureCount: number;
  readonly lastDeliveredAt: string | null;
  readonly lastFailedAt: string | null;
  readonly lastFailureReason: string | null;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface CreateWebhookInput {
  readonly tenantId: string;
  readonly supplierId: string;
  readonly createdBy: string;
  readonly label: string;
  readonly endpointUrl: string;
  readonly eventTypes: readonly WebhookEventType[];
}

export interface UpdateWebhookInput {
  readonly label?: string;
  readonly endpointUrl?: string;
  readonly eventTypes?: readonly WebhookEventType[];
}

// ─── Repository Port ──────────────────────────────────────────────────────────

export interface IWebhookSubscriptionRepo {
  findBySupplierId(supplierId: string): Promise<readonly WebhookSubscription[]>;
  findById(id: string): Promise<WebhookSubscription | null>;
  countActiveBySupplierId(supplierId: string): Promise<number>;
  create(
    data: Omit<CreateWebhookInput, never> & { id: string; signingSecret: string }
  ): Promise<WebhookSubscription>;
  update(id: string, patch: UpdateWebhookInput): Promise<WebhookSubscription>;
  pause(id: string): Promise<WebhookSubscription>;
  resume(id: string): Promise<WebhookSubscription>;
  softDelete(id: string): Promise<void>;
  rotateSigning(id: string, newSecret: string): Promise<void>;
  recordDeliverySuccess(id: string): Promise<void>;
  recordDeliveryFailure(id: string, reason: string): Promise<void>;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function generateSecret(): string {
  return randomBytes(32).toString('hex');
}

function generateId(): string {
  return crypto.randomUUID();
}

function isValidHttpsUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

function validateEventTypes(types: readonly string[]): types is WebhookEventType[] {
  return types.every((t) => SUPPORTED_EVENT_TYPES.includes(t as WebhookEventType));
}

// ─── Service ─────────────────────────────────────────────────────────────────

export interface WebhookServiceDeps {
  readonly webhookRepo: IWebhookSubscriptionRepo;
}

export type WebhookError =
  | { code: 'VALIDATION_ERROR'; message: string }
  | { code: 'NOT_FOUND'; message: string }
  | { code: 'LIMIT_EXCEEDED'; message: string }
  | { code: 'FORBIDDEN'; message: string };

/** List all non-deleted subscriptions for a supplier. */
export async function listWebhooks(
  deps: WebhookServiceDeps,
  supplierId: string
): Promise<Result<readonly WebhookSubscription[], WebhookError>> {
  const items = await deps.webhookRepo.findBySupplierId(supplierId);
  return ok(items);
}

/** Create a new webhook subscription. Returns the subscription without the signingSecret. */
export async function createWebhook(
  deps: WebhookServiceDeps,
  input: CreateWebhookInput
): Promise<Result<{ subscription: WebhookSubscription; signingSecret: string }, WebhookError>> {
  if (!input.label.trim()) {
    return err({ code: 'VALIDATION_ERROR', message: 'Label is required.' });
  }

  if (!isValidHttpsUrl(input.endpointUrl)) {
    return err({
      code: 'VALIDATION_ERROR',
      message: 'Endpoint URL must be a valid HTTPS URL.',
    });
  }

  if (input.eventTypes.length === 0) {
    return err({
      code: 'VALIDATION_ERROR',
      message: 'At least one event type must be selected.',
    });
  }

  if (!validateEventTypes(input.eventTypes)) {
    return err({ code: 'VALIDATION_ERROR', message: 'One or more event types are invalid.' });
  }

  const activeCount = await deps.webhookRepo.countActiveBySupplierId(input.supplierId);
  if (activeCount >= MAX_SUBSCRIPTIONS_PER_SUPPLIER) {
    return err({
      code: 'LIMIT_EXCEEDED',
      message: `Maximum of ${MAX_SUBSCRIPTIONS_PER_SUPPLIER} webhook subscriptions per supplier.`,
    });
  }

  const signingSecret = generateSecret();
  const subscription = await deps.webhookRepo.create({
    ...input,
    id: generateId(),
    signingSecret,
  });

  // Return the secret ONCE — it will never be retrievable again.
  return ok({ subscription, signingSecret });
}

/** Update label, endpoint URL, or event types. */
export async function updateWebhook(
  deps: WebhookServiceDeps,
  id: string,
  patch: UpdateWebhookInput,
  requestingSupplierId: string
): Promise<Result<WebhookSubscription, WebhookError>> {
  const existing = await deps.webhookRepo.findById(id);
  if (!existing) return err({ code: 'NOT_FOUND', message: 'Webhook subscription not found.' });
  if (existing.supplierId !== requestingSupplierId) {
    return err({ code: 'FORBIDDEN', message: "Cannot modify another supplier's webhook." });
  }

  if (patch.endpointUrl && !isValidHttpsUrl(patch.endpointUrl)) {
    return err({ code: 'VALIDATION_ERROR', message: 'Endpoint URL must be a valid HTTPS URL.' });
  }

  if (patch.eventTypes !== undefined) {
    if (patch.eventTypes.length === 0) {
      return err({
        code: 'VALIDATION_ERROR',
        message: 'At least one event type must be selected.',
      });
    }
    if (!validateEventTypes(patch.eventTypes)) {
      return err({ code: 'VALIDATION_ERROR', message: 'One or more event types are invalid.' });
    }
  }

  const updated = await deps.webhookRepo.update(id, patch);
  return ok(updated);
}

/** Pause a subscription (no deliveries until resumed). */
export async function pauseWebhook(
  deps: WebhookServiceDeps,
  id: string,
  requestingSupplierId: string
): Promise<Result<WebhookSubscription, WebhookError>> {
  const existing = await deps.webhookRepo.findById(id);
  if (!existing) return err({ code: 'NOT_FOUND', message: 'Webhook subscription not found.' });
  if (existing.supplierId !== requestingSupplierId) {
    return err({ code: 'FORBIDDEN', message: "Cannot modify another supplier's webhook." });
  }
  const updated = await deps.webhookRepo.pause(id);
  return ok(updated);
}

/** Resume a paused or suspended subscription. */
export async function resumeWebhook(
  deps: WebhookServiceDeps,
  id: string,
  requestingSupplierId: string
): Promise<Result<WebhookSubscription, WebhookError>> {
  const existing = await deps.webhookRepo.findById(id);
  if (!existing) return err({ code: 'NOT_FOUND', message: 'Webhook subscription not found.' });
  if (existing.supplierId !== requestingSupplierId) {
    return err({ code: 'FORBIDDEN', message: "Cannot modify another supplier's webhook." });
  }
  const updated = await deps.webhookRepo.resume(id);
  return ok(updated);
}

/** Soft-delete a subscription. Idempotent. */
export async function deleteWebhook(
  deps: WebhookServiceDeps,
  id: string,
  requestingSupplierId: string
): Promise<Result<void, WebhookError>> {
  const existing = await deps.webhookRepo.findById(id);
  if (!existing) return err({ code: 'NOT_FOUND', message: 'Webhook subscription not found.' });
  if (existing.supplierId !== requestingSupplierId) {
    return err({ code: 'FORBIDDEN', message: "Cannot modify another supplier's webhook." });
  }
  await deps.webhookRepo.softDelete(id);
  return ok(undefined);
}

/** Rotate the signing secret. Returns the new secret ONCE. */
export async function rotateWebhookSecret(
  deps: WebhookServiceDeps,
  id: string,
  requestingSupplierId: string
): Promise<Result<{ newSecret: string }, WebhookError>> {
  const existing = await deps.webhookRepo.findById(id);
  if (!existing) return err({ code: 'NOT_FOUND', message: 'Webhook subscription not found.' });
  if (existing.supplierId !== requestingSupplierId) {
    return err({ code: 'FORBIDDEN', message: "Cannot modify another supplier's webhook." });
  }
  const newSecret = generateSecret();
  await deps.webhookRepo.rotateSigning(id, newSecret);
  return ok({ newSecret });
}

/**
 * Sign a webhook payload for delivery.
 * Header: X-Afenda-Signature: sha256={hmac}
 */
export function signWebhookPayload(payload: string, secret: string): string {
  const hmac = createHmac('sha256', secret).update(payload, 'utf8').digest('hex');
  return `sha256=${hmac}`;
}

/**
 * Verify an incoming webhook signature (for testing/resend scenarios).
 */
export function verifyWebhookSignature(
  payload: string,
  secret: string,
  signature: string
): boolean {
  const expected = signWebhookPayload(payload, secret);
  // Constant-time comparison
  try {
    const { timingSafeEqual } = require('node:crypto') as typeof import('node:crypto');
    return timingSafeEqual(Buffer.from(expected, 'utf8'), Buffer.from(signature, 'utf8'));
  } catch {
    return expected === signature;
  }
}
