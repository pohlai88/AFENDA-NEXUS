/**
 * Expense policy entity — category-level spending limits and rules.
 */

export interface ExpensePolicy {
  readonly id: string;
  readonly tenantId: string;
  readonly companyId: string;
  readonly name: string;
  readonly category: string;
  readonly maxAmountPerItem: bigint;
  readonly maxAmountPerClaim: bigint;
  readonly currencyCode: string;
  readonly requiresReceipt: boolean;
  readonly requiresApproval: boolean;
  readonly perDiemRate: bigint | null;
  readonly mileageRateBps: number | null;
  readonly isActive: boolean;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}
