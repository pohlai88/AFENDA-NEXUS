#!/usr/bin/env node
/**
 * gate:turbo-config — Validate turbo.json configuration.
 *
 * Fails on:
 *   - Invalid JSON syntax
 *   - Missing required fields (tasks)
 *   - Invalid task configuration (missing outputs for file-producing tasks)
 *   - Root tasks that should be package tasks
 *   - Using shorthand `turbo` instead of `turbo run` in scripts
 *
 * Usage: node tools/scripts/gate-turbo-config.mjs
 * Reference: .agents/skills/turborepo/SKILL.md
 */

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const ROOT = join(__dirname, '../..');

const failures = [];

function checkTurboJson() {
  const turboPath = join(ROOT, 'turbo.json');
  let config;
  
  try {
    config = JSON.parse(readFileSync(turboPath, 'utf-8'));
  } catch (err) {
    failures.push({
      gate: 'TURBO-01',
      file: 'turbo.json',
      name: 'Invalid JSON syntax',
      hint: err.message,
    });
    return;
  }

  // Check for required fields
  if (!config.tasks) {
    failures.push({
      gate: 'TURBO-02',
      file: 'turbo.json',
      name: 'Missing tasks configuration',
      hint: 'turbo.json must have a "tasks" field',
    });
    return;
  }

  // Check for common anti-patterns
  const tasks = config.tasks;

  // Check for root tasks (starting with //# or without package name)
  for (const [taskName, taskConfig] of Object.entries(tasks)) {
    if (taskName.startsWith('//#')) {
      failures.push({
        gate: 'TURBO-03',
        file: 'turbo.json',
        name: `Root task detected: ${taskName}`,
        hint: 'Prefer package tasks over root tasks. Only use root tasks when absolutely necessary.',
      });
    }

    // Check for build/test/typecheck tasks without outputs
    if (['build', 'test', 'test:coverage'].includes(taskName)) {
      if (!taskConfig.outputs || taskConfig.outputs.length === 0) {
        // Only warn for build, as test/typecheck might not produce files
        if (taskName === 'build') {
          failures.push({
            gate: 'TURBO-04',
            file: 'turbo.json',
            name: `Task "${taskName}" missing outputs`,
            hint: 'Build tasks should specify outputs for caching. Add "outputs": ["dist/**"] or similar.',
          });
        }
      }
    }

    // Check for missing inputs on lint/typecheck tasks
    if (['lint', 'lint:fix', 'typecheck'].includes(taskName)) {
      if (!taskConfig.inputs || taskConfig.inputs.length === 0) {
        failures.push({
          gate: 'TURBO-05',
          file: 'turbo.json',
          name: `Task "${taskName}" missing inputs`,
          hint: 'Specify inputs to improve cache precision. Add "inputs": ["src/**/*.ts", "src/**/*.tsx"]',
        });
      }
    }
  }
}

function checkPackageJsonScripts() {
  const rootPkgPath = join(ROOT, 'package.json');
  const rootPkg = JSON.parse(readFileSync(rootPkgPath, 'utf-8'));
  
  if (rootPkg.scripts) {
    for (const [name, script] of Object.entries(rootPkg.scripts)) {
      // Check for shorthand turbo usage (should be turbo run)
      if (script.includes('turbo ') && !script.includes('turbo run') && !script.includes('turbo login') && !script.includes('turbo link')) {
        // Check if it's a task execution (not a flag like --help)
        const taskMatch = script.match(/turbo\s+([a-z-:]+)/);
        if (taskMatch && !taskMatch[1].startsWith('--')) {
          failures.push({
            gate: 'TURBO-06',
            file: 'package.json',
            name: `Script "${name}" uses shorthand: ${script}`,
            hint: 'Use "turbo run <task>" instead of "turbo <task>" in package.json scripts',
          });
        }
      }

      // Check for non-turbo task execution that should delegate to turbo
      const taskKeywords = ['build', 'lint', 'test', 'typecheck'];
      if (taskKeywords.some(k => name === k || name.startsWith(k + ':'))) {
        if (!script.includes('turbo') && !script.includes('changeset') && !name.includes('watch')) {
          // This might be intentional for tools like changeset, but flag for review
          if (!script.includes('scripts/') && !script.includes('tools/')) {
            failures.push({
              gate: 'TURBO-07',
              file: 'package.json',
              name: `Script "${name}" bypasses turbo: ${script}`,
              hint: 'Root scripts should delegate to "turbo run <task>" for proper caching and parallelization',
            });
          }
        }
      }
    }
  }
}

// ─── Run Checks ──────────────────────────────────────────────────────────────

checkTurboJson();
checkPackageJsonScripts();

// ─── Report ──────────────────────────────────────────────────────────────────

if (failures.length > 0) {
  console.error('❌ gate:turbo-config FAILED\n');
  const byGate = {};
  for (const f of failures) {
    (byGate[f.gate] ??= []).push(f);
  }
  for (const [gate, items] of Object.entries(byGate)) {
    console.error(`  ${gate} (${items.length}):`);
    for (const v of items) {
      console.error(`    ${v.file}: ${v.name}`);
      console.error(`       ${v.hint}`);
    }
    console.error('');
  }
  console.error(`${failures.length} turbo.json issue(s). See .agents/skills/turborepo/SKILL.md`);
  process.exit(1);
}

console.log('✅ gate:turbo-config PASSED');
console.log('   turbo.json is valid and follows best practices');
