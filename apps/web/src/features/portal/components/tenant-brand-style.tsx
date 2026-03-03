/**
 * SP-7013 (CAP-BRAND): TenantBrandStyle
 *
 * Client component that applies tenant-specific CSS custom properties at the
 * portal shell root. Only rendered when at least one brand token is set.
 *
 * Design tokens applied (all optional — fall back to design-system defaults):
 *   --color-primary              → overrides design-system primary
 *   --color-primary-foreground   → overrides design-system primary-foreground
 *   --color-accent               → overrides design-system accent
 *
 * Usage in portal layout (Server Component):
 *   <TenantBrandStyle brand={brand}>{children}</TenantBrandStyle>
 */
'use client';

// ─── Types (serializable — safe to pass from Server to Client Component) ─────

export interface BrandTokens {
  readonly portalDisplayName: string | null;
  readonly logoUrl: string | null;
  readonly logoAltText: string | null;
  readonly primaryColor: string | null;
  readonly primaryForegroundColor: string | null;
  readonly accentColor: string | null;
  readonly supportEmail: string | null;
  readonly supportPhone: string | null;
  readonly supportUrl: string | null;
}

/** Zero-config default — all nulls. Falls through to design-system defaults. */
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

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Validates a hex color string (#rrggbb). Returns null for invalid input. */
function sanitizeHex(color: string | null | undefined): string | null {
  if (!color) return null;
  const t = color.trim();
  return /^#[0-9a-fA-F]{6}$/.test(t) ? t : null;
}

// ─── Component ───────────────────────────────────────────────────────────────

interface TenantBrandStyleProps {
  brand: BrandTokens;
  children: React.ReactNode;
}

export function TenantBrandStyle({ brand, children }: TenantBrandStyleProps) {
  const cssVars: Record<string, string> = {};

  const primary = sanitizeHex(brand.primaryColor);
  if (primary) cssVars['--color-primary'] = primary;

  const primaryFg = sanitizeHex(brand.primaryForegroundColor);
  if (primaryFg) cssVars['--color-primary-foreground'] = primaryFg;

  const accent = sanitizeHex(brand.accentColor);
  if (accent) cssVars['--color-accent'] = accent;

  if (Object.keys(cssVars).length === 0) {
    // No brand customisation — avoid wrapper div overhead.
    return <>{children}</>;
  }

  return (
    <div data-brand-tenant style={cssVars as React.CSSProperties} className="contents">
      {children}
    </div>
  );
}
