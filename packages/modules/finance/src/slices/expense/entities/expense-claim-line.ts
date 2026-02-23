/**
 * Expense claim line entity — individual expense item within a claim.
 */

export type ExpenseCategory = "TRAVEL" | "MEALS" | "ACCOMMODATION" | "TRANSPORT" | "SUPPLIES" | "COMMUNICATION" | "ENTERTAINMENT" | "OTHER";

export interface ExpenseClaimLine {
  readonly id: string;
  readonly tenantId: string;
  readonly claimId: string;
  readonly lineNumber: number;
  readonly expenseDate: Date;
  readonly category: ExpenseCategory;
  readonly description: string;
  readonly amount: bigint;
  readonly currencyCode: string;
  readonly baseCurrencyAmount: bigint;
  readonly receiptRef: string | null;
  readonly glAccountId: string;
  readonly costCenterId: string | null;
  readonly projectId: string | null;
  readonly isBillable: boolean;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}
