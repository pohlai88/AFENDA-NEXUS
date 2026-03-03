#!/usr/bin/env node
/**
 * gen-response-schemas — Auto-generates Zod schemas in @afenda/contracts
 * from exported interfaces in *.queries.ts files.
 *
 * Reads each query file, extracts exported interfaces/types, and generates
 * a corresponding Zod schema block that can be appended to contracts/src/index.ts.
 *
 * Usage: node tools/scripts/gen-response-schemas.mjs
 */
import { readdirSync, readFileSync, writeFileSync, statSync } from 'node:fs';
import { join, relative, dirname, basename } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '../..');
const WEB_FEATURES = join(ROOT, 'apps', 'web', 'src', 'features');
const CONTRACTS_INDEX = join(ROOT, 'packages', 'contracts', 'src', 'index.ts');

// ── Helpers ─────────────────────────────────────────────────────────────────

function findFiles(dir, pattern, results = []) {
  try {
    for (const entry of readdirSync(dir)) {
      if (entry === 'node_modules' || entry === 'dist') continue;
      const full = join(dir, entry);
      if (statSync(full).isDirectory()) findFiles(full, pattern, results);
      else if (pattern.test(entry)) results.push(full);
    }
  } catch {
    /* skip */
  }
  return results;
}

// Read existing contracts to find already-defined schemas
function getExistingSchemas(content) {
  const schemas = new Set();
  const re = /export\s+(?:const|type|interface)\s+(\w+)/g;
  let m;
  while ((m = re.exec(content))) schemas.add(m[1]);
  return schemas;
}

/**
 * Parse exported interfaces from a TypeScript file.
 * Returns array of { name, fields: [{ name, type, optional }], extends }
 */
function parseInterfaces(content) {
  const results = [];
  const lines = content.split('\n');
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    // Match: export interface Foo { or export interface Foo extends Bar {
    const match = line.match(/^export\s+interface\s+(\w+)(?:\s+extends\s+(\w+))?\s*\{/);
    if (!match) {
      // Also match single-line type aliases
      const typeMatch = line.match(/^export\s+type\s+(\w+)\s*=\s*(.+);/);
      if (typeMatch) {
        results.push({ name: typeMatch[1], isTypeAlias: true, aliasBody: typeMatch[2] });
      }
      i++;
      continue;
    }

    const iface = { name: match[1], extends: match[2] || null, fields: [] };
    i++;

    // Parse fields until closing }
    let braceDepth = 1;
    while (i < lines.length && braceDepth > 0) {
      const fl = lines[i].trim();

      if (fl === '}' || fl === '};') {
        braceDepth--;
        if (braceDepth === 0) break;
      }

      // Count braces for nested objects
      for (const ch of fl) {
        if (ch === '{') braceDepth++;
        if (ch === '}') braceDepth--;
      }

      if (
        braceDepth === 1 &&
        fl &&
        !fl.startsWith('//') &&
        !fl.startsWith('*') &&
        !fl.startsWith('/**')
      ) {
        // Parse field: name: type; or name?: type;
        const fm = fl.match(/^(\w+)(\?)?:\s*(.+?);?\s*$/);
        if (fm) {
          iface.fields.push({
            name: fm[1],
            optional: !!fm[2],
            type: fm[3].replace(/;$/, '').trim(),
          });
        }
      }
      i++;
    }

    results.push(iface);
    i++;
  }

  return results;
}

/**
 * Convert a TypeScript type string to a Zod schema call.
 */
function tsTypeToZod(type, knownSchemas) {
  type = type.trim();

  // Handle nullable: Foo | null
  const nullableMatch = type.match(/^(.+?)\s*\|\s*null$/);
  if (nullableMatch) {
    return tsTypeToZod(nullableMatch[1], knownSchemas) + '.nullable()';
  }

  // Primitives
  if (type === 'string') return 'z.string()';
  if (type === 'number') return 'z.number()';
  if (type === 'boolean') return 'z.boolean()';
  if (type === 'bigint') return 'z.coerce.bigint()';

  // Array types
  const arrayMatch = type.match(/^(.+)\[\]$/);
  if (arrayMatch) {
    return `z.array(${tsTypeToZod(arrayMatch[1], knownSchemas)})`;
  }
  const genericArrayMatch = type.match(/^Array<(.+)>$/);
  if (genericArrayMatch) {
    return `z.array(${tsTypeToZod(genericArrayMatch[1], knownSchemas)})`;
  }

  // String literal union: 'a' | 'b' | 'c'
  const literalUnionMatch = type.match(/^'[^']+'\s*(?:\|\s*'[^']+')+$/);
  if (literalUnionMatch) {
    const values = type.match(/'([^']+)'/g).map((s) => s.replace(/'/g, ''));
    return `z.enum([${values.map((v) => `'${v}'`).join(', ')}])`;
  }

  // Known schema reference
  if (knownSchemas.has(type + 'Schema')) {
    return type + 'Schema';
  }
  if (knownSchemas.has(type)) {
    return type;
  }

  // Object inline type: { foo: string; bar: number }
  if (type.startsWith('{') && type.endsWith('}')) {
    return 'z.record(z.unknown())';
  }

  // Record<string, unknown>
  if (type.startsWith('Record<')) {
    return 'z.record(z.unknown())';
  }

  // Union types (non-literal)
  if (type.includes(' | ')) {
    const parts = type.split(/\s*\|\s*/);
    // Filter out null (handled above)
    const nonNull = parts.filter((p) => p !== 'null');
    if (nonNull.length === 1) return tsTypeToZod(nonNull[0], knownSchemas) + '.nullable()';
    const zods = nonNull.map((p) => tsTypeToZod(p, knownSchemas));
    return `z.union([${zods.join(', ')}])`;
  }

  // Default: treat as string (monetary values stored as strings in this app)
  return 'z.string()';
}

/**
 * Generate Zod schema code for an interface.
 */
function generateSchema(iface, knownSchemas) {
  if (iface.isTypeAlias) {
    // For type aliases, generate a passthrough
    return `export const ${iface.name}Schema = z.record(z.unknown());\nexport type ${iface.name} = z.infer<typeof ${iface.name}Schema>;`;
  }

  const schemaName = iface.name + 'Schema';

  let base;
  if (iface.extends && knownSchemas.has(iface.extends + 'Schema')) {
    base = `${iface.extends}Schema.extend({`;
  } else {
    base = 'z.object({';
  }

  const fieldLines = iface.fields.map((f) => {
    let zodType = tsTypeToZod(f.type, knownSchemas);
    if (f.optional) zodType += '.optional()';
    return `  ${f.name}: ${zodType},`;
  });

  const code = [
    `export const ${schemaName} = ${base}`,
    ...fieldLines,
    '});',
    `export type ${iface.name} = z.infer<typeof ${schemaName}>;`,
  ].join('\n');

  return code;
}

// ── Main ────────────────────────────────────────────────────────────────────

const existing = readFileSync(CONTRACTS_INDEX, 'utf-8');
const existingSchemas = getExistingSchemas(existing);
const queryFiles = findFiles(WEB_FEATURES, /\.queries\.ts$/).sort();

const allGenerated = [];
const skipDupes = new Set();
let totalGenerated = 0;
let totalSkipped = 0;

// Group by domain for section headers
const byDomain = new Map();

for (const fp of queryFiles) {
  const rel = relative(join(ROOT, 'apps', 'web', 'src', 'features'), fp).replace(/\\/g, '/');
  const content = readFileSync(fp, 'utf-8');
  const ifaces = parseInterfaces(content);

  if (ifaces.length === 0) continue;

  // Determine domain from path
  const domain = rel.split('/')[0]; // e.g. 'finance', 'portal'
  const subDomain = basename(fp, '.queries.ts'); // e.g. 'report', 'ap', 'ic'

  if (!byDomain.has(domain)) byDomain.set(domain, []);

  const domainSchemas = [];

  for (const iface of ifaces) {
    const schemaName = iface.name + 'Schema';

    // Skip if already exists in contracts
    if (existingSchemas.has(schemaName) || existingSchemas.has(iface.name)) {
      totalSkipped++;
      continue;
    }

    // Skip duplicates within this generation (e.g. PostingPreviewLine appears in many files)
    if (skipDupes.has(iface.name)) {
      totalSkipped++;
      continue;
    }

    skipDupes.add(iface.name);
    existingSchemas.add(schemaName); // Track for extends resolution
    existingSchemas.add(iface.name);

    const code = generateSchema(iface, existingSchemas);
    domainSchemas.push(code);
    totalGenerated++;
  }

  if (domainSchemas.length > 0) {
    byDomain.get(domain).push({
      subDomain,
      schemas: domainSchemas,
    });
  }
}

// Build the output block
const outputLines = [
  '',
  '// ─── Response View-Model Schemas (auto-generated) ─────────────────────────',
  '// Generated by: node tools/scripts/gen-response-schemas.mjs',
  '// These schemas provide contract coverage for response types used in query files.',
  '',
];

for (const [domain, subs] of byDomain) {
  outputLines.push(`// ── ${domain.charAt(0).toUpperCase() + domain.slice(1)} Response Schemas ──`);
  outputLines.push('');

  for (const { subDomain, schemas } of subs) {
    outputLines.push(`// ${subDomain}`);
    for (const s of schemas) {
      outputLines.push(s);
      outputLines.push('');
    }
  }
}

// Find the insertion point (before the kernel re-export line)
const kernelLine =
  '// ─── Kernel Contracts ─────────────────────────────────────────────────────────';
const insertIdx = existing.indexOf(kernelLine);

let newContent;
if (insertIdx !== -1) {
  newContent =
    existing.slice(0, insertIdx) + outputLines.join('\n') + '\n' + existing.slice(insertIdx);
} else {
  // Append to end
  newContent = existing + '\n' + outputLines.join('\n') + '\n';
}

writeFileSync(CONTRACTS_INDEX, newContent);

console.log(`✅ Generated ${totalGenerated} response schemas`);
console.log(`   Skipped ${totalSkipped} (already exist or duplicates)`);
console.log(`   Written to: packages/contracts/src/index.ts`);
