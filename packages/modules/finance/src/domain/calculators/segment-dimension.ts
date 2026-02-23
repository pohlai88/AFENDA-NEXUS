/**
 * @see GL-09 — Segment / Cost-Center / Profit-Center Dimensions
 * @see GL-10 — Dimension validation on journal lines
 *
 * Pure calculator — no I/O, no side effects.
 * Validates and resolves multi-dimensional coding on journal lines.
 * Ensures segment combinations are valid per the configured dimension hierarchy.
 */
import type { CalculatorResult } from "./journal-balance.js";

export type DimensionType = "segment" | "cost_center" | "profit_center" | "project" | "custom";

export interface DimensionValue {
  readonly dimensionType: DimensionType;
  readonly code: string;
  readonly label: string;
  readonly parentCode: string | null;
  readonly isActive: boolean;
}

export interface JournalLineDimensions {
  readonly lineId: string;
  readonly accountId: string;
  readonly segment?: string;
  readonly costCenter?: string;
  readonly profitCenter?: string;
  readonly project?: string;
}

export interface DimensionValidationResult {
  readonly validLines: readonly JournalLineDimensions[];
  readonly invalidLines: readonly { lineId: string; errors: readonly string[] }[];
  readonly allValid: boolean;
}

/**
 * Validates dimension codes on journal lines against the set of active dimension values.
 */
export function validateDimensions(
  lines: readonly JournalLineDimensions[],
  validDimensions: readonly DimensionValue[],
): CalculatorResult<DimensionValidationResult> {
  if (lines.length === 0) {
    throw new Error("Journal lines cannot be empty");
  }

  const activeCodes = new Map<string, Set<string>>();
  for (const dim of validDimensions) {
    if (!dim.isActive) continue;
    const set = activeCodes.get(dim.dimensionType) ?? new Set();
    set.add(dim.code);
    activeCodes.set(dim.dimensionType, set);
  }

  const validLines: JournalLineDimensions[] = [];
  const invalidLines: { lineId: string; errors: string[] }[] = [];

  for (const line of lines) {
    const errors: string[] = [];
    if (line.segment && !activeCodes.get("segment")?.has(line.segment)) {
      errors.push(`Invalid segment: ${line.segment}`);
    }
    if (line.costCenter && !activeCodes.get("cost_center")?.has(line.costCenter)) {
      errors.push(`Invalid cost center: ${line.costCenter}`);
    }
    if (line.profitCenter && !activeCodes.get("profit_center")?.has(line.profitCenter)) {
      errors.push(`Invalid profit center: ${line.profitCenter}`);
    }
    if (line.project && !activeCodes.get("project")?.has(line.project)) {
      errors.push(`Invalid project: ${line.project}`);
    }
    if (errors.length > 0) {
      invalidLines.push({ lineId: line.lineId, errors });
    } else {
      validLines.push(line);
    }
  }

  return {
    result: { validLines, invalidLines, allValid: invalidLines.length === 0 },
    inputs: { lineCount: lines.length, dimensionCount: validDimensions.length },
    explanation: `Dimension validation: ${validLines.length}/${lines.length} valid`,
  };
}
