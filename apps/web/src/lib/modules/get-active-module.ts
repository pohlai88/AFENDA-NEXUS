import { MODULE_SPECS } from './module-spec';
import type { ModuleId } from './types';

/**
 * Determine the active module from the current pathname.
 * Uses longest-prefix match — Home ('/') is the fallback.
 *
 * Client-safe: imports only module-spec.ts (no server imports, no LucideIcon).
 */
export function getActiveModule(pathname: string): ModuleId {
  for (const spec of MODULE_SPECS) {
    if (spec.matchers.some((m) => (m === '/' ? pathname === '/' : pathname.startsWith(m)))) {
      return spec.id;
    }
  }
  return 'home';
}
