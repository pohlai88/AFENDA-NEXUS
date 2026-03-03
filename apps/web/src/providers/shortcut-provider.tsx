'use client';

import { createContext, useContext, useEffect, useMemo, type ReactNode } from 'react';
import {
  getShortcutEngine,
  type ShortcutEngine,
  type ShortcutRegistration,
  type ShortcutScope,
} from '@/lib/shortcuts/shortcut-engine';

// ─── Context ─────────────────────────────────────────────────────────────────

interface ShortcutContextValue {
  /** The underlying shortcut engine instance. */
  engine: ShortcutEngine;
}

const ShortcutCtx = createContext<ShortcutContextValue | null>(null);

/**
 * Exported for components that need optional access to the shortcut engine
 * (e.g. DataTable pushes 'table' scope on focus). Use `useContext(ShortcutContext)`
 * — returns `null` when no provider is present.
 */
export { ShortcutCtx as ShortcutContext };

// ─── Provider ────────────────────────────────────────────────────────────────

interface ShortcutProviderProps {
  children: ReactNode;
}

/**
 * Wraps the ShortcutEngine in React context. Starts listening on mount,
 * stops on unmount.
 */
export function ShortcutProvider({ children }: ShortcutProviderProps) {
  const engine = useMemo(() => getShortcutEngine(), []);

  useEffect(() => {
    engine.start();

    // Expose engine globally for debugging (dev only)
    if (typeof window !== 'undefined' && process.env.NODE_ENV !== 'production') {
      (
        window as Window & { __AFENDA_SHORTCUT_ENGINE__?: ShortcutEngine }
      ).__AFENDA_SHORTCUT_ENGINE__ = engine;
    }

    return () => {
      engine.stop();
      if (typeof window !== 'undefined' && process.env.NODE_ENV !== 'production') {
        delete (window as Window & { __AFENDA_SHORTCUT_ENGINE__?: ShortcutEngine })
          .__AFENDA_SHORTCUT_ENGINE__;
      }
    };
  }, [engine]);

  const value = useMemo(() => ({ engine }), [engine]);

  return <ShortcutCtx.Provider value={value}>{children}</ShortcutCtx.Provider>;
}

// ─── Hooks ───────────────────────────────────────────────────────────────────

function useShortcutContext(): ShortcutContextValue {
  const ctx = useContext(ShortcutCtx);
  if (!ctx) {
    throw new Error('useRegisterShortcut must be used within <ShortcutProvider>');
  }
  return ctx;
}

/**
 * Register a keyboard shortcut. Automatically unregisters on unmount.
 *
 * @param id - Unique shortcut identifier
 * @param keys - Key string ("?" or "g j" or "mod+k")
 * @param description - Human-readable label for the shortcut dialog
 * @param handler - Callback to execute
 * @param scope - Scope for priority arbitration (default: "global")
 */
export function useRegisterShortcut(
  id: string,
  keys: string,
  description: string,
  handler: () => void,
  scope: ShortcutScope = 'global'
): void {
  const { engine } = useShortcutContext();

  useEffect(() => {
    engine.register({ id, keys, description, handler, scope });
    return () => engine.unregister(id);
  }, [engine, id, keys, description, handler, scope]);
}

/**
 * Push a shortcut scope onto the stack when the component mounts.
 * Pops on unmount. Used by Dialog, Sheet, CommandDialog wrappers.
 */
export function useShortcutScope(scope: ShortcutScope): void {
  const { engine } = useShortcutContext();

  useEffect(() => {
    engine.pushScope(scope);
    return () => engine.popScope(scope);
  }, [engine, scope]);
}

/**
 * Get all registered shortcuts (for rendering in the shortcut dialog).
 */
export function useRegisteredShortcuts(): ShortcutRegistration[] {
  const { engine } = useShortcutContext();
  return engine.getRegistered();
}
