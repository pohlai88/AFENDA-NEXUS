/**
 * Display settings registry — Density and Theme options.
 *
 * Single source of truth for the display cluster dropdown.
 * No hardcoded values in components.
 */

import type { DensityProfile } from './shell-preferences.types';

// ─── Density Options ────────────────────────────────────────────────────────

export interface DensityOption {
  value: DensityProfile;
  label: string;
  description: string;
}

export const DENSITY_OPTIONS: DensityOption[] = [
  { value: 'default', label: 'Default', description: 'Standard spacing' },
  { value: 'compact', label: 'Compact', description: 'Reduced whitespace' },
  { value: 'ultra', label: 'Ultra', description: 'Minimal spacing' },
  { value: 'touch', label: 'Touch', description: 'Larger tap targets' },
];

// ─── Theme Options ───────────────────────────────────────────────────────────

export interface ThemeOption {
  value: 'light' | 'dark' | 'system';
  label: string;
  icon: 'Sun' | 'Moon' | 'Monitor';
}

export const THEME_OPTIONS: ThemeOption[] = [
  { value: 'light', label: 'Light', icon: 'Sun' },
  { value: 'dark', label: 'Dark', icon: 'Moon' },
  { value: 'system', label: 'System', icon: 'Monitor' },
];
