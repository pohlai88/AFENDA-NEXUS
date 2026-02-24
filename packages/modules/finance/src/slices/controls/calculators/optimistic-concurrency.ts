/**
 * @see DA-03 — Optimistic concurrency: version-based conflict detection
 *
 * Pure calculator — no I/O, no side effects.
 * Validates that the expected version matches the current version before
 * allowing a write. Returns the next version if valid, or a conflict error.
 *
 * Used for high-contention entities: GL balances, bank reconciliations,
 * fiscal period status, cost allocation runs.
 */

export interface VersionedEntity {
  readonly entityId: string;
  readonly entityType: string;
  readonly currentVersion: number;
  readonly expectedVersion: number;
  readonly updatedBy: string;
  readonly updatedAt: Date;
}

export type ConcurrencyOutcome = "OK" | "VERSION_CONFLICT" | "STALE_READ";

export interface ConcurrencyCheckResult {
  readonly entityId: string;
  readonly entityType: string;
  readonly outcome: ConcurrencyOutcome;
  readonly currentVersion: number;
  readonly expectedVersion: number;
  readonly nextVersion: number | null;
  readonly conflictDescription: string | null;
}

export interface ConcurrencyReport {
  readonly results: readonly ConcurrencyCheckResult[];
  readonly totalChecked: number;
  readonly totalConflicts: number;
  readonly totalOk: number;
}

export function checkOptimisticConcurrency(
  entities: readonly VersionedEntity[],
): { result: ConcurrencyReport; explanation: string } {
  if (entities.length === 0) {
    throw new Error("At least one versioned entity is required");
  }

  const results: ConcurrencyCheckResult[] = entities.map((entity) => {
    if (entity.expectedVersion === entity.currentVersion) {
      return {
        entityId: entity.entityId,
        entityType: entity.entityType,
        outcome: "OK" as const,
        currentVersion: entity.currentVersion,
        expectedVersion: entity.expectedVersion,
        nextVersion: entity.currentVersion + 1,
        conflictDescription: null,
      };
    }

    if (entity.expectedVersion < entity.currentVersion) {
      return {
        entityId: entity.entityId,
        entityType: entity.entityType,
        outcome: "STALE_READ" as const,
        currentVersion: entity.currentVersion,
        expectedVersion: entity.expectedVersion,
        nextVersion: null,
        conflictDescription:
          `Stale read: expected version ${entity.expectedVersion} but current is ${entity.currentVersion}. ` +
          `Entity was modified ${entity.currentVersion - entity.expectedVersion} time(s) since read.`,
      };
    }

    return {
      entityId: entity.entityId,
      entityType: entity.entityType,
      outcome: "VERSION_CONFLICT" as const,
      currentVersion: entity.currentVersion,
      expectedVersion: entity.expectedVersion,
      nextVersion: null,
      conflictDescription:
        `Version conflict: expected ${entity.expectedVersion} > current ${entity.currentVersion}. ` +
        `Expected version is ahead — possible data corruption or invalid client state.`,
    };
  });

  const conflicts = results.filter((r) => r.outcome !== "OK");
  const ok = results.filter((r) => r.outcome === "OK");

  return {
    result: {
      results,
      totalChecked: results.length,
      totalConflicts: conflicts.length,
      totalOk: ok.length,
    },
    explanation: conflicts.length === 0
      ? `All ${results.length} entity version(s) verified — no conflicts`
      : `${conflicts.length}/${results.length} version conflict(s): ${conflicts.map((c) => `${c.entityType}:${c.entityId} (${c.outcome})`).join(", ")}`,
  };
}
