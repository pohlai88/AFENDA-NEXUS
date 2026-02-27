/**
 * @generated — do not edit manually
 * Outbox event generator.
 *
 * Patches FinanceEventType registry via anchored region and generates
 * typed payload interface in the slice.
 */
import { join } from 'node:path';
import { resolveRoot, safeWrite, toKebab, toScreamingSnake, toPascal, patchAnchoredRegion } from '../utils.mjs';
import { loadSpec, buildSpec } from '../spec.mjs';

/**
 * Generate outbox event artifacts from spec.
 * @param {object} spec  Validated feature spec
 * @param {object} [options]
 * @returns {{ files: Array<{ path: string, action: string }>, patches: Array<{ path: string, patched: boolean, reason?: string }> }}
 */
export function generate(spec, options = {}) {
  const root = resolveRoot();
  const { entity, module: mod, slice, commands = [] } = spec;
  const files = [];
  const patches = [];

  // Generate event names from commands
  const eventPrefix = toScreamingSnake(entity.name);
  const eventNames = commands.map((cmd) => ({
    name: `${eventPrefix}_${toScreamingSnake(cmd.name)}D`,
    command: cmd,
  }));

  // Also add a generic CREATED event for the CRUD create
  eventNames.unshift({
    name: `${eventPrefix}_CREATED`,
    command: null,
  });

  // 1. Patch FinanceEventType registry
  const eventsFile = join(root, 'packages', 'modules', mod, 'src', 'shared', 'events.ts');
  for (const evt of eventNames) {
    const insertion = `${evt.name}: '${evt.name}',`;
    const result = patchAnchoredRegion(eventsFile, 'events', insertion);
    patches.push({ path: eventsFile, ...result });
  }

  // 2. Generate typed payload interfaces
  const kebab = toKebab(entity.name);
  const sliceDir = join(root, 'packages', 'modules', mod, 'src', 'slices', slice);
  const payloadPath = join(sliceDir, 'events', `${kebab}-events.ts`);

  const content = buildPayloadContent(entity, eventNames);
  files.push(safeWrite(payloadPath, content, { force: options.force }));

  return { files, patches };
}

function buildPayloadContent(entity, eventNames) {
  const lines = [];
  const { name } = entity;

  lines.push(`/**`);
  lines.push(` * Typed event payload interfaces for ${name} domain events.`);
  lines.push(` */`);
  lines.push('');

  for (const evt of eventNames) {
    const payloadName = toPascal(evt.name.toLowerCase().replace(/_/g, '-')) + 'Payload';
    lines.push(`export interface ${payloadName} {`);
    lines.push(`  readonly tenantId: string;`);
    lines.push(`  readonly ${toCamelFromScreaming(entity.name)}Id: string;`);
    if (evt.command) {
      lines.push(`  // DOMAIN-TODO[HIGH|E2|ServiceDomainLogic]: Define payload fields for ${evt.command.name}`);
    }
    lines.push(`}`);
    lines.push('');
  }

  return lines.join('\n');
}

function toCamelFromScreaming(pascalStr) {
  return pascalStr.charAt(0).toLowerCase() + pascalStr.slice(1);
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
  const { files, patches } = generate(spec, { force: args.force });
  for (const f of files) {
    if (f.action === 'skipped') {
      console.log(`⚠️  Skipped ${f.path}`);
    } else {
      console.log(`✅ ${f.action}: ${f.path}`);
    }
  }
  for (const p of patches) {
    if (p.patched) {
      console.log(`🔧 Patched: ${p.path}`);
    } else {
      console.log(`⚠️  Patch skipped: ${p.reason}`);
    }
  }
}
