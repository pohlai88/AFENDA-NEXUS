/**
 * SP-5020: Portal Brand / Theme Service (CAP-BRAND P12)
 *
 * Reads white-label branding configuration for a tenant's supplier portal.
 * Returns a BrandTokens object — a thin, UI-safe projection of the DB row.
 * Falls back gracefully to AFENDA defaults when no brand is configured.
 *
 * Usage in portal layout (Server Component):
 *   const brand = await getPortalBrand(tenantId);
 *   <TenantBrandStyle brand={brand} />
 */
import type { Result } from '@afenda/core';
import { ok } from '@afenda/core';

// ─── Types ───────────────────────────────────────────────────────────────────

/** CSS-safe brand tokens injected as portal-scoped CSS variables. */
export interface BrandTokens {
  /** Buyer display name shown in portal header. Falls back to tenant name. */
  readonly portalDisplayName: string | null;
  /** Absolute or relative URL to the buyer logo. null = use AFENDA default. */
  readonly logoUrl: string | null;
  readonly logoAltText: string | null;
  /** Hex color for --brand-primary. null = use design system default. */
  readonly primaryColor: string | null;
  /** Hex color for --brand-primary-foreground. null = use design system default. */
  readonly primaryForegroundColor: string | null;
  /** Hex color for --brand-accent. null = use design system default. */
  readonly accentColor: string | null;
  /** Support contact surfaced in the portal footer/help panel. */
  readonly supportEmail: string | null;
  readonly supportPhone: string | null;
  readonly supportUrl: string | null;
}

/** Default pass-through when no brand is configured. */
export const DEFAULT_BRAND_TOKENS: BrandTokens = {
  portalDisplayName: null,
  logoUrl: null,
  logoAltText: null,
  primaryColor: null,
  primaryForegroundColor: null,
  accentColor: null,
  supportEmail: null,
  supportPhone: null,
  supportUrl: null,
};

// ─── Repository Port ─────────────────────────────────────────────────────────

export interface IBrandConfigRepo {
  findByTenantId(tenantId: string): Promise<BrandTokens | null>;
}

// ─── Service ─────────────────────────────────────────────────────────────────

export interface BrandServiceDeps {
  readonly brandConfigRepo: IBrandConfigRepo;
}

/**
 * Fetch portal brand tokens for a tenant.
 * Always succeeds — returns DEFAULT_BRAND_TOKENS on miss/error.
 */
export async function getPortalBrand(
  deps: BrandServiceDeps,
  tenantId: string
): Promise<Result<BrandTokens, never>> {
  const config = await deps.brandConfigRepo.findByTenantId(tenantId).catch(() => null);
  return ok(config ?? DEFAULT_BRAND_TOKENS);
}

/**
 * Convert hex color to CSS-safe string.
 * Returns null for invalid / missing values.
 */
export function sanitizeHex(color: string | null | undefined): string | null {
  if (!color) return null;
  const trimmed = color.trim();
  if (/^#[0-9a-fA-F]{6}$/.test(trimmed)) return trimmed;
  return null;
}

/**
 * Build a CSS-variable map from BrandTokens.
 * Only emits variables for tokens that are explicitly set.
 * Returns a plain record — cast to React.CSSProperties in the component layer.
 */
export function buildBrandCssVars(brand: BrandTokens): Record<string, string> {
  const vars: Record<string, string> = {};

  const primary = sanitizeHex(brand.primaryColor);
  if (primary) vars['--brand-primary'] = primary;

  const primaryFg = sanitizeHex(brand.primaryForegroundColor);
  if (primaryFg) vars['--brand-primary-foreground'] = primaryFg;

  const accent = sanitizeHex(brand.accentColor);
  if (accent) vars['--brand-accent'] = accent;

  return vars;
}
