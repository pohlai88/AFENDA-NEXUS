/**
 * Bank statement line entity — individual transaction from a bank statement.
 */

export type TransactionType = "DEBIT" | "CREDIT";
export type MatchStatus = "UNMATCHED" | "AUTO_MATCHED" | "MANUAL_MATCHED" | "CONFIRMED" | "INVESTIGATING";

export interface BankStatementLine {
  readonly id: string;
  readonly tenantId: string;
  readonly statementId: string;
  readonly lineNumber: number;
  readonly transactionDate: Date;
  readonly valueDate: Date | null;
  readonly transactionType: TransactionType;
  readonly amount: bigint;
  readonly currencyCode: string;
  readonly reference: string | null;
  readonly description: string;
  readonly payeeOrPayer: string | null;
  readonly bankReference: string | null;
  readonly matchStatus: MatchStatus;
  readonly matchId: string | null;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}
