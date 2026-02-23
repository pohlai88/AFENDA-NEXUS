import type { Result } from "@afenda/core";
import type { Journal } from "../entities/journal.js";
import type { IJournalRepo } from "../../../slices/gl/ports/journal-repo.js";
import type { FinanceContext } from "../../../shared/finance-context.js";

export async function getJournal(
  journalId: string,
  deps: { journalRepo: IJournalRepo },
  _ctx?: FinanceContext,
): Promise<Result<Journal>> {
  return deps.journalRepo.findById(journalId);
}
