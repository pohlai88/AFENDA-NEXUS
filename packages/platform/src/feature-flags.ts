/**
 * Feature flags — simple in-memory implementation.
 * Replace with a proper service when needed.
 */

export interface FeatureFlags {
  isEnabled(flag: string): boolean;
}

export function featureFlags(
  overrides: Record<string, boolean> = {},
): FeatureFlags {
  return {
    isEnabled(flag: string): boolean {
      return overrides[flag] ?? false;
    },
  };
}
