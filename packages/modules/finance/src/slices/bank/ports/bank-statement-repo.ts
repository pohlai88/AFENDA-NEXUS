import type { BankStatement } from "../entities/bank-statement.js";
import type { BankStatementLine } from "../entities/bank-statement-line.js";

export interface CreateBankStatementInput {
  readonly bankAccountId: string;
  readonly bankAccountName: string;
  readonly statementDate: Date;
  readonly periodStart: Date;
  readonly periodEnd: Date;
  readonly openingBalance: bigint;
  readonly closingBalance: bigint;
  readonly currencyCode: string;
  readonly format: BankStatement["format"];
  readonly lineCount: number;
  readonly importedBy: string;
}

export interface CreateStatementLineInput {
  readonly statementId: string;
  readonly lineNumber: number;
  readonly transactionDate: Date;
  readonly valueDate: Date | null;
  readonly transactionType: BankStatementLine["transactionType"];
  readonly amount: bigint;
  readonly currencyCode: string;
  readonly reference: string | null;
  readonly description: string;
  readonly payeeOrPayer: string | null;
  readonly bankReference: string | null;
}

export interface IBankStatementRepo {
  findById(id: string): Promise<BankStatement | null>;
  findByBankAccount(bankAccountId: string): Promise<readonly BankStatement[]>;
  create(tenantId: string, input: CreateBankStatementInput): Promise<BankStatement>;
  findLinesByStatement(statementId: string): Promise<readonly BankStatementLine[]>;
  findUnmatchedLines(statementId: string): Promise<readonly BankStatementLine[]>;
  createLine(tenantId: string, input: CreateStatementLineInput): Promise<BankStatementLine>;
  updateLineMatchStatus(lineId: string, status: BankStatementLine["matchStatus"], matchId: string | null): Promise<BankStatementLine>;
}
