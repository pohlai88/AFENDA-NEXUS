/**
 * @module nav-icon
 *
 * Shared icon resolver for sidebar navigation items.
 * Maps a Lucide icon name string → rendered React element.
 */

'use client';

import { getIcon } from '@/lib/modules/icon-map';
import { cn } from '@/lib/utils';

interface NavIconProps {
  /** Lucide icon name (e.g. "LayoutDashboard", "Wallet"). */
  name: string;
  className?: string;
}

/** Renders a Lucide icon by name with consistent sizing. */
function NavIcon({ name, className }: NavIconProps) {
  const Icon = getIcon(name);
  return <Icon className={cn('h-4 w-4', className)}  aria-hidden="true" />;
}
NavIcon.displayName = 'NavIcon';

export { NavIcon };
export type { NavIconProps };
