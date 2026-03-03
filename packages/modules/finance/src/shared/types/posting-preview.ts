/**
 * Shared posting preview types used across multiple finance slices.
 *
 * These types represent the common output format for any journal posting
 * preview — AP, cost allocation, depreciation, revenue recognition, IC, etc.
 *
 * Moved out of the AP slice to avoid cross-slice imports (gate E16).
 */

export interface PostingLinePreview {
  readonly accountId: string;
  readonly accountCode: string;
  readonly accountName: string;
  readonly debit: string;
  readonly credit: string;
  readonly description: string;
}

export interface PostingPreviewResult {
  readonly ledgerName: string;
  readonly periodName: string;
  readonly currency: string;
  readonly lines: readonly PostingLinePreview[];
  readonly warnings: readonly string[];
}
