import type { BankMatch } from "../entities/bank-match.js";

export interface CreateBankMatchInput {
  readonly statementLineId: string;
  readonly journalId: string | null;
  readonly sourceDocumentId: string | null;
  readonly sourceDocumentType: string | null;
  readonly matchType: BankMatch["matchType"];
  readonly confidence: BankMatch["confidence"];
  readonly confidenceScore: number;
  readonly matchedAmount: bigint;
  readonly currencyCode: string;
  readonly matchedBy: string | null;
}

export interface IBankMatchRepo {
  findById(id: string): Promise<BankMatch | null>;
  findByStatementLine(statementLineId: string): Promise<BankMatch | null>;
  findAll(): Promise<readonly BankMatch[]>;
  create(tenantId: string, input: CreateBankMatchInput): Promise<BankMatch>;
  confirm(id: string, confirmedBy: string): Promise<BankMatch>;
}
