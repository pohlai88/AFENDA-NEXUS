'use client';

import * as React from 'react';
import Link from 'next/link';
import { LogOut, Settings, BadgeCheck } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { routes } from '@/lib/constants';
import { Button } from '@/components/ui/button';
import type { ShellUser } from '@/lib/shell/shell-user';

// ─── Types ───────────────────────────────────────────────────────────────────

/**
 * @deprecated Use `ShellUser` from `@/lib/shell/shell-user` directly.
 */
type UserMenuUser = ShellUser;

interface UserMenuProps {
  /** Current authenticated user. */
  user?: UserMenuUser;
  /** Server action called on sign-out. */
  logoutAction?: () => Promise<void>;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Extract up to two initials from a display name. */
function getInitials(name: string): string {
  return name
    .split(' ')
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

// ─── Component ───────────────────────────────────────────────────────────────

/**
 * User menu following the shadcn nav-user pattern.
 *
 * - Avatar trigger with rounded-lg styling
 * - Rich label header with avatar + name + email
 * - Settings, Account, Sign-out actions
 */
function UserMenu({ user, logoutAction }: UserMenuProps) {
  const displayName = user?.name ?? 'User';
  const displayEmail = user?.email ?? '';
  const initials = getInitials(displayName);

  return (
    <DropdownMenu>
      <Tooltip>
        <TooltipTrigger asChild>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon-sm"
              className="h-8 w-8 rounded-full"
              aria-label={`Account menu for ${displayName}`}
            >
              <Avatar className="h-8 w-8 rounded-lg">
                {user?.image && <AvatarImage src={user.image} alt={displayName} />}
                <AvatarFallback className="rounded-lg text-xs">{initials}</AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
        </TooltipTrigger>
        <TooltipContent side="bottom">Account menu</TooltipContent>
      </Tooltip>
      <DropdownMenuContent
        className="w-56 rounded-lg"
        align="end"
        sideOffset={4}
      >
        {/* Rich user identity header */}
        <DropdownMenuLabel className="p-0 font-normal">
          <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
            <Avatar className="h-8 w-8 rounded-lg">
              {user?.image && <AvatarImage src={user.image} alt={displayName} />}
              <AvatarFallback className="rounded-lg text-xs">{initials}</AvatarFallback>
            </Avatar>
            <div className="grid flex-1 text-left text-sm leading-tight">
              <span className="truncate font-medium">{displayName}</span>
              <span className="truncate text-xs text-muted-foreground">{displayEmail}</span>
            </div>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        {/* Navigation group */}
        <DropdownMenuGroup>
          <DropdownMenuItem asChild>
            <Link href={routes.settings}>
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href={routes.settingsPreferences}>
              <BadgeCheck className="mr-2 h-4 w-4" />
              Account
            </Link>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />

        {/* Sign out */}
        {logoutAction ? (
          <form action={logoutAction}>
            <button type="submit" className="w-full">
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onSelect={(e) => e.preventDefault()}
              >
                <LogOut className="mr-2 h-4 w-4" />
                Sign out
              </DropdownMenuItem>
            </button>
          </form>
        ) : (
          <DropdownMenuItem disabled className="text-destructive">
            <LogOut className="mr-2 h-4 w-4" />
            Sign out
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
UserMenu.displayName = 'UserMenu';

export { UserMenu };
export type { UserMenuProps, UserMenuUser };
