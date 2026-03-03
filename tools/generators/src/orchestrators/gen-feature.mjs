/**
 * @generated — do not edit manually
 * Feature orchestrator — the main workflow entry point.
 *
 * Chains all sub-generators from a single feature.spec.json:
 *   spec validate → entity → port → repo → service × N → route →
 *   contracts → migration → outbox-event → (optional) screen + form + table-ui →
 *   test shells → checklist → format → summary
 *
 * Usage:
 *   pnpm afenda-gen feature --module finance --slice ar --entity ArCustomer ...
 *   pnpm afenda-gen feature --spec ./feature.spec.json
 */
import { join } from 'node:path';
import { existsSync, mkdirSync } from 'node:fs';
import { buildSpec, loadSpec, validateSpec, writeSpec, parseArgs } from '../spec.mjs';
import { resolveRoot, safeWrite, toKebab, runFormatter, printSummary } from '../utils.mjs';
import { writeChecklist } from '../checklist.mjs';
import { generate as genEntity } from '../generators/gen-entity.mjs';
import { generate as genPort } from '../generators/gen-port.mjs';
import { generate as genRepo } from '../generators/gen-repo.mjs';
import { generate as genService } from '../generators/gen-service.mjs';
import { generate as genRoute } from '../generators/gen-route.mjs';
import { generate as genContracts } from '../generators/gen-contracts.mjs';
import { generate as genMigration } from '../generators/gen-migration.mjs';
import { generate as genOutboxEvent } from '../generators/gen-outbox-event.mjs';

/**
 * Run the full feature orchestrator.
 * @param {object} args  Parsed CLI args
 */
export async function run(args) {
  const root = resolveRoot();
  const force = !!args.force;
  const skipFrontend = !!args['skip-frontend'];
  const skipContracts = !!args['skip-contracts'];
  const skipMigration = !!args['skip-migration'];

  // ── 1. Build or load spec ──
  let spec;
  if (args.spec) {
    spec = loadSpec(args.spec);
    console.log(`📋 Loaded spec from ${args.spec}`);
  } else {
    spec = buildSpec(args);
    const errors = validateSpec(spec);
    if (errors.length > 0) {
      console.error('❌ Invalid spec:');
      for (const e of errors) console.error(`   - ${e}`);
      process.exit(1);
    }
    console.log(`📋 Built spec for ${spec.entity.name}`);
  }

  // Apply skip flags
  if (skipFrontend) delete spec.frontend;
  if (skipContracts) spec.contracts = false;
  if (skipMigration) spec.migration = false;

  // ── 2. Ensure target directories exist ──
  const sliceDir = join(root, 'packages', 'modules', spec.module, 'src', 'slices', spec.slice);
  const dirs = [
    join(sliceDir, 'entities'),
    join(sliceDir, 'ports'),
    join(sliceDir, 'repos'),
    join(sliceDir, 'services'),
    join(sliceDir, 'routes'),
    join(sliceDir, 'events'),
    join(sliceDir, '__tests__'),
  ];
  for (const d of dirs) mkdirSync(d, { recursive: true });

  // ── 3. Write spec to slice dir ──
  const specPath = writeSpec(spec, sliceDir);

  // Track all results
  const created = [];
  const overwritten = [];
  const skipped = [];
  const patched = [];
  const allFiles = [];

  function track(result) {
    if (!result) return;
    if (Array.isArray(result)) {
      for (const r of result) track(r);
      return;
    }
    if (result.action === 'created') created.push(result.path);
    else if (result.action === 'overwritten') overwritten.push(result.path);
    else if (result.action === 'skipped') skipped.push(result.path);
    if (result.path) allFiles.push(result.path);
  }

  // ── 4. Backend generators ──
  console.log('\n🔧 Generating backend...');

  const entityResult = genEntity(spec, { force });
  track(entityResult);
  console.log(`   Entity: ${entityResult.action}`);

  const portResult = genPort(spec, { force });
  track(portResult);
  console.log(`   Port: ${portResult.action}`);

  const repoResult = genRepo(spec, { force });
  track(repoResult);
  console.log(`   Repo: ${repoResult.action}`);

  if (spec.commands && spec.commands.length > 0) {
    const serviceResults = genService(spec, { force });
    track(serviceResults);
    console.log(`   Services: ${serviceResults.length} files`);
  }

  const routeResult = genRoute(spec, { force });
  track(routeResult);
  console.log(`   Routes: ${routeResult.action}`);

  // ── 5. Infrastructure generators ──
  console.log('\n🔧 Generating infrastructure...');

  if (spec.contracts) {
    const contractsResult = genContracts(spec, { force });
    track(contractsResult);
    console.log(`   Contracts: ${contractsResult.action}`);
  }

  if (spec.migration) {
    const migrationResults = genMigration(spec, { force });
    track(migrationResults);
    console.log(`   Migration: ${migrationResults.length} files`);
  }

  // Outbox events
  if (spec.commands && spec.commands.length > 0) {
    const outboxResult = genOutboxEvent(spec, { force });
    track(outboxResult.files);
    for (const p of outboxResult.patches) {
      if (p.patched) patched.push(p.path);
    }
    console.log(
      `   Events: ${outboxResult.files.length} files, ${outboxResult.patches.filter((p) => p.patched).length} patches`
    );
  }

  // ── 6. Test shell ──
  console.log('\n🔧 Generating test shell...');
  const testResult = generateTestShell(spec, sliceDir, { force });
  track(testResult);
  console.log(`   Test: ${testResult.action}`);

  // ── 7. Frontend (optional) ──
  if (spec.frontend) {
    const specFlag = `--spec ${specPath}`;
    console.log('\n🔧 Frontend generation available via legacy generators:');
    console.log(
      `   pnpm gen:screen ${spec.module} ${spec.frontend.featureDir || spec.slice} ${specFlag}`
    );
    console.log(`   pnpm gen:form Create${spec.entity.name}Schema --module ${spec.module}`);
    console.log(
      `   pnpm gen:table-ui ${spec.entity.name}ListItem --module ${spec.module} ${specFlag}`
    );
  }

  // ── 8. Checklist ──
  console.log('\n📋 Generating checklist...');
  const { mdPath, jsonPath, todos } = writeChecklist(spec, sliceDir);
  created.push(mdPath, jsonPath);
  allFiles.push(mdPath);

  // ── 9. Format all generated files ──
  console.log('\n✨ Formatting...');
  const tsFiles = allFiles.filter((f) => f.endsWith('.ts') || f.endsWith('.tsx'));
  runFormatter(tsFiles, root);

  // ── 10. Summary ──
  const todosBySeverity = {};
  for (const t of todos) {
    todosBySeverity[t.severity] = (todosBySeverity[t.severity] || 0) + 1;
  }
  const todoSummary = Object.entries(todosBySeverity)
    .map(([sev, count]) => `${count} ${sev}`)
    .join(', ');

  printSummary({ created, overwritten, skipped, patched });

  console.log(`\n📋 TODOs: ${todos.length} total (${todoSummary})`);
  console.log(`\n📋 Next: Open ${mdPath}`);
  console.log(`🔒 CI:   pnpm afenda-gen todo scan --fail-on critical`);
}

// ─── Test Shell Generator ────────────────────────────────────────────────────

function generateTestShell(spec, sliceDir, options = {}) {
  const { entity, commands = [] } = spec;
  const kebab = toKebab(entity.name);
  const testPath = join(sliceDir, '__tests__', `${kebab}.test.ts`);

  const lines = [];
  lines.push(`import { describe, it, expect, vi } from 'vitest';`);
  lines.push('');

  // Mock deps factory
  lines.push(`function createMockDeps() {`);
  lines.push(`  return {`);
  lines.push(`    ${toKebab(entity.name).replace(/-/g, '')}Repo: {`);
  lines.push(`      create: vi.fn(),`);
  lines.push(`      findById: vi.fn(),`);
  lines.push(`      findAll: vi.fn(),`);
  lines.push(`      findByStatus: vi.fn(),`);
  lines.push(`      updateStatus: vi.fn(),`);
  lines.push(`      update: vi.fn(),`);
  lines.push(`    },`);
  lines.push(`    outboxWriter: { write: vi.fn() },`);
  lines.push(`    idempotencyStore: { claimOrGet: vi.fn(), recordOutcome: vi.fn() },`);
  lines.push(`  };`);
  lines.push(`}`);
  lines.push('');

  lines.push(`function createMockContext() {`);
  lines.push(`  return { tenantId: 'tenant-1', userId: 'user-1' };`);
  lines.push(`}`);
  lines.push('');

  // Test suites per command
  for (const cmd of commands) {
    lines.push(`describe('${cmd.service}', () => {`);
    lines.push(`  // DOMAIN-TODO[HIGH|F1|TestScenarios]: Fill in test cases`);
    lines.push('');
    lines.push(`  it('should succeed for happy path', async () => {`);
    lines.push(`    // DOMAIN-TODO[HIGH|F1|TestScenarios]: Implement happy path test`);
    lines.push(`    const deps = createMockDeps();`);
    lines.push(`    const ctx = createMockContext();`);
    lines.push(`    expect(true).toBe(true); // placeholder`);
    lines.push(`  });`);
    lines.push('');
    lines.push(`  it('should reject invalid state transition', async () => {`);
    lines.push(`    // DOMAIN-TODO[HIGH|F1|TestScenarios]: Implement state validation test`);
    lines.push(`    expect(true).toBe(true); // placeholder`);
    lines.push(`  });`);

    if (cmd.idempotent) {
      lines.push('');
      lines.push(`  it('should return IDEMPOTENCY_CONFLICT on duplicate key', async () => {`);
      lines.push(`    // DOMAIN-TODO[MEDIUM|F2|TestScenarios]: Implement idempotency test`);
      lines.push(`    expect(true).toBe(true); // placeholder`);
      lines.push(`  });`);
    }

    lines.push(`});`);
    lines.push('');
  }

  // CRUD tests
  lines.push(`describe('${entity.name} CRUD', () => {`);
  lines.push(`  // DOMAIN-TODO[HIGH|F1|TestScenarios]: Add CRUD test cases`);
  lines.push('');
  lines.push(`  it('should create entity', async () => {`);
  lines.push(`    expect(true).toBe(true); // placeholder`);
  lines.push(`  });`);
  lines.push('');
  lines.push(`  it('should find entity by id', async () => {`);
  lines.push(`    expect(true).toBe(true); // placeholder`);
  lines.push(`  });`);
  lines.push('');
  lines.push(`  it('should list entities with pagination', async () => {`);
  lines.push(`    expect(true).toBe(true); // placeholder`);
  lines.push(`  });`);
  lines.push(`});`);
  lines.push('');

  return safeWrite(testPath, lines.join('\n'), { force: options.force });
}

function toCamelSimple(str) {
  return str.charAt(0).toLowerCase() + str.slice(1);
}
