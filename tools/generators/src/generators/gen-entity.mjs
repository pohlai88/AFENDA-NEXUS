/**
 * @generated — do not edit manually
 * Entity interface generator.
 *
 * Produces a TypeScript entity interface matching the AP enterprise quality:
 * - All fields readonly
 * - Union status type
 * - Money type for monetary fields
 * - Branded IDs for references
 * - DOMAIN-TODO markers for domain-specific decisions
 */
import { join } from 'node:path';
import { resolveRoot, safeWrite, toKebab } from '../utils.mjs';
import { loadSpec, buildSpec, parseArgs } from '../spec.mjs';

/**
 * Generate entity interface from spec.
 * @param {object} spec  Validated feature spec
 * @param {object} [options]
 * @param {boolean} [options.force]
 * @returns {{ path: string, action: string }}
 */
export function generate(spec, options = {}) {
  const root = resolveRoot();
  const { entity, module: mod, slice } = spec;
  const kebab = toKebab(entity.name);

  const sliceDir = join(root, 'packages', 'modules', mod, 'src', 'slices', slice);
  const filePath = join(sliceDir, 'entities', `${kebab}.ts`);

  const content = buildEntityContent(entity);
  return safeWrite(filePath, content, { force: options.force });
}

function buildEntityContent(entity) {
  const lines = [];
  const { name, statuses, moneyFields = [], refs = [], extraFields = [] } = entity;
  const statusTypeName = `${name}Status`;

  // Imports
  const coreImports = [];
  if (moneyFields.length > 0) coreImports.push('Money');
  for (const ref of refs) {
    if (ref.brand) coreImports.push(ref.brand);
  }
  if (coreImports.length > 0) {
    lines.push(`import type { ${coreImports.join(', ')} } from '@afenda/core';`);
    lines.push('');
  }

  // Status union type
  lines.push(`export type ${statusTypeName} =`);
  for (let i = 0; i < statuses.length; i++) {
    const sep = i === statuses.length - 1 ? ';' : '';
    lines.push(`  | '${statuses[i]}'${sep}`);
  }
  lines.push('');

  // DOMAIN-TODO for state machine
  lines.push(`// DOMAIN-TODO[CRITICAL|A1|BusinessRules]: Define allowed status transitions`);
  lines.push(`// e.g. DRAFT → PENDING_APPROVAL → APPROVED → POSTED → PAID`);
  lines.push('');

  // Entity interface
  lines.push(`export interface ${name} {`);
  lines.push(`  readonly id: string;`);
  lines.push(`  readonly tenantId: string;`);

  // Ref fields
  for (const ref of refs) {
    const type = ref.brand || 'string';
    lines.push(`  readonly ${ref.field}: ${type};`);
  }

  // Money fields
  for (const field of moneyFields) {
    lines.push(`  readonly ${field}: Money;`);
  }

  // Status
  lines.push(`  readonly status: ${statusTypeName};`);

  // Standard fields
  lines.push(`  readonly description: string | null;`);

  // Extra fields
  for (const field of extraFields) {
    const nullSuffix = field.nullable ? ' | null' : '';
    lines.push(`  readonly ${field.name}: ${field.type}${nullSuffix};`);
  }

  // DOMAIN-TODO for additional fields
  lines.push(`  // DOMAIN-TODO[MEDIUM|A4|BusinessRules]: Add domain-specific fields`);

  // Timestamps
  lines.push(`  readonly createdAt: Date;`);
  lines.push(`  readonly updatedAt: Date;`);
  lines.push(`}`);
  lines.push('');

  return lines.join('\n');
}

/**
 * CLI entry point.
 */
export async function run(args) {
  let spec;
  if (args.spec) {
    spec = loadSpec(args.spec);
  } else {
    spec = buildSpec(args);
  }
  const result = generate(spec, { force: args.force });
  if (result.action === 'skipped') {
    console.log(`⚠️  Skipped ${result.path} (no @generated header, use --force)`);
  } else {
    console.log(`✅ ${result.action}: ${result.path}`);
  }
}
