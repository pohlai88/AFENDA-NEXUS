#!/usr/bin/env node
/**
 * gate:worker-module — CI gate that checks worker event handler conventions.
 *
 * - Every Tier-1 event in EVENT_REGISTRY has a handler registered in event-handlers.ts
 * - Worker drain loop includes correlationId in log context
 *
 * Usage: node tools/scripts/gate-worker-module.mjs
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = process.cwd();

const eventsFile = join(ROOT, 'packages', 'modules', 'finance', 'src', 'shared', 'events.ts');
const handlersFile = join(ROOT, 'apps', 'worker', 'src', 'event-handlers.ts');
const drainFile = join(ROOT, 'apps', 'worker', 'src', 'tasks', 'drain-outbox.ts');

const violations = [];

// Parse EVENT_REGISTRY for tier-1 events
const eventsContent = readFileSync(eventsFile, 'utf-8');
const tier1Events = [];
const registryMatch = eventsContent.match(/EVENT_REGISTRY[\s\S]*?=\s*\{([\s\S]*?)\};/);
if (registryMatch) {
  const registryBlock = registryMatch[1];
  // Find all FinanceEventType.XXX entries
  const eventMatches = registryBlock.matchAll(/\[FinanceEventType\.(\w+)\]/g);
  for (const m of eventMatches) {
    tier1Events.push(m[1]);
  }
}

// Check event-handlers.ts has a registration for each tier-1 event
const handlersContent = readFileSync(handlersFile, 'utf-8');
for (const evt of tier1Events) {
  if (!handlersContent.includes(evt)) {
    violations.push({ issue: `Tier-1 event ${evt} not registered in event-handlers.ts` });
  }
}

// Check drain-outbox.ts propagates correlationId
const drainContent = readFileSync(drainFile, 'utf-8');
if (!drainContent.includes('correlationId')) {
  violations.push({ issue: 'drain-outbox.ts does not propagate correlationId' });
}
if (!drainContent.includes('runWithContext')) {
  violations.push({ issue: 'drain-outbox.ts does not use runWithContext for ALS propagation' });
}

// Parse tier families from EVENT_REGISTRY for stats
const familyCounts = {};
const familyRe = /\[FinanceEventType\.\w+\]:\s*T1_(\w+)/g;
for (const m of eventsContent.matchAll(familyRe)) {
  const family = m[1].toLowerCase();
  familyCounts[family] = (familyCounts[family] ?? 0) + 1;
}

if (violations.length > 0) {
  console.error('❌ gate:worker-module FAILED\n');
  for (const v of violations) {
    console.error(`  ${v.issue}`);
  }
  console.error(`\nFix: register missing Tier-1 event handlers in apps/worker/src/event-handlers.ts`);
  process.exit(1);
} else {
  const familySummary = Object.entries(familyCounts)
    .map(([f, c]) => `${f}(${c})`)
    .join(', ');
  console.log('✅ gate:worker-module PASSED');
  console.log(`   ${tier1Events.length} Tier-1 events verified in handler registry.`);
  console.log(`   Families: ${familySummary || 'none detected'}`);
  console.log('   Correlation ID propagation confirmed in drain-outbox.');
}
