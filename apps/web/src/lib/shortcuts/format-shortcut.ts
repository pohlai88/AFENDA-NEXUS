/**
 * Platform-aware shortcut key formatting.
 *
 * Radix-style: mod = Cmd on Mac, Ctrl on Win/Linux.
 * Use for consistent display across Kbd, tooltips, and shortcut dialogs.
 */

const KEY_MAP: Record<string, (isMac: boolean) => string> = {
  mod: (isMac) => (isMac ? '⌘' : 'Ctrl'),
  ctrl: () => 'Ctrl',
  alt: (isMac) => (isMac ? '⌥' : 'Alt'),
  shift: () => '⇧',
  escape: () => 'Esc',
  enter: () => '↵',
  backspace: () => '⌫',
  delete: () => '⌦',
  ' ': () => 'Space',
  arrowup: () => '↑',
  arrowdown: () => '↓',
  arrowleft: () => '←',
  arrowright: () => '→',
};

/**
 * Format a shortcut key string for display.
 * e.g. "mod+k" → "⌘K" (Mac) or "Ctrl+K" (Win)
 */
export function formatShortcutKey(keys: string, isMac?: boolean): string {
  const mac = isMac ?? (typeof navigator !== 'undefined' && /Mac|iPod|iPhone|iPad/.test(navigator.userAgent));
  const parts = keys.split(/(?<=\+)|(?=\+)|\s+/).filter((p) => p !== '+');
  return parts
    .map((part) => {
      const fn = KEY_MAP[part.toLowerCase()];
      return fn ? fn(mac) : part.toUpperCase();
    })
    .join('+');
}

/**
 * Format a shortcut for Kbd display (e.g. "Ctrl+Y" or "⌘Y").
 * Use in tooltips and inline hints.
 */
export function formatShortcutForKbd(keys: string, isMac?: boolean): string {
  return formatShortcutKey(keys, isMac);
}
