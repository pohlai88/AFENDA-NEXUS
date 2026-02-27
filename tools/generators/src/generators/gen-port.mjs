/**
 * @generated — do not edit manually
 * Port interface generator (IEntityRepo).
 *
 * Produces a repository port interface matching AP enterprise quality:
 * - Result<T> return types
 * - PaginationParams / PaginatedResult
 * - Typed Create/Update input interfaces with readonly fields
 * - DOMAIN-TODO markers for custom query methods
 */
import { join } from 'node:path';
import { resolveRoot, safeWrite, toKebab, toCamel } from '../utils.mjs';
import { loadSpec, buildSpec } from '../spec.mjs';

/**
 * Generate port interface from spec.
 * @param {object} spec  Validated feature spec
 * @param {object} [options]
 * @returns {{ path: string, action: string }}
 */
export function generate(spec, options = {}) {
  const root = resolveRoot();
  const { entity, module: mod, slice } = spec;
  const kebab = toKebab(entity.name);

  const sliceDir = join(root, 'packages', 'modules', mod, 'src', 'slices', slice);
  const filePath = join(sliceDir, 'ports', `${kebab}-repo.ts`);

  const content = buildPortContent(entity);
  return safeWrite(filePath, content, { force: options.force });
}

function buildPortContent(entity) {
  const lines = [];
  const { name, moneyFields = [], refs = [] } = entity;
  const kebab = toKebab(name);
  const statusType = `${name}Status`;
  const repoName = `I${name}Repo`;
  const createInput = `Create${name}Input`;
  const updateInput = `Update${name}Input`;

  // Imports
  lines.push(`import type { ${name}, ${statusType} } from '../entities/${kebab}.js';`);
  lines.push(`import type { Result, PaginationParams, PaginatedResult } from '@afenda/core';`);
  lines.push('');

  // Create input
  lines.push(`export interface ${createInput} {`);
  lines.push(`  readonly tenantId: string;`);
  for (const ref of refs) {
    lines.push(`  readonly ${ref.field}: string;`);
  }
  for (const field of moneyFields) {
    lines.push(`  readonly ${field}: bigint;`);
  }
  lines.push(`  readonly description?: string | null;`);
  lines.push(`  // DOMAIN-TODO[MEDIUM|A4|BusinessRules]: Add domain-specific create fields`);
  lines.push(`}`);
  lines.push('');

  // Update input (partial)
  lines.push(`export interface ${updateInput} {`);
  lines.push(`  readonly status?: ${statusType};`);
  lines.push(`  readonly description?: string | null;`);
  lines.push(`  // DOMAIN-TODO[MEDIUM|A4|BusinessRules]: Add domain-specific update fields`);
  lines.push(`}`);
  lines.push('');

  // Repo interface
  lines.push(`export interface ${repoName} {`);
  lines.push(`  create(input: ${createInput}): Promise<Result<${name}>>;`);
  lines.push(`  findById(id: string): Promise<Result<${name}>>;`);
  lines.push(`  findAll(tenantId: string, params?: PaginationParams): Promise<PaginatedResult<${name}>>;`);
  lines.push(`  findByStatus(tenantId: string, status: ${statusType}, params?: PaginationParams): Promise<PaginatedResult<${name}>>;`);

  // Ref-based finders
  for (const ref of refs) {
    const methodName = `findBy${ref.entity || toCamel(ref.field).replace(/Id$/, '')}`;
    lines.push(`  ${methodName}(${ref.field}: string, params?: PaginationParams): Promise<PaginatedResult<${name}>>;`);
  }

  lines.push(`  updateStatus(id: string, status: ${statusType}): Promise<Result<${name}>>;`);
  lines.push(`  update(id: string, input: ${updateInput}): Promise<Result<${name}>>;`);
  lines.push(`  // DOMAIN-TODO[MEDIUM|A4|BusinessRules]: Add domain-specific query methods`);
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
