import type { CompanyId } from "@afenda/core";

export type AccountType = "ASSET" | "LIABILITY" | "EQUITY" | "REVENUE" | "EXPENSE";

export type NormalBalance = "DEBIT" | "CREDIT";

/**
 * @see GL-02 — Account type enforcement (debit-normal vs credit-normal)
 *
 * Derives the normal balance side from the account type.
 * Assets and Expenses are debit-normal; Liabilities, Equity, and Revenue are credit-normal.
 */
export function normalBalanceFor(type: AccountType): NormalBalance {
  switch (type) {
    case "ASSET":
    case "EXPENSE":
      return "DEBIT";
    case "LIABILITY":
    case "EQUITY":
    case "REVENUE":
      return "CREDIT";
  }
}

/**
 * GAP-13: Validates that an account's net balance is on the expected side.
 * Returns true if the balance direction is normal (or zero).
 *
 * For debit-normal accounts (ASSET, EXPENSE): net debit >= net credit
 * For credit-normal accounts (LIABILITY, EQUITY, REVENUE): net credit >= net debit
 */
export function isBalanceDirectionValid(
  type: AccountType,
  totalDebit: bigint,
  totalCredit: bigint,
): boolean {
  if (totalDebit === totalCredit) return true;
  const normal = normalBalanceFor(type);
  return normal === "DEBIT" ? totalDebit >= totalCredit : totalCredit >= totalDebit;
}

export interface Account {
  readonly id: string;
  readonly companyId: CompanyId;
  readonly code: string;
  readonly name: string;
  readonly type: AccountType;
  readonly normalBalance: NormalBalance;
  readonly parentId: string | null;
  readonly isActive: boolean;
}
