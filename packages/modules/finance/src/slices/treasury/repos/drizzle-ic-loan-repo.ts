import { eq } from "drizzle-orm";
import type { TenantTx } from "@afenda/db";
import { icLoans } from "@afenda/db";
import type { IcLoan } from "../entities/ic-loan.js";
import type { IIcLoanRepo, CreateIcLoanInput } from "../ports/ic-loan-repo.js";

type Row = typeof icLoans.$inferSelect;

function mapToDomain(row: Row): IcLoan {
  return {
    id: row.id,
    tenantId: row.tenantId,
    lenderCompanyId: row.lenderCompanyId,
    borrowerCompanyId: row.borrowerCompanyId,
    loanNumber: row.loanNumber,
    description: row.description,
    principalAmount: row.principalAmount,
    outstandingBalance: row.outstandingBalance,
    interestRateBps: row.interestRateBps,
    currencyCode: row.currencyCode,
    startDate: row.startDate,
    maturityDate: row.maturityDate,
    status: row.status as IcLoan["status"],
    icAgreementId: row.icAgreementId,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export class DrizzleIcLoanRepo implements IIcLoanRepo {
  constructor(private readonly db: TenantTx) {}

  async findById(id: string): Promise<IcLoan | null> {
    const rows = await this.db.select().from(icLoans).where(eq(icLoans.id, id)).limit(1);
    return rows[0] ? mapToDomain(rows[0]) : null;
  }

  async findByLender(lenderCompanyId: string): Promise<readonly IcLoan[]> {
    const rows = await this.db.select().from(icLoans).where(eq(icLoans.lenderCompanyId, lenderCompanyId));
    return rows.map(mapToDomain);
  }

  async findByBorrower(borrowerCompanyId: string): Promise<readonly IcLoan[]> {
    const rows = await this.db.select().from(icLoans).where(eq(icLoans.borrowerCompanyId, borrowerCompanyId));
    return rows.map(mapToDomain);
  }

  async findAll(): Promise<readonly IcLoan[]> {
    const rows = await this.db.select().from(icLoans);
    return rows.map(mapToDomain);
  }

  async create(tenantId: string, input: CreateIcLoanInput): Promise<IcLoan> {
    const [row] = await this.db.insert(icLoans).values({ tenantId, ...input }).returning();
    return mapToDomain(row!);
  }

  async updateBalance(id: string, outstandingBalance: bigint): Promise<IcLoan> {
    const [row] = await this.db.update(icLoans).set({ outstandingBalance }).where(eq(icLoans.id, id)).returning();
    return mapToDomain(row!);
  }

  async updateStatus(id: string, status: IcLoan["status"]): Promise<IcLoan> {
    const [row] = await this.db.update(icLoans).set({ status }).where(eq(icLoans.id, id)).returning();
    return mapToDomain(row!);
  }
}
