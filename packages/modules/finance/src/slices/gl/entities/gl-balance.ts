import type { CompanyId, LedgerId, Money } from "@afenda/core";
import type { AccountType } from "./account.js";

export interface GlBalance {
  readonly companyId: CompanyId;
  readonly ledgerId: LedgerId;
  readonly accountCode: string;
  readonly periodId: string;
  readonly debitTotal: Money;
  readonly creditTotal: Money;
  readonly netBalance: Money;
}

export interface TrialBalanceRow {
  readonly accountCode: string;
  readonly accountName: string;
  readonly accountType: AccountType;
  readonly debitTotal: Money;
  readonly creditTotal: Money;
}

export interface TrialBalance {
  readonly companyId: CompanyId;
  readonly ledgerId: LedgerId;
  readonly periodId: string;
  readonly rows: readonly TrialBalanceRow[];
  readonly totalDebits: Money;
  readonly totalCredits: Money;
  readonly isBalanced: boolean;
}
