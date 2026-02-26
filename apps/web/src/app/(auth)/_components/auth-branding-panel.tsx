/**
 * Static auth branding panel — extracted for reuse and future 'use cache' when
 * cacheComponents is enabled. No cookies, headers, or dynamic data.
 */
export function AuthBrandingPanel() {
  return (
    <div className="relative hidden flex-col justify-between bg-primary p-10 text-primary-foreground lg:flex">
      <div className="flex items-center gap-2 text-lg font-semibold">
        <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary-foreground text-primary text-sm font-bold">
          A
        </div>
        Afenda
      </div>

      <div className="space-y-4">
        <blockquote className="space-y-2">
          <p className="text-lg leading-relaxed">
            &ldquo;Afenda transformed how we manage our entire business — from financials to
            procurement — in a single platform.&rdquo;
          </p>
          <footer className="text-sm text-primary-foreground/70">— Chief Financial Officer</footer>
        </blockquote>
      </div>

      <p className="text-xs text-primary-foreground/50">
        Enterprise Resource Planning &middot; Built for modern teams
      </p>
    </div>
  );
}
