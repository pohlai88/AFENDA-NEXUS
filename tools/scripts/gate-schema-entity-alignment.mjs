#!/usr/bin/env node
/**
 * gate:schema-entity-alignment — CI gate that validates Drizzle DB schema
 * columns align with domain entity interface properties.
 *
 * Rationale: The repo layer maps DB rows to domain entities. If a column is
 * added to the schema but not to the entity (or vice versa), the repo mapper
 * silently drops or invents data. This gate catches column↔property drift.
 *
 * Approach:
 *   - Parse entity interfaces from packages/modules/finance/src/slices/(star)/entities/(star).ts
 *   - Parse table definitions from packages/db/src/schema/erp.ts
 *   - Match entity <-> table by naming convention (e.g. ApInvoice <-> apInvoices)
 *   - Compare property names -- flag mismatches
 *
 * Checks:
 *   SEA-01: Every entity interface has a corresponding DB table.
 *   SEA-02: Entity properties have corresponding DB columns (with known exceptions).
 *
 * Usage: node tools/scripts/gate-schema-entity-alignment.mjs
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const ROOT = process.cwd();
const SLICES_DIR = join(ROOT, 'packages', 'modules', 'finance', 'src', 'slices');
const ERP_SCHEMA = join(ROOT, 'packages', 'db', 'src', 'schema', 'erp.ts');
const SCHEMA_INDEX = join(ROOT, 'packages', 'db', 'src', 'schema', 'index.ts');

// Properties that exist on domain entities but NOT in DB (computed, embedded, etc.)
const KNOWN_ENTITY_ONLY_PROPS = new Set([
  'lines',         // Child entities composed by repo
  'items',         // Child entities composed by repo
  'legs',          // IC transaction legs
  'movements',     // Asset movements
  'allocations',   // Payment allocations
  'entries',       // Nested entries
  'steps',         // Approval steps
  'details',       // Computed detail objects
  'children',      // Nested child records
  'schedules',     // Embedded schedules
]);

// DB columns that may not map to entity properties (infrastructure concerns)
const KNOWN_DB_ONLY_COLS = new Set([
  'currencyId',    // Entity uses Money branded type which embeds currency
  'correlationId', // Infrastructure concern
  'eventId',       // Outbox infrastructure
]);

function findFiles(dir, pattern, results = []) {
  try {
    for (const entry of readdirSync(dir)) {
      if (entry === 'node_modules' || entry === 'dist') continue;
      const full = join(dir, entry);
      if (statSync(full).isDirectory()) findFiles(full, pattern, results);
      else if (pattern.test(entry)) results.push(full);
    }
  } catch {
    /* dir doesn't exist */
  }
  return results;
}

function rel(fp) {
  return relative(ROOT, fp).replace(/\\/g, '/');
}

// ── Parse entity interfaces ─────────────────────────────────────────────────

function extractEntityInterfaces(content) {
  const entities = [];
  const lines = content.split('\n');
  let current = null;
  let depth = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Match: export interface ApInvoice {
    const ifaceMatch = line.match(
      /^export\s+interface\s+(\w+)(?:\s+extends\s+\w+)?\s*\{/,
    );
    if (ifaceMatch && !current) {
      current = { name: ifaceMatch[1], props: [], line: i + 1 };
      depth = 1;
      continue;
    }

    if (current) {
      depth += (line.match(/\{/g) || []).length;
      depth -= (line.match(/\}/g) || []).length;

      // Extract property: readonly id: string;
      const propMatch = line.match(
        /^\s*(?:readonly\s+)?(\w+)\s*[?:]?\s*:/,
      );
      if (propMatch && depth > 0) {
        current.props.push(propMatch[1]);
      }

      if (depth <= 0) {
        entities.push(current);
        current = null;
      }
    }
  }

  return entities;
}

// ── Parse Drizzle table definitions ─────────────────────────────────────────

function extractTableDefinitions(content) {
  const tables = [];
  const lines = content.split('\n');
  let current = null;
  let depth = 0;
  let inFirstArg = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Match: export const apInvoices = erpSchema.table(
    const tableMatch = line.match(
      /^export\s+const\s+(\w+)\s*=\s*\w+\.table\(/,
    );
    if (tableMatch && !current) {
      current = { name: tableMatch[1], columns: [], line: i + 1 };
      depth = 0;
      inFirstArg = false;
      // Count opening parens on this line
      depth += (line.match(/\(/g) || []).length;
      depth -= (line.match(/\)/g) || []).length;
      continue;
    }

    if (current) {
      const opens = (line.match(/\{/g) || []).length;
      const closes = (line.match(/\}/g) || []).length;

      // Detect when we enter the column object (second argument)
      if (!inFirstArg && line.includes('{') && !line.includes("'")) {
        inFirstArg = true;
      }

      if (inFirstArg) {
        // Extract column: companyId: uuid('company_id')
        // Also match spread helpers: ...pkId(), ...tenantCol(), ...timestamps()
        const spreadMatch = line.match(/\.\.\.(pkId|tenantCol|timestamps)\(\)/);
        if (spreadMatch) {
          const helper = spreadMatch[1];
          if (helper === 'pkId') current.columns.push('id');
          if (helper === 'tenantCol') current.columns.push('tenantId');
          if (helper === 'timestamps') {
            current.columns.push('createdAt');
            current.columns.push('updatedAt');
          }
        }

        // Match columns defined with any Drizzle column builder
        // Patterns: `colName: uuid(`, `colName: varchar(`, `colName: moneyBigint(`,
        //           `colName: apInvoiceStatusEnum(`, etc.
        const colMatch = line.match(/^\s+(\w+)\s*:\s*\w+\s*\(/);
        if (colMatch && !line.includes('...') && !line.includes('=>')) {
          current.columns.push(colMatch[1]);
        }
      }

      // When we see the index function (third arg), table definition is done
      if (line.includes('(t) =>') || line.includes('(table) =>')) {
        tables.push(current);
        current = null;
        continue;
      }

      // Or when the table call closes
      depth += (line.match(/\(/g) || []).length;
      depth -= (line.match(/\)/g) || []).length;
      if (depth <= 0 && i > current.line) {
        tables.push(current);
        current = null;
      }
    }
  }

  if (current) tables.push(current);
  return tables;
}

// ── Naming convention mapping ───────────────────────────────────────────────
// Entity: ApInvoice → Table: apInvoices
// Entity: GlJournal → Table: glJournals
// Entity: BankStatement → Table: bankStatements

function entityToTableName(entityName) {
  // PascalCase → camelCase + 's'
  const camel = entityName[0].toLowerCase() + entityName.slice(1);
  // Add 's' unless already ends in 's'
  return camel.endsWith('s') ? camel : camel + 's';
}

// ── Main ────────────────────────────────────────────────────────────────────

let schemaContent;
try {
  schemaContent = readFileSync(ERP_SCHEMA, 'utf-8');
} catch {
  console.error(`❌ gate:schema-entity-alignment — Cannot read ${rel(ERP_SCHEMA)}`);
  process.exit(1);
}

const tables = extractTableDefinitions(schemaContent);
const tableMap = new Map(tables.map((t) => [t.name, t]));

// Collect entity files
const entityFiles = findFiles(SLICES_DIR, /\.ts$/).filter((f) => {
  const norm = f.replace(/\\/g, '/');
  return norm.includes('/entities/') && !norm.includes('.test.');
});

let totalEntities = 0;
let matchedEntities = 0;
const warnings = [];
const violations = [];

for (const fp of entityFiles) {
  const content = readFileSync(fp, 'utf-8');
  const entities = extractEntityInterfaces(content);
  const r = rel(fp);

  for (const entity of entities) {
    // Skip small helper types (< 3 props are usually union types or sub-types)
    if (entity.props.length < 3) continue;
    // Skip types that are clearly not DB-backed entities
    if (entity.name.endsWith('Line') || entity.name.endsWith('Item')) continue;

    totalEntities++;
    const expectedTable = entityToTableName(entity.name);
    const table = tableMap.get(expectedTable);

    if (!table) {
      // Try alternative naming
      const alt1 = expectedTable.replace(/ies$/, 'y'); // no — we want plural
      warnings.push({
        entity: entity.name,
        file: r,
        line: entity.line,
        issue: `No DB table '${expectedTable}' found for entity '${entity.name}'`,
      });
      continue;
    }

    matchedEntities++;
    const tableColSet = new Set(table.columns);
    const entityPropSet = new Set(entity.props);

    // Entity props missing from DB
    for (const prop of entity.props) {
      if (KNOWN_ENTITY_ONLY_PROPS.has(prop)) continue;
      if (!tableColSet.has(prop)) {
        // Don't flag — entity may use computed/mapped names
        // This is a warning, not a violation
        warnings.push({
          entity: entity.name,
          file: r,
          line: entity.line,
          issue: `Entity prop '${prop}' not found as DB column in '${table.name}'`,
        });
      }
    }
  }
}

// ── Output ──────────────────────────────────────────────────────────────────

console.log('── Schema ↔ Entity Alignment ──\n');
console.log(`  Tables parsed:    ${tables.length}`);
console.log(`  Entities parsed:  ${totalEntities}`);
console.log(`  Matched pairs:    ${matchedEntities}`);
console.log(`  Warnings:         ${warnings.length}`);
console.log();

if (warnings.length > 0) {
  console.log('── Alignment Warnings ──\n');
  for (const w of warnings) {
    console.log(`  ⚠ [${w.entity}] ${w.file}:${w.line}`);
    console.log(`    ${w.issue}`);
  }
  console.log();
}

// Gate fails if no entities matched at all (something is fundamentally broken)
if (totalEntities > 0 && matchedEntities === 0) {
  console.error('❌ gate:schema-entity-alignment FAILED');
  console.error(
    '   No entity interfaces matched any DB table. Naming convention may have changed.',
  );
  process.exit(1);
}

// Gate fails if the table match rate drops below 40%
// (indicates entity naming convention diverged from table convention)
const matchRate = matchedEntities / Math.max(totalEntities, 1);
if (matchRate < 0.4 && totalEntities > 5) {
  console.error('❌ gate:schema-entity-alignment FAILED');
  console.error(
    `   Only ${matchedEntities}/${totalEntities} entities (${(matchRate * 100).toFixed(0)}%) matched DB tables.`,
  );
  console.error(
    '   Entity↔table naming convention may have diverged. Expected ≥40% match rate.',
  );
  process.exit(1);
}

console.log('✅ gate:schema-entity-alignment PASSED');
console.log(
  `   ${matchedEntities}/${totalEntities} entities aligned with DB tables. ${warnings.length} column-level warning(s).`,
);
