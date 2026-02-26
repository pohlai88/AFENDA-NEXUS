import type { IcLoan } from '../entities/ic-loan.js';

export interface CreateIcLoanInput {
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
  readonly icAgreementId: string | null;
}

export interface IIcLoanRepo {
  findById(id: string): Promise<IcLoan | null>;
  findByLender(lenderCompanyId: string): Promise<readonly IcLoan[]>;
  findByBorrower(borrowerCompanyId: string): Promise<readonly IcLoan[]>;
  findAll(): Promise<readonly IcLoan[]>;
  create(tenantId: string, input: CreateIcLoanInput): Promise<IcLoan>;
  updateBalance(id: string, outstandingBalance: bigint): Promise<IcLoan>;
  updateStatus(id: string, status: IcLoan['status']): Promise<IcLoan>;
}
