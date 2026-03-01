import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Icon integrity tests — ensures all icon assets referenced in metadata and
 * manifest.json exist in public/ with valid file signatures.
 *
 * Prevents 404s for /icon.svg, /icon-192.png, /favicon.ico, etc.
 */

const WEB_ROOT = path.resolve(__dirname, '../..');
const PUBLIC = path.join(WEB_ROOT, 'public');
const LAYOUT = path.join(WEB_ROOT, 'src', 'app', 'layout.tsx');

const PNG_SIG = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
const ICO_SIG = Buffer.from([0, 0, 1, 0]);

// Extract icon URLs from layout.tsx metadata
function getMetadataIconUrls(): string[] {
  const content = readFileSync(LAYOUT, 'utf-8');
  const urls: string[] = [];
  for (const match of content.matchAll(/url:\s*['"](\/.+?)['"]/g)) {
    urls.push(match[1]!);
  }
  return urls;
}

// Extract icon srcs from manifest.json
function getManifestIconSrcs(): string[] {
  const manifestPath = path.join(PUBLIC, 'manifest.json');
  if (!existsSync(manifestPath)) return [];
  const manifest = JSON.parse(readFileSync(manifestPath, 'utf-8'));
  const srcs = new Set<string>();

  if (Array.isArray(manifest.icons)) {
    for (const icon of manifest.icons) {
      if (icon.src) srcs.add(icon.src);
    }
  }
  if (Array.isArray(manifest.shortcuts)) {
    for (const shortcut of manifest.shortcuts) {
      if (Array.isArray(shortcut.icons)) {
        for (const icon of shortcut.icons) {
          if (icon.src) srcs.add(icon.src);
        }
      }
    }
  }
  return [...srcs];
}

function toPublicPath(url: string): string {
  return path.join(PUBLIC, url.startsWith('/') ? url.slice(1) : url);
}

describe('Icon integrity', () => {
  describe('layout.tsx metadata icons', () => {
    const urls = getMetadataIconUrls();

    it('should reference at least one icon', () => {
      expect(urls.length).toBeGreaterThan(0);
    });

    it.each(urls)('should have %s in public/', (url) => {
      expect(existsSync(toPublicPath(url))).toBe(true);
    });
  });

  describe('manifest.json', () => {
    it('should exist in public/', () => {
      expect(existsSync(path.join(PUBLIC, 'manifest.json'))).toBe(true);
    });

    const srcs = getManifestIconSrcs();

    it('should reference at least one icon', () => {
      expect(srcs.length).toBeGreaterThan(0);
    });

    it.each(srcs)('should have %s in public/', (src) => {
      expect(existsSync(toPublicPath(src))).toBe(true);
    });
  });

  describe('SVG validity', () => {
    const svgUrls = getMetadataIconUrls().filter((u) => u.endsWith('.svg'));

    it.each(svgUrls)('%s should contain <svg element', (url) => {
      const content = readFileSync(toPublicPath(url), 'utf-8');
      expect(content).toContain('<svg');
    });
  });

  describe('PNG signature', () => {
    const allUrls = [
      ...getMetadataIconUrls(),
      ...getManifestIconSrcs(),
    ].filter((u) => u.endsWith('.png'));
    const unique = [...new Set(allUrls)];

    it.each(unique)('%s should have valid PNG header', (url) => {
      const buf = readFileSync(toPublicPath(url));
      expect(buf.length).toBeGreaterThanOrEqual(8);
      expect(buf.subarray(0, 8).equals(PNG_SIG)).toBe(true);
    });
  });

  describe('ICO signature', () => {
    const icoUrls = getMetadataIconUrls().filter((u) => u.endsWith('.ico'));

    it.each(icoUrls)('%s should have valid ICO header', (url) => {
      const buf = readFileSync(toPublicPath(url));
      expect(buf.length).toBeGreaterThanOrEqual(4);
      expect(buf.subarray(0, 4).equals(ICO_SIG)).toBe(true);
    });
  });
});
