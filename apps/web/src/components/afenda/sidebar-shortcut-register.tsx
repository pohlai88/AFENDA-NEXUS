'use client';

import { useCallback } from 'react';
import { useSidebar } from '@/components/ui/sidebar';
import { useRegisterShortcut } from '@/providers/shortcut-provider';
import { useShellPreferences } from '@/providers/shell-preferences-provider';
import { resolveShortcutKeys } from '@/lib/shortcuts/resolve-shortcut';

const SIDEBAR_SHORTCUT_ID = 'afenda-sidebar';

/**
 * Registers mod+B (or user override) to toggle the sidebar.
 * Must be rendered inside SidebarProvider and ShortcutProvider.
 * Use with SidebarProvider keyboardShortcut="external".
 */
export function SidebarShortcutRegister() {
  const { toggleSidebar } = useSidebar();
  const { prefs } = useShellPreferences();
  const overrides = prefs.shortcutOverrides ?? null;
  const keys = resolveShortcutKeys(SIDEBAR_SHORTCUT_ID, 'mod+b', overrides);

  useRegisterShortcut(
    SIDEBAR_SHORTCUT_ID,
    keys,
    'Toggle sidebar',
    useCallback(() => toggleSidebar(), [toggleSidebar]),
    'global',
  );

  return null;
}
