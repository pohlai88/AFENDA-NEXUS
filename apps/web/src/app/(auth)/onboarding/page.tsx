import { Suspense } from 'react';
import { OrgOnboardingForm } from './_components/org-onboarding-form';

export const metadata = {
  title: 'Setup Organization — Afenda',
};

/**
 * Organization onboarding page.
 *
 * Shown when a user has no active organization:
 * - First-time users create their first org
 * - Users with existing orgs select one to activate
 */
export default function OrgOnboardingPage() {
  return (
    <Suspense>
      <OrgOnboardingForm />
    </Suspense>
  );
}
