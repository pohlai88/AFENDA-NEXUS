/**
 * @generated — do not edit manually
 * Table UI generator wrapper — delegates to legacy gen-table-ui with spec-driven interface.
 *
 * Adds the run() API expected by the CLI router.
 */
import { loadSpec, buildSpec } from '../spec.mjs';
import { toPascal } from '../utils.mjs';

/**
 * CLI entry point — bridges spec to legacy gen-table-ui argv format.
 */
export async function run(args) {
  let spec;
  if (args.spec) {
    spec = loadSpec(args.spec);
  } else if (args.entity) {
    spec = buildSpec(args);
  } else {
    console.error('Usage: pnpm afenda-gen table-ui --entity <Entity> [--module <mod>] [--spec <path>]');
    process.exit(1);
  }

  const viewModelName = `${toPascal(spec.entity.name)}ListItem`;
  const fe = spec.frontend;

  // Delegate to the legacy generator
  const legacyArgv = [viewModelName];
  if (spec.module) legacyArgv.push('--module', spec.module);
  if (fe?.featureDir) legacyArgv.push('--entity', fe.featureDir);

  process.argv = ['node', 'gen-table-ui.mjs', ...legacyArgv];

  await import('../gen-table-ui.mjs');
}
