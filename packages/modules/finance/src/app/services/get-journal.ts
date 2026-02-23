import type { Result } from "@afenda/core";
import type { Journal } from "../../domain/index.js";
import type { IJournalRepo } from "../ports/journal-repo.js";
import type { FinanceContext } from "../../domain/finance-context.js";

export async function getJournal(
  journalId: string,
  deps: { journalRepo: IJournalRepo },
  _ctx?: FinanceContext,
): Promise<Result<Journal>> {
  return deps.journalRepo.findById(journalId);
}
