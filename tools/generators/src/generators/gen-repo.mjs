/**
 * @generated — do not edit manually
 * Drizzle repository implementation generator.
 *
 * Produces a Drizzle repo matching AP enterprise quality:
 * - Implements IEntityRepo port
 * - TenantTx type for tenant-scoped transactions
 * - Domain mapper (DB row → entity)
 * - Deterministic pagination with orderBy: [desc(createdAt), desc(id)]
 * - Result<T> return types
 * - DOMAIN-TODO markers for custom query implementations
 */
import { join } from 'node:path';
import { resolveRoot, safeWrite, toKebab, toCamel, toSnake } from '../utils.mjs';
import { loadSpec, buildSpec } from '../spec.mjs';

/**
 * Generate Drizzle repo from spec.
 * @param {object} spec  Validated feature spec
 * @param {object} [options]
 * @returns {{ path: string, action: string }}
 */
export function generate(spec, options = {}) {
  const root = resolveRoot();
  const { entity, module: mod, slice } = spec;
  const kebab = toKebab(entity.name);

  const sliceDir = join(root, 'packages', 'modules', mod, 'src', 'slices', slice);
  const filePath = join(sliceDir, 'repos', `drizzle-${kebab}-repo.ts`);

  const content = buildRepoContent(entity);
  return safeWrite(filePath, content, { force: options.force });
}

function buildRepoContent(entity) {
  const lines = [];
  const { name, table, moneyFields = [], refs = [] } = entity;
  const kebab = toKebab(name);
  const camel = toCamel(name);
  const statusType = `${name}Status`;
  const repoInterface = `I${name}Repo`;
  const createInput = `Create${name}Input`;
  const updateInput = `Update${name}Input`;
  const className = `Drizzle${name}Repo`;
  const tableVar = `${toCamel(table)}Table`;

  // Imports
  lines.push(`import { eq, desc, and, count, sql } from 'drizzle-orm';`);
  lines.push(`import { ok, err, AppError, NotFoundError, money } from '@afenda/core';`);
  lines.push(`import type { Result, PaginationParams, PaginatedResult } from '@afenda/core';`);
  lines.push(`import type { TenantTx } from '@afenda/db';`);
  lines.push(`import type { ${name}, ${statusType} } from '../entities/${kebab}.js';`);
  lines.push(`import type {`);
  lines.push(`  ${repoInterface},`);
  lines.push(`  ${createInput},`);
  lines.push(`  ${updateInput},`);
  lines.push(`} from '../ports/${kebab}-repo.js';`);
  lines.push(`// DOMAIN-TODO[MEDIUM|A4|BusinessRules]: Import the correct Drizzle table schema`);
  lines.push(`// import { ${tableVar} } from '@afenda/db';`);
  lines.push('');

  // Domain mapper
  lines.push(`function toDomain(row: any): ${name} {`);
  lines.push(`  return {`);
  lines.push(`    id: row.id,`);
  lines.push(`    tenantId: row.tenantId ?? row.tenant_id,`);
  for (const ref of refs) {
    const snakeField = toSnake(ref.field);
    lines.push(`    ${ref.field}: row.${ref.field} ?? row.${snakeField},`);
  }
  for (const field of moneyFields) {
    const snakeField = toSnake(field);
    lines.push(`    ${field}: money(BigInt(row.${field} ?? row.${snakeField} ?? 0), row.currencyCode ?? row.currency_code ?? ''),`);
  }
  lines.push(`    status: row.status as ${statusType},`);
  lines.push(`    description: row.description ?? null,`);
  lines.push(`    // DOMAIN-TODO[MEDIUM|A4|BusinessRules]: Map additional fields`);
  lines.push(`    createdAt: row.createdAt ?? row.created_at,`);
  lines.push(`    updatedAt: row.updatedAt ?? row.updated_at,`);
  lines.push(`  };`);
  lines.push(`}`);
  lines.push('');

  // Repo class
  lines.push(`export class ${className} implements ${repoInterface} {`);
  lines.push(`  constructor(private readonly db: TenantTx) {}`);
  lines.push('');

  // create
  lines.push(`  async create(input: ${createInput}): Promise<Result<${name}>> {`);
  lines.push(`    try {`);
  lines.push(`      // DOMAIN-TODO[CRITICAL|E1|ServiceDomainLogic]: Implement create with proper field mapping`);
  lines.push(`      // const [row] = await this.db`);
  lines.push(`      //   .insert(${tableVar})`);
  lines.push(`      //   .values({ ...input })`);
  lines.push(`      //   .returning();`);
  lines.push(`      // return ok(toDomain(row));`);
  lines.push(`      return err(new AppError('NOT_IMPLEMENTED', 'create not implemented'));`);
  lines.push(`    } catch (e) {`);
  lines.push(`      return err(new AppError('DB_ERROR', String(e)));`);
  lines.push(`    }`);
  lines.push(`  }`);
  lines.push('');

  // findById
  lines.push(`  async findById(id: string): Promise<Result<${name}>> {`);
  lines.push(`    try {`);
  lines.push(`      // DOMAIN-TODO[CRITICAL|E1|ServiceDomainLogic]: Implement findById`);
  lines.push(`      // const [row] = await this.db`);
  lines.push(`      //   .select()`);
  lines.push(`      //   .from(${tableVar})`);
  lines.push(`      //   .where(eq(${tableVar}.id, id))`);
  lines.push(`      //   .limit(1);`);
  lines.push(`      // if (!row) return err(new NotFoundError('${name}', id));`);
  lines.push(`      // return ok(toDomain(row));`);
  lines.push(`      return err(new AppError('NOT_IMPLEMENTED', 'findById not implemented'));`);
  lines.push(`    } catch (e) {`);
  lines.push(`      return err(new AppError('DB_ERROR', String(e)));`);
  lines.push(`    }`);
  lines.push(`  }`);
  lines.push('');

  // findAll (paginated)
  lines.push(`  async findAll(tenantId: string, params: PaginationParams = { page: 1, limit: 20 }): Promise<PaginatedResult<${name}>> {`);
  lines.push(`    const page = params.page ?? 1;`);
  lines.push(`    const limit = params.limit ?? 20;`);
  lines.push(`    const offset = (page - 1) * limit;`);
  lines.push('');
  lines.push(`    // DOMAIN-TODO[CRITICAL|E1|ServiceDomainLogic]: Implement findAll with proper table reference`);
  lines.push(`    // const [{ total: totalCount }] = await this.db`);
  lines.push(`    //   .select({ total: count() })`);
  lines.push(`    //   .from(${tableVar})`);
  lines.push(`    //   .where(eq(${tableVar}.tenantId, tenantId));`);
  lines.push(`    //`);
  lines.push(`    // const rows = await this.db`);
  lines.push(`    //   .select()`);
  lines.push(`    //   .from(${tableVar})`);
  lines.push(`    //   .where(eq(${tableVar}.tenantId, tenantId))`);
  lines.push(`    //   .orderBy(desc(${tableVar}.createdAt), desc(${tableVar}.id))`);
  lines.push(`    //   .limit(limit)`);
  lines.push(`    //   .offset(offset);`);
  lines.push('');
  lines.push(`    return { data: [], total: 0, page, limit };`);
  lines.push(`  }`);
  lines.push('');

  // findByStatus
  lines.push(`  async findByStatus(tenantId: string, status: ${statusType}, params: PaginationParams = {}): Promise<PaginatedResult<${name}>> {`);
  lines.push(`    const page = params.page ?? 1;`);
  lines.push(`    const limit = params.limit ?? 20;`);
  lines.push(`    // DOMAIN-TODO[CRITICAL|E1|ServiceDomainLogic]: Implement findByStatus`);
  lines.push(`    return { data: [], total: 0, page, limit };`);
  lines.push(`  }`);
  lines.push('');

  // Ref-based finders
  for (const ref of refs) {
    const methodName = `findBy${ref.entity || toCamel(ref.field).replace(/Id$/, '')}`;
    lines.push(`  async ${methodName}(${ref.field}: string, params: PaginationParams = {}): Promise<PaginatedResult<${name}>> {`);
    lines.push(`    const page = params.page ?? 1;`);
    lines.push(`    const limit = params.limit ?? 20;`);
    lines.push(`    // DOMAIN-TODO[CRITICAL|E1|ServiceDomainLogic]: Implement ${methodName}`);
    lines.push(`    return { data: [], total: 0, page, limit };`);
    lines.push(`  }`);
    lines.push('');
  }

  // updateStatus
  lines.push(`  async updateStatus(id: string, status: ${statusType}): Promise<Result<${name}>> {`);
  lines.push(`    // DOMAIN-TODO[CRITICAL|E1|ServiceDomainLogic]: Implement updateStatus`);
  lines.push(`    return err(new AppError('NOT_IMPLEMENTED', 'updateStatus not implemented'));`);
  lines.push(`  }`);
  lines.push('');

  // update
  lines.push(`  async update(id: string, input: ${updateInput}): Promise<Result<${name}>> {`);
  lines.push(`    // DOMAIN-TODO[CRITICAL|E1|ServiceDomainLogic]: Implement update`);
  lines.push(`    return err(new AppError('NOT_IMPLEMENTED', 'update not implemented'));`);
  lines.push(`  }`);

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
