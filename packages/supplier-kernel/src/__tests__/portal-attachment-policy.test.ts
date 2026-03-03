import { describe, expect, it } from 'vitest';

import {
  ATTACHMENT_ALLOWED_TYPES,
  ATTACHMENT_SIZE_LIMITS,
  computeFileChecksum,
  validateAttachment,
  type AttachmentCategory,
} from '../attachments/portal-attachment-policy.js';

describe('SP-1007: Attachment Policy', () => {
  // ─── validateAttachment ─────────────────────────────────────────────────

  describe('validateAttachment', () => {
    it('accepts a valid PDF invoice', () => {
      const result = validateAttachment({
        fileName: 'invoice.pdf',
        mimeType: 'application/pdf',
        sizeBytes: 1 * 1024 * 1024,
        category: 'invoice',
      });
      expect(result.valid).toBe(true);
    });

    it('rejects file exceeding size limit', () => {
      const result = validateAttachment({
        fileName: 'huge.pdf',
        mimeType: 'application/pdf',
        sizeBytes: 15 * 1024 * 1024, // 15 MB > 10 MB invoice limit
        category: 'invoice',
      });
      expect(result.valid).toBe(false);
      if (!result.valid) {
        expect(result.reason).toContain('exceeds limit');
      }
    });

    it('rejects disallowed MIME type', () => {
      const result = validateAttachment({
        fileName: 'data.json',
        mimeType: 'application/json',
        sizeBytes: 1024,
        category: 'invoice',
      });
      expect(result.valid).toBe(false);
      if (!result.valid) {
        expect(result.reason).toContain('not allowed');
      }
    });

    it('rejects dangerous file extensions', () => {
      const result = validateAttachment({
        fileName: 'malware.exe',
        mimeType: 'application/pdf',
        sizeBytes: 1024,
        category: 'document',
      });
      expect(result.valid).toBe(false);
      if (!result.valid) {
        expect(result.reason).toContain('.exe');
      }
    });

    it('rejects .ps1 files', () => {
      const result = validateAttachment({
        fileName: 'script.ps1',
        mimeType: 'text/plain',
        sizeBytes: 1024,
        category: 'document',
      });
      expect(result.valid).toBe(false);
    });

    it('accepts CSV for bulk_upload', () => {
      const result = validateAttachment({
        fileName: 'upload.csv',
        mimeType: 'text/csv',
        sizeBytes: 10 * 1024 * 1024, // 10 MB
        category: 'bulk_upload',
      });
      expect(result.valid).toBe(true);
    });

    it('accepts image within size limit', () => {
      const result = validateAttachment({
        fileName: 'logo.png',
        mimeType: 'image/png',
        sizeBytes: 2 * 1024 * 1024, // 2 MB
        category: 'image',
      });
      expect(result.valid).toBe(true);
    });

    it('rejects image over 5 MB', () => {
      const result = validateAttachment({
        fileName: 'large-photo.png',
        mimeType: 'image/png',
        sizeBytes: 6 * 1024 * 1024,
        category: 'image',
      });
      expect(result.valid).toBe(false);
    });
  });

  // ─── computeFileChecksum ────────────────────────────────────────────────

  describe('computeFileChecksum', () => {
    it('produces valid SHA-256 hex string', async () => {
      const content = new TextEncoder().encode('test content');
      const hash = await computeFileChecksum(content);
      expect(hash).toMatch(/^[0-9a-f]{64}$/);
    });

    it('is deterministic', async () => {
      const content = new TextEncoder().encode('same content');
      const h1 = await computeFileChecksum(content);
      const h2 = await computeFileChecksum(content);
      expect(h1).toBe(h2);
    });

    it('different content → different hash', async () => {
      const a = new TextEncoder().encode('content A');
      const b = new TextEncoder().encode('content B');
      const h1 = await computeFileChecksum(a);
      const h2 = await computeFileChecksum(b);
      expect(h1).not.toBe(h2);
    });
  });

  // ─── Constants ──────────────────────────────────────────────────────────

  describe('constants', () => {
    it('has 5 attachment categories', () => {
      const categories = Object.keys(ATTACHMENT_SIZE_LIMITS) as AttachmentCategory[];
      expect(categories).toHaveLength(5);
    });

    it('each category has MIME type allowlist', () => {
      for (const cat of Object.keys(ATTACHMENT_SIZE_LIMITS) as AttachmentCategory[]) {
        expect(ATTACHMENT_ALLOWED_TYPES[cat].length).toBeGreaterThan(0);
      }
    });

    it('image category max size is 5 MB', () => {
      expect(ATTACHMENT_SIZE_LIMITS.image).toBe(5 * 1024 * 1024);
    });

    it('bulk_upload category max size is 50 MB', () => {
      expect(ATTACHMENT_SIZE_LIMITS.bulk_upload).toBe(50 * 1024 * 1024);
    });
  });
});
