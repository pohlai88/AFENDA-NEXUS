'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { ShellPreferences, DensityProfile } from '@/lib/shell/shell-preferences.types';
import { SHELL_PREFS_DEFAULTS } from '@/lib/shell/shell-preferences.types';
import {
  writeShellCookie,
  applyDensityClass,
} from '@/lib/shell/shell-persistence';

// ─── Context Shape ──────────────────────────────────────────────────────────

interface ShellPreferencesContextValue {
  /** Current preferences (SSR-critical fields). */
  prefs: ShellPreferences;
  /** Update one or more preference fields. Writes cookie + applies CSS. */
  setPref: <K extends keyof Omit<ShellPreferences, 'v'>>(
    key: K,
    value: ShellPreferences[K],
  ) => void;
  /** Convenience: set density and apply CSS class immediately. */
  setDensity: (density: DensityProfile) => void;
  /** Convenience: toggle the right sidebar open/closed. */
  toggleRightSidebar: () => void;
}

const ShellPreferencesCtx = createContext<ShellPreferencesContextValue | null>(null);

// ─── Provider ───────────────────────────────────────────────────────────────

interface ShellPreferencesProviderProps {
  children: ReactNode;
  /**
   * Server-read cookie value passed from the `(shell)/layout.tsx`.
   * When provided, the provider SSR-renders with correct initial state.
   */
  defaultPrefs?: ShellPreferences;
  /**
   * Company-scoped cookie key (e.g. `shell_prefs:tenantId:userId:companyId`).
   * Prevents preference leakage across companies in multi-company setups.
   * Built server-side via `buildShellCookieKey()`.
   */
  cookieKey?: string;
}

export function ShellPreferencesProvider({
  children,
  defaultPrefs,
  cookieKey,
}: ShellPreferencesProviderProps) {
  const [prefs, setPrefs] = useState<ShellPreferences>(
    defaultPrefs ?? { ...SHELL_PREFS_DEFAULTS },
  );

  // Apply density class on mount and when density changes
  useEffect(() => {
    applyDensityClass(prefs.density);
  }, [prefs.density]);

  const setPref = useCallback(
    <K extends keyof Omit<ShellPreferences, 'v'>>(key: K, value: ShellPreferences[K]) => {
      setPrefs((prev) => {
        const next = { ...prev, [key]: value };
        writeShellCookie(next, cookieKey);
        return next;
      });
    },
    [cookieKey],
  );

  const setDensity = useCallback(
    (density: DensityProfile) => {
      setPref('density', density);
    },
    [setPref],
  );

  const toggleRightSidebar = useCallback(() => {
    setPrefs((prev) => {
      const next = { ...prev, rightOpen: !prev.rightOpen };
      writeShellCookie(next, cookieKey);
      return next;
    });
  }, [cookieKey]);

  const value = useMemo(
    () => ({ prefs, setPref, setDensity, toggleRightSidebar }),
    [prefs, setPref, setDensity, toggleRightSidebar],
  );

  return (
    <ShellPreferencesCtx.Provider value={value}>{children}</ShellPreferencesCtx.Provider>
  );
}

// ─── Hook ───────────────────────────────────────────────────────────────────

export function useShellPreferences(): ShellPreferencesContextValue {
  const ctx = useContext(ShellPreferencesCtx);
  if (!ctx) {
    throw new Error('useShellPreferences must be used within <ShellPreferencesProvider>');
  }
  return ctx;
}
