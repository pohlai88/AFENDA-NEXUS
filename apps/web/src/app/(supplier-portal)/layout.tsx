import { PortalShell } from '@/components/portal/portal-shell';
import { PortalSupplierProvider } from '@/features/portal/portal-supplier-context';
import {
  getPortalSupplier,
  getPortalAnnouncements,
  getPortalAssociations,
} from '@/features/portal/queries/portal.queries';
import { PortalAnnouncementsBanner } from '@/features/portal/components/portal-announcements-banner';
import {
  TenantBrandStyle,
  DEFAULT_BRAND_TOKENS,
} from '@/features/portal/components/tenant-brand-style';
import { logoutAction } from '@/lib/auth-actions';
import { requireAuth, getRequestContext } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const session = await requireAuth();
  const ctx = await getRequestContext();

  const user = session?.user
    ? {
        name: session.user.name,
        email: session.user.email,
        image: session.user.image,
      }
    : undefined;

  // Fetch supplier + associations in parallel — associations don't need supplierId
  const [supplierResult, associationsResult] = await Promise.all([
    getPortalSupplier(ctx),
    getPortalAssociations(ctx),
  ]);

  // If supplier data fails, still render the shell but without context.
  // Individual pages can handle the missing context gracefully.
  if (!supplierResult.ok) {
    return (
      <PortalShell user={user} logoutAction={logoutAction}>
        {children}
      </PortalShell>
    );
  }

  const associations = associationsResult.ok ? associationsResult.value : [];

  // Fetch active announcements for the banner (non-blocking — silently skip on error)
  const announcementsResult = await getPortalAnnouncements(ctx, supplierResult.value.supplierId);
  const announcements = announcementsResult.ok ? announcementsResult.value : [];

  const banner = <PortalAnnouncementsBanner announcements={announcements} />;

  // SP-5020: Brand customization from DB is deferred to Phase 1.2
  // Using design-system defaults for portal branding (TenantBrandStyle applies zero-config)
  const brand = DEFAULT_BRAND_TOKENS;

  return (
    <TenantBrandStyle brand={brand}>
      <PortalShell
        user={user}
        logoutAction={logoutAction}
        banner={banner}
        associations={associations}
        activeSupplierId={supplierResult.value.supplierId}
      >
        <PortalSupplierProvider supplier={supplierResult.value}>{children}</PortalSupplierProvider>
      </PortalShell>
    </TenantBrandStyle>
  );
}
