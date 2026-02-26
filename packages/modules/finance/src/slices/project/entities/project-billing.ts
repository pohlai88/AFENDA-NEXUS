/**
 * Project billing entity — billing events against a project.
 */

export type BillingStatus = 'DRAFT' | 'INVOICED' | 'PAID';

export interface ProjectBilling {
  readonly id: string;
  readonly tenantId: string;
  readonly projectId: string;
  readonly billingDate: Date;
  readonly description: string;
  readonly amount: bigint;
  readonly currencyCode: string;
  readonly status: BillingStatus;
  readonly milestoneRef: string | null;
  readonly arInvoiceId: string | null;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}
