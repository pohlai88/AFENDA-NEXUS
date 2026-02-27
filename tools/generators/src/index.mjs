#!/usr/bin/env node
/**
 * @generated — do not edit manually
 * @afenda/generators — Spec-driven, gate-aware workflow engine.
 *
 * Usage:
 *   pnpm afenda-gen feature --module finance --slice ar --entity ArCustomer ...
 *   pnpm afenda-gen entity  --spec ./feature.spec.json
 *   pnpm afenda-gen todo list --slice ar
 *   pnpm afenda-gen todo scan --fail-on critical
 *
 * See feature.spec.schema.json for the full spec format.
 */
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { parseArgs } from './spec.mjs';
import { resolveRoot } from './utils.mjs';

const COMMANDS = {
    feature: () => import('./orchestrators/gen-feature.mjs'),
    entity: () => import('./generators/gen-entity.mjs'),
    port: () => import('./generators/gen-port.mjs'),
    repo: () => import('./generators/gen-repo.mjs'),
    service: () => import('./generators/gen-service.mjs'),
    route: () => import('./generators/gen-route.mjs'),
    contracts: () => import('./generators/gen-contracts.mjs'),
    migration: () => import('./generators/gen-migration.mjs'),
    'outbox-event': () => import('./generators/gen-outbox-event.mjs'),
    module: () => import('./generators/gen-module.mjs'),
    screen: () => import('./generators/gen-screen.mjs'),
    form: () => import('./generators/gen-form.mjs'),
    'table-ui': () => import('./generators/gen-table-ui.mjs'),
    todo: null, // handled inline below
};

// ─── Main ────────────────────────────────────────────────────────────────────

async function main() {
    const argv = process.argv.slice(2);

    if (argv.length === 0 || argv.includes('--help') || argv.includes('-h')) {
        printHelp();
        process.exit(0);
    }

    const command = argv[0];

    // ── todo subcommand ──
    if (command === 'todo') {
        await handleTodo(argv.slice(1));
        return;
    }

    // ── generator commands ──
    const loader = COMMANDS[command];
    if (!loader) {
        console.error(`Unknown command: "${command}"\n`);
        printHelp();
        process.exit(1);
    }

    const args = parseArgs(argv.slice(1));
    const mod = await loader();

    if (typeof mod.run !== 'function') {
        console.error(`Generator "${command}" does not export a run() function.`);
        process.exit(1);
    }

    await mod.run(args);
}

// ─── Todo Subcommand ─────────────────────────────────────────────────────────

async function handleTodo(argv) {
    const subcommand = argv[0];
    const args = parseArgs(argv.slice(1));

    if (subcommand === 'list') {
        await todoList(args);
    } else if (subcommand === 'scan') {
        await todoScan(args);
    } else if (subcommand === 'open') {
        await todoOpen(argv.slice(1));
    } else {
        console.error(`Unknown todo subcommand: "${subcommand}"`);
        console.error('Available: list, scan, open');
        process.exit(1);
    }
}

async function todoList(args) {
    const root = resolveRoot();
    const sliceFilter = args.slice;
    const checklists = findChecklists(root, sliceFilter);

    if (checklists.length === 0) {
        console.log('No CHECKLIST.json files found.');
        return;
    }

    for (const checklistPath of checklists) {
        const data = JSON.parse(readFileSync(checklistPath, 'utf-8'));
        console.log(`\n📋 ${data.featureKey} (${data.todos.length} TODOs)`);

        const bySeverity = {};
        for (const t of data.todos) {
            bySeverity[t.severity] = (bySeverity[t.severity] || 0) + 1;
        }
        const summary = Object.entries(bySeverity)
            .map(([sev, count]) => `${count} ${sev}`)
            .join(', ');
        console.log(`   ${summary}`);

        for (const t of data.todos) {
            console.log(`   [${t.severity}|${t.id}] ${t.text}`);
        }
    }
}

async function todoScan(args) {
    const root = resolveRoot();
    const failOn = args['fail-on'] || 'critical';
    const sliceFilter = args.slice;
    const checklists = findChecklists(root, sliceFilter);

    let failCount = 0;
    const failSeverity = failOn.toUpperCase();

    for (const checklistPath of checklists) {
        const data = JSON.parse(readFileSync(checklistPath, 'utf-8'));
        const failing = data.todos.filter((t) => t.severity === failSeverity);

        if (failing.length > 0) {
            console.log(`\n❌ ${data.featureKey}: ${failing.length} ${failSeverity} TODOs remaining`);
            for (const t of failing) {
                console.log(`   ${t.id}: ${t.text}`);
            }
            failCount += failing.length;
        }
    }

    if (failCount > 0) {
        console.log(`\n❌ ${failCount} ${failSeverity} TODOs unresolved. Failing.`);
        process.exit(1);
    } else {
        console.log(`\n✅ No ${failSeverity} TODOs remaining.`);
    }
}

async function todoOpen(positional) {
    const featureKey = positional[0];
    if (!featureKey) {
        console.error('Usage: pnpm afenda-gen todo open <featureKey>');
        console.error('Example: pnpm afenda-gen todo open finance/ar/ar-invoice');
        process.exit(1);
    }

    const root = resolveRoot();
    const checklists = findChecklists(root);
    const match = checklists.find((p) => {
        const data = JSON.parse(readFileSync(p, 'utf-8'));
        return data.featureKey === featureKey;
    });

    if (match) {
        const mdPath = match.replace('.json', '.md');
        console.log(`📋 ${mdPath}`);
        if (existsSync(mdPath)) {
            console.log(readFileSync(mdPath, 'utf-8'));
        }
    } else {
        console.error(`No checklist found for feature key: ${featureKey}`);
        process.exit(1);
    }
}

function findChecklists(root, sliceFilter) {
    const results = [];
    const modulesDir = join(root, 'packages', 'modules');

    if (!existsSync(modulesDir)) return results;

    // Walk packages/modules/*/src/slices/*/CHECKLIST-*.json
    for (const mod of safeReadDir(modulesDir)) {
        const slicesDir = join(modulesDir, mod, 'src', 'slices');
        if (!existsSync(slicesDir)) continue;

        for (const slice of safeReadDir(slicesDir)) {
            if (sliceFilter && slice !== sliceFilter) continue;
            const sliceDir = join(slicesDir, slice);
            for (const file of safeReadDir(sliceDir)) {
                if (file.startsWith('CHECKLIST-') && file.endsWith('.json')) {
                    results.push(join(sliceDir, file));
                }
            }
        }
    }

    return results;
}

function safeReadDir(dir) {
    try {
        return readdirSync(dir);
    } catch {
        return [];
    }
}

// ─── Help ────────────────────────────────────────────────────────────────────

function printHelp() {
    console.log(`
@afenda/generators — Spec-driven, gate-aware workflow engine

USAGE
  pnpm afenda-gen <command> [options]

COMMANDS
  feature          Full-stack feature scaffold (the main workflow entry point)
  entity           Generate entity interface
  port             Generate port interface (IRepo)
  repo             Generate Drizzle repo implementation
  service          Generate service shell(s)
  route            Generate route file (CRUD + commands)
  contracts        Generate Zod schemas in @afenda/contracts
  migration        Generate SQL migration + Drizzle schema
  outbox-event     Patch event registry + generate payload type
  module           Scaffold a new domain module
  screen           Generate frontend pages + boundaries
  form             Generate RHF + Zod form component
  table-ui         Generate data table block
  todo list        List all open TODOs across slices
  todo scan        CI gate: fail if critical TODOs remain
  todo open        Display a feature's checklist

FEATURE OPTIONS
  --module <name>       Module name (e.g. finance)
  --slice <name>        Slice name (e.g. ar)
  --entity <Name>       PascalCase entity name (e.g. ArCustomer)
  --statuses <list>     Comma-separated SCREAMING_SNAKE statuses
  --money-fields <list> Comma-separated camelCase money field names
  --commands <list>     Comma-separated verb:serviceName pairs
  --frontend            Include frontend scaffold
  --feature-dir <name>  Frontend feature directory (default: slice name)
  --contracts           Include contracts schemas (default: true)
  --migration           Include SQL migration (default: true)
  --spec <path>         Path to existing feature.spec.json
  --skip-frontend       Skip frontend generation
  --skip-contracts      Skip contracts generation
  --skip-migration      Skip migration generation
  --force               Overwrite files without @generated header

TODO OPTIONS
  --slice <name>        Filter by slice
  --fail-on <severity>  Severity to fail on (default: critical)

EXAMPLES
  pnpm afenda-gen feature --module finance --slice ar --entity ArCustomer \\
    --statuses "ACTIVE,ON_HOLD,INACTIVE" --money-fields "creditLimit" \\
    --commands "create:createArCustomer,update:updateArCustomer" \\
    --frontend --feature-dir receivables

  pnpm afenda-gen todo scan --fail-on critical
  pnpm afenda-gen todo list --slice ar
`);
}

// ─── Run ─────────────────────────────────────────────────────────────────────

main().catch((err) => {
    console.error(err.message || err);
    process.exit(1);
});
