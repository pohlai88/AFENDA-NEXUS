/**
 * @generated — do not edit manually
 * Service shell generator.
 *
 * Produces one service file per command from spec.commands[].
 * Matches AP enterprise quality:
 * - Result<T> return type
 * - FinanceContext + deps parameter
 * - Idempotency guard scaffold (for commands marked idempotent)
 * - Outbox event write scaffold
 * - DOMAIN-TODO markers for all domain decisions
 */
import { join } from 'node:path';
import { resolveRoot, safeWrite, toKebab, toCamel, toScreamingSnake } from '../utils.mjs';
import { loadSpec, buildSpec } from '../spec.mjs';

/**
 * Generate service files from spec.
 * @param {object} spec  Validated feature spec
 * @param {object} [options]
 * @returns {Array<{ path: string, action: string }>}
 */
export function generate(spec, options = {}) {
  const root = resolveRoot();
  const { entity, module: mod, slice, commands = [] } = spec;

  const sliceDir = join(root, 'packages', 'modules', mod, 'src', 'slices', slice);
  const results = [];

  for (const cmd of commands) {
    const kebabService = toKebab(cmd.service);
    const filePath = join(sliceDir, 'services', `${kebabService}.ts`);
    const content = buildServiceContent(entity, cmd, slice);
    results.push(safeWrite(filePath, content, { force: options.force }));
  }

  return results;
}

function buildServiceContent(entity, cmd, slice) {
  const lines = [];
  const { name: entityName } = entity;
  const kebabEntity = toKebab(entityName);
  const depsType = `${entityName.replace(/^[A-Z][a-z]+/, '')}Deps`;
  const sliceDeps = `${slice.charAt(0).toUpperCase() + slice.slice(1)}Deps`;
  const eventPrefix = toScreamingSnake(entityName);
  const eventName = `${eventPrefix}_${toScreamingSnake(cmd.name)}D`;

  // Imports
  lines.push(`import { err, AppError } from '@afenda/core';`);
  lines.push(`import type { Result } from '@afenda/core';`);
  lines.push(`import type { ${entityName} } from '../entities/${kebabEntity}.js';`);
  lines.push(`import type { FinanceContext } from '../../shared/finance-context.js';`);
  lines.push(`import type { IOutboxWriter } from '../../shared/ports/outbox-writer.js';`);
  if (cmd.idempotent) {
    lines.push(`import type { IIdempotencyStore } from '../../shared/ports/idempotency-store.js';`);
  }
  lines.push(`import { FinanceEventType } from '../../shared/events.js';`);
  lines.push('');

  // Deps type (inline for the service)
  lines.push(`interface ${cmd.service}Deps {`);
  lines.push(`  readonly ${toCamel(entityName)}Repo: import('../ports/${kebabEntity}-repo.js').I${entityName}Repo;`);
  lines.push(`  readonly outboxWriter: IOutboxWriter;`);
  if (cmd.idempotent) {
    lines.push(`  readonly idempotencyStore: IIdempotencyStore;`);
  }
  lines.push(`  // DOMAIN-TODO[MEDIUM|D1|ApprovalWorkflows]: Add approvalWorkflow? if this command needs approval`);
  lines.push(`}`);
  lines.push('');

  // Input type (matches AP pattern: context fields live inside input)
  lines.push(`export interface ${cmd.service}Input {`);
  lines.push(`  readonly tenantId: string;`);
  lines.push(`  readonly userId: string;`);
  lines.push(`  readonly ${toCamel(entityName)}Id: string;`);
  if (cmd.idempotent) {
    lines.push(`  readonly correlationId?: string;`);
  }
  lines.push(`  // DOMAIN-TODO[CRITICAL|E1|ServiceDomainLogic]: Define input fields for ${cmd.name}`);
  lines.push(`}`);
  lines.push('');

  // Service function (matches AP pattern: (input, deps) — no separate ctx)
  lines.push(`export async function ${cmd.service}(`);
  lines.push(`  input: ${cmd.service}Input,`);
  lines.push(`  deps: ${cmd.service}Deps,`);
  lines.push(`): Promise<Result<${entityName}>> {`);

  // Idempotency guard
  if (cmd.idempotent) {
    lines.push('');
    lines.push(`  // ── Idempotency guard ──`);
    lines.push(`  // DOMAIN-TODO[CRITICAL|C1|Idempotency]: Choose idempotency key strategy`);
    lines.push(`  const idempotencyKey = input.correlationId ?? input.${toCamel(entityName)}Id;`);
    lines.push(`  // DOMAIN-TODO[CRITICAL|C1|Idempotency]: Choose commandType string`);
    lines.push(`  const commandType = '${toScreamingSnake(cmd.service)}';`);
    lines.push(`  const claim = await deps.idempotencyStore.claimOrGet({`);
    lines.push(`    tenantId: input.tenantId,`);
    lines.push(`    key: idempotencyKey,`);
    lines.push(`    commandType,`);
    lines.push(`  });`);
    lines.push(`  if (!claim.claimed) {`);
    lines.push(`    return err(new AppError('IDEMPOTENCY_CONFLICT', 'Operation already processed'));`);
    lines.push(`  }`);
  }

  // Fetch entity
  lines.push('');
  lines.push(`  // ── Fetch entity ──`);
  lines.push(`  const entityResult = await deps.${toCamel(entityName)}Repo.findById(input.${toCamel(entityName)}Id);`);
  lines.push(`  if (!entityResult.ok) return entityResult;`);
  lines.push(`  const entity = entityResult.value;`);
  lines.push('');

  // State validation
  lines.push(`  // ── State validation ──`);
  lines.push(`  // DOMAIN-TODO[CRITICAL|A1|BusinessRules]: Validate entity is in correct state for ${cmd.name}`);
  lines.push(`  // if (entity.status !== 'EXPECTED_STATUS') {`);
  lines.push(`  //   return err(new AppError('INVALID_STATE', \`Cannot ${cmd.name} entity in \${entity.status} state\`));`);
  lines.push(`  // }`);
  lines.push('');

  // Core logic placeholder
  lines.push(`  // ── Core business logic ──`);
  lines.push(`  // DOMAIN-TODO[CRITICAL|E1|ServiceDomainLogic]: Implement ${cmd.name} business logic`);
  lines.push('');

  // Status update
  lines.push(`  // ── Update status ──`);
  lines.push(`  // DOMAIN-TODO[CRITICAL|E1|ServiceDomainLogic]: Update entity status after ${cmd.name}`);
  lines.push(`  // const updateResult = await deps.${toCamel(entityName)}Repo.updateStatus(input.id, 'NEW_STATUS');`);
  lines.push(`  // if (!updateResult.ok) return updateResult;`);
  lines.push('');

  // Outbox event
  lines.push(`  // ── Outbox event ──`);
  lines.push(`  // DOMAIN-TODO[HIGH|E2|ServiceDomainLogic]: Add event type to FinanceEventType registry`);
  lines.push(`  // await deps.outboxWriter.write({`);
  lines.push(`  //   tenantId: input.tenantId,`);
  lines.push(`  //   eventType: FinanceEventType.${eventName},`);
  lines.push(`  //   correlationId: ${cmd.idempotent ? 'idempotencyKey' : `input.${toCamel(entityName)}Id`},`);
  lines.push(`  //   payload: { ${toCamel(entityName)}Id: entity.id },`);
  lines.push(`  // });`);
  lines.push('');

  // Idempotency outcome
  if (cmd.idempotent) {
    lines.push(`  // ── Record idempotency outcome ──`);
    lines.push(`  // await deps.idempotencyStore.recordOutcome?.(input.tenantId, idempotencyKey, commandType, entity.id);`);
    lines.push('');
  }

  // Observability
  lines.push(`  // DOMAIN-TODO[MEDIUM|J1|Observability]: Add structured log with correlationId`);
  lines.push('');

  lines.push(`  return err(new AppError('NOT_IMPLEMENTED', '${cmd.service} not implemented'));`);
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
  const results = generate(spec, { force: args.force });
  for (const r of results) {
    if (r.action === 'skipped') {
      console.log(`⚠️  Skipped ${r.path} (no @generated header, use --force)`);
    } else {
      console.log(`✅ ${r.action}: ${r.path}`);
    }
  }
}
