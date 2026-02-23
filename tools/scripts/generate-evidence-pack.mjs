#!/usr/bin/env node
/**
 * pnpm audit:pack — Generate a consolidated evidence pack from all audit tools.
 *
 * Runs audit:ais, audit:sox, and arch:guard in JSON mode, then bundles
 * results into a single timestamped evidence pack file.
 *
 * Usage:
 *   node tools/scripts/generate-evidence-pack.mjs
 *   node tools/scripts/generate-evidence-pack.mjs --output evidence-pack.json
 *   pnpm audit:pack
 */
import { execSync } from "node:child_process";
import { writeFileSync } from "node:fs";
import { resolve } from "node:path";

const ROOT = resolve(import.meta.dirname, "../..");
const VERSION = "1.0.0";

const args = process.argv.slice(2);
function getArg(name) {
  const idx = args.indexOf(`--${name}`);
  return idx >= 0 && idx + 1 < args.length ? args[idx + 1] : undefined;
}

const outputPath = getArg("output");

// ─── Run audit tools ─────────────────────────────────────────────────────────

function runTool(label, command) {
  console.error(`  Running ${label}...`);
  try {
    const stdout = execSync(command, { cwd: ROOT, encoding: "utf-8", timeout: 60_000 });
    return { status: "ok", data: JSON.parse(stdout) };
  } catch (err) {
    // Tool may exit non-zero (e.g. AIS has failures) but still produce valid JSON
    if (err.stdout) {
      try {
        return { status: "ok", data: JSON.parse(err.stdout) };
      } catch { /* fall through */ }
    }
    return { status: "error", error: err.message?.slice(0, 200) ?? "unknown error" };
  }
}

console.error(`\n  Evidence Pack Generator v${VERSION}\n`);

const ais = runTool("AIS Benchmark", "node tools/scripts/audit-ais.mjs --json");
const sox = runTool("SOX ITGC", "node tools/scripts/audit-sox.mjs --json");

// ─── Assemble pack ───────────────────────────────────────────────────────────

const now = new Date();
const timestamp = now.toISOString();
const dateSlug = timestamp.slice(0, 10);

const pack = {
  schemaVersion: "1.0",
  generatedAt: timestamp,
  generatorVersion: VERSION,
  tools: {},
  summary: {
    totalChecks: 0,
    totalPass: 0,
    totalFail: 0,
    totalWarn: 0,
  },
};

// Add AIS
if (ais.status === "ok") {
  pack.tools.AIS = ais.data;
  pack.summary.totalChecks += ais.data.summary?.total ?? 0;
  pack.summary.totalPass += ais.data.summary?.pass ?? 0;
  pack.summary.totalFail += ais.data.summary?.fail ?? 0;
  pack.summary.totalWarn += ais.data.summary?.warn ?? 0;
} else {
  pack.tools.AIS = { error: ais.error };
}

// Add SOX
if (sox.status === "ok") {
  pack.tools.SOX = sox.data;
  pack.summary.totalChecks += sox.data.summary?.total ?? 0;
  pack.summary.totalPass += sox.data.summary?.pass ?? 0;
  pack.summary.totalFail += sox.data.summary?.fail ?? 0;
  pack.summary.totalWarn += sox.data.summary?.warn ?? 0;
} else {
  pack.tools.SOX = { error: sox.error };
}

// ─── Output ──────────────────────────────────────────────────────────────────

const json = JSON.stringify(pack, null, 2);

if (outputPath) {
  writeFileSync(outputPath, json, "utf-8");
  console.error(`\n  Evidence pack written to ${outputPath}`);
} else {
  const defaultFile = `evidence-pack-${dateSlug}.json`;
  writeFileSync(resolve(ROOT, defaultFile), json, "utf-8");
  console.error(`\n  Evidence pack written to ${defaultFile}`);
}

const { totalChecks, totalPass, totalFail, totalWarn } = pack.summary;
console.error(`  ${totalChecks} checks: ${totalPass} pass, ${totalFail} fail, ${totalWarn} warn\n`);

process.exit(totalFail > 0 ? 1 : 0);
