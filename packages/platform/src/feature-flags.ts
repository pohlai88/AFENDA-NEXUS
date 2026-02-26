/**
 * Feature flags — env-var-driven implementation.
 *
 * Convention: each flag is read from `FEATURE_<UPPER_SNAKE_FLAG>`.
 * e.g. flag "dashboard_kpis" → env var `FEATURE_DASHBOARD_KPIS`.
 *
 * Runtime overrides (passed at construction) take precedence over env vars.
 * Unset flags default to `false`.
 */

export interface FeatureFlags {
  isEnabled(flag: string): boolean;
}

function envKey(flag: string): string {
  return `FEATURE_${flag.toUpperCase().replace(/[^A-Z0-9]/g, '_')}`;
}

function readEnvFlag(flag: string): boolean | undefined {
  const raw = process.env[envKey(flag)];
  if (raw === undefined || raw === '') return undefined;
  return raw === '1' || raw.toLowerCase() === 'true';
}

export function featureFlags(overrides: Record<string, boolean> = {}): FeatureFlags {
  return {
    isEnabled(flag: string): boolean {
      if (flag in overrides) return overrides[flag] as boolean;
      return readEnvFlag(flag) ?? false;
    },
  };
}
