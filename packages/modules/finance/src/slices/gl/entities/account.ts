import type { CompanyId } from "@afenda/core";

// Re-export from shared for backward compatibility
export { normalBalanceFor } from "../../../shared/types.js";
export type { AccountType, NormalBalance } from "../../../shared/types.js";
import type { AccountType } from "../../../shared/types.js";
import type { NormalBalance } from "../../../shared/types.js";
import { normalBalanceFor } from "../../../shared/types.js";

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
