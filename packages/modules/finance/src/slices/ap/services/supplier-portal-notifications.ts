import type { Result } from '@afenda/core';
import { ok, err, AppError } from '@afenda/core';
import type { ISupplierRepo } from '../ports/supplier-repo.js';

/**
 * N10: Supplier notification preferences.
 *
 * Allows suppliers to configure which events they want to be notified
 * about and through which channels. The worker/event-handler uses these
 * preferences to decide whether to send emails/webhooks.
 */

export type NotificationChannel = 'EMAIL' | 'WEBHOOK';

export type NotificationEventType =
  | 'INVOICE_POSTED'
  | 'INVOICE_APPROVED'
  | 'PAYMENT_EXECUTED'
  | 'PAYMENT_REJECTED'
  | 'HOLD_PLACED'
  | 'HOLD_RELEASED'
  | 'REMITTANCE_READY'
  | 'DISPUTE_UPDATED';

export interface SupplierNotificationPref {
  readonly supplierId: string;
  readonly tenantId: string;
  readonly eventType: NotificationEventType;
  readonly channel: NotificationChannel;
  readonly enabled: boolean;
  readonly webhookUrl: string | null;
}

export interface ISupplierNotificationPrefRepo {
  findBySupplierId(supplierId: string): Promise<readonly SupplierNotificationPref[]>;
  upsert(pref: SupplierNotificationPref): Promise<SupplierNotificationPref>;
  bulkUpsert(
    prefs: readonly SupplierNotificationPref[]
  ): Promise<readonly SupplierNotificationPref[]>;
}

export interface GetNotificationPrefsInput {
  readonly tenantId: string;
  readonly supplierId: string;
}

export async function supplierGetNotificationPrefs(
  input: GetNotificationPrefsInput,
  deps: {
    supplierRepo: ISupplierRepo;
    supplierNotificationPrefRepo: ISupplierNotificationPrefRepo;
  }
): Promise<Result<readonly SupplierNotificationPref[]>> {
  const supplierResult = await deps.supplierRepo.findById(input.supplierId);
  if (!supplierResult.ok) {
    return err(new AppError('NOT_FOUND', 'Supplier not found'));
  }

  const prefs = await deps.supplierNotificationPrefRepo.findBySupplierId(input.supplierId);
  return ok(prefs);
}

export interface UpdateNotificationPrefInput {
  readonly tenantId: string;
  readonly supplierId: string;
  readonly preferences: readonly {
    readonly eventType: NotificationEventType;
    readonly channel: NotificationChannel;
    readonly enabled: boolean;
    readonly webhookUrl?: string | null;
  }[];
}

const VALID_EVENTS: ReadonlySet<string> = new Set([
  'INVOICE_POSTED',
  'INVOICE_APPROVED',
  'PAYMENT_EXECUTED',
  'PAYMENT_REJECTED',
  'HOLD_PLACED',
  'HOLD_RELEASED',
  'REMITTANCE_READY',
  'DISPUTE_UPDATED',
]);

const WEBHOOK_URL_REGEX = /^https:\/\/.+/;

export async function supplierUpdateNotificationPrefs(
  input: UpdateNotificationPrefInput,
  deps: {
    supplierRepo: ISupplierRepo;
    supplierNotificationPrefRepo: ISupplierNotificationPrefRepo;
  }
): Promise<Result<readonly SupplierNotificationPref[]>> {
  const supplierResult = await deps.supplierRepo.findById(input.supplierId);
  if (!supplierResult.ok) {
    return err(new AppError('NOT_FOUND', 'Supplier not found'));
  }
  if (supplierResult.value.status === 'INACTIVE') {
    return err(new AppError('VALIDATION', 'Supplier is inactive'));
  }

  // Validate each preference
  for (const pref of input.preferences) {
    if (!VALID_EVENTS.has(pref.eventType)) {
      return err(new AppError('VALIDATION', `Invalid event type: ${pref.eventType}`));
    }
    if (pref.channel === 'WEBHOOK' && pref.enabled) {
      if (!pref.webhookUrl || !WEBHOOK_URL_REGEX.test(pref.webhookUrl)) {
        return err(new AppError('VALIDATION', 'Webhook URL must be a valid HTTPS URL'));
      }
    }
  }

  const prefs: SupplierNotificationPref[] = input.preferences.map((p) => ({
    supplierId: input.supplierId,
    tenantId: input.tenantId,
    eventType: p.eventType,
    channel: p.channel,
    enabled: p.enabled,
    webhookUrl: p.webhookUrl ?? null,
  }));

  const result = await deps.supplierNotificationPrefRepo.bulkUpsert(prefs);
  return ok(result);
}
