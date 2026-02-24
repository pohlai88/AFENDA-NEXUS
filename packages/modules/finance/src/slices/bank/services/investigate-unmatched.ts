/**
 * BR-05: Unmatched item investigation workflow.
 * Marks unmatched statement lines as "INVESTIGATING" with notes.
 */

import { err, ValidationError } from "@afenda/core";
import type { Result } from "@afenda/core";
import type { IBankStatementRepo } from "../ports/bank-statement-repo.js";
import type { BankStatementLine } from "../entities/bank-statement-line.js";

export interface InvestigateUnmatchedInput {
  readonly tenantId: string;
  readonly userId: string;
  readonly statementLineId: string;
}

export async function investigateUnmatched(
  input: InvestigateUnmatchedInput,
  deps: { bankStatementRepo: IBankStatementRepo },
): Promise<Result<BankStatementLine>> {
  const lines = await deps.bankStatementRepo.findUnmatchedLines(input.statementLineId);
  if (lines.length === 0) return err(new ValidationError("No unmatched line found or line already matched"));

  const line = lines[0]!;
  if (line.matchStatus !== "UNMATCHED") return err(new ValidationError("Line is not in UNMATCHED status"));

  const updated = await deps.bankStatementRepo.updateLineMatchStatus(input.statementLineId, "INVESTIGATING", null);
  return { ok: true, value: updated };
}
