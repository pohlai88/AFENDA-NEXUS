/**
 * CO-01: Group ownership hierarchy calculator.
 * Pure calculator — computes effective ownership % through chains and
 * determines consolidation method per entity.
 */
import type { CalculatorResult } from "../../../shared/types.js";

export type ConsolidationMethod = "FULL" | "EQUITY" | "PROPORTIONATE" | "NONE";

export interface OwnershipLink {
  readonly parentEntityId: string;
  readonly childEntityId: string;
  readonly directPctBps: number;
}

export interface EffectiveOwnership {
  readonly entityId: string;
  readonly directPctBps: number;
  readonly effectivePctBps: number;
  readonly consolidationMethod: ConsolidationMethod;
  readonly path: readonly string[];
}

/**
 * Determines consolidation method from effective ownership BPS.
 * >= 5000 (50%) → FULL consolidation
 * >= 2000 (20%) → EQUITY method
 * < 2000         → NONE (not consolidated, or fair-value investment)
 */
function methodFromPct(effectivePctBps: number): ConsolidationMethod {
  if (effectivePctBps >= 5000) return "FULL";
  if (effectivePctBps >= 2000) return "EQUITY";
  return "NONE";
}

/**
 * Computes effective ownership for every entity reachable from a root parent.
 * Supports multi-tier chains (A → B → C at 80% × 60% = 48% effective).
 */
export function computeGroupOwnership(
  rootEntityId: string,
  links: readonly OwnershipLink[],
): CalculatorResult<readonly EffectiveOwnership[]> {
  if (links.length === 0) {
    return {
      result: [],
      inputs: { rootEntityId, linkCount: 0 },
      explanation: "No ownership links provided",
    };
  }

  const childrenOf = new Map<string, OwnershipLink[]>();
  for (const link of links) {
    const existing = childrenOf.get(link.parentEntityId) ?? [];
    existing.push(link);
    childrenOf.set(link.parentEntityId, existing);
  }

  const results: EffectiveOwnership[] = [];
  const visited = new Set<string>();

  function walk(entityId: string, effectiveBps: number, path: string[]): void {
    const children = childrenOf.get(entityId) ?? [];
    for (const child of children) {
      if (visited.has(child.childEntityId)) continue;
      visited.add(child.childEntityId);

      const childEffective = Math.round(
        (effectiveBps * child.directPctBps) / 10000,
      );
      const childPath = [...path, child.childEntityId];

      results.push({
        entityId: child.childEntityId,
        directPctBps: child.directPctBps,
        effectivePctBps: childEffective,
        consolidationMethod: methodFromPct(childEffective),
        path: childPath,
      });

      walk(child.childEntityId, childEffective, childPath);
    }
  }

  walk(rootEntityId, 10000, [rootEntityId]);

  return {
    result: results,
    inputs: { rootEntityId, linkCount: links.length },
    explanation: `Group ownership: ${results.length} entities resolved from ${links.length} links`,
  };
}
