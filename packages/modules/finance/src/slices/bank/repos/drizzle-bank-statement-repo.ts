import { eq } from 'drizzle-orm';
import type { TenantTx } from '@afenda/db';
import { bankStatements, bankStatementLines } from '@afenda/db';
import type { BankStatement } from '../entities/bank-statement.js';
import type { BankStatementLine } from '../entities/bank-statement-line.js';
import type {
  IBankStatementRepo,
  CreateBankStatementInput,
  CreateStatementLineInput,
} from '../ports/bank-statement-repo.js';

type StmtRow = typeof bankStatements.$inferSelect;
type LineRow = typeof bankStatementLines.$inferSelect;

function mapStmtToDomain(row: StmtRow): BankStatement {
  return {
    id: row.id,
    tenantId: row.tenantId,
    bankAccountId: row.bankAccountId,
    bankAccountName: row.bankAccountName,
    statementDate: row.statementDate,
    periodStart: row.periodStart,
    periodEnd: row.periodEnd,
    openingBalance: row.openingBalance,
    closingBalance: row.closingBalance,
    currencyCode: row.currencyCode,
    format: row.format as BankStatement['format'],
    lineCount: row.lineCount,
    importedAt: row.importedAt,
    importedBy: row.importedBy,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function mapLineToDomain(row: LineRow): BankStatementLine {
  return {
    id: row.id,
    tenantId: row.tenantId,
    statementId: row.statementId,
    lineNumber: row.lineNumber,
    transactionDate: row.transactionDate,
    valueDate: row.valueDate,
    transactionType: row.transactionType as BankStatementLine['transactionType'],
    amount: row.amount,
    currencyCode: row.currencyCode,
    reference: row.reference,
    description: row.description,
    payeeOrPayer: row.payeeOrPayer,
    bankReference: row.bankReference,
    matchStatus: row.matchStatus as BankStatementLine['matchStatus'],
    matchId: row.matchId,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export class DrizzleBankStatementRepo implements IBankStatementRepo {
  constructor(private readonly db: TenantTx) {}

  async findById(id: string): Promise<BankStatement | null> {
    const rows = await this.db
      .select()
      .from(bankStatements)
      .where(eq(bankStatements.id, id))
      .limit(1);
    return rows[0] ? mapStmtToDomain(rows[0]) : null;
  }

  async findByBankAccount(bankAccountId: string): Promise<readonly BankStatement[]> {
    const rows = await this.db
      .select()
      .from(bankStatements)
      .where(eq(bankStatements.bankAccountId, bankAccountId));
    return rows.map(mapStmtToDomain);
  }

  async create(tenantId: string, input: CreateBankStatementInput): Promise<BankStatement> {
    const [row] = await this.db
      .insert(bankStatements)
      .values({
        tenantId,
        bankAccountId: input.bankAccountId,
        bankAccountName: input.bankAccountName,
        statementDate: input.statementDate,
        periodStart: input.periodStart,
        periodEnd: input.periodEnd,
        openingBalance: input.openingBalance,
        closingBalance: input.closingBalance,
        currencyCode: input.currencyCode,
        format: input.format,
        lineCount: input.lineCount,
        importedBy: input.importedBy,
      })
      .returning();
    return mapStmtToDomain(row!);
  }

  async findLinesByStatement(statementId: string): Promise<readonly BankStatementLine[]> {
    const rows = await this.db
      .select()
      .from(bankStatementLines)
      .where(eq(bankStatementLines.statementId, statementId));
    return rows.map(mapLineToDomain);
  }

  async findUnmatchedLines(statementId: string): Promise<readonly BankStatementLine[]> {
    const rows = await this.db
      .select()
      .from(bankStatementLines)
      .where(eq(bankStatementLines.statementId, statementId));
    return rows.filter((r) => r.matchStatus === 'UNMATCHED').map(mapLineToDomain);
  }

  async createLine(tenantId: string, input: CreateStatementLineInput): Promise<BankStatementLine> {
    const [row] = await this.db
      .insert(bankStatementLines)
      .values({
        tenantId,
        statementId: input.statementId,
        lineNumber: input.lineNumber,
        transactionDate: input.transactionDate,
        valueDate: input.valueDate,
        transactionType: input.transactionType,
        amount: input.amount,
        currencyCode: input.currencyCode,
        reference: input.reference,
        description: input.description,
        payeeOrPayer: input.payeeOrPayer,
        bankReference: input.bankReference,
      })
      .returning();
    return mapLineToDomain(row!);
  }

  async updateLineMatchStatus(
    lineId: string,
    status: BankStatementLine['matchStatus'],
    matchId: string | null
  ): Promise<BankStatementLine> {
    const [row] = await this.db
      .update(bankStatementLines)
      .set({ matchStatus: status, matchId })
      .where(eq(bankStatementLines.id, lineId))
      .returning();
    return mapLineToDomain(row!);
  }
}
