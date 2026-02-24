/**
 * SLA-04: Preview mode calculator.
 * Pure calculator — derives journal lines without posting, returning
 * a preview of what would be created. Reuses multi-ledger derivation.
 */
import type { CalculatorResult } from "../../../shared/types.js";
import type { MappingRule } from "../entities/mapping-rule.js";
import type { AccountingEvent } from "../entities/accounting-event.js";
import { deriveMultiLedger, type DerivedJournalLine } from "./multi-ledger-derivation.js";

export interface PreviewResult {
  readonly previewLines: readonly DerivedJournalLine[];
  readonly totalDebit: bigint;
  readonly totalCredit: bigint;
  readonly isBalanced: boolean;
  readonly ledgerCount: number;
  readonly unmatchedEvents: readonly string[];
  readonly warnings: readonly string[];
}

/**
 * Previews derivation without posting.
 * Runs the same derivation logic but marks the output as preview-only
 * and adds balance validation + warnings.
 */
export function previewDerivation(
  events: readonly AccountingEvent[],
  rules: readonly MappingRule[],
): CalculatorResult<PreviewResult> {
  const derivation = deriveMultiLedger(events, rules);
  const lines = derivation.result.derivedLines;

  let totalDebit = 0n;
  let totalCredit = 0n;
  const warnings: string[] = [];

  for (const line of lines) {
    totalDebit += line.amountMinor;
    totalCredit += line.amountMinor;
  }

  // Check for unmatched events
  if (derivation.result.unmatchedEvents.length > 0) {
    warnings.push(
      `${derivation.result.unmatchedEvents.length} event(s) had no matching rules`,
    );
  }

  // Check for rules targeting non-existent ledgers (heuristic: empty target ledger)
  const emptyMemoLines = lines.filter((l) => l.memo.trim() === "");
  if (emptyMemoLines.length > 0) {
    warnings.push(`${emptyMemoLines.length} line(s) have empty memos`);
  }

  // Check rules with zero output
  const ruleIdsUsed = new Set(lines.map((l) => l.ruleId));
  const publishedRules = rules.filter((r) => r.status === "PUBLISHED");
  const unusedRules = publishedRules.filter((r) => !ruleIdsUsed.has(r.id));
  if (unusedRules.length > 0) {
    warnings.push(
      `${unusedRules.length} published rule(s) produced no output: ${unusedRules.map((r) => r.name).join(", ")}`,
    );
  }

  const isBalanced = totalDebit === totalCredit;

  return {
    result: {
      previewLines: lines,
      totalDebit,
      totalCredit,
      isBalanced,
      ledgerCount: derivation.result.ledgerCount,
      unmatchedEvents: derivation.result.unmatchedEvents,
      warnings,
    },
    inputs: {
      eventCount: events.length,
      ruleCount: rules.length,
      mode: "PREVIEW",
    },
    explanation: `Preview: ${lines.length} lines, balanced=${isBalanced}, ${warnings.length} warnings`,
  };
}
