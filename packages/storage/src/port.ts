/**
 * IObjectStore — generic object storage port for S3-compatible backends (R2, S3, MinIO).
 * Used by DocumentAttachmentService; not finance-owned.
 */
import type {
  TenantContext,
  PutMeta,
  PutResult,
  HeadResult,
  DownloadOptions,
  MultipartInit,
  PartInfo,
} from './types.js';

export interface IObjectStore {
  putObject(
    ctx: TenantContext,
    key: string,
    body: Buffer | ReadableStream<Uint8Array>,
    meta: PutMeta
  ): Promise<PutResult>;

  getSignedDownloadUrl(ctx: TenantContext, key: string, options?: DownloadOptions): Promise<string>;

  getSignedUploadUrl(
    ctx: TenantContext,
    key: string,
    meta: PutMeta,
    expirySec?: number
  ): Promise<string>;

  createMultipartUpload(ctx: TenantContext, key: string, meta: PutMeta): Promise<MultipartInit>;

  getSignedPartUrl(
    ctx: TenantContext,
    key: string,
    uploadId: string,
    partNumber: number
  ): Promise<string>;

  completeMultipartUpload(
    ctx: TenantContext,
    key: string,
    uploadId: string,
    parts: PartInfo[]
  ): Promise<void>;

  headObject(ctx: TenantContext, key: string): Promise<HeadResult | null>;

  deleteObject(ctx: TenantContext, key: string): Promise<void>;

  /** Stream object for server-side verification (checksum compute) */
  getObjectStream(ctx: TenantContext, key: string): Promise<ReadableStream<Uint8Array> | null>;
}
