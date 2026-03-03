/**
 * SP-5015: CAP-BULK — Bulk Invoice Upload Service
 *
 * Accepts a JSON batch of invoice rows, validates each one, computes
 * SHA-256 fingerprints for within-batch dedup, and submits valid rows as
 * DRAFT supplier invoices.
 *
 * Dedup policies:
 * - SKIP_DUPLICATES  — in-batch duplicate fingerprints are skipped
 * - UPDATE_DRAFT     — in-batch duplicates update an existing DRAFT
 * - REJECT_CONFLICTS — in-batch duplicates fail the entire batch
 *
 * NOTE: Cross-batch dedup (fingerprint lookup against historical uploads)
 * is Phase 2 (requires bulk_upload_batch + row tables). This service
 * returns fingerprints in the response for traceability.
 */

import { randomUUID } from 'node:crypto';
import { computeRowFingerprint } from '@afenda/supplier-kernel';
import type {
  BulkUploadBatch,
  BulkUploadRow,
  BulkUploadResponse,
  BulkUploadRowResult,
  BulkUploadRowStatus,
  DedupePolicy,
} from '@afenda/contracts/portal';
import { BulkUploadRowSchema } from '@afenda/contracts/portal';

// ─── Port ────────────────────────────────────────────────────────────────────

export interface IBulkInvoiceSubmitter {
  /**
   * Submit a single validated invoice row as a DRAFT.
   * Returns the ID of the created/updated invoice.
   */
  submitDraft(params: {
    supplierId: string;
    tenantId: string;
    invoiceNumber: string;
    invoiceDate: string;
    amount: string;
    currency: string;
    vendorReference: string;
    description?: string;
    dueDate?: string;
    fingerprint: string;
    createdBy: string;
  }): Promise<string>;
}

// ─── Service ─────────────────────────────────────────────────────────────────

export interface BulkUploadContext {
  supplierId: string;
  tenantId: string;
  userId: string;
}

export async function processBulkUpload(
  batch: BulkUploadBatch,
  ctx: BulkUploadContext,
  submitter: IBulkInvoiceSubmitter
): Promise<BulkUploadResponse> {
  const batchId = randomUUID();
  const processedAt = new Date().toISOString();
  const { rows, dedupePolicy } = batch;

  // ── Phase 1: Validate all rows ─────────────────────────────────────────────
  const parseResults = rows.map((row) => {
    const parsed = BulkUploadRowSchema.safeParse(row);
    return { row, parsed };
  });

  // Check REJECT_CONFLICTS dedup early — if any validation fails, abort
  const validationErrors = parseResults.filter((r) => !r.parsed.success);
  const results: BulkUploadRowResult[] = [];

  // Emit validation error results immediately
  for (const { row, parsed } of parseResults) {
    if (!parsed.success) {
      results.push({
        rowNumber: row.rowNumber,
        status: 'VALIDATION_ERROR',
        errors: parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`),
      });
    }
  }

  // ── Phase 2: Compute fingerprints for valid rows ───────────────────────────
  const fingerprintMap = new Map<string, number>(); // fingerprint → first rowNumber

  const validRows = parseResults.filter((r) => r.parsed.success);
  const fingerprintedRows = await Promise.all(
    validRows.map(async ({ parsed }) => {
      if (!parsed.success) return null; // should not happen
      const row = parsed.data;
      const fingerprint = await computeRowFingerprint({
        supplierId: ctx.supplierId,
        invoiceNumber: row.invoiceNumber,
        invoiceDate: row.invoiceDate,
        amount: row.amount,
        currency: row.currency,
        vendorReference: row.vendorReference ?? '',
      });
      return { row, fingerprint };
    })
  );

  // ── Phase 3: Within-batch dedup ───────────────────────────────────────────
  const seenFingerprints = new Map<string, number>(); // fingerprint → first rowNumber seen
  const rowsToSubmit: Array<{
    row: BulkUploadRow;
    fingerprint: string;
    status: BulkUploadRowStatus;
  }> = [];

  for (const item of fingerprintedRows) {
    if (!item) continue;
    const { row, fingerprint } = item;

    const firstSeen = seenFingerprints.get(fingerprint);
    if (firstSeen !== undefined) {
      // Duplicate fingerprint within this batch
      let status: BulkUploadRowStatus;
      if (dedupePolicy === 'SKIP_DUPLICATES') {
        status = 'SKIPPED_DUPLICATE';
      } else if (dedupePolicy === 'REJECT_CONFLICTS') {
        status = 'REJECTED_CONFLICT';
      } else {
        // UPDATE_DRAFT — treat as to-submit (will overwrite)
        status = 'UPDATED_DRAFT';
        rowsToSubmit.push({ row, fingerprint, status });
        results.push({ rowNumber: row.rowNumber, status, fingerprint });
        continue;
      }
      results.push({
        rowNumber: row.rowNumber,
        status,
        fingerprint,
        errors: status === 'REJECTED_CONFLICT' ? [`Duplicate of row ${firstSeen}`] : undefined,
      });
      continue;
    }

    seenFingerprints.set(fingerprint, row.rowNumber);
    rowsToSubmit.push({ row, fingerprint, status: 'CREATED' });
  }

  // ── Phase 4: Submit valid, non-duplicate rows ─────────────────────────────
  for (const { row, fingerprint, status } of rowsToSubmit) {
    if (status === 'REJECTED_CONFLICT') continue; // already recorded above

    try {
      const invoiceId = await submitter.submitDraft({
        supplierId: ctx.supplierId,
        tenantId: ctx.tenantId,
        invoiceNumber: row.invoiceNumber,
        invoiceDate: row.invoiceDate,
        amount: row.amount,
        currency: row.currency,
        vendorReference: row.vendorReference ?? '',
        description: row.description,
        dueDate: row.dueDate,
        fingerprint,
        createdBy: ctx.userId,
      });

      results.push({
        rowNumber: row.rowNumber,
        status,
        invoiceId,
        fingerprint,
      });
    } catch (err) {
      results.push({
        rowNumber: row.rowNumber,
        status: 'VALIDATION_ERROR',
        fingerprint,
        errors: [err instanceof Error ? err.message : 'Unknown error'],
      });
    }
  }

  // ── Phase 5: Sort results by row number and tally ─────────────────────────
  results.sort((a, b) => a.rowNumber - b.rowNumber);

  const created = results.filter((r) => r.status === 'CREATED').length;
  const skipped = results.filter((r) => r.status === 'SKIPPED_DUPLICATE').length;
  const updated = results.filter((r) => r.status === 'UPDATED_DRAFT').length;
  const failed = results.filter(
    (r) => r.status === 'VALIDATION_ERROR' || r.status === 'REJECTED_CONFLICT'
  ).length;

  return {
    batchId,
    totalRows: rows.length,
    created,
    skipped,
    updated,
    failed,
    results,
    processedAt,
  };
}
