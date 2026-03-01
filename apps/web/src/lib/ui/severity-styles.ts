/**
 * Shared severity icon/color maps for the ERP shell.
 *
 * Centralises the icon components and Tailwind color tokens used by
 * `NeedsAttention`, `NotificationPopover`, and any future severity-
 * coded UI.  Import from here instead of maintaining local duplicates.
 */

import type { ComponentType } from 'react';
import {
  AlertOctagon,
  AlertTriangle,
  Info,
  CheckCircle2,
} from 'lucide-react';
import type { AttentionSeverity } from '@/lib/attention/attention.types';
import type { NotificationSeverity } from '@/lib/notifications/notification.types';

// ─── Attention Severity (3-value: critical | warning | info) ─────────────────

export const ATTENTION_SEVERITY_ICON: Record<
  AttentionSeverity,
  ComponentType<{ className?: string }>
> = {
  critical: AlertOctagon,
  warning: AlertTriangle,
  info: Info,
};

export const ATTENTION_SEVERITY_COLOR: Record<AttentionSeverity, string> = {
  critical: 'text-destructive',
  warning: 'text-amber-500',
  info: 'text-blue-500',
};

// ─── Notification Severity (4-value: info | warning | critical | success) ────

export const NOTIFICATION_SEVERITY_ICON: Record<
  NotificationSeverity,
  ComponentType<{ className?: string }>
> = {
  info: Info,
  warning: AlertTriangle,
  critical: AlertOctagon,
  success: CheckCircle2,
};

export const NOTIFICATION_SEVERITY_COLOR: Record<NotificationSeverity, string> = {
  info: 'text-blue-500',
  warning: 'text-amber-500',
  critical: 'text-destructive',
  success: 'text-emerald-500',
};

export const NOTIFICATION_SEVERITY_BG: Record<NotificationSeverity, string> = {
  info: 'bg-blue-50 dark:bg-blue-950/30',
  warning: 'bg-amber-50 dark:bg-amber-950/30',
  critical: 'bg-destructive/5 dark:bg-destructive/10',
  success: 'bg-emerald-50 dark:bg-emerald-950/30',
};
