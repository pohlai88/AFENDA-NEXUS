#!/usr/bin/env node
/**
 * gen:screen <module> <entity> — Scaffold a full feature screen for @afenda/web.
 *
 * Creates:
 *   Feature slice:
 *     features/<module>/<entity>/queries/<prefix>.queries.ts
 *     features/<module>/<entity>/actions/<prefix>.actions.ts
 *     features/<module>/<entity>/blocks/<prefix>-<entity>-table.tsx
 *     features/<module>/<entity>/blocks/<prefix>-<entity>-detail-header.tsx
 *   Route pages:
 *     app/(shell)/<module>/<entity>/page.tsx        — list
 *     app/(shell)/<module>/<entity>/loading.tsx      — skeleton
 *     app/(shell)/<module>/<entity>/[id]/page.tsx    — detail
 *     app/(shell)/<module>/<entity>/new/page.tsx     — create
 *
 * Usage: pnpm gen:screen finance accounts
 *
 * Conventions: follows ARCHITECTURE_afenda-web.md §3, §11, §12.
 */
import { mkdirSync, writeFileSync, existsSync, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { toTitleCase, pluralize, patchEmptyStateRegistry, readJson } from './utils.mjs';

// ─── CLI Args ────────────────────────────────────────────────────────────────

const allArgs = process.argv.slice(2);
let module_ = '';
let entity = '';
let specPath = '';
let displayNameFlag = '';
let displayPluralFlag = '';

// Positional args first, then flags
const positional = [];
for (let i = 0; i < allArgs.length; i++) {
  if (allArgs[i] === '--spec' && allArgs[i + 1]) {
    specPath = allArgs[++i];
    continue;
  }
  if (allArgs[i] === '--displayName' && allArgs[i + 1]) {
    displayNameFlag = allArgs[++i];
    continue;
  }
  if (allArgs[i] === '--displayPlural' && allArgs[i + 1]) {
    displayPluralFlag = allArgs[++i];
    continue;
  }
  positional.push(allArgs[i]);
}
module_ = positional[0] || '';
entity = positional[1] || '';

if (!module_ || !entity) {
  console.error(
    'Usage: pnpm gen:screen <module> <entity> [--spec <path>] [--displayName <name>] [--displayPlural <plural>]'
  );
  console.error('Example: pnpm gen:screen finance accounts');
  process.exit(1);
}

// ─── Resolve display metadata ───────────────────────────────────────────────

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
  const p = toPascal(s);
  return p.charAt(0).toLowerCase() + p.slice(1);
}

/** @param {string} s — singular form */
function toTitle(s) {
  return toKebab(s)
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

const kebab = toKebab(entity);
const pascal = toPascal(entity);
const camel = toCamel(entity);
const title = toTitle(entity);
const prefix = kebab; // file prefix  e.g. "accounts" or "cost-centers"
const registryKey = `${module_}.${camel}`;

// ─── Paths ──────────────────────────────────────────────────────────────────

// Resolve monorepo root from script location: tools/generators/src/gen-screen.mjs → root
const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..', '..', '..');
const webSrc = join(root, 'apps', 'web', 'src');
const featureDir = join(webSrc, 'features', module_, kebab);
const routeDir = join(webSrc, 'app', '(shell)', module_, kebab);

// Guard
if (existsSync(featureDir)) {
  console.error(`Feature directory already exists: ${featureDir}`);
  process.exit(1);
}

// Create dirs
const dirs = [
  join(featureDir, 'queries'),
  join(featureDir, 'actions'),
  join(featureDir, 'blocks'),
  join(featureDir, 'forms'),
  join(routeDir, '[id]'),
  join(routeDir, 'new'),
];
for (const d of dirs) mkdirSync(d, { recursive: true });

console.log(`\nScaffolding screen: ${module_}/${kebab} (${pascal})\n`);

// ═══════════════════════════════════════════════════════════════════════════
// 1. Queries
// ═══════════════════════════════════════════════════════════════════════════

const queriesFile = join(featureDir, 'queries', `${prefix}.queries.ts`);
writeFileSync(
  queriesFile,
  `import { createApiClient } from '@/lib/api-client';
import type { ApiResult, PaginatedResponse, CommandReceipt } from '@/lib/types';

// ─── View Models ────────────────────────────────────────────────────────────

export interface ${pascal}ListItem {
  id: string;
  // TODO: add list columns
  createdAt: string;
}

export interface ${pascal}Detail {
  id: string;
  // TODO: add detail fields
  createdAt: string;
}

// ─── Query Functions (server-side, called from RSC pages) ───────────────────

export async function get${pascal}s(
  ctx: { tenantId: string; userId: string; token: string },
  params: { page?: string; limit?: string }
): Promise<ApiResult<PaginatedResponse<${pascal}ListItem>>> {
  const client = createApiClient(ctx);
  const query: Record<string, string> = {};
  if (params.page) query.page = params.page;
  if (params.limit) query.limit = params.limit;
  return client.get<PaginatedResponse<${pascal}ListItem>>('/${kebab}', query);
}

export async function get${pascal}(
  ctx: { tenantId: string; userId: string; token: string },
  id: string
): Promise<ApiResult<${pascal}Detail>> {
  const client = createApiClient(ctx);
  return client.get<${pascal}Detail>(\`/${kebab}/\${id}\`);
}

export async function create${pascal}(
  ctx: { tenantId: string; userId: string; token: string },
  body: unknown
): Promise<ApiResult<CommandReceipt>> {
  const client = createApiClient(ctx);
  return client.post<CommandReceipt>('/${kebab}', body);
}
`
);
console.log(`  ✓ queries/${prefix}.queries.ts`);

// ═══════════════════════════════════════════════════════════════════════════
// 2. Actions
// ═══════════════════════════════════════════════════════════════════════════

const actionsFile = join(featureDir, 'actions', `${prefix}.actions.ts`);
writeFileSync(
  actionsFile,
  `'use server';

import { getRequestContext } from '@/lib/auth';
import { create${pascal} } from '../queries/${prefix}.queries';
import { createApiClient } from '@/lib/api-client';
import type { ApiResult, CommandReceipt, AuditEntry } from '@/lib/types';

// ─── Mutations ──────────────────────────────────────────────────────────────

export async function create${pascal}Action(
  data: unknown
): Promise<ApiResult<CommandReceipt>> {
  const ctx = await getRequestContext();
  return create${pascal}(ctx, data);
}

// ─── Queries ────────────────────────────────────────────────────────────────

export async function get${pascal}AuditAction(
  entityId: string
): Promise<ApiResult<AuditEntry[]>> {
  const ctx = await getRequestContext();
  const client = createApiClient(ctx);
  return client.get<AuditEntry[]>(\`/${kebab}/\${entityId}/audit\`);
}
`
);
console.log(`  ✓ actions/${prefix}.actions.ts`);

// ═══════════════════════════════════════════════════════════════════════════
// 3. Blocks — Table
// ═══════════════════════════════════════════════════════════════════════════

const tableFile = join(featureDir, 'blocks', `${prefix}-table.tsx`);
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
import { EmptyState } from '@/components/erp/empty-state';
import { routes } from '@/lib/constants';
import { FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { ${pascal}ListItem } from '../queries/${prefix}.queries';

interface ${pascal}TableProps {
  data: ${pascal}ListItem[];
  total: number;
}

export function ${pascal}Table({ data, total }: ${pascal}TableProps) {
  if (data.length === 0) {
    return (
      <EmptyState
        contentKey="${registryKey}"
        icon={FileText}
        action={
          <Button asChild>
            <Link href={\`/${module_}/${kebab}/new\`}>Create ${title}</Link>
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
              {/* TODO: Add column headers */}
              <TableHead>Created</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((item) => (
              <TableRow key={item.id} className="cursor-pointer">
                <TableCell>
                  <Link
                    href={\`/${module_}/${kebab}/\${item.id}\`}
                    className="font-mono text-sm font-medium text-primary hover:underline"
                  >
                    {item.id}
                  </Link>
                </TableCell>
                {/* TODO: Add column cells */}
                <TableCell className="text-muted-foreground">
                  {item.createdAt}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <p className="mt-2 text-xs text-muted-foreground">
        {total} {total !== 1 ? '${title.toLowerCase()}s' : '${title.toLowerCase()}'} total
      </p>
    </div>
  );
}
`
);
console.log(`  ✓ blocks/${prefix}-table.tsx`);

// ═══════════════════════════════════════════════════════════════════════════
// 4. Blocks — Detail Header
// ═══════════════════════════════════════════════════════════════════════════

const detailHeaderFile = join(featureDir, 'blocks', `${prefix}-detail-header.tsx`);
writeFileSync(
  detailHeaderFile,
  `'use client';

import type { ${pascal}Detail } from '../queries/${prefix}.queries';

interface ${pascal}DetailHeaderProps {
  item: ${pascal}Detail;
}

export function ${pascal}DetailHeader({ item }: ${pascal}DetailHeaderProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <div>
        <p className="text-xs text-muted-foreground">ID</p>
        <p className="font-mono text-sm">{item.id}</p>
      </div>
      <div>
        <p className="text-xs text-muted-foreground">Created</p>
        <p className="text-sm">{item.createdAt}</p>
      </div>
      {/* TODO: Add detail header fields */}
    </div>
  );
}
`
);
console.log(`  ✓ blocks/${prefix}-detail-header.tsx`);

// ═══════════════════════════════════════════════════════════════════════════
// 5. Route — List Page
// ═══════════════════════════════════════════════════════════════════════════

const listPage = join(routeDir, 'page.tsx');
writeFileSync(
  listPage,
  `import Link from 'next/link';
import { PageHeader } from '@/components/erp/page-header';
import { ${pascal}Table } from '@/features/${module_}/${kebab}/blocks/${prefix}-table';
import { getRequestContext } from '@/lib/auth';
import { handleApiError } from '@/lib/api-error.server';
import { get${pascal}s } from '@/features/${module_}/${kebab}/queries/${prefix}.queries';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

export const metadata = { title: '${title}s' };

interface ${pascal}sPageProps {
  searchParams: Promise<{ page?: string; limit?: string }>;
}

export default async function ${pascal}sPage({ searchParams }: ${pascal}sPageProps) {
  const params = await searchParams;
  const ctx = await getRequestContext();

  const result = await get${pascal}s(ctx, {
    page: params.page ?? '1',
    limit: params.limit ?? '20',
  });

  if (!result.ok) {
    handleApiError(result, 'Failed to load ${title.toLowerCase()}s');
  }

  const items = result.value.data;
  const total = result.value.total;

  return (
    <div className="space-y-6">
      <PageHeader
        title="${title}s"
        description="Manage ${title.toLowerCase()} records."
        breadcrumbs={[
          { label: '${toTitle(module_)}', href: '/${module_}/${kebab}' },
          { label: '${title}s' },
        ]}
        actions={
          <Button asChild>
            <Link href={\`/${module_}/${kebab}/new\`}>
              <Plus className="mr-2 h-4 w-4" aria-hidden="true" />
              Create ${title}
            </Link>
          </Button>
        }
      />

      <${pascal}Table data={items} total={total} />
    </div>
  );
}
`
);
console.log(`  ✓ app/(shell)/${module_}/${kebab}/page.tsx`);

// ═══════════════════════════════════════════════════════════════════════════
// 6. Route — Loading Skeleton
// ═══════════════════════════════════════════════════════════════════════════

const loadingFile = join(routeDir, 'loading.tsx');
writeFileSync(
  loadingFile,
  `import { Skeleton } from '@/components/ui/skeleton';

export default function ${pascal}sLoading() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-9 w-32" />
      </div>
      <div className="rounded-md border">
        <div className="border-b p-4">
          <div className="flex gap-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-4 w-24" />
            ))}
          </div>
        </div>
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="flex gap-4 border-b p-4">
            {Array.from({ length: 5 }).map((_, j) => (
              <Skeleton key={j} className="h-4 w-24" />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
`
);
console.log(`  ✓ app/(shell)/${module_}/${kebab}/loading.tsx`);

// ═══════════════════════════════════════════════════════════════════════════
// 7. Route — Detail Page
// ═══════════════════════════════════════════════════════════════════════════

const detailPage = join(routeDir, '[id]', 'page.tsx');
writeFileSync(
  detailPage,
  `import { notFound } from 'next/navigation';
import { PageHeader } from '@/components/erp/page-header';
import { BusinessDocument } from '@/components/erp/business-document';
import { AuditPanel } from '@/components/erp/audit-panel';
import { ${pascal}DetailHeader } from '@/features/${module_}/${kebab}/blocks/${prefix}-detail-header';
import { getRequestContext } from '@/lib/auth';
import { handleApiError } from '@/lib/api-error.server';
import { get${pascal} } from '@/features/${module_}/${kebab}/queries/${prefix}.queries';
import { get${pascal}AuditAction } from '@/features/${module_}/${kebab}/actions/${prefix}.actions';

export const metadata = { title: '${title} Detail' };

export default async function ${pascal}DetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const ctx = await getRequestContext();
  const result = await get${pascal}(ctx, id);

  if (!result.ok) {
    if (result.error.statusCode === 404) notFound();
    handleApiError(result, 'Failed to load ${title.toLowerCase()}');
  }

  const item = result.value;

  const auditResult = await get${pascal}AuditAction(id);
  const auditEntries = auditResult.ok ? auditResult.value : [];

  return (
    <div className="space-y-6">
      <PageHeader
        title={item.id}
        breadcrumbs={[
          { label: '${toTitle(module_)}' },
          { label: '${title}s', href: '/${module_}/${kebab}' },
          { label: item.id },
        ]}
      />

      <BusinessDocument
        header={<${pascal}DetailHeader item={item} />}
        tabs={[
          {
            value: 'details',
            label: 'Details',
            content: <p className="text-sm text-muted-foreground">TODO: detail content</p>,
          },
          {
            value: 'audit',
            label: 'Audit Trail',
            content: <AuditPanel entries={auditEntries} />,
          },
        ]}
        defaultTab="details"
      />
    </div>
  );
}
`
);
console.log(`  ✓ app/(shell)/${module_}/${kebab}/[id]/page.tsx`);

// ═══════════════════════════════════════════════════════════════════════════
// 8. Route — New Page
// ═══════════════════════════════════════════════════════════════════════════

const newPage = join(routeDir, 'new', 'page.tsx');
writeFileSync(
  newPage,
  `import { PageHeader } from '@/components/erp/page-header';

export const metadata = { title: 'New ${title}' };

export default function New${pascal}Page() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Create ${title}"
        description="Create a new ${title.toLowerCase()} record."
        breadcrumbs={[
          { label: '${toTitle(module_)}' },
          { label: '${title}s', href: '/${module_}/${kebab}' },
          { label: 'New' },
        ]}
      />

      <div className="mx-auto max-w-4xl">
        <p className="text-sm text-muted-foreground">
          TODO: Wire up the form component. Run{' '}
          <code className="rounded bg-muted px-1 py-0.5 text-xs">
            pnpm gen:form Create${pascal}Schema
          </code>{' '}
          to generate it.
        </p>
      </div>
    </div>
  );
}
`
);
console.log(`  ✓ app/(shell)/${module_}/${kebab}/new/page.tsx`);

// ─── Summary ────────────────────────────────────────────────────────────────

// ─── Auto-patch empty state registry ─────────────────────────────────────────

const displayName = displayNameFlag || specData?.entity?.displayName || toTitleCase(pascal);
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
[DONE] Screen ${module_}/${kebab} scaffolded (8 files).

Feature slice:
  features/${module_}/${kebab}/queries/${prefix}.queries.ts
  features/${module_}/${kebab}/actions/${prefix}.actions.ts
  features/${module_}/${kebab}/blocks/${prefix}-table.tsx
  features/${module_}/${kebab}/blocks/${prefix}-detail-header.tsx

Route pages:
  app/(shell)/${module_}/${kebab}/page.tsx          (list)
  app/(shell)/${module_}/${kebab}/loading.tsx        (skeleton)
  app/(shell)/${module_}/${kebab}/[id]/page.tsx      (detail)
  app/(shell)/${module_}/${kebab}/new/page.tsx       (create)

Next steps:
  1. Fill in view model fields in ${prefix}.queries.ts
  2. Add columns to ${prefix}-table.tsx
  3. Add detail fields to ${prefix}-detail-header.tsx
  4. Generate a form:  pnpm gen:form Create${pascal}Schema
  5. Generate a table:  pnpm gen:table-ui ${pascal}ListItem
  6. Add routes to constants.ts + nav items
  7. Run:  pnpm --filter @afenda/web typecheck
`);
