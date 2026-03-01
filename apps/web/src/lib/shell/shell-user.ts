/**
 * Shared user identity type for the application shell.
 *
 * Used by `AppShell`, `ShellHeader`, and `UserMenu` to describe the
 * authenticated user.  Consolidates the previously triplicate
 * `AppShellUser` / `ShellHeaderUser` / `UserMenuUser` definitions.
 */
export interface ShellUser {
  name: string;
  email: string;
  image?: string | null;
}
