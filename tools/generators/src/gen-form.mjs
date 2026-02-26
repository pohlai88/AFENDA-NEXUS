#!/usr/bin/env node
/**
 * gen:form <SchemaName> — Scaffold a RHF + Zod form component for @afenda/web.
 *
 * Reads the schema name (e.g. CreateJournalSchema) and generates:
 *   features/<module>/<entity>/forms/<entity>-form.tsx
 *
 * The form follows architecture patterns:
 *   - 'use client' directive
 *   - react-hook-form + zodResolver
 *   - useReceipt + ReceiptPanel
 *   - idempotency key via crypto.randomUUID()
 *   - Proper error display with role="alert"
 *   - Label + Input pairs with shadcn/ui components
 *
 * Convention: "Create<Entity>Schema" → <entity>-form.tsx
 *
 * Usage: pnpm gen:form CreateAccountSchema
 *        pnpm gen:form CreateAccountSchema --module finance --entity accounts
 *
 * Without --module/--entity, the generator infers from the schema name
 * and prompts for the module. The entity is derived from the schema name:
 *   CreateAccountSchema     → accounts   (pluralized kebab)
 *   CreateCostCenterSchema  → cost-centers
 *   CreateApInvoiceSchema   → ap-invoices
 */
import { mkdirSync, writeFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

// ─── CLI Args ────────────────────────────────────────────────────────────────

const args = process.argv.slice(2);
const schemaName = args[0];

if (!schemaName || !schemaName.endsWith('Schema')) {
  console.error('Usage: pnpm gen:form <SchemaName>');
  console.error('Example: pnpm gen:form CreateAccountSchema');
  console.error('');
  console.error('The schema name must end with "Schema" and start with "Create".');
  process.exit(1);
}

// Parse --module and --entity flags
let moduleFlag = '';
let entityFlag = '';
for (let i = 1; i < args.length; i++) {
  if (args[i] === '--module' && args[i + 1]) moduleFlag = args[++i];
  if (args[i] === '--entity' && args[i + 1]) entityFlag = args[++i];
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
function toTitle(s) {
  return toKebab(s)
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

// Extract entity from schema: "CreateAccountSchema" → "Account"
const match = schemaName.match(/^Create(\w+)Schema$/);
if (!match) {
  console.error(`Schema name must match "Create<Entity>Schema" pattern. Got: ${schemaName}`);
  process.exit(1);
}

const entityPascal = match[1]; // "Account", "ApInvoice", "CostCenter"
const entityKebab = entityFlag || toKebab(entityPascal) + 's'; // pluralize for directory
const entitySingularKebab = toKebab(entityPascal);
const entityTitle = toTitle(entityPascal);
const module_ = moduleFlag || 'finance'; // default module
const typeName = `Create${entityPascal}`;

// ─── Paths ──────────────────────────────────────────────────────────────────

// Resolve monorepo root from script location: tools/generators/src/gen-form.mjs → root
const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..', '..', '..');
const webSrc = join(root, 'apps', 'web', 'src');
const formsDir = join(webSrc, 'features', module_, entityKebab, 'forms');

mkdirSync(formsDir, { recursive: true });

const formFile = join(formsDir, `${entitySingularKebab}-form.tsx`);
if (existsSync(formFile)) {
  console.error(`Form file already exists: ${formFile}`);
  process.exit(1);
}

console.log(`\nScaffolding form: ${entitySingularKebab}-form.tsx (${schemaName})\n`);

// ─── Generate Form ──────────────────────────────────────────────────────────

writeFileSync(
  formFile,
  `'use client';

import { useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ${schemaName}, type ${typeName} } from '@afenda/contracts';
import { useReceipt } from '@/hooks/use-receipt';
import { ReceiptPanel } from '@/components/erp/receipt-panel';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { ApiResult, CommandReceipt } from '@/lib/types';
import Link from 'next/link';

interface ${entityPascal}FormProps {
  onSubmit: (data: ${typeName}) => Promise<ApiResult<CommandReceipt>>;
}

export function ${entityPascal}Form({ onSubmit }: ${entityPascal}FormProps) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { receipt, showReceipt, clearReceipt, isOpen } = useReceipt();

  const idempotencyKeyRef = useRef(crypto.randomUUID());

  const form = useForm<${typeName}>({
    resolver: zodResolver(${schemaName}),
    defaultValues: {
      // TODO: Fill in default values matching ${schemaName} fields
    },
  });

  async function handleSubmit(data: ${typeName}) {
    setSubmitting(true);
    setError(null);

    const result = await onSubmit(data);

    setSubmitting(false);

    if (result.ok) {
      showReceipt(result.value);
      idempotencyKeyRef.current = crypto.randomUUID();
    } else {
      setError(result.error.message);
    }
  }

  if (isOpen && receipt) {
    return (
      <ReceiptPanel
        receipt={receipt}
        title="${entityTitle} Created"
        onClose={clearReceipt}
        viewHref={\`/${module_}/${entityKebab}/\${receipt.resultRef}\`}
        backHref="/${module_}/${entityKebab}"
      />
    );
  }

  return (
    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
      {/* TODO: Replace with actual form fields from ${schemaName} */}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="field1">
            Field 1 <span className="text-destructive">*</span>
          </Label>
          <Input
            id="field1"
            placeholder="Enter value"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="field2">Field 2</Label>
          <Input
            id="field2"
            placeholder="Optional value"
          />
        </div>
      </div>

      {error && (
        <div
          className="rounded-md border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive"
          role="alert"
        >
          {error}
        </div>
      )}

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" asChild>
          <Link href="/${module_}/${entityKebab}">Cancel</Link>
        </Button>
        <Button type="submit" disabled={submitting}>
          {submitting ? 'Creating…' : 'Create ${entityTitle}'}
        </Button>
      </div>
    </form>
  );
}
`
);

console.log(`  ✓ forms/${entitySingularKebab}-form.tsx`);
console.log(`
[DONE] Form ${entitySingularKebab}-form.tsx scaffolded.

  features/${module_}/${entityKebab}/forms/${entitySingularKebab}-form.tsx

Next steps:
  1. Fill in defaultValues matching ${schemaName} fields
  2. Replace placeholder form fields with real Input/Select controls
  3. Register fields with form.register('fieldName')
  4. Add validation error display per field
  5. Wire into the new page:  import { ${entityPascal}Form } from '...'
  6. Run:  pnpm --filter @afenda/web typecheck
`);
