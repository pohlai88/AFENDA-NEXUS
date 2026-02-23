import { companyId } from "@afenda/core";
import type { Account, AccountType } from "../../domain/index.js";
import { normalBalanceFor } from "../../slices/gl/entities/account.js";
import type { Account as DbAccount } from "@afenda/db";

export function mapAccountToDomain(row: DbAccount): Account {
  const type = row.accountType as AccountType;
  return {
    id: row.id,
    companyId: companyId(""),
    code: row.code,
    name: row.name,
    type,
    normalBalance: normalBalanceFor(type),
    parentId: row.parentId,
    isActive: row.isActive,
  };
}
