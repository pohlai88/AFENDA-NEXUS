/**
 * @generated — do not edit manually
 * Form generator wrapper — delegates to legacy gen-form with spec-driven interface.
 *
 * Adds the run() API expected by the CLI router.
 */
import { loadSpec, buildSpec } from '../spec.mjs';
import { toPascal } from '../utils.mjs';

/**
 * CLI entry point — bridges spec to legacy gen-form argv format.
 */
export async function run(args) {
  let spec;
  if (args.spec) {
    spec = loadSpec(args.spec);
  } else if (args.entity) {
    spec = buildSpec(args);
  } else {
    console.error('Usage: pnpm afenda-gen form --entity <Entity> [--module <mod>] [--spec <path>]');
    process.exit(1);
  }

  const schemaName = `Create${toPascal(spec.entity.name)}Schema`;
  const fe = spec.frontend;

  // Delegate to the legacy generator
  const legacyArgv = [schemaName];
  if (spec.module) legacyArgv.push('--module', spec.module);
  if (fe?.featureDir) legacyArgv.push('--entity', fe.featureDir);

  process.argv = ['node', 'gen-form.mjs', ...legacyArgv];

  await import('../gen-form.mjs');
}
