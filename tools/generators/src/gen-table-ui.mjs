#!/usr/bin/env node
/**
 * gen:table-ui <ViewModelName> — Scaffold a data table block for @afenda/web.
 *
 * Generates a table block following architecture patterns:
 *   - 'use client' directive
 *   - shadcn Table components
 *   - EmptyState with icon
 *   - StatusBadge, MoneyCell, DateCell formatters
 *   - Typed props from view model interface
 *   - cn() for className merging
 *
 * Convention: "JournalListItem" → journal-table.tsx
 *             "ApInvoiceListItem" → ap-invoice-table.tsx
 *
 * Usage: pnpm gen:table-ui AccountListItem
 *        pnpm gen:table-ui AccountListItem --module finance --entity accounts
 *
 * Without --module/--entity, the generator prompts for module;
 * the entity is derived from the view model name.
 */
import { mkdirSync, writeFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { toTitleCase, pluralize, patchEmptyStateRegistry, readJson } from './utils.mjs';

// ─── CLI Args ────────────────────────────────────────────────────────────────

const args = process.argv.slice(2);
const viewModelName = args[0];

if (!viewModelName || !viewModelName.endsWith('ListItem')) {
  console.error('Usage: pnpm gen:table-ui <ViewModelName>');
  console.error('Example: pnpm gen:table-ui AccountListItem');
  console.error('');
  console.error('The view model name must end with "ListItem".');
  process.exit(1);
}

// Parse --module, --entity, --spec, --displayName, --displayPlural flags
let moduleFlag = '';
let entityFlag = '';
let specPath = '';
let displayNameFlag = '';
let displayPluralFlag = '';
for (let i = 1; i < args.length; i++) {
  if (args[i] === '--module' && args[i + 1]) moduleFlag = args[++i];
  if (args[i] === '--entity' && args[i + 1]) entityFlag = args[++i];
  if (args[i] === '--spec' && args[i + 1]) specPath = args[++i];
  if (args[i] === '--displayName' && args[i + 1]) displayNameFlag = args[++i];
  if (args[i] === '--displayPlural' && args[i + 1]) displayPluralFlag = args[++i];
}

let specData = null;
if (specPath) {
  try {
    specData = readJson(specPath);
  } catch (e) {
    console.warn(`Warning: Could not read spec file: ${specPath}`);
  }
}

// ─── Naming Conventions ─────────────────────────────────────────────────────

/** @param {string} s */
function toKebab(s) {
  return s
    .replace(/([a-z])([A-Z])/g, '$1-$2')
    .replace(/_/g, '-')
    .toLowerCase();
}

/** @param {string} s */
function toPascal(s) {
  return toKebab(s)
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join('');
}

/** @param {string} s */
function toCamel(s) {
  return toKebab(s)
    .split('-')
    .map((w, i) => (i === 0 ? w : w.charAt(0).toUpperCase() + w.slice(1)))
    .join('');
}

/** @param {string} s */
function toTitle(s) {
  return toKebab(s)
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

// Extract entity from view model: "AccountListItem" → "Account"
const match = viewModelName.match(/^(\w+)ListItem$/);
if (!match) {
  console.error(`View model name must match "<Entity>ListItem" pattern. Got: ${viewModelName}`);
  process.exit(1);
}

const entityPascal = match[1]; // "Account", "ApInvoice"
const entityKebab = entityFlag || toKebab(entityPascal) + 's'; // pluralize for directory
const entitySingularKebab = toKebab(entityPascal);
const entityCamel = toCamel(entityPascal);
const entityTitle = toTitle(entityPascal);
const module_ = moduleFlag || 'finance';
const prefix = entitySingularKebab; // file prefix
const registryKey = `${module_}.${entityCamel}`;

// ─── Paths ──────────────────────────────────────────────────────────────────

// Resolve monorepo root from script location: tools/generators/src/gen-table-ui.mjs → root
const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..', '..', '..');
const webSrc = join(root, 'apps', 'web', 'src');
const blocksDir = join(webSrc, 'features', module_, entityKebab, 'blocks');

mkdirSync(blocksDir, { recursive: true });

const tableFile = join(blocksDir, `${prefix}-table.tsx`);
if (existsSync(tableFile)) {
  console.error(`Table file already exists: ${tableFile}`);
  process.exit(1);
}

console.log(`\nScaffolding table: ${prefix}-table.tsx (${viewModelName})\n`);

// ─── Generate Table ─────────────────────────────────────────────────────────

writeFileSync(
  tableFile,
  `'use client';

import Link from 'next/link';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { StatusBadge } from '@/components/erp/status-badge';
import { MoneyCell } from '@/components/erp/money-cell';
import { DateCell } from '@/components/erp/date-cell';
import { EmptyState } from '@/components/erp/empty-state';
import { FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { ${viewModelName} } from '../queries/${prefix}.queries';

interface ${entityPascal}TableProps {
  data: ${viewModelName}[];
  total: number;
}

export function ${entityPascal}Table({ data, total }: ${entityPascal}TableProps) {
  if (data.length === 0) {
    return (
      <EmptyState
        contentKey="${registryKey}"
        icon={FileText}
        action={
          <Button asChild>
            <Link href={\`/${module_}/${entityKebab}/new\`}>Create ${entityTitle}</Link>
          </Button>
        }
      />
    );
  }

  return (
    <div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              {/* TODO: Add columns matching ${viewModelName} fields */}
              {/* Example: */}
              {/* <TableHead>Name</TableHead> */}
              {/* <TableHead>Status</TableHead> */}
              {/* <TableHead className="text-right">Amount</TableHead> */}
              <TableHead>Created</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((item) => (
              <TableRow key={item.id} className="cursor-pointer">
                <TableCell>
                  <Link
                    href={\`/${module_}/${entityKebab}/\${item.id}\`}
                    className="font-mono text-sm font-medium text-primary hover:underline"
                  >
                    {item.id}
                  </Link>
                </TableCell>
                {/* TODO: Add cells matching ${viewModelName} fields */}
                {/* Example: */}
                {/* <TableCell>{item.name}</TableCell> */}
                {/* <TableCell><StatusBadge status={item.status} /></TableCell> */}
                {/* <TableCell className="text-right"><MoneyCell amount={item.amount} currency={item.currencyCode} /></TableCell> */}
                <TableCell className="text-muted-foreground">
                  <DateCell date={item.createdAt} format="short" />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <p className="mt-2 text-xs text-muted-foreground">
        {total} {total !== 1 ? '${entityTitle.toLowerCase()}s' : '${entityTitle.toLowerCase()}'} total
      </p>
    </div>
  );
}
`
);

console.log(`  ✓ blocks/${prefix}-table.tsx`);

// ─── Auto-patch empty state registry ─────────────────────────────────────────

const displayName = displayNameFlag || specData?.entity?.displayName || toTitleCase(entityPascal);
const displayPlural =
  displayPluralFlag || specData?.entity?.displayPlural || pluralize(displayName);
const emptyStateDescription =
  specData?.entity?.emptyStateDescription || `Create your first ${displayName} to get started.`;

const esResult = patchEmptyStateRegistry({
  registryKey,
  displayName,
  displayPlural,
  description: emptyStateDescription,
  root,
});

if (esResult.keysPatched)
  console.log(`  ✓ Patched empty-state.generated-keys.ts (added "${registryKey}")`);
if (esResult.registryPatched)
  console.log(`  ✓ Patched empty-state.registry.ts (added "${registryKey}")`);

console.log(`
[DONE] Table ${prefix}-table.tsx scaffolded.

  features/${module_}/${entityKebab}/blocks/${prefix}-table.tsx

Available formatters (already imported):
  - <StatusBadge status={item.status} />       — badge with variant
  - <MoneyCell amount={item.amount} currency={item.currencyCode} />  — formatted money
  - <DateCell date={item.date} format="short" />  — formatted date

Next steps:
  1. Fill in column headers in <TableHead>
  2. Fill in column cells in <TableCell>
  3. Run:  pnpm --filter @afenda/web typecheck
`);
