/**
 * @module resolve-shortcut
 *
 * Resolves shortcut keys from user overrides.
 * Used by the shell to apply custom key mappings from preferences.
 */

/**
 * Resolve the effective key combo for a shortcut.
 *
 * @param id - Shortcut id (e.g. "nav-journals")
 * @param defaultKeys - Default key combo (e.g. "g j")
 * @param overrides - User overrides from shell preferences
 * @returns The overridden keys if present, otherwise defaultKeys
 */
export function resolveShortcutKeys(
  id: string,
  defaultKeys: string,
  overrides?: Record<string, string> | null,
): string {
  if (!overrides || typeof overrides[id] !== 'string') {
    return defaultKeys;
  }
  const override = overrides[id].trim();
  return override || defaultKeys;
}
