import {
  type ShellPreferences,
  type DensityProfile,
  SHELL_PREFS_DEFAULTS,
} from './shell-preferences.types';

// ─── Constants ───────────────────────────────────────────────────────────────

/** Cookie name for SSR-critical shell preferences. */
export const SHELL_COOKIE_NAME = 'shell_prefs';

/** Cookie max-age: 30 days (seconds). */
const SHELL_COOKIE_MAX_AGE = 60 * 60 * 24 * 30;

/** localStorage key prefix for convenience prefs. */
const LS_PREFIX = 'afenda-shell';

// ─── Density → CSS class mapping ────────────────────────────────────────────

/**
 * Maps a `DensityProfile` to the CSS class name used by `_density.css`.
 * 'default' maps to `null` (no class needed — default density is implicit).
 */
export const DENSITY_CLASS_MAP: Record<DensityProfile, string | null> = {
  default: null,
  compact: 'compact',
  ultra: 'ultra',
  touch: 'touch-mode',
};

// ─── Cookie read/write (client & server) ─────────────────────────────────────

/**
 * Parse `ShellPreferences` from a raw cookie string value.
 * Returns defaults if the value is missing, unparseable, or a different version.
 */
export function parseShellCookie(raw: string | undefined | null): ShellPreferences {
  if (!raw) return { ...SHELL_PREFS_DEFAULTS };
  try {
    const parsed = JSON.parse(raw) as Partial<ShellPreferences>;
    if (parsed.v !== 1) return { ...SHELL_PREFS_DEFAULTS };
    return {
      v: 1,
      density: isValidDensity(parsed.density) ? parsed.density : SHELL_PREFS_DEFAULTS.density,
      leftCollapsed:
        typeof parsed.leftCollapsed === 'boolean'
          ? parsed.leftCollapsed
          : SHELL_PREFS_DEFAULTS.leftCollapsed,
      rightOpen:
        typeof parsed.rightOpen === 'boolean'
          ? parsed.rightOpen
          : SHELL_PREFS_DEFAULTS.rightOpen,
    };
  } catch {
    return { ...SHELL_PREFS_DEFAULTS };
  }
}

/**
 * Serialize `ShellPreferences` to the `shell_prefs` cookie (client-side).
 * Follows the same `document.cookie` pattern used by the sidebar provider.
 */
export function writeShellCookie(prefs: ShellPreferences): void {
  if (typeof document === 'undefined') return;
  const value = JSON.stringify(prefs);
  document.cookie = `${SHELL_COOKIE_NAME}=${encodeURIComponent(value)}; path=/; max-age=${SHELL_COOKIE_MAX_AGE}; SameSite=Lax`;
}

// ─── localStorage read/write (convenience prefs) ────────────────────────────

/**
 * Read a conveniently-stored (non-SSR-critical) preference from localStorage.
 * Returns `fallback` if not found or unparseable.
 */
export function readConveniencePrefs<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = window.localStorage.getItem(`${LS_PREFIX}:${key}`);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

/**
 * Write a conveniently-stored preference to localStorage.
 */
export function writeConveniencePrefs<T>(key: string, value: T): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(`${LS_PREFIX}:${key}`, JSON.stringify(value));
  } catch {
    // localStorage may be full or disabled — silently ignore
  }
}

// ─── Density helpers ─────────────────────────────────────────────────────────

const VALID_DENSITIES = new Set<string>(['default', 'compact', 'ultra', 'touch']);

function isValidDensity(value: unknown): value is DensityProfile {
  return typeof value === 'string' && VALID_DENSITIES.has(value);
}

/**
 * Apply (or remove) the density CSS class on `<html>` and set the
 * `data-density` attribute for global references.
 */
export function applyDensityClass(density: DensityProfile): void {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;

  // Remove all density classes
  root.classList.remove('compact', 'ultra', 'touch-mode');
  root.removeAttribute('data-density');

  const cls = DENSITY_CLASS_MAP[density];
  if (cls) {
    root.classList.add(cls);
  }
  if (density !== 'default') {
    root.dataset.density = density;
  }
}
