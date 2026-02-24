/**
 * SLA-03: Multi-ledger derivation calculator.
 * Pure calculator — derives journal lines from accounting events using mapping rules,
 * supporting 1 event → N journals across multiple ledgers.
 */
import type { CalculatorResult } from "../../../shared/types.js";
import type { MappingRule, MappingRuleCondition } from "../entities/mapping-rule.js";
import type { AccountingEvent } from "../entities/accounting-event.js";

export interface DerivedJournalLine {
  readonly ruleId: string;
  readonly ruleName: string;
  readonly targetLedgerId: string;
  readonly debitAccountId: string;
  readonly creditAccountId: string;
  readonly amountMinor: bigint;
  readonly currencyCode: string;
  readonly memo: string;
}

export interface MultiLedgerDerivationResult {
  readonly derivedLines: readonly DerivedJournalLine[];
  readonly ledgerCount: number;
  readonly unmatchedEvents: readonly string[];
  readonly totalDerived: bigint;
}

/**
 * Evaluates a single condition against an event.
 */
function evaluateCondition(
  condition: MappingRuleCondition,
  event: AccountingEvent,
): boolean {
  const fieldValue = String(getEventField(event, condition.field));

  switch (condition.operator) {
    case "EQ":
      return fieldValue === condition.value;
    case "NEQ":
      return fieldValue !== condition.value;
    case "IN":
      return Array.isArray(condition.value) && condition.value.includes(fieldValue);
    case "NOT_IN":
      return Array.isArray(condition.value) && !condition.value.includes(fieldValue);
    case "GT":
      return Number(fieldValue) > Number(condition.value);
    case "LT":
      return Number(fieldValue) < Number(condition.value);
    case "GTE":
      return Number(fieldValue) >= Number(condition.value);
    case "LTE":
      return Number(fieldValue) <= Number(condition.value);
    default:
      return false;
  }
}

function getEventField(event: AccountingEvent, field: string): string | bigint {
  const map: Record<string, string | bigint> = {
    eventType: event.eventType,
    sourceSystem: event.sourceSystem,
    sourceDocumentType: event.sourceDocumentType,
    accountId: event.accountId,
    currencyCode: event.currencyCode,
    amountMinor: event.amountMinor,
    ledgerId: event.ledgerId,
  };
  return map[field] ?? "";
}

/**
 * Derives journal lines from accounting events using published mapping rules.
 * Supports multi-ledger output: each rule can target multiple ledgers.
 */
export function deriveMultiLedger(
  events: readonly AccountingEvent[],
  rules: readonly MappingRule[],
): CalculatorResult<MultiLedgerDerivationResult> {
  if (events.length === 0) {
    throw new Error("At least one accounting event required");
  }

  const publishedRules = [...rules]
    .filter((r) => r.status === "PUBLISHED")
    .sort((a, b) => a.priority - b.priority);

  const derivedLines: DerivedJournalLine[] = [];
  const matchedEventIds = new Set<string>();
  let totalDerived = 0n;
  const ledgerIds = new Set<string>();

  for (const event of events) {
    const matchingRules = publishedRules.filter((rule) => {
      if (rule.eventType !== event.eventType) return false;
      return rule.conditions.every((cond) => evaluateCondition(cond, event));
    });

    if (matchingRules.length === 0) continue;
    matchedEventIds.add(event.id);

    for (const rule of matchingRules) {
      const targetLedgers =
        rule.targetLedgerIds.length > 0
          ? rule.targetLedgerIds
          : [event.ledgerId];

      for (const targetLedgerId of targetLedgers) {
        ledgerIds.add(targetLedgerId);

        for (const target of rule.targets) {
          const amount =
            (event.amountMinor * BigInt(target.percentageBps)) / 10000n;
          if (amount === 0n) continue;

          totalDerived += amount;
          derivedLines.push({
            ruleId: rule.id,
            ruleName: rule.name,
            targetLedgerId,
            debitAccountId: target.debitAccountId,
            creditAccountId: target.creditAccountId,
            amountMinor: amount,
            currencyCode: event.currencyCode,
            memo: `${target.memo} — event=${event.id}`,
          });
        }
      }
    }
  }

  const unmatchedEvents = events
    .filter((e) => !matchedEventIds.has(e.id))
    .map((e) => e.id);

  return {
    result: {
      derivedLines,
      ledgerCount: ledgerIds.size,
      unmatchedEvents,
      totalDerived,
    },
    inputs: {
      eventCount: events.length,
      ruleCount: publishedRules.length,
    },
    explanation: `Multi-ledger derivation: ${derivedLines.length} lines across ${ledgerIds.size} ledgers from ${matchedEventIds.size}/${events.length} events`,
  };
}
