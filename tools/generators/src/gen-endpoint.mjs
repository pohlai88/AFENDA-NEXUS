#!/usr/bin/env node
/**
 * gen:endpoint <module> <verb> <path> — Scaffold a REST handler stub.
 *
 * Creates: route handler in the module's infra/routes/, updates route index.
 *
 * Usage: pnpm gen:endpoint finance POST /journals
 */
import { mkdirSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const [module_, verb, routePath] = process.argv.slice(2);
if (!module_ || !verb || !routePath) {
  console.error('Usage: pnpm gen:endpoint <module> <verb> <path>');
  console.error('Example: pnpm gen:endpoint finance POST /journals');
  process.exit(1);
}

const root = process.cwd();
const httpVerb = verb.toUpperCase();
const routeName = routePath.replace(/^\//, '').replace(/[/:]/g, '-').replace(/-+/g, '-');
const handlerName = `${httpVerb.toLowerCase()}-${routeName}`;

const routesDir = join(root, 'packages', 'modules', module_, 'src', 'infra', 'routes');
if (!existsSync(routesDir)) {
  mkdirSync(routesDir, { recursive: true });
}

const handlerFile = join(routesDir, `${handlerName}.ts`);
if (existsSync(handlerFile)) {
  console.error(`Handler already exists: ${handlerFile}`);
  process.exit(1);
}

writeFileSync(
  handlerFile,
  `import type { FastifyInstance } from "fastify";

/**
 * ${httpVerb} ${routePath}
 */
export async function register(app: FastifyInstance): Promise<void> {
  app.${httpVerb.toLowerCase()}("${routePath}", {
    schema: {
      description: "${httpVerb} ${routePath}",
      // TODO: Add request/response schemas from @afenda/contracts
    },
  }, async (request, reply) => {
    // TODO: Implement handler
    // 1. Validate input (Zod schema from @afenda/contracts)
    // 2. Call use-case from app/services/
    // 3. Return response
    return reply.status(${httpVerb === 'POST' ? 201 : 200}).send({ status: "not_implemented" });
  });
}
`
);

console.log(`Created handler: ${handlerFile}`);
console.log(`\nNext steps:`);
console.log(`  1. Add request/response schemas in @afenda/contracts`);
console.log(`  2. Implement handler logic`);
console.log(`  3. Register route in the module's infra/routes/index.ts`);
console.log(`  4. Wire into apps/api/src/index.ts`);

console.log(`\n[DONE] Endpoint ${httpVerb} ${routePath} scaffolded in ${module_}.`);
