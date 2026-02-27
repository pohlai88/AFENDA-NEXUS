/**
 * @generated — do not edit manually
 * Module generator wrapper — delegates to legacy gen-module with spec-driven interface.
 *
 * Adds the run() API expected by the CLI router.
 */
import { loadSpec, buildSpec } from '../spec.mjs';

/**
 * CLI entry point — bridges spec to legacy gen-module argv format.
 */
export async function run(args) {
  const moduleName = args.module || args.name || args._positional?.[0];
  if (!moduleName) {
    console.error('Usage: pnpm afenda-gen module --module <name>');
    process.exit(1);
  }

  // Delegate to the legacy generator
  process.argv = ['node', 'gen-module.mjs', moduleName];
  await import('../gen-module.mjs');
}
