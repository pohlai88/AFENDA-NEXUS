#!/usr/bin/env node
/**
 * gate:icon-integrity — CI gate ensuring all icon assets referenced by
 * Next.js metadata and manifest.json exist in apps/web/public/.
 *
 *   ICON-01: Every icon URL in layout.tsx metadata.icons must resolve to a file
 *   ICON-02: Every icon src in manifest.json must resolve to a file
 *   ICON-03: manifest.json itself must exist
 *   ICON-04: SVG icons must be valid (contain <svg root element)
 *   ICON-05: PNG/ICO files must have valid binary signatures
 *
 * Usage: node tools/scripts/gate-icon-integrity.mjs
 */
import { readFileSync, existsSync } from 'node:fs';
import { join, relative } from 'node:path';

const ROOT = process.cwd();
const WEB = join(ROOT, 'apps', 'web');
const PUBLIC = join(WEB, 'public');

function rel(fp) {
  return relative(ROOT, fp).replace(/\\/g, '/');
}

const failures = [];

// ─── ICON-03: manifest.json must exist ──────────────────────────────────────

const manifestPath = join(PUBLIC, 'manifest.json');
if (!existsSync(manifestPath)) {
  failures.push({
    gate: 'ICON-03',
    file: rel(manifestPath),
    issue: 'manifest.json missing from public/',
  });
}

// ─── ICON-01: Metadata icon references ─────────────────────────────────────
// Parse layout.tsx for icon URLs referenced in the metadata export.

const layoutPath = join(WEB, 'src', 'app', 'layout.tsx');
const metadataIcons = [];

if (existsSync(layoutPath)) {
  const layoutContent = readFileSync(layoutPath, 'utf-8');

  // Match url: '/...' patterns inside icons config
  const urlMatches = layoutContent.matchAll(/url:\s*['"](\/.+?)['"]/g);
  for (const m of urlMatches) {
    metadataIcons.push(m[1]);
  }

  // Match manifest reference
  const manifestMatch = layoutContent.match(/manifest:\s*['"](\/.+?)['"]/);
  if (manifestMatch) {
    const manifestFile = join(PUBLIC, manifestMatch[1].slice(1));
    if (!existsSync(manifestFile)) {
      failures.push({
        gate: 'ICON-01',
        file: rel(layoutPath),
        issue: `manifest reference "${manifestMatch[1]}" not found in public/`,
      });
    }
  }

  for (const iconUrl of metadataIcons) {
    const iconPath = join(PUBLIC, iconUrl.slice(1)); // strip leading /
    if (!existsSync(iconPath)) {
      failures.push({
        gate: 'ICON-01',
        file: rel(layoutPath),
        issue: `icon "${iconUrl}" referenced in metadata but missing from public/`,
      });
    }
  }
}

// ─── ICON-02: manifest.json icon references ────────────────────────────────

if (existsSync(manifestPath)) {
  let manifest;
  try {
    manifest = JSON.parse(readFileSync(manifestPath, 'utf-8'));
  } catch (e) {
    failures.push({
      gate: 'ICON-02',
      file: rel(manifestPath),
      issue: `manifest.json is not valid JSON: ${e.message}`,
    });
  }

  if (manifest) {
    // Collect all icon src values from icons array and shortcuts
    const iconSrcs = new Set();

    if (Array.isArray(manifest.icons)) {
      for (const icon of manifest.icons) {
        if (icon.src) iconSrcs.add(icon.src);
      }
    }

    if (Array.isArray(manifest.shortcuts)) {
      for (const shortcut of manifest.shortcuts) {
        if (Array.isArray(shortcut.icons)) {
          for (const icon of shortcut.icons) {
            if (icon.src) iconSrcs.add(icon.src);
          }
        }
      }
    }

    for (const src of iconSrcs) {
      const iconPath = join(PUBLIC, src.startsWith('/') ? src.slice(1) : src);
      if (!existsSync(iconPath)) {
        failures.push({
          gate: 'ICON-02',
          file: rel(manifestPath),
          issue: `icon "${src}" referenced in manifest.json but missing from public/`,
        });
      }
    }
  }
}

// ─── ICON-04: SVG validity ─────────────────────────────────────────────────

const allIconUrls = [...new Set([...metadataIcons])];
for (const iconUrl of allIconUrls) {
  const iconPath = join(PUBLIC, iconUrl.slice(1));
  if (existsSync(iconPath) && iconUrl.endsWith('.svg')) {
    const content = readFileSync(iconPath, 'utf-8');
    if (!content.includes('<svg')) {
      failures.push({
        gate: 'ICON-04',
        file: rel(iconPath),
        issue: 'SVG file does not contain <svg element',
      });
    }
  }
}

// ─── ICON-05: PNG/ICO binary signatures ────────────────────────────────────

const PNG_SIG = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
const ICO_SIG = Buffer.from([0, 0, 1, 0]); // ICO magic bytes

// Gather all referenced icon files
const allReferenced = new Set(metadataIcons);
if (existsSync(manifestPath)) {
  try {
    const m = JSON.parse(readFileSync(manifestPath, 'utf-8'));
    if (Array.isArray(m.icons)) m.icons.forEach(i => i.src && allReferenced.add(i.src));
    if (Array.isArray(m.shortcuts)) m.shortcuts.forEach(s => {
      if (Array.isArray(s.icons)) s.icons.forEach(i => i.src && allReferenced.add(i.src));
    });
  } catch { /* already reported */ }
}

for (const iconUrl of allReferenced) {
  const iconPath = join(PUBLIC, iconUrl.startsWith('/') ? iconUrl.slice(1) : iconUrl);
  if (!existsSync(iconPath)) continue;

  if (iconUrl.endsWith('.png')) {
    const header = Buffer.alloc(8);
    const fd = readFileSync(iconPath);
    if (fd.length < 8 || !fd.subarray(0, 8).equals(PNG_SIG)) {
      failures.push({
        gate: 'ICON-05',
        file: rel(iconPath),
        issue: 'PNG file has invalid header signature',
      });
    }
  }

  if (iconUrl.endsWith('.ico')) {
    const fd = readFileSync(iconPath);
    if (fd.length < 4 || !fd.subarray(0, 4).equals(ICO_SIG)) {
      failures.push({
        gate: 'ICON-05',
        file: rel(iconPath),
        issue: 'ICO file has invalid header signature',
      });
    }
  }
}

// ─── Report ─────────────────────────────────────────────────────────────────

if (failures.length > 0) {
  console.error('❌ gate:icon-integrity FAILED\n');

  const byGate = {};
  for (const f of failures) {
    (byGate[f.gate] ??= []).push(f);
  }

  for (const [gate, items] of Object.entries(byGate)) {
    console.error(`  ${gate} (${items.length} violation${items.length > 1 ? 's' : ''}):`);
    for (const v of items) {
      console.error(`    ${v.file}: ${v.issue}`);
    }
    console.error('');
  }

  console.error(`${failures.length} total violation(s).`);
  process.exit(1);
} else {
  const total = allReferenced.size;
  console.log('✅ gate:icon-integrity PASSED');
  console.log(`   Checked ${total} icon reference(s) across layout.tsx + manifest.json.`);
  console.log('   All 5 gates green: files exist, SVG valid, PNG/ICO signatures correct.');
}
