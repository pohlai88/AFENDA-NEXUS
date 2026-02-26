/**
 * @afenda/storage — Object storage port and R2 adapter.
 * S3-compatible; used by DocumentAttachmentService for document storage.
 */
export type { IObjectStore } from './port.js';
export type {
  TenantContext,
  PutMeta,
  PutResult,
  HeadResult,
  DownloadOptions,
  MultipartInit,
  PartInfo,
} from './types.js';
export { createR2Adapter } from './r2-adapter.js';
export {
  sanitizeFilenameForStorage,
  buildContentDisposition,
  extFromMime,
  type SanitizeResult,
} from './filename-utils.js';
export { createMockObjectStore } from './mock-adapter.js';
export { loadR2Config, type R2StorageConfig } from './config.js';
export { sniffMimeFromBuffer, validateMimeAgainstSniff } from './mime-sniff.js';
