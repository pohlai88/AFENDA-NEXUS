/**
 * Minimal context for storage operations.
 * Aligns with TenantContext from @afenda/db but storage has no db dependency.
 */
export interface TenantContext {
  tenantId: string;
  userId?: string;
  companyId?: string;
}

export interface PutMeta {
  contentType?: string;
  contentLength?: number;
  metadata?: Record<string, string>;
}

export interface PutResult {
  key: string;
  etag?: string;
  size?: number;
}

export interface HeadResult {
  key: string;
  size?: number;
  contentType?: string;
  etag?: string;
  metadata?: Record<string, string>;
}

export interface DownloadOptions {
  /** Override filename for Content-Disposition (should be pre-sanitized) */
  filename?: string;
  /** Pre-built Content-Disposition header (if set, overrides filename-based build) */
  contentDisposition?: string;
  /** Expiry in seconds (default 3600) */
  expirySec?: number;
}

export interface MultipartInit {
  uploadId: string;
  key: string;
}

export interface PartInfo {
  partNumber: number;
  etag: string;
}
