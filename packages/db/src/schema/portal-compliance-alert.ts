/**
 * Portal Compliance Alert Log table (Phase 1.1.3 — CAP-COMPL)
 *
 * Tracks which compliance expiry alerts have been sent to prevent
 * duplicate notifications. One row per (complianceItemId, alertType)
 * so the cron scanner knows not to re-alert for the same threshold.
 *
 * All tables are tenant-scoped with RLS enabled.
 */
import { index, timestamp, uniqueIndex, uuid } from 'drizzle-orm/pg-core';
import { erpSchema } from './_schemas';
import { pkId, tenantCol, timestamps } from './_common';
import { complianceAlertTypeEnum } from './_enums';
import { supplierComplianceItems } from './erp';
import { suppliers } from './erp';

// ─── erp.supplier_compliance_alert_log (CAP-COMPL) ─────────────────────────

/**
 * Prevents duplicate alert dispatches. The compliance cron job checks
 * this table before sending a notification for a given (item, alertType) pair.
 *
 * - EXPIRING_30D: sent once when item enters 30-day window
 * - EXPIRING_14D: sent once when item enters 14-day window
 * - EXPIRING_7D:  sent once when item enters 7-day window
 * - EXPIRED:      sent once when item actually expires
 *
 * If a supplier renews the item, the related alert rows are soft-deleted
 * (supersededAt set) so the cycle can restart for the new expiry date.
 */
export const supplierComplianceAlertLog = erpSchema
  .table(
    'supplier_compliance_alert_log',
    {
      ...pkId(),
      ...tenantCol(),

      /** The compliance item that triggered this alert. */
      complianceItemId: uuid('compliance_item_id')
        .notNull()
        .references(() => supplierComplianceItems.id, { onDelete: 'cascade' }),

      /** The supplier who owns this compliance item. */
      supplierId: uuid('supplier_id')
        .notNull()
        .references(() => suppliers.id, { onDelete: 'cascade' }),

      /** Which threshold was hit when alert was sent. */
      alertType: complianceAlertTypeEnum('alert_type').notNull(),

      /** When the alert notification was dispatched. */
      alertedAt: timestamp('alerted_at', { withTimezone: true }).notNull().defaultNow(),

      /** If not null, this alert has been superseded by a renewal. */
      supersededAt: timestamp('superseded_at', { withTimezone: true }),

      ...timestamps(),
    },
    (t) => [
      // Fast lookup: "has this alert already been sent?"
      uniqueIndex('uq_compliance_alert_item_type').on(t.tenantId, t.complianceItemId, t.alertType),
      // Find all alerts for a supplier
      index('idx_compliance_alert_supplier').on(t.tenantId, t.supplierId),
    ]
  )
  .enableRLS();
