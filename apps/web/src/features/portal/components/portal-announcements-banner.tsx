/**
 * Phase 1.2.3 CAP-ANNOUNCE — Announcements Banner
 *
 * Displays pinned announcements as a persistent strip above main content.
 * Renders nothing when there are no active pinned announcements.
 *
 * SP-7010: Portal Announcements Components
 */
import { Info, AlertTriangle, AlertOctagon, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { PortalAnnouncement } from '@/features/portal/queries/portal.queries';

// ─── Severity config ──────────────────────────────────────────────────────────

const severityConfig = {
  INFO: {
    icon: Info,
    containerClass:
      'border-blue-200 bg-blue-50 text-blue-900 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-100',
    iconClass: 'text-blue-500 dark:text-blue-400',
    label: 'Information',
  },
  WARNING: {
    icon: AlertTriangle,
    containerClass: 'border-warning/30 bg-warning/10 text-warning-foreground',
    iconClass: 'text-warning',
    label: 'Warning',
  },
  CRITICAL: {
    icon: AlertOctagon,
    containerClass: 'border-destructive/30 bg-destructive/10 text-destructive',
    iconClass: 'text-destructive',
    label: 'Critical',
  },
} as const;

// ─── Single announcement banner strip ────────────────────────────────────────

interface AnnouncementBannerItemProps {
  announcement: PortalAnnouncement;
}

function AnnouncementBannerItem({ announcement }: AnnouncementBannerItemProps) {
  const config = severityConfig[announcement.severity];
  const Icon = config.icon;

  return (
    <div
      role="alert"
      aria-label={`${config.label} announcement: ${announcement.title}`}
      className={cn('flex items-start gap-3 border-b px-4 py-2.5 text-sm', config.containerClass)}
    >
      <Icon className={cn('mt-0.5 h-4 w-4 shrink-0', config.iconClass)} aria-hidden="true" />
      <div className="min-w-0 flex-1">
        <span className="font-semibold">{announcement.title}</span>
        {announcement.body && <span className="ml-2 opacity-80">{announcement.body}</span>}
      </div>
    </div>
  );
}

// ─── Announcement Card for list view ─────────────────────────────────────────

interface AnnouncementCardProps {
  announcement: PortalAnnouncement;
}

export function AnnouncementCard({ announcement }: AnnouncementCardProps) {
  const config = severityConfig[announcement.severity];
  const Icon = config.icon;

  return (
    <div
      className={cn('rounded-lg border p-4', config.containerClass)}
      role="article"
      aria-label={`${config.label}: ${announcement.title}`}
    >
      <div className="flex items-start gap-3">
        <Icon className={cn('mt-0.5 h-5 w-5 shrink-0', config.iconClass)} aria-hidden="true" />
        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-semibold">{announcement.title}</h3>
            {announcement.pinned && (
              <span className="rounded-full bg-current/10 px-2 py-0.5 text-xs font-medium opacity-70">
                Pinned
              </span>
            )}
          </div>
          <p className="text-sm leading-relaxed opacity-80">{announcement.body}</p>
          <p className="text-xs opacity-60">
            {announcement.validUntil
              ? `Valid until ${new Date(announcement.validUntil).toLocaleDateString()}`
              : 'No expiry'}
            {' · '}
            Posted {new Date(announcement.createdAt).toLocaleDateString()}
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── Persistent banner strip (pinned only) ───────────────────────────────────

interface PortalAnnouncementsBannerProps {
  /** Pass the full list; the banner filters for pinned=true automatically. */
  announcements: PortalAnnouncement[];
}

/**
 * Renders a banner strip for each pinned announcement.
 * Positioned between the topbar and main content in the portal shell.
 * Renders nothing when there are no pinned active announcements.
 */
export function PortalAnnouncementsBanner({ announcements }: PortalAnnouncementsBannerProps) {
  const pinned = announcements.filter((a) => a.pinned && !a.archivedAt);

  if (pinned.length === 0) return null;

  return (
    <div role="region" aria-label="Portal announcements">
      {pinned.map((a) => (
        <AnnouncementBannerItem key={a.id} announcement={a} />
      ))}
    </div>
  );
}
