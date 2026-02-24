/**
 * IC Loan entity — intercompany loan management.
 */

export type IcLoanStatus = "ACTIVE" | "REPAID" | "WRITTEN_OFF";

export interface IcLoan {
  readonly id: string;
  readonly tenantId: string;
  readonly lenderCompanyId: string;
  readonly borrowerCompanyId: string;
  readonly loanNumber: string;
  readonly description: string;
  readonly principalAmount: bigint;
  readonly outstandingBalance: bigint;
  readonly interestRateBps: number;
  readonly currencyCode: string;
  readonly startDate: Date;
  readonly maturityDate: Date;
  readonly status: IcLoanStatus;
  readonly icAgreementId: string | null;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}
