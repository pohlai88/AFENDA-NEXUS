import { eq, and, sql } from 'drizzle-orm';
import type { TenantTx } from '@afenda/db';
import { ocrJobs } from '@afenda/db';
import type {
  IOcrJobRepo,
  OcrJob,
  OcrJobStatus,
  ClaimResult,
  OcrConfidenceLevel,
  OcrFailureReason,
} from '../ports/ocr-job-repo.js';

type OcrJobRow = typeof ocrJobs.$inferSelect;

function mapToDomain(row: OcrJobRow): OcrJob {
  return {
    id: row.id,
    tenantId: row.tenantId,
    checksum: row.checksum,
    fileSize: row.fileSize ?? null,
    mimeType: row.mimeType ?? null,
    status: row.status as OcrJobStatus,
    storageKey: row.storageKey ?? null,
    providerName: row.providerName ?? null,
    externalRef: row.externalRef ?? null,
    confidence: row.confidence as OcrConfidenceLevel | null,
    invoiceId: row.invoiceId ?? null,
    errorReason: row.errorReason as OcrFailureReason | null,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export class DrizzleOcrJobRepo implements IOcrJobRepo {
  constructor(private readonly tx: TenantTx) { }

  async claimOrGet(
    tenantId: string,
    checksum: string,
    meta?: { fileSize?: number; mimeType?: string }
  ): Promise<ClaimResult> {
    const inserted = await this.tx
      .insert(ocrJobs)
      .values({
        tenantId,
        checksum,
        fileSize: meta?.fileSize ?? null,
        mimeType: meta?.mimeType ?? null,
        status: 'CLAIMED',
      })
      .onConflictDoNothing({
        target: [ocrJobs.tenantId, ocrJobs.checksum],
      })
      .returning();

    if (inserted.length > 0) {
      return { claimed: true, jobId: inserted[0]!.id };
    }

    const existing = await this.tx
      .select()
      .from(ocrJobs)
      .where(and(eq(ocrJobs.tenantId, tenantId), eq(ocrJobs.checksum, checksum)))
      .limit(1);

    const row = existing[0];
    if (!row) {
      throw new Error('Race condition: job not found after conflict');
    }

    return { claimed: false, existing: mapToDomain(row) };
  }

  async updateStatus(
    jobId: string,
    status: OcrJobStatus,
    fields?: Partial<Omit<OcrJob, 'id' | 'tenantId' | 'checksum' | 'createdAt'>>
  ): Promise<void> {
    const values: Record<string, unknown> = {
      status,
      updatedAt: sql`now()`,
    };

    if (fields?.fileSize !== undefined) values.fileSize = fields.fileSize;
    if (fields?.mimeType !== undefined) values.mimeType = fields.mimeType;
    if (fields?.storageKey !== undefined) values.storageKey = fields.storageKey;
    if (fields?.providerName !== undefined) values.providerName = fields.providerName;
    if (fields?.externalRef !== undefined) values.externalRef = fields.externalRef;
    if (fields?.confidence !== undefined) values.confidence = fields.confidence;
    if (fields?.invoiceId !== undefined) values.invoiceId = fields.invoiceId;
    if (fields?.errorReason !== undefined) values.errorReason = fields.errorReason;

    await this.tx.update(ocrJobs).set(values).where(eq(ocrJobs.id, jobId));
  }

  async resetForRetry(jobId: string): Promise<void> {
    await this.tx
      .update(ocrJobs)
      .set({
        status: 'CLAIMED',
        errorReason: null,
        updatedAt: sql`now()`,
      })
      .where(and(eq(ocrJobs.id, jobId), eq(ocrJobs.status, 'FAILED')));
  }

  async findById(jobId: string): Promise<OcrJob | null> {
    const rows = await this.tx
      .select()
      .from(ocrJobs)
      .where(eq(ocrJobs.id, jobId))
      .limit(1);

    const row = rows[0];
    return row ? mapToDomain(row) : null;
  }
}
