import { eq, and, sql } from "drizzle-orm";
import { ok, money } from "@afenda/core";
import type { Result, CompanyId, LedgerId } from "@afenda/core";
import type { TenantTx } from "@afenda/db";
import { glBalances, ledgers } from "@afenda/db";
import type { TrialBalance, TrialBalanceRow, AccountType } from "../../domain/index.js";
import type { IGlBalanceRepo, BalanceUpsertLine } from "../../app/ports/gl-balance-repo.js";

export class DrizzleBalanceRepo implements IGlBalanceRepo {
  constructor(private readonly tx: TenantTx) { }

  async getTrialBalance(
    ledgerId: string,
    year: string,
    period?: number,
  ): Promise<Result<TrialBalance>> {
    // @see FX-10 — Functional currency determination per entity
    // Load ledger first to get the actual base currency (fixes hardcoded "USD" bug)
    const ledgerRow = await this.tx.query.ledgers.findFirst({
      where: eq(ledgers.id, ledgerId),
      with: { currency: true },
    });
    const baseCurrency = (ledgerRow as unknown as { currency?: { code: string } })?.currency?.code ?? "USD";

    const conditions = [
      eq(glBalances.ledgerId, ledgerId),
      eq(glBalances.fiscalYear, year),
    ];
    if (period !== undefined) {
      conditions.push(eq(glBalances.fiscalPeriod, period));
    }

    const rows = await this.tx.query.glBalances.findMany({
      where: and(...conditions),
      with: { account: true },
    });

    let totalDebits = 0n;
    let totalCredits = 0n;

    const trialRows: TrialBalanceRow[] = rows.map((row) => {
      const debitTotal = money(row.debitBalance, baseCurrency);
      const creditTotal = money(row.creditBalance, baseCurrency);
      totalDebits += row.debitBalance;
      totalCredits += row.creditBalance;
      const acct = row as unknown as { account?: { code: string; name: string; accountType: string } };
      return {
        accountCode: acct.account?.code ?? "",
        accountName: acct.account?.name ?? "",
        accountType: (acct.account?.accountType ?? "ASSET") as AccountType,
        debitTotal,
        creditTotal,
      };
    });

    return ok({
      companyId: (ledgerRow?.companyId ?? "") as CompanyId,
      ledgerId: ledgerId as LedgerId,
      periodId: period !== undefined ? `${year}-P${String(period).padStart(2, "0")}` : year,
      rows: trialRows,
      totalDebits: money(totalDebits, baseCurrency),
      totalCredits: money(totalCredits, baseCurrency),
      isBalanced: totalDebits === totalCredits,
    });
  }

  async upsertForJournal(input: {
    tenantId: string;
    ledgerId: string;
    fiscalYear: string;
    fiscalPeriod: number;
    lines: readonly BalanceUpsertLine[];
  }): Promise<void> {
    for (const line of input.lines) {
      await this.tx
        .insert(glBalances)
        .values({
          tenantId: input.tenantId,
          ledgerId: input.ledgerId,
          accountId: line.accountId,
          fiscalYear: input.fiscalYear,
          fiscalPeriod: input.fiscalPeriod,
          debitBalance: line.debit,
          creditBalance: line.credit,
        })
        .onConflictDoUpdate({
          target: [
            glBalances.tenantId,
            glBalances.ledgerId,
            glBalances.accountId,
            glBalances.fiscalYear,
            glBalances.fiscalPeriod,
          ],
          set: {
            debitBalance: sql`${glBalances.debitBalance} + ${line.debit}`,
            creditBalance: sql`${glBalances.creditBalance} + ${line.credit}`,
            updatedAt: new Date(),
          },
        });
    }
  }
}
