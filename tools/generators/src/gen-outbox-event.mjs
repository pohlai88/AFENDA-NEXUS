#!/usr/bin/env node
/**
 * gen:outbox-event <event> — Scaffold an outbox payload type + worker handler stub.
 *
 * Creates: event type in packages/db/src/outbox/, worker handler in apps/worker/src/handlers/
 *
 * Usage: pnpm gen:outbox-event journal-posted
 */
import { mkdirSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const event = process.argv[2];
if (!event) {
  console.error('Usage: pnpm gen:outbox-event <event-name>');
  console.error('Example: pnpm gen:outbox-event journal-posted');
  process.exit(1);
}

const root = process.cwd();
const camelCase = event.replace(/([-_][a-z])/g, (g) => g[1].toUpperCase());
const PascalCase = camelCase.charAt(0).toUpperCase() + camelCase.slice(1);
const SCREAMING_SNAKE = event.replace(/-/g, '_').toUpperCase();

// Outbox event type in packages/db/src/outbox/
const outboxDir = join(root, 'packages', 'db', 'src', 'outbox');
mkdirSync(outboxDir, { recursive: true });

const eventFile = join(outboxDir, `${event}.ts`);
if (existsSync(eventFile)) {
  console.error(`Event file already exists: ${eventFile}`);
  process.exit(1);
}

writeFileSync(
  eventFile,
  `/**
 * Outbox event: ${SCREAMING_SNAKE}
 *
 * Written to the outbox table in the same transaction as the business change.
 * Drained by the worker process.
 */

export const ${SCREAMING_SNAKE}_EVENT = "${SCREAMING_SNAKE}" as const;

export interface ${PascalCase}Payload {
  readonly tenantId: string;
  // TODO: Add event-specific fields
}

export interface ${PascalCase}OutboxRow {
  readonly id: string;
  readonly eventType: typeof ${SCREAMING_SNAKE}_EVENT;
  readonly payload: ${PascalCase}Payload;
  readonly createdAt: Date;
  readonly processedAt: Date | null;
}
`
);

console.log(`Created event type: ${eventFile}`);

// Worker handler stub
const handlersDir = join(root, 'apps', 'worker', 'src', 'handlers');
mkdirSync(handlersDir, { recursive: true });

const handlerFile = join(handlersDir, `${event}.ts`);
if (existsSync(handlerFile)) {
  console.error(`Handler already exists: ${handlerFile}`);
  process.exit(1);
}

writeFileSync(
  handlerFile,
  `import type { Logger } from "@afenda/platform";

/**
 * Worker handler for ${SCREAMING_SNAKE} events.
 *
 * Invoked by the outbox drain loop when an event of this type is found.
 */
export async function handle${PascalCase}(
  payload: unknown,
  deps: { logger: Logger },
): Promise<void> {
  deps.logger.info("Processing ${SCREAMING_SNAKE}", { payload });

  // TODO: Implement side effects:
  // - Send email/notification
  // - Generate PDF
  // - Call external API
  // - Enqueue follow-up job

  deps.logger.info("Completed ${SCREAMING_SNAKE}");
}
`
);

console.log(`Created worker handler: ${handlerFile}`);
console.log(`\nNext steps:`);
console.log(`  1. Add event-specific fields to ${PascalCase}Payload`);
console.log(`  2. Write outbox row in the service that triggers this event`);
console.log(`  3. Register handler in apps/worker/src/index.ts`);
console.log(`  4. Implement side effects in the handler`);

console.log(`\n[DONE] Outbox event ${SCREAMING_SNAKE} scaffolded.`);
