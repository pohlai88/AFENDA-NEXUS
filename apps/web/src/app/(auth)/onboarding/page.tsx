import { Suspense } from 'react';
import { getServerSession, getLastActiveOrgId } from '@/lib/auth';
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
 *
 * I-KRN-08: If the user has a lastActiveOrgId in preferences,
 * pass it as a hint so the client can auto-activate.
 */

async function OnboardingContent() {
  const session = await getServerSession();
  const lastActiveOrgId = session ? await getLastActiveOrgId(session) : null;

  return <OrgOnboardingForm lastActiveOrgId={lastActiveOrgId} />;
}

export default async function OrgOnboardingPage() {
  return (
    <Suspense>
      <OnboardingContent />
    </Suspense>
  );
}
