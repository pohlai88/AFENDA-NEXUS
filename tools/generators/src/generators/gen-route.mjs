/**
 * @generated — do not edit manually
 * Route file generator.
 *
 * Produces a Fastify route registration function matching AP enterprise quality:
 * - registerXxxRoutes(app, runtime, policy) signature
 * - extractIdentity from @afenda/api-kit
 * - requirePermission / requireSoD guards
 * - Zod schema parsing from @afenda/contracts
 * - runtime.withTenant() for dependency injection
 * - mapErrorToStatus for consistent error responses
 * - CRUD endpoints (create, list, detail) + command stubs from spec.commands[]
 * - DOMAIN-TODO markers for authorization and SoD decisions
 */
import { join } from 'node:path';
import { resolveRoot, safeWrite, toKebab, toCamel, toPascal } from '../utils.mjs';
import { loadSpec, buildSpec } from '../spec.mjs';

/**
 * Generate route file from spec.
 * @param {object} spec  Validated feature spec
 * @param {object} [options]
 * @returns {{ path: string, action: string }}
 */
export function generate(spec, options = {}) {
  const root = resolveRoot();
  const { entity, module: mod, slice } = spec;
  const kebab = toKebab(entity.name);

  const sliceDir = join(root, 'packages', 'modules', mod, 'src', 'slices', slice);
  const filePath = join(sliceDir, 'routes', `${kebab}-routes.ts`);

  const content = buildRouteContent(spec);
  return safeWrite(filePath, content, { force: options.force });
}

function buildRouteContent(spec) {
  const lines = [];
  const { entity, slice, commands = [] } = spec;
  const { name: entityName } = entity;
  const kebab = toKebab(entityName);
  const camel = toCamel(entityName);
  const pascal = toPascal(entityName);
  const routePrefix = `/${slice}/${kebab}s`;
  const registerFn = `register${pascal}Routes`;

  // Contracts schema names
  const createSchema = `Create${pascal}Schema`;
  const listQuerySchema = `List${pascal}QuerySchema`;
  const idParamSchema = `IdParamSchema`;

  // Imports
  lines.push(`import type { FastifyInstance } from 'fastify';`);
  lines.push(`import { extractIdentity } from '@afenda/api-kit';`);
  lines.push(`import { requirePermission } from '../../shared/routes/authorization-guard.js';`);
  lines.push(`import type { IAuthorizationPolicy } from '../../shared/ports/authorization.js';`);
  lines.push(`import { mapErrorToStatus } from '../../shared/routes/error-mapper.js';`);
  lines.push(`import type { FinanceRuntime } from '../../app/ports/finance-runtime.js';`);
  lines.push(`// DOMAIN-TODO[CRITICAL|B1|Authorization]: Import requireSoD if needed`);
  lines.push(`// import { requireSoD } from '../../shared/routes/authorization-guard.js';`);
  lines.push(`import {`);
  lines.push(`  ${createSchema},`);
  lines.push(`  ${listQuerySchema},`);
  lines.push(`  ${idParamSchema},`);

  // Command-specific schemas
  for (const cmd of commands) {
    const schemaName = `${toPascal(cmd.name)}${pascal}Schema`;
    lines.push(`  ${schemaName},`);
  }

  lines.push(`} from '@afenda/contracts';`);

  // Service imports for commands
  for (const cmd of commands) {
    const kebabService = toKebab(cmd.service);
    lines.push(`import { ${cmd.service} } from '../services/${kebabService}.js';`);
  }
  lines.push('');

  // Route registration function
  lines.push(`export function ${registerFn}(`);
  lines.push(`  app: FastifyInstance,`);
  lines.push(`  runtime: FinanceRuntime,`);
  lines.push(`  policy: IAuthorizationPolicy,`);
  lines.push(`): void {`);

  // ── CREATE ──
  lines.push('');
  lines.push(`  // ── CREATE ──`);
  lines.push(`  app.post(`);
  lines.push(`    '${routePrefix}',`);
  lines.push(`    // DOMAIN-TODO[CRITICAL|B1|Authorization]: Verify permission string`);
  lines.push(`    { preHandler: [requirePermission(policy, 'journal:create')] },`);
  lines.push(`    async (req, reply) => {`);
  lines.push(`      const { tenantId, userId } = extractIdentity(req);`);
  lines.push(`      const body = ${createSchema}.parse(req.body);`);
  lines.push('');
  lines.push(`      const result = await runtime.withTenant({ tenantId, userId }, async (deps) => {`);
  lines.push(`        return deps.${camel}Repo.create({ tenantId, ...body });`);
  lines.push(`      });`);
  lines.push('');
  lines.push(`      return result.ok`);
  lines.push(`        ? reply.status(201).send(result.value)`);
  lines.push(`        : reply.status(mapErrorToStatus(result.error)).send({ error: result.error });`);
  lines.push(`    },`);
  lines.push(`  );`);

  // ── LIST (paginated) ──
  lines.push('');
  lines.push(`  // ── LIST (paginated) ──`);
  lines.push(`  app.get(`);
  lines.push(`    '${routePrefix}',`);
  lines.push(`    { preHandler: [requirePermission(policy, 'report:read')] },`);
  lines.push(`    async (req, reply) => {`);
  lines.push(`      const { tenantId } = extractIdentity(req);`);
  lines.push(`      const query = ${listQuerySchema}.parse(req.query);`);
  lines.push('');
  lines.push(`      const result = await runtime.withTenant({ tenantId }, async (deps) => {`);
  lines.push(`        return deps.${camel}Repo.findAll(tenantId, query);`);
  lines.push(`      });`);
  lines.push('');
  lines.push(`      return reply.send(result);`);
  lines.push(`    },`);
  lines.push(`  );`);

  // ── DETAIL ──
  lines.push('');
  lines.push(`  // ── DETAIL ──`);
  lines.push(`  app.get(`);
  lines.push(`    '${routePrefix}/:id',`);
  lines.push(`    { preHandler: [requirePermission(policy, 'report:read')] },`);
  lines.push(`    async (req, reply) => {`);
  lines.push(`      const { tenantId } = extractIdentity(req);`);
  lines.push(`      const { id } = ${idParamSchema}.parse(req.params);`);
  lines.push('');
  lines.push(`      const result = await runtime.withTenant({ tenantId }, async (deps) => {`);
  lines.push(`        return deps.${camel}Repo.findById(id);`);
  lines.push(`      });`);
  lines.push('');
  lines.push(`      return result.ok`);
  lines.push(`        ? reply.send(result.value)`);
  lines.push(`        : reply.status(mapErrorToStatus(result.error)).send({ error: result.error });`);
  lines.push(`    },`);
  lines.push(`  );`);

  // ── COMMAND STUBS ──
  for (const cmd of commands) {
    const schemaName = `${toPascal(cmd.name)}${pascal}Schema`;
    const [httpMethod, routePath] = parseRoute(cmd.route);
    const method = httpMethod.toLowerCase();

    lines.push('');
    lines.push(`  // ── ${cmd.name.toUpperCase()} ──`);
    lines.push(`  app.${method}(`);
    lines.push(`    '${routePath}',`);
    lines.push(`    {`);
    lines.push(`      preHandler: [`);
    lines.push(`        // DOMAIN-TODO[CRITICAL|B1|Authorization]: Verify permission string for ${cmd.name}`);
    lines.push(`        requirePermission(policy, 'journal:create'),`);
    lines.push(`        // DOMAIN-TODO[HIGH|B2|Authorization]: Add requireSoD if this is a sensitive operation`);
    lines.push(`        // requireSoD(policy, 'journal:${cmd.name}'),`);
    lines.push(`      ],`);
    lines.push(`    },`);
    lines.push(`    async (req, reply) => {`);
    lines.push(`      const { tenantId, userId } = extractIdentity(req);`);
    lines.push(`      const { id } = ${idParamSchema}.parse(req.params);`);

    // Parse body if not a GET
    if (method !== 'get') {
      lines.push(`      const body = ${schemaName}.parse(req.body);`);
    }

    lines.push('');
    lines.push(`      const result = await runtime.withTenant({ tenantId, userId }, async (deps) => {`);
    lines.push(`        return ${cmd.service}({ tenantId, userId, ${camel}Id: id${method !== 'get' ? ', ...body' : ''} }, deps);`);
    lines.push(`      });`);
    lines.push('');
    lines.push(`      return result.ok`);
    lines.push(`        ? reply.send(result.value)`);
    lines.push(`        : reply.status(mapErrorToStatus(result.error)).send({ error: result.error });`);
    lines.push(`    },`);
    lines.push(`  );`);
  }

  lines.push(`}`);
  lines.push('');

  return lines.join('\n');
}

/**
 * Parse a route string like "POST /ar/invoices/:id/post" into [method, path].
 */
function parseRoute(route) {
  const parts = route.trim().split(/\s+/);
  if (parts.length === 2) return parts;
  return ['POST', parts[0]]; // fallback
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
