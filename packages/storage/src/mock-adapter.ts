/**
 * Mock IObjectStore for tests when R2 is not configured.
 */
import type { IObjectStore } from './port.js';
import type {
  TenantContext,
  PutMeta,
  PutResult,
  HeadResult,
  DownloadOptions,
  MultipartInit,
  PartInfo,
} from './types.js';
import { buildContentDisposition } from './filename-utils.js';

const inMemory = new Map<string, { body: Uint8Array; meta: PutMeta }>();

export function createMockObjectStore(): IObjectStore {
  return {
    async putObject(
      _ctx: TenantContext,
      key: string,
      body: Buffer | ReadableStream<Uint8Array>,
      meta: PutMeta
    ): Promise<PutResult> {
      const chunks: Uint8Array[] = [];
      const isStream = typeof (body as ReadableStream).getReader === 'function';
      if (!isStream) {
        chunks.push(new Uint8Array(body as Buffer));
      } else {
        const reader = (body as ReadableStream<Uint8Array>).getReader();
        let done = false;
        while (!done) {
          const { value, done: d } = await reader.read();
          done = d;
          if (value) chunks.push(value);
        }
      }
      const combined = new Uint8Array(chunks.reduce((acc, c) => acc + c.length, 0));
      let offset = 0;
      for (const c of chunks) {
        combined.set(c, offset);
        offset += c.length;
      }
      inMemory.set(key, { body: combined, meta });
      return { key, size: combined.length };
    },

    async getSignedDownloadUrl(
      _ctx: TenantContext,
      key: string,
      options?: DownloadOptions
    ): Promise<string> {
      if (!inMemory.has(key)) throw new Error(`Object not found: ${key}`);
      const base = `https://mock.example.com/download/${key}`;
      if (options?.contentDisposition) {
        return `${base}?response-content-disposition=${encodeURIComponent(options.contentDisposition)}`;
      }
      if (options?.filename) {
        const cd = buildContentDisposition(options.filename);
        return `${base}?response-content-disposition=${encodeURIComponent(cd)}`;
      }
      return base;
    },

    async getSignedUploadUrl(
      _ctx: TenantContext,
      key: string,
      _meta: PutMeta,
      _expirySec?: number
    ): Promise<string> {
      return `https://mock.example.com/upload/${key}`;
    },

    async createMultipartUpload(
      _ctx: TenantContext,
      key: string,
      _meta: PutMeta
    ): Promise<MultipartInit> {
      return { uploadId: `mock-${key}-${Date.now()}`, key };
    },

    async getSignedPartUrl(
      _ctx: TenantContext,
      key: string,
      uploadId: string,
      partNumber: number
    ): Promise<string> {
      return `https://mock.example.com/part/${key}/${uploadId}/${partNumber}`;
    },

    async completeMultipartUpload(
      _ctx: TenantContext,
      key: string,
      _uploadId: string,
      _parts: PartInfo[]
    ): Promise<void> {
      inMemory.set(key, { body: new Uint8Array(0), meta: {} });
    },

    async headObject(_ctx: TenantContext, key: string): Promise<HeadResult | null> {
      const stored = inMemory.get(key);
      if (!stored) return null;
      return {
        key,
        size: stored.body.length,
        contentType: stored.meta.contentType,
        metadata: stored.meta.metadata,
      };
    },

    async deleteObject(_ctx: TenantContext, key: string): Promise<void> {
      inMemory.delete(key);
    },

    async getObjectStream(
      _ctx: TenantContext,
      key: string
    ): Promise<ReadableStream<Uint8Array> | null> {
      const stored = inMemory.get(key);
      if (!stored) return null;
      return new ReadableStream({
        start(controller) {
          controller.enqueue(stored.body);
          controller.close();
        },
      });
    },
  };
}
