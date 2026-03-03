/**
 * SP-1004: Notification Backbone — dispatch portal notifications via outbox → worker.
 *
 * Defines the PORT (interface) for notification dispatch.
 * Actual delivery uses the existing platform.notifications infrastructure.
 */

import type { ActorType } from '../context/portal-request-context.js';

// ─── Notification Types ─────────────────────────────────────────────────────

export const PORTAL_NOTIFICATION_CHANNELS = ['email', 'in_app', 'push'] as const;
export type PortalNotificationChannel = (typeof PORTAL_NOTIFICATION_CHANNELS)[number];

export type PortalNotificationType =
  | 'CASE_STATUS_CHANGED'
  | 'CASE_ASSIGNED'
  | 'CASE_MESSAGE_RECEIVED'
  | 'CASE_SLA_BREACH'
  | 'ESCALATION_TRIGGERED'
  | 'ESCALATION_ASSIGNED'
  | 'PAYMENT_STATUS_CHANGED'
  | 'INVOICE_STATUS_CHANGED'
  | 'COMPLIANCE_EXPIRING'
  | 'COMPLIANCE_EXPIRED'
  | 'DOCUMENT_SHARED'
  | 'ONBOARDING_STATUS_CHANGED'
  | 'BANK_ACCOUNT_STATUS_CHANGED'
  | 'ANNOUNCEMENT_PUBLISHED'
  | 'APPOINTMENT_CONFIRMED'
  | 'APPOINTMENT_CANCELLED';

export interface PortalNotification {
  readonly tenantId: string;
  readonly recipientId: string;
  readonly recipientType: ActorType;
  readonly type: PortalNotificationType;
  readonly channels: readonly PortalNotificationChannel[];
  readonly payload: Record<string, unknown>;
  /** Reference entity (case, invoice, payment, etc.) */
  readonly entityRef?: {
    readonly entityType: string;
    readonly entityId: string;
  };
}

// ─── Notification Dispatcher Port ───────────────────────────────────────────

/**
 * Port for dispatching portal notifications.
 *
 * Implementation writes to outbox → worker picks up → platform.notifications delivers.
 * One dispatcher for all portal services — no per-service notification logic.
 */
export interface IPortalNotificationDispatcher {
  /**
   * Dispatch a notification to the outbox for async delivery.
   *
   * @param notification The notification to dispatch.
   * @param tx Optional transaction handle — if provided, writes to outbox within the same transaction.
   */
  dispatch(notification: PortalNotification, tx?: unknown): Promise<void>;

  /**
   * Dispatch multiple notifications atomically.
   */
  dispatchBatch(notifications: readonly PortalNotification[], tx?: unknown): Promise<void>;
}
