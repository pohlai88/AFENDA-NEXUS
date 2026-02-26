/**
 * MIME sniffing for high-risk types (Plan §7).
 * CI: storage package tests; no __tests__ enforcement for storage (check scans finance only).
 */
import { describe, it, expect } from 'vitest';
import { sniffMimeFromBuffer, validateMimeAgainstSniff } from '../mime-sniff.js';

/** Minimal PDF magic bytes (%PDF-1.) */
const PDF_HEADER = Buffer.from('%PDF-1.4\n%fake content for test', 'utf-8');

/** Minimal PE executable magic (MZ + stub) — file-type detects application/x-msdownload */
const PE_HEADER = Buffer.alloc(70);
PE_HEADER.write('MZ', 0);
PE_HEADER.writeUInt32LE(0x40, 0x3c); // e_lfanew points to offset 0x40
PE_HEADER.write('PE\x00\x00', 0x40);

describe('sniffMimeFromBuffer', () => {
  it('detects PDF from magic bytes', async () => {
    const result = await sniffMimeFromBuffer(PDF_HEADER);
    expect(result).not.toBeNull();
    expect(result!.mime).toBe('application/pdf');
    expect(result!.ext).toBe('pdf');
  });

  it('detects PE executable from magic bytes', async () => {
    const result = await sniffMimeFromBuffer(PE_HEADER);
    expect(result).not.toBeNull();
    expect(result!.mime).toBe('application/x-msdownload');
  });

  it('returns null for unknown content', async () => {
    const result = await sniffMimeFromBuffer(Buffer.from('plain text', 'utf-8'));
    expect(result).toBeNull();
  });

  it('returns null for empty buffer', async () => {
    const result = await sniffMimeFromBuffer(Buffer.alloc(0));
    expect(result).toBeNull();
  });
});

describe('validateMimeAgainstSniff', () => {
  it('returns ok when declared matches detected', async () => {
    const result = await validateMimeAgainstSniff(PDF_HEADER, 'application/pdf');
    expect(result.ok).toBe(true);
  });

  it('returns ok when detected is not high-risk', async () => {
    const result = await validateMimeAgainstSniff(PDF_HEADER, 'image/png');
    expect(result.ok).toBe(true);
  });

  it('returns ok when sniff returns null (unknown type)', async () => {
    const result = await validateMimeAgainstSniff(
      Buffer.from('plain text'),
      'application/octet-stream'
    );
    expect(result.ok).toBe(true);
  });

  it('returns ok when declared matches detected high-risk type', async () => {
    const result = await validateMimeAgainstSniff(PE_HEADER, 'application/x-msdownload');
    expect(result.ok).toBe(true);
  });

  it('returns error when declared mismatches detected high-risk type', async () => {
    const result = await validateMimeAgainstSniff(PE_HEADER, 'application/pdf');
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.detected).toBe('application/x-msdownload');
    }
  });

  it('strips MIME params from declared', async () => {
    const result = await validateMimeAgainstSniff(PE_HEADER, 'application/pdf; charset=utf-8');
    expect(result.ok).toBe(false);
  });

  it('is case-insensitive for declared', async () => {
    const result = await validateMimeAgainstSniff(PE_HEADER, 'APPLICATION/X-MSDOWNLOAD');
    expect(result.ok).toBe(true);
  });
});
