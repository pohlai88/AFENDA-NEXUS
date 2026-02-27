/**
 * @generated — do not edit manually
 * Contracts schema generator.
 *
 * Produces Zod schemas in @afenda/contracts matching AP enterprise quality:
 * - Create, Update, ListQuery, IdParam schemas
 * - Command-specific schemas from spec.commands[]
 * - Money fields as z.coerce.bigint() (no float arithmetic — CIG-02)
 * - No currency defaults (FE-GATE-02)
 */
import { join } from 'node:path';
import { resolveRoot, safeWrite, toKebab, toPascal, toCamel } from '../utils.mjs';
import { loadSpec, buildSpec } from '../spec.mjs';

/**
 * Generate contracts Zod schemas from spec.
 * @param {object} spec  Validated feature spec
 * @param {object} [options]
 * @returns {{ path: string, action: string }}
 */
export function generate(spec, options = {}) {
  const root = resolveRoot();
  const { entity, module: mod, slice, commands = [] } = spec;
  const kebab = toKebab(entity.name);

  const contractsDir = join(root, 'packages', 'contracts', 'src');
  const filePath = join(contractsDir, `${slice}-${kebab}.ts`);

  const content = buildContractsContent(entity, commands);
  return safeWrite(filePath, content, { force: options.force });
}

function buildContractsContent(entity, commands) {
  const lines = [];
  const { name, statuses, moneyFields = [], refs = [] } = entity;
  const pascal = toPascal(name);

  lines.push(`import { z } from 'zod';`);
  lines.push('');

  // Status enum schema
  const statusSchemaName = `${pascal}StatusSchema`;
  lines.push(`export const ${statusSchemaName} = z.enum([${statuses.map((s) => `'${s}'`).join(', ')}]);`);
  lines.push(`export type ${pascal}Status = z.infer<typeof ${statusSchemaName}>;`);
  lines.push('');

  // Note: IdParamSchema already exists in @afenda/contracts index.ts

  // Create schema
  lines.push(`export const Create${pascal}Schema = z.object({`);
  for (const ref of refs) {
    lines.push(`  ${ref.field}: z.string().uuid(),`);
  }
  for (const field of moneyFields) {
    lines.push(`  ${field}: z.coerce.bigint(), // minor units — CIG-02: no float arithmetic`);
  }
  lines.push(`  description: z.string().max(500).optional(),`);
  lines.push(`  // DOMAIN-TODO[MEDIUM|A4|BusinessRules]: Add domain-specific create fields`);
  lines.push(`});`);
  lines.push(`export type Create${pascal} = z.infer<typeof Create${pascal}Schema>;`);
  lines.push('');

  // Update schema (partial of create)
  lines.push(`export const Update${pascal}Schema = Create${pascal}Schema.partial();`);
  lines.push(`export type Update${pascal} = z.infer<typeof Update${pascal}Schema>;`);
  lines.push('');

  // ListQuery schema (pagination + filters)
  lines.push(`export const List${pascal}QuerySchema = z.object({`);
  lines.push(`  page: z.coerce.number().int().positive().default(1),`);
  lines.push(`  limit: z.coerce.number().int().min(1).max(100).default(20),`);
  lines.push(`  status: ${statusSchemaName}.optional(),`);
  for (const ref of refs) {
    lines.push(`  ${ref.field}: z.string().uuid().optional(),`);
  }
  lines.push(`});`);
  lines.push(`export type List${pascal}Query = z.infer<typeof List${pascal}QuerySchema>;`);
  lines.push('');

  // Command-specific schemas
  for (const cmd of commands) {
    const schemaName = `${toPascal(cmd.name)}${pascal}Schema`;
    lines.push(`export const ${schemaName} = z.object({`);
    if (cmd.idempotent) {
      lines.push(`  correlationId: z.string().uuid().optional(),`);
    }
    lines.push(`  // DOMAIN-TODO[CRITICAL|E1|ServiceDomainLogic]: Define ${cmd.name} input fields`);
    lines.push(`});`);
    lines.push(`export type ${toPascal(cmd.name)}${pascal} = z.infer<typeof ${schemaName}>;`);
    lines.push('');
  }

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
