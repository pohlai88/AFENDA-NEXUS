import { eq, and } from 'drizzle-orm';
import type { TenantTx } from '@afenda/db';
import { supplierNotificationPrefs } from '@afenda/db';
import type {
  SupplierNotificationPref,
  ISupplierNotificationPrefRepo,
} from '../services/supplier-portal-notifications.js';

type PrefRow = typeof supplierNotificationPrefs.$inferSelect;

/**
 * Maps DB row (per-channel with boolean flags) to the service's per-event interface.
 * Each DB row represents one channel for a supplier; the service
 * returns per-event-type preferences. We expand each row into
 * per-event entries based on the boolean flags.
 */
const EVENT_FLAG_MAP = [
  { eventType: 'INVOICE_POSTED', flag: 'invoiceStatusChanges' },
  { eventType: 'INVOICE_APPROVED', flag: 'invoiceStatusChanges' },
  { eventType: 'PAYMENT_EXECUTED', flag: 'paymentNotifications' },
  { eventType: 'PAYMENT_REJECTED', flag: 'paymentNotifications' },
  { eventType: 'REMITTANCE_READY', flag: 'paymentNotifications' },
  { eventType: 'HOLD_PLACED', flag: 'invoiceStatusChanges' },
  { eventType: 'HOLD_RELEASED', flag: 'invoiceStatusChanges' },
  { eventType: 'DISPUTE_UPDATED', flag: 'disputeUpdates' },
] as const;

function expandRow(row: PrefRow): SupplierNotificationPref[] {
  return EVENT_FLAG_MAP.map(({ eventType, flag }) => ({
    supplierId: row.supplierId,
    tenantId: row.tenantId,
    eventType: eventType as SupplierNotificationPref['eventType'],
    channel: row.channel.toUpperCase() as SupplierNotificationPref['channel'],
    enabled: row.isActive && row[flag],
    webhookUrl: row.channel === 'WEBHOOK' ? row.endpoint : null,
  }));
}

export class DrizzleSupplierNotificationPrefRepo implements ISupplierNotificationPrefRepo {
  constructor(private readonly tx: TenantTx) {}

  async findBySupplierId(supplierId: string): Promise<readonly SupplierNotificationPref[]> {
    const rows = await this.tx.query.supplierNotificationPrefs.findMany({
      where: eq(supplierNotificationPrefs.supplierId, supplierId),
    });
    return rows.flatMap(expandRow);
  }

  async upsert(pref: SupplierNotificationPref): Promise<SupplierNotificationPref> {
    const channel = pref.channel.toLowerCase();
    const endpoint = pref.webhookUrl ?? (pref.channel === 'EMAIL' ? 'default' : '');

    const existing = await this.tx.query.supplierNotificationPrefs.findFirst({
      where: and(
        eq(supplierNotificationPrefs.supplierId, pref.supplierId),
        eq(supplierNotificationPrefs.channel, channel)
      ),
    });

    if (existing) {
      await this.tx
        .update(supplierNotificationPrefs)
        .set({ isActive: pref.enabled, endpoint, updatedAt: new Date() })
        .where(eq(supplierNotificationPrefs.id, existing.id));
    } else {
      await this.tx.insert(supplierNotificationPrefs).values({
        tenantId: pref.tenantId,
        supplierId: pref.supplierId,
        channel,
        endpoint,
        isActive: pref.enabled,
      });
    }

    return pref;
  }

  async bulkUpsert(
    prefs: readonly SupplierNotificationPref[]
  ): Promise<readonly SupplierNotificationPref[]> {
    const results: SupplierNotificationPref[] = [];
    for (const pref of prefs) {
      results.push(await this.upsert(pref));
    }
    return results;
  }
}
