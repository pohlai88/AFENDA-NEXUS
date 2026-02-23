/**
 * @see GL-01 — Multi-entity chart of accounts with hierarchical structure
 * @see GL-02 — CoA integrity validation (no cycles, all parents exist)
 *
 * Pure calculator — no I/O, no side effects.
 * Validates CoA tree integrity, computes subtrees, and ancestor chains.
 */
import type { AccountType, NormalBalance } from "../entities/account.js";
import type { CalculatorResult } from "./journal-balance.js";

export interface AccountNode {
  readonly id: string;
  readonly accountCode: string;
  readonly accountName: string;
  readonly accountType: AccountType;
  readonly normalBalance: NormalBalance;
  readonly parentId: string | null;
  readonly isPostable: boolean;
}

export interface CoaIntegrityResult {
  readonly valid: boolean;
  readonly accountCount: number;
  readonly rootCount: number;
  readonly maxDepth: number;
  readonly errors: readonly string[];
}

/**
 * Validates CoA integrity: no cycles, all parents exist, root nodes have no parent.
 */
export function validateCoaIntegrity(
  accounts: readonly AccountNode[],
): CalculatorResult<CoaIntegrityResult> {
  const byId = new Map(accounts.map((a) => [a.id, a]));
  const errors: string[] = [];

  // Check all parents exist
  for (const a of accounts) {
    if (a.parentId && !byId.has(a.parentId)) {
      errors.push(
        `Account ${a.accountCode} references non-existent parent ${a.parentId}`,
      );
    }
  }

  // Check for cycles by walking each node's ancestor chain
  let maxDepth = 0;
  for (const a of accounts) {
    const visited = new Set<string>();
    let current: AccountNode | undefined = a;
    let depth = 0;

    while (current) {
      if (visited.has(current.id)) {
        errors.push(
          `Cycle detected in CoA hierarchy at account ${current.accountCode}`,
        );
        break;
      }
      visited.add(current.id);
      depth++;
      current = current.parentId ? byId.get(current.parentId) : undefined;
    }
    if (depth > maxDepth) maxDepth = depth;
  }

  const rootCount = accounts.filter((a) => a.parentId === null).length;

  return {
    result: {
      valid: errors.length === 0,
      accountCount: accounts.length,
      rootCount,
      maxDepth,
      errors,
    },
    inputs: { accountCount: accounts.length },
    explanation: errors.length === 0
      ? `CoA integrity validated: ${accounts.length} accounts, ${rootCount} roots, max depth ${maxDepth}`
      : `CoA integrity FAILED: ${errors.length} error(s) — ${errors[0]}`,
  };
}

/**
 * Returns the subtree of accounts under `rootId` (depth-first).
 * If `rootId` is null, returns all root-level accounts and their subtrees.
 */
export function getSubtree(
  rootId: string | null,
  accounts: readonly AccountNode[],
): CalculatorResult<AccountNode[]> {
  const childMap = new Map<string | null, AccountNode[]>();
  for (const a of accounts) {
    const key = a.parentId;
    const list = childMap.get(key) ?? [];
    list.push(a);
    childMap.set(key, list);
  }

  const result: AccountNode[] = [];
  const stack = [...(childMap.get(rootId) ?? [])];

  while (stack.length > 0) {
    const node = stack.pop()!;
    result.push(node);
    const children = childMap.get(node.id) ?? [];
    stack.push(...children.reverse());
  }

  return {
    result,
    inputs: { rootId, accountCount: accounts.length },
    explanation: `Subtree from ${rootId ?? "root"}: ${result.length} account(s) found`,
  };
}

/**
 * Returns the ancestor chain for a given account (from leaf up to root).
 */
export function getAncestors(
  accountId: string,
  accounts: readonly AccountNode[],
): CalculatorResult<AccountNode[]> {
  const byId = new Map(accounts.map((a) => [a.id, a]));
  const chain: AccountNode[] = [];
  let current = byId.get(accountId);
  const visited = new Set<string>();

  while (current) {
    if (visited.has(current.id)) {
      throw new Error(
        `Cycle detected in CoA hierarchy at account ${current.accountCode}`,
      );
    }
    visited.add(current.id);
    chain.push(current);
    current = current.parentId ? byId.get(current.parentId) : undefined;
  }

  return {
    result: chain,
    inputs: { accountId, accountCount: accounts.length },
    explanation: `Ancestor chain for ${accountId}: ${chain.length} level(s)`,
  };
}
