'use client';

import { useContext, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { ShortcutContext } from '@/providers/shortcut-provider';
import { useShellPreferences } from '@/providers/shell-preferences-provider';
import { useQuickActions } from '@/hooks/use-quick-actions';
import { resolveShortcutKeys } from '@/lib/shortcuts/resolve-shortcut';

/** Custom event to open the Quick Action picker (Ctrl+Q). */
export const QUICK_ACTION_PICKER_EVENT = 'afenda:open-quick-action-picker';

/**
 * Registers Quick Action shortcuts with the ShortcutEngine so they appear
 * in the keyboard shortcut dialog and work end-to-end.
 *
 * - Ctrl+Q: Opens the Quick Action picker (dispatches custom event)
 * - Ctrl+1…9: Navigates to the pinned action in that slot
 */
export function QuickActionShortcuts() {
  const ctx = useContext(ShortcutContext);
  const { prefs } = useShellPreferences();
  const overrides = prefs.shortcutOverrides ?? null;
  const { actions } = useQuickActions();
  const router = useRouter();
  const routerRef = useRef(router);
  routerRef.current = router;

  // Register Ctrl+Q to open the picker (with user override)
  useEffect(() => {
    if (!ctx) return;
    const keys = resolveShortcutKeys('quick-action-picker', 'ctrl+q', overrides);
    ctx.engine.register({
      id: 'quick-action-picker',
      keys,
      description: 'Open Quick Action picker',
      handler: () => {
        window.dispatchEvent(new CustomEvent(QUICK_ACTION_PICKER_EVENT));
      },
      scope: 'global',
    });
    return () => ctx.engine.unregister('quick-action-picker');
  }, [ctx, overrides]);

  // Register Ctrl+1…9 for each pinned action (with user overrides)
  useEffect(() => {
    if (!ctx) return;

    const ids: string[] = [];

    for (const action of actions) {
      const id = `quick-action-${action.slot}`;
      ids.push(id);
      const keys = resolveShortcutKeys(id, `ctrl+${action.slot}`, overrides);

      ctx.engine.register({
        id,
        keys,
        description: `Quick Action ${action.slot}: ${action.title}`,
        handler: () => routerRef.current.push(action.href),
        scope: 'global',
      });
    }

    return () => {
      for (const id of ids) ctx.engine.unregister(id);
    };
  }, [ctx, actions, overrides]);

  return null;
}
