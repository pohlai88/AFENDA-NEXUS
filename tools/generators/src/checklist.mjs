/**
 * @generated — do not edit manually
 * Checklist generator for @afenda/generators.
 *
 * Emits both CHECKLIST.md (human) and CHECKLIST.json (machine) from a feature spec.
 * Categories A–J, with severity levels and command-aware placeholders.
 */
import { join } from 'node:path';
import { toKebab, toTitleCase, safeWrite } from './utils.mjs';

// ─── TODO Item Builder ───────────────────────────────────────────────────────

let _todoCounter = 0;

/**
 * @param {string} category  Category code (e.g. 'A', 'B')
 * @param {string} severity  'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'
 * @param {string} text      Human-readable description
 * @param {string[]} files   Relative file paths this TODO applies to
 * @returns {object} checklist todo item
 */
function todo(category, severity, text, files = []) {
  _todoCounter++;
  return {
    id: `${category}${_todoCounter}`,
    category: CATEGORY_NAMES[category] || category,
    severity,
    text,
    files,
  };
}

const CATEGORY_NAMES = {
  A: 'BusinessRules',
  B: 'Authorization',
  C: 'Idempotency',
  D: 'ApprovalWorkflows',
  E: 'ServiceDomainLogic',
  F: 'TestScenarios',
  G: 'EnterpriseSpec',
  H: 'DataIntegrity',
  I: 'ReportingHooks',
  J: 'Observability',
};

const CATEGORY_TITLES = {
  A: 'Business Rules',
  B: 'Authorization',
  C: 'Idempotency',
  D: 'Approval Workflows',
  E: 'Service Domain Logic',
  F: 'Test Scenarios',
  G: 'Enterprise Spec',
  H: 'Data Integrity & Concurrency',
  I: 'Reporting & Reconciliation Hooks',
  J: 'Observability',
};

// ─── Checklist Generation ────────────────────────────────────────────────────

/**
 * Generate checklist TODOs from a feature spec.
 *
 * @param {object} spec  Validated feature spec
 * @returns {{ todos: object[], md: string, json: object }}
 */
export function generateChecklist(spec) {
  _todoCounter = 0;
  const todos = [];
  const { entity, commands = [], slice } = spec;
  const kebab = toKebab(entity.name);
  const title = toTitleCase(entity.name);

  // ── A. Business Rules ──
  todos.push(todo('A', 'CRITICAL', `Define state machine transitions for ${entity.name} (${entity.statuses.join(' → ')})`, [`entities/${kebab}.ts`]));
  todos.push(todo('A', 'HIGH', `Implement domain calculators for ${title}`, []));
  todos.push(todo('A', 'HIGH', `Wire calculators into service lifecycle`, []));
  todos.push(todo('A', 'MEDIUM', `Define cross-field / cross-entity validation rules`, [`entities/${kebab}.ts`]));

  // ── B. Authorization ──
  todos.push(todo('B', 'CRITICAL', `Choose permission strings for each route (defaulted to 'journal:create' — verify)`, [`routes/${kebab}-routes.ts`]));
  todos.push(todo('B', 'HIGH', `Decide which routes need requireSoD guards`, [`routes/${kebab}-routes.ts`]));
  todos.push(todo('B', 'HIGH', `Define SoD conflict pairs and add to shared/authorization/sod-rules.ts`, []));

  // ── C. Idempotency (one per idempotent command) ──
  const idempotentCommands = commands.filter((c) => c.idempotent);
  if (idempotentCommands.length > 0) {
    for (const cmd of idempotentCommands) {
      todos.push(todo('C', 'CRITICAL', `Choose idempotency key strategy for ${cmd.service} (correlationId? natural key? prefix?)`, [`services/${toKebab(cmd.service)}.ts`]));
    }
    todos.push(todo('C', 'HIGH', `Define conflict behavior (same key, different payload)`, []));
  } else if (commands.length > 0) {
    todos.push(todo('C', 'HIGH', `Evaluate which commands need idempotency guards`, []));
  }

  // ── D. Approval Workflows ──
  todos.push(todo('D', 'MEDIUM', `Decide which operations need approval gates`, []));
  if (commands.length > 0) {
    todos.push(todo('D', 'MEDIUM', `Wire approvalWorkflow.isApproved / .submit for gated commands`, commands.map((c) => `services/${toKebab(c.service)}.ts`)));
  }

  // ── E. Service Domain Logic (one per command) ──
  for (const cmd of commands) {
    todos.push(todo('E', 'CRITICAL', `Implement core business logic for ${cmd.service}`, [`services/${toKebab(cmd.service)}.ts`]));
  }
  if (commands.some((c) => c.name === 'post')) {
    todos.push(todo('E', 'HIGH', `Wire fiscal period check (prevent posting into closed/locked periods)`, []));
    todos.push(todo('E', 'HIGH', `Wire document number generation`, []));
  }
  todos.push(todo('E', 'HIGH', `Add event type(s) to FinanceEventType registry`, []));

  // ── F. Test Scenarios ──
  todos.push(todo('F', 'HIGH', `Fill in happy path test cases`, [`__tests__/${kebab}.test.ts`]));
  todos.push(todo('F', 'HIGH', `Add edge cases: invalid status transition, duplicate key, closed period`, [`__tests__/${kebab}.test.ts`]));
  if (idempotentCommands.length > 0) {
    todos.push(todo('F', 'MEDIUM', `Add idempotency collision test cases`, [`__tests__/${kebab}.test.ts`]));
  }

  // ── G. Enterprise Spec ──
  todos.push(todo('G', 'MEDIUM', `Create ${slice}.enterprise.md benchmarking against industry standard`, []));
  todos.push(todo('G', 'LOW', `Score capabilities V0–V4 and track gaps`, []));

  // ── H. Data Integrity & Concurrency ──
  todos.push(todo('H', 'HIGH', `Define uniqueness rules (natural keys per tenant)`, [`entities/${kebab}.ts`]));
  todos.push(todo('H', 'HIGH', `Choose concurrency strategy (optimistic locking / status check on update)`, []));
  todos.push(todo('H', 'MEDIUM', `Add DB constraints for invariants where possible`, []));

  // ── I. Reporting & Reconciliation Hooks ──
  todos.push(todo('I', 'MEDIUM', `Decide what reporting views need updating`, []));
  todos.push(todo('I', 'MEDIUM', `Decide what balances / projections update on events`, []));
  todos.push(todo('I', 'LOW', `Add outbox event consumers if required`, []));

  // ── J. Observability ──
  todos.push(todo('J', 'MEDIUM', `Add audit events for critical actions`, commands.map((c) => `services/${toKebab(c.service)}.ts`)));
  todos.push(todo('J', 'MEDIUM', `Add structured logs with requestId / correlationId`, commands.map((c) => `services/${toKebab(c.service)}.ts`)));
  todos.push(todo('J', 'LOW', `Add metrics counters (created/posted/failed)`, []));

  // Build outputs
  const specHash = simpleHash(JSON.stringify(spec));
  const json = buildChecklistJson(spec, todos, specHash);
  const md = buildChecklistMd(spec, todos, specHash);

  return { todos, md, json };
}

// ─── CHECKLIST.json ──────────────────────────────────────────────────────────

function buildChecklistJson(spec, todos, specHash) {
  return {
    _generated: true,
    featureKey: `${spec.module}/${spec.slice}/${toKebab(spec.entity.name)}`,
    generatedAt: new Date().toISOString(),
    specHash,
    todos: todos.map((t) => ({
      id: t.id,
      category: t.category,
      severity: t.severity,
      text: t.text,
      files: t.files,
    })),
  };
}

// ─── CHECKLIST.md ────────────────────────────────────────────────────────────

function buildChecklistMd(spec, todos, specHash) {
  const title = toTitleCase(spec.entity.name);
  const lines = [];

  lines.push(`# ${title} — Domain Checklist`);
  lines.push(`> Generated ${new Date().toISOString().slice(0, 10)} from feature.spec.json (hash: ${specHash})`);
  lines.push('');

  // Summary counts
  const bySeverity = {};
  for (const t of todos) {
    bySeverity[t.severity] = (bySeverity[t.severity] || 0) + 1;
  }
  const summary = Object.entries(bySeverity)
    .map(([sev, count]) => `${count} ${sev}`)
    .join(', ');
  lines.push(`**${todos.length} TODOs** (${summary})`);
  lines.push('');

  // Group by category letter
  const categoryLetters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];
  for (const letter of categoryLetters) {
    const catName = CATEGORY_NAMES[letter];
    const catTitle = CATEGORY_TITLES[letter];
    const items = todos.filter((t) => t.category === catName);

    lines.push(`## ${letter}. ${catTitle} (${items.length} items)`);
    if (items.length === 0) {
      lines.push('_None for this feature._');
    } else {
      for (const item of items) {
        lines.push(`- [ ] **[${item.severity}|${item.id}]** ${item.text}`);
      }
    }
    lines.push('');
  }

  return lines.join('\n');
}

// ─── Write Checklist Files ───────────────────────────────────────────────────

/**
 * Write CHECKLIST.md and CHECKLIST.json to the target directory.
 *
 * @param {object} spec      Validated feature spec
 * @param {string} targetDir Absolute path to write into (e.g. slice dir)
 * @returns {{ mdPath: string, jsonPath: string, todos: object[] }}
 */
export function writeChecklist(spec, targetDir) {
  const { todos, md, json } = generateChecklist(spec);
  const kebab = toKebab(spec.entity.name);

  const mdPath = join(targetDir, `CHECKLIST-${kebab}.md`);
  const jsonPath = join(targetDir, `CHECKLIST-${kebab}.json`);

  safeWrite(mdPath, md, { force: true });
  safeWrite(jsonPath, JSON.stringify(json, null, 2), { force: true });

  return { mdPath, jsonPath, todos };
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Simple deterministic hash for spec fingerprinting. */
function simpleHash(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const ch = str.charCodeAt(i);
    hash = ((hash << 5) - hash + ch) | 0;
  }
  return Math.abs(hash).toString(36).slice(0, 6);
}
