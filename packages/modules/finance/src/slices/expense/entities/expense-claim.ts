/**
 * Expense claim entity — employee expense submission with approval workflow.
 */

export type ClaimStatus = "DRAFT" | "SUBMITTED" | "APPROVED" | "REJECTED" | "REIMBURSED" | "CANCELLED";

export interface ExpenseClaim {
  readonly id: string;
  readonly tenantId: string;
  readonly companyId: string;
  readonly employeeId: string;
  readonly claimNumber: string;
  readonly description: string;
  readonly claimDate: Date;
  readonly totalAmount: bigint;
  readonly currencyCode: string;
  readonly baseCurrencyAmount: bigint;
  readonly status: ClaimStatus;
  readonly submittedAt: Date | null;
  readonly approvedBy: string | null;
  readonly approvedAt: Date | null;
  readonly rejectionReason: string | null;
  readonly reimbursedAt: Date | null;
  readonly apInvoiceId: string | null;
  readonly lineCount: number;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}
