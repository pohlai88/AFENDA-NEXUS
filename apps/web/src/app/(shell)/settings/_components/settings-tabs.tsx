'use client';

import { ProfileForm } from './profile-form';
import { ChangePasswordForm } from './change-password-form';
import { DeleteAccountCard } from './delete-account-card';

/**
 * Settings page — account management.
 *
 * Composes the profile editor, password change form, and account deletion
 * card into a single scrollable layout.
 */
export function SettingsTabs() {
  return (
    <div className="space-y-6">
      <ProfileForm />
      <ChangePasswordForm />
      <DeleteAccountCard />
    </div>
  );
}
