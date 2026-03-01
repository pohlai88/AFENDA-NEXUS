const MODIFIER_KEYS = new Set(['control', 'meta', 'alt', 'shift']);

/**
 * Convert a KeyboardEvent to the shortcut engine's key string format.
 * e.g. Ctrl+Shift+J → "ctrl+shift+j", Cmd+K → "mod+k"
 */
export function eventToKeyString(e: KeyboardEvent): string {
  const parts: string[] = [];
  if (e.ctrlKey && !e.metaKey) parts.push('ctrl');
  else if (e.metaKey || e.ctrlKey) parts.push('mod');
  if (e.altKey) parts.push('alt');
  if (e.shiftKey) parts.push('shift');
  const key = e.key?.toLowerCase();
  if (key && !MODIFIER_KEYS.has(key)) {
    parts.push(key);
  }
  return parts.join('+');
}

/** Reject modifier-only combos (e.g. "shift", "ctrl") — need at least one non-modifier key. */
export function isValidShortcutKeys(keys: string): boolean {
  const trimmed = keys.trim();
  if (!trimmed) return false;
  const parts = trimmed.split(/[\s+]+/).filter(Boolean);
  const hasNonModifier = parts.some(
    (p) => !['mod', 'ctrl', 'alt', 'shift'].includes(p.toLowerCase()),
  );
  return hasNonModifier;
}
