#!/usr/bin/env node
/**
 * neon-auth-trusted-domains.mjs — Add trusted domains to Neon Auth.
 *
 * Neon Auth only redirects to domains in its allowlist (OAuth, email verification).
 * This script registers domains via the Neon Console API.
 *
 * Usage:
 *   node tools/scripts/neon-auth-trusted-domains.mjs https://myapp.com
 *   node tools/scripts/neon-auth-trusted-domains.mjs https://app.example.com https://www.example.com
 *   node tools/scripts/neon-auth-trusted-domains.mjs --branch afenda https://staging.example.com
 *
 * Prerequisites:
 *   - NEON_API_KEY env var (or neonctl auth)
 *   - NEON_PROJECT_ID env var (default: dark-band-87285012)
 *
 * Ref: https://neon.com/docs/auth/guides/configure-domains
 */

import { parseArgs } from 'node:util';

const PROJECT_ID = process.env.NEON_PROJECT_ID || 'dark-band-87285012';
const API_KEY = process.env.NEON_API_KEY;

const { values, positionals } = parseArgs({
  options: {
    branch: { type: 'string', short: 'b' },
    help: { type: 'boolean', short: 'h', default: false },
  },
  allowPositionals: true,
});

if (values.help || positionals.length === 0) {
  console.log(`
Usage: node neon-auth-trusted-domains.mjs [options] <domain> [domain...]

Add trusted domains to Neon Auth for OAuth and email verification redirects.

Options:
  -b, --branch <name>   Branch name (default: production)
  -h, --help           Show this help

Examples:
  node neon-auth-trusted-domains.mjs https://myapp.com
  node neon-auth-trusted-domains.mjs -b afenda https://staging.myapp.com
  node neon-auth-trusted-domains.mjs https://app.example.com https://www.example.com

Domains must include protocol (https://) and no trailing slash.
`);
  process.exit(values.help ? 0 : 1);
}

if (!API_KEY) {
  console.error('Error: NEON_API_KEY is required. Set it or run neonctl auth.');
  process.exit(1);
}

const domains = positionals.filter((d) => d.startsWith('http'));
const branchName = values.branch || 'production';

async function getBranchId() {
  const res = await fetch(`https://console.neon.tech/api/v2/projects/${PROJECT_ID}/branches`, {
    headers: { Authorization: `Bearer ${API_KEY}` },
  });
  if (!res.ok) throw new Error(`Failed to list branches: ${res.status}`);
  const { branches } = await res.json();
  const branch = branches.find((b) => b.name === branchName);
  if (!branch) throw new Error(`Branch "${branchName}" not found`);
  return branch.id;
}

async function addTrustedDomain(branchId, domain) {
  const res = await fetch(
    `https://console.neon.tech/api/v2/projects/${PROJECT_ID}/branches/${branchId}/neon_auth/trusted_domains`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ domain }),
    }
  );
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Failed to add domain ${domain}: ${res.status} ${body}`);
  }
}

async function main() {
  console.log(`Adding trusted domains for branch "${branchName}"...`);
  const branchId = await getBranchId();

  for (const domain of domains) {
    try {
      await addTrustedDomain(branchId, domain);
      console.log(`  ✓ ${domain}`);
    } catch (e) {
      console.error(`  ✗ ${domain}: ${e.message}`);
    }
  }
}

main().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
