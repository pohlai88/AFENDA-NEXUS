export type OcrJobStatus =
  | 'CLAIMED'
  | 'UPLOADED'
  | 'EXTRACTING'
  | 'SCORED'
  | 'INVOICE_CREATING'
  | 'COMPLETED'
  | 'FAILED';

export type OcrFailureReason =
  | 'PROVIDER_TIMEOUT'
  | 'PROVIDER_REJECTED'
  | 'UNSUPPORTED_MIME'
  | 'PARSE_ERROR'
  | 'INTERNAL_ERROR';

export type OcrConfidenceLevel = 'HIGH' | 'MEDIUM' | 'LOW';

export interface OcrJob {
  readonly id: string;
  readonly tenantId: string;
  readonly checksum: string;
  readonly fileSize: number | null;
  readonly mimeType: string | null;
  readonly status: OcrJobStatus;
  readonly storageKey: string | null;
  readonly providerName: string | null;
  readonly externalRef: string | null;
  readonly confidence: OcrConfidenceLevel | null;
  readonly invoiceId: string | null;
  readonly errorReason: OcrFailureReason | null;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export type ClaimResult =
  | { claimed: true; jobId: string }
  | { claimed: false; existing: OcrJob };

export interface IOcrJobRepo {
  claimOrGet(
    tenantId: string,
    checksum: string,
    meta?: { fileSize?: number; mimeType?: string }
  ): Promise<ClaimResult>;

  updateStatus(
    jobId: string,
    status: OcrJobStatus,
    fields?: Partial<Omit<OcrJob, 'id' | 'tenantId' | 'checksum' | 'createdAt'>>
  ): Promise<void>;

  resetForRetry(jobId: string): Promise<void>;

  findById(jobId: string): Promise<OcrJob | null>;
}
