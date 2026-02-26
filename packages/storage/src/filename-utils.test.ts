import { describe, expect, it } from 'vitest';
import {
  sanitizeFilenameForStorage,
  buildContentDisposition,
  extFromMime,
} from './filename-utils.js';

describe('sanitizeFilenameForStorage', () => {
  it('strips path separators', () => {
    expect(sanitizeFilenameForStorage('foo/bar/baz.pdf').safe).toBe('foobarbaz.pdf');
    expect(sanitizeFilenameForStorage('foo\\bar.pdf').safe).toBe('foobar.pdf');
  });

  it('normalizes Unicode to NFC', () => {
    const nfd = 'é'.normalize('NFD'); // e + combining acute
    const nfc = 'é'.normalize('NFC');
    expect(sanitizeFilenameForStorage(nfd).safe).toBe(sanitizeFilenameForStorage(nfc).safe);
  });

  it('rewrites Windows reserved names', () => {
    expect(sanitizeFilenameForStorage('CON').safe).toBe('file_CON');
    expect(sanitizeFilenameForStorage('con.txt').safe).toBe('file_con.txt');
    expect(sanitizeFilenameForStorage('COM1').safe).toBe('file_COM1');
    expect(sanitizeFilenameForStorage('LPT9.pdf').safe).toBe('file_LPT9.pdf');
  });

  it('trims trailing dot and space', () => {
    expect(sanitizeFilenameForStorage('invoice. ').safe).toBe('invoice');
    expect(sanitizeFilenameForStorage('  doc . ').safe).toBe('doc');
  });

  it('collapses whitespace', () => {
    expect(sanitizeFilenameForStorage('foo   bar.pdf').safe).toBe('foo bar.pdf');
  });

  it('returns fallback for empty after sanitization', () => {
    expect(sanitizeFilenameForStorage('').safe).toBe('document');
    expect(sanitizeFilenameForStorage('   ...   ').safe).toBe('document');
  });

  it('truncates to 255 preserving extension', () => {
    const long = 'a'.repeat(300) + '.pdf';
    const result = sanitizeFilenameForStorage(long);
    expect(result.safe.length).toBeLessThanOrEqual(255);
    expect(result.safe).toMatch(/\.pdf$/);
  });

  it('returns original capped for audit', () => {
    const input = 'invoice.pdf';
    expect(sanitizeFilenameForStorage(input).original).toBe(input);
  });

  it('produces ASCII fallback for non-ASCII', () => {
    const result = sanitizeFilenameForStorage('发票.pdf');
    expect(result.asciiFallback).toMatch(/^_+\.pdf$/);
    expect(result.safe).toBe('发票.pdf');
  });
});

describe('buildContentDisposition', () => {
  it('always uses attachment', () => {
    expect(buildContentDisposition('foo.pdf')).toMatch(/^attachment;/);
  });

  it('quotes filename param', () => {
    expect(buildContentDisposition('foo.pdf')).toContain('filename="foo.pdf"');
  });

  it('adds filename* for non-ASCII', () => {
    const result = buildContentDisposition('发票.pdf');
    expect(result).toContain('filename*=');
    expect(result).toContain("UTF-8''");
  });

  it('strips CR/LF for header safety', () => {
    const result = buildContentDisposition('foo\r\nbar.pdf');
    expect(result).not.toMatch(/\r|\n/);
  });

  it('truncates long names preserving extension', () => {
    const long = 'a'.repeat(300) + '.pdf';
    const result = buildContentDisposition(long);
    expect(result.length).toBeLessThan(400);
    expect(result).toContain('.pdf');
  });
});

describe('extFromMime', () => {
  it('maps common MIME types', () => {
    expect(extFromMime('application/pdf')).toBe('.pdf');
    expect(extFromMime('image/jpeg')).toBe('.jpg');
    expect(extFromMime('image/png')).toBe('.png');
    expect(extFromMime('text/csv')).toBe('.csv');
  });

  it('returns .bin for unknown MIME', () => {
    expect(extFromMime('application/x-unknown')).toBe('.bin');
    expect(extFromMime(null)).toBe('.bin');
    expect(extFromMime(undefined)).toBe('.bin');
  });

  it('strips MIME params', () => {
    expect(extFromMime('application/pdf; charset=utf-8')).toBe('.pdf');
  });

  it('is case-insensitive', () => {
    expect(extFromMime('APPLICATION/PDF')).toBe('.pdf');
  });
});
