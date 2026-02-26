#!/usr/bin/env node
/**
 * neon-branch-env.mjs — Create or switch to a Neon branch and print env vars.
 *
 * Creates a personal dev branch (or preview branch) from production, then
 * outputs the DATABASE_URL + NEON_AUTH_BASE_URL for that branch. Because
 * Neon Auth data lives in the neon_auth schema, it is cloned automatically.
 *
 * Usage:
 *   node tools/scripts/neon-branch-env.mjs                    # dev/<username>
 *   node tools/scripts/neon-branch-env.mjs --name feature/xyz # custom name
 *   node tools/scripts/neon-branch-env.mjs --delete           # delete branch
 *
 * Prerequisites:
 *   - neonctl installed: npm i -g neonctl
 *   - Authenticated: neonctl auth   OR   NEON_API_KEY env var
 */

import { execSync } from 'node:child_process';
import { userInfo } from 'node:os';
import { parseArgs } from 'node:util';

const PROJECT_ID = process.env.NEON_PROJECT_ID || 'dark-band-87285012';
const REGION = 'ap-southeast-1';
const DB_NAME = 'neondb';

const { values } = parseArgs({
  options: {
    name: { type: 'string', short: 'n' },
    delete: { type: 'boolean', short: 'd', default: false },
    parent: { type: 'string', short: 'p', default: 'production' },
  },
});

const branchName = values.name || `dev/${userInfo().username}`;

function run(cmd) {
  return execSync(cmd, { encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'] }).trim();
}

function neonctl(args) {
  return run(`neonctl ${args} --project-id ${PROJECT_ID} --output json`);
}

// ─── Delete Branch ────────────────────────────────────────────────────────────

if (values.delete) {
  console.log(`Deleting branch: ${branchName}`);
  try {
    run(`neonctl branches delete ${branchName} --project-id ${PROJECT_ID}`);
    console.log('✓ Branch deleted (auth data + DB removed).');
  } catch (e) {
    console.error(`✗ Failed to delete branch: ${e.message}`);
    process.exit(1);
  }
  process.exit(0);
}

// ─── Create or Reuse Branch ──────────────────────────────────────────────────

console.log(`Setting up branch: ${branchName}`);

let branchInfo;
try {
  // Check if branch already exists
  const branches = JSON.parse(neonctl('branches list'));
  const existing = branches.find((b) => b.name === branchName);

  if (existing) {
    console.log('→ Branch already exists, reusing.');
    branchInfo = existing;
  } else {
    console.log(`→ Creating branch from "${values.parent}"...`);
    const result = JSON.parse(
      neonctl(`branches create --name "${branchName}" --parent ${values.parent}`)
    );
    branchInfo = result.branch || result;
    console.log('✓ Branch created.');
  }
} catch (e) {
  console.error(`✗ Failed to create/find branch: ${e.message}`);
  process.exit(1);
}

// ─── Get Connection String ────────────────────────────────────────────────────

let connString;
try {
  connString = run(
    `neonctl connection-string --project-id ${PROJECT_ID} --branch "${branchName}" --database-name ${DB_NAME} --role-name neondb_owner --pooled`
  );
} catch (e) {
  console.error(`✗ Could not get connection string: ${e.message}`);
  process.exit(1);
}

// ─── Derive Auth URL ──────────────────────────────────────────────────────────
// Each branch gets its own Neon Auth endpoint. We derive it from the
// branch's compute endpoint hostname.
// Pattern: https://<endpoint-id>.neonauth.<region>.aws.neon.tech/<dbname>/auth

let neonAuthUrl = '';
try {
  const endpoints = JSON.parse(neonctl('endpoints list'));
  const ep = endpoints.find((e) => e.branch_id === branchInfo.id);
  if (ep) {
    const endpointId = ep.host.split('.')[0]; // e.g. ep-fancy-wildflower-a1o82bpk
    neonAuthUrl = `https://${endpointId}.neonauth.${REGION}.aws.neon.tech/${DB_NAME}/auth`;
  }
} catch {
  console.warn('⚠ Could not derive Auth URL (endpoints not accessible).');
}

// ─── Output ───────────────────────────────────────────────────────────────────

console.log('\n# ─── Add to .env (or .env.local) ───────────────────────────────');
console.log(`DATABASE_URL=${connString}`);
if (neonAuthUrl) {
  console.log(`NEON_AUTH_BASE_URL=${neonAuthUrl}`);
}
console.log('');
console.log('# Branch auth is isolated — OAuth config, users & sessions are cloned');
console.log('# from the parent branch. Changes here do NOT affect production.');
console.log(
  `# Delete with: node tools/scripts/neon-branch-env.mjs --name "${branchName}" --delete`
);
