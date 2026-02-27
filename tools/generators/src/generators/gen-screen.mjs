/**
 * @generated — do not edit manually
 * Screen generator wrapper — delegates to legacy gen-screen with spec-driven interface.
 *
 * Adds the run() API expected by the CLI router.
 * The legacy generator handles the actual file generation.
 */
import { loadSpec, buildSpec } from '../spec.mjs';
import { toKebab } from '../utils.mjs';

/**
 * CLI entry point — bridges spec to legacy gen-screen argv format.
 */
export async function run(args) {
  let spec;
  if (args.spec) {
    spec = loadSpec(args.spec);
  } else if (args.module && args.entity) {
    spec = buildSpec(args);
  } else {
    console.error('Usage: pnpm afenda-gen screen --module <mod> --entity <Entity> [--spec <path>]');
    process.exit(1);
  }

  const fe = spec.frontend;
  if (!fe) {
    console.log('⚠️  No frontend config in spec — skipping screen generation.');
    return;
  }

  // Delegate to the legacy generator by setting argv and importing
  const legacyArgv = [spec.module, fe.featureDir || spec.slice];
  process.argv = ['node', 'gen-screen.mjs', ...legacyArgv];

  await import('../gen-screen.mjs');
}
