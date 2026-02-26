import {
  CompleteMultipartUploadCommand,
  CreateMultipartUploadCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
  UploadPartCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import type { IObjectStore } from './port.js';
import type {
  TenantContext,
  PutMeta,
  PutResult,
  HeadResult,
  DownloadOptions,
  PartInfo,
} from './types.js';
import { buildContentDisposition } from './filename-utils.js';
import type { R2StorageConfig } from './config.js';

const DEFAULT_EXPIRY_SEC = 3600;

function createS3Client(config: R2StorageConfig): S3Client | null {
  if (
    !config.R2_ACCOUNT_ID ||
    !config.R2_ACCESS_KEY_ID ||
    !config.R2_SECRET_ACCESS_KEY ||
    config.R2_ENABLED === 'false'
  ) {
    return null;
  }
  const endpoint = `https://${config.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`;
  return new S3Client({
    region: 'auto',
    endpoint,
    credentials: {
      accessKeyId: config.R2_ACCESS_KEY_ID,
      secretAccessKey: config.R2_SECRET_ACCESS_KEY,
    },
    forcePathStyle: true,
  });
}

export function createR2Adapter(config: R2StorageConfig): IObjectStore {
  const client = createS3Client(config);
  const bucket = config.R2_BUCKET_NAME ?? '';

  const ensureClient = (): S3Client => {
    if (!client) {
      throw new Error(
        'R2 storage not configured. Set R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY.'
      );
    }
    return client;
  };

  return {
    async putObject(
      _ctx: TenantContext,
      key: string,
      body: Buffer | ReadableStream<Uint8Array>,
      meta: PutMeta
    ): Promise<PutResult> {
      const c = ensureClient();
      const command = new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: body,
        ContentType: meta.contentType,
        ContentLength: meta.contentLength,
        Metadata: meta.metadata,
      });
      const result = await c.send(command);
      return {
        key,
        etag: result.ETag?.replace(/"/g, ''),
        size: meta.contentLength,
      };
    },

    async getSignedDownloadUrl(
      _ctx: TenantContext,
      key: string,
      options?: DownloadOptions
    ): Promise<string> {
      const c = ensureClient();
      let contentDisposition: string | undefined;
      if (options?.contentDisposition) {
        contentDisposition = options.contentDisposition;
      } else if (options?.filename) {
        contentDisposition = buildContentDisposition(options.filename);
      }
      const command = new GetObjectCommand({
        Bucket: bucket,
        Key: key,
        ResponseContentDisposition: contentDisposition,
      });
      return getSignedUrl(c, command, { expiresIn: options?.expirySec ?? DEFAULT_EXPIRY_SEC });
    },

    async getSignedUploadUrl(
      _ctx: TenantContext,
      key: string,
      meta: PutMeta,
      expirySec = DEFAULT_EXPIRY_SEC
    ): Promise<string> {
      const c = ensureClient();
      const command = new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        ContentType: meta.contentType,
        ContentLength: meta.contentLength,
        Metadata: meta.metadata,
      });
      return getSignedUrl(c, command, { expiresIn: expirySec });
    },

    async createMultipartUpload(
      _ctx: TenantContext,
      key: string,
      meta: PutMeta
    ): Promise<{ uploadId: string; key: string }> {
      const c = ensureClient();
      const command = new CreateMultipartUploadCommand({
        Bucket: bucket,
        Key: key,
        ContentType: meta.contentType,
        Metadata: meta.metadata,
      });
      const result = await c.send(command);
      if (!result.UploadId) throw new Error('No upload ID returned');
      return { uploadId: result.UploadId, key };
    },

    async getSignedPartUrl(
      _ctx: TenantContext,
      key: string,
      uploadId: string,
      partNumber: number
    ): Promise<string> {
      const c = ensureClient();
      const command = new UploadPartCommand({
        Bucket: bucket,
        Key: key,
        UploadId: uploadId,
        PartNumber: partNumber,
      });
      return getSignedUrl(c, command, { expiresIn: DEFAULT_EXPIRY_SEC });
    },

    async completeMultipartUpload(
      _ctx: TenantContext,
      key: string,
      uploadId: string,
      parts: PartInfo[]
    ): Promise<void> {
      const c = ensureClient();
      const command = new CompleteMultipartUploadCommand({
        Bucket: bucket,
        Key: key,
        UploadId: uploadId,
        MultipartUpload: {
          Parts: parts.map((p) => ({ PartNumber: p.partNumber, ETag: p.etag })),
        },
      });
      await c.send(command);
    },

    async headObject(_ctx: TenantContext, key: string): Promise<HeadResult | null> {
      const c = ensureClient();
      try {
        const command = new HeadObjectCommand({ Bucket: bucket, Key: key });
        const result = await c.send(command);
        return {
          key,
          size: result.ContentLength,
          contentType: result.ContentType ?? undefined,
          etag: result.ETag?.replace(/"/g, ''),
          metadata: result.Metadata as Record<string, string> | undefined,
        };
      } catch {
        return null;
      }
    },

    async deleteObject(_ctx: TenantContext, key: string): Promise<void> {
      const c = ensureClient();
      const command = new DeleteObjectCommand({ Bucket: bucket, Key: key });
      await c.send(command);
    },

    async getObjectStream(
      _ctx: TenantContext,
      key: string
    ): Promise<ReadableStream<Uint8Array> | null> {
      const c = ensureClient();
      try {
        const command = new GetObjectCommand({ Bucket: bucket, Key: key });
        const result = await c.send(command);
        return (result.Body as ReadableStream<Uint8Array>) ?? null;
      } catch {
        return null;
      }
    },
  };
}
