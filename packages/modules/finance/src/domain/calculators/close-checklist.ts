/**
 * @see FC-01 — Financial close task dependency resolution
 * @see FC-02 — Close evidence validation
 * @see FC-03 — Multi-company close sequencing
 *
 * Pure calculator — no I/O, no side effects.
 * Manages financial close checklist: task dependencies, sequencing,
 * and readiness validation.
 */
import type { CalculatorResult } from "./journal-balance.js";

export type CloseTaskStatus = "pending" | "in_progress" | "completed" | "blocked" | "skipped";

export interface CloseTask {
  readonly id: string;
  readonly name: string;
  readonly status: CloseTaskStatus;
  readonly dependsOn: readonly string[];
  readonly companyId: string;
  readonly assignedTo?: string;
  readonly completedAt?: Date;
}

export interface CloseReadinessResult {
  readonly ready: boolean;
  readonly completedCount: number;
  readonly pendingCount: number;
  readonly blockedCount: number;
  readonly blockedTasks: readonly { taskId: string; taskName: string; blockedBy: readonly string[] }[];
  readonly nextTasks: readonly CloseTask[];
}

/**
 * Resolves task dependencies and determines which tasks are ready to execute.
 * A task is "ready" when all its dependencies are completed or skipped.
 * A task is "blocked" when any dependency is not yet completed.
 */
export function resolveCloseReadiness(
  tasks: readonly CloseTask[],
): CalculatorResult<CloseReadinessResult> {
  const completedOrSkipped = new Set(
    tasks.filter((t) => t.status === "completed" || t.status === "skipped").map((t) => t.id),
  );

  const blockedTasks: { taskId: string; taskName: string; blockedBy: string[] }[] = [];
  const nextTasks: CloseTask[] = [];

  for (const task of tasks) {
    if (task.status === "completed" || task.status === "skipped") continue;

    const unmetDeps = task.dependsOn.filter((depId) => !completedOrSkipped.has(depId));

    if (unmetDeps.length > 0) {
      blockedTasks.push({
        taskId: task.id,
        taskName: task.name,
        blockedBy: unmetDeps,
      });
    } else if (task.status === "pending") {
      nextTasks.push(task);
    }
  }

  const completedCount = tasks.filter((t) => t.status === "completed").length;
  const pendingCount = tasks.filter((t) => t.status === "pending").length;
  const ready = pendingCount === 0 && blockedTasks.length === 0;

  return {
    result: {
      ready,
      completedCount,
      pendingCount,
      blockedCount: blockedTasks.length,
      blockedTasks,
      nextTasks,
    },
    inputs: { taskCount: tasks.length },
    explanation: ready
      ? `Close ready: all ${completedCount} tasks completed`
      : `Close NOT ready: ${pendingCount} pending, ${blockedTasks.length} blocked, ${nextTasks.length} actionable`,
  };
}

export interface MultiCompanyCloseOrder {
  readonly companyId: string;
  readonly companyName: string;
  readonly order: number;
  readonly dependsOnCompanies: readonly string[];
}

/**
 * Sequences multi-company close by topological sort of company dependencies.
 * Subsidiaries close before parent; parent consolidates after all subs are done.
 */
export function sequenceMultiCompanyClose(
  companies: readonly MultiCompanyCloseOrder[],
): CalculatorResult<string[]> {
  const byId = new Map(companies.map((c) => [c.companyId, c]));
  const inDegree = new Map<string, number>();
  const adj = new Map<string, string[]>();

  for (const c of companies) {
    inDegree.set(c.companyId, c.dependsOnCompanies.length);
    for (const dep of c.dependsOnCompanies) {
      const list = adj.get(dep) ?? [];
      list.push(c.companyId);
      adj.set(dep, list);
    }
  }

  // Kahn's algorithm for topological sort
  const queue: string[] = [];
  for (const c of companies) {
    if ((inDegree.get(c.companyId) ?? 0) === 0) {
      queue.push(c.companyId);
    }
  }

  const sorted: string[] = [];
  while (queue.length > 0) {
    const current = queue.shift()!;
    sorted.push(current);
    for (const neighbor of adj.get(current) ?? []) {
      const deg = (inDegree.get(neighbor) ?? 1) - 1;
      inDegree.set(neighbor, deg);
      if (deg === 0) queue.push(neighbor);
    }
  }

  if (sorted.length !== companies.length) {
    throw new Error(
      `Circular dependency detected in multi-company close order. Resolved ${sorted.length}/${companies.length} companies.`,
    );
  }

  return {
    result: sorted,
    inputs: { companyCount: companies.length },
    explanation: `Close order: ${sorted.map((id) => byId.get(id)?.companyName ?? id).join(" → ")}`,
  };
}
