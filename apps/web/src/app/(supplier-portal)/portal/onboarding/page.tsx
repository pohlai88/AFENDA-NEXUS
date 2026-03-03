import { Suspense } from 'react';
import { getRequestContext } from '@/lib/auth';
import { getPortalSupplier, getPortalOnboarding } from '@/features/portal/queries/portal.queries';
import { PageHeader } from '@/components/erp/page-header';
import { AlertTriangle, ClipboardCheck } from 'lucide-react';
import { routes } from '@/lib/constants';
import { LoadingSkeleton } from '@/components/erp/loading-skeleton';
import { OnboardingWizard } from '@/features/portal/components/onboarding-wizard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { Metadata } from 'next';
import type { RequestContext } from '@afenda/core';

export const metadata: Metadata = {
  title: 'Onboarding | Supplier Portal',
};

async function OnboardingPageContent({ ctx }: { ctx: RequestContext }) {
  const supplierResult = await getPortalSupplier(ctx);
  if (!supplierResult.ok) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <AlertTriangle className="h-10 w-10 text-destructive" />
        <h2 className="mt-4 text-lg font-semibold">Unable to load supplier profile</h2>
        <p className="mt-1 text-sm text-muted-foreground">{supplierResult.error.message}</p>
      </div>
    );
  }

  const supplier = supplierResult.value;
  const onboardingResult = await getPortalOnboarding(ctx, supplier.supplierId);

  if (!onboardingResult.ok) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <AlertTriangle className="h-10 w-10 text-destructive" />
        <h2 className="mt-4 text-lg font-semibold">Unable to load onboarding status</h2>
        <p className="mt-1 text-sm text-muted-foreground">{onboardingResult.error.message}</p>
      </div>
    );
  }

  const submission = onboardingResult.value;

  // If already submitted and pending review, show status card
  if (submission.isSubmitted) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Onboarding"
          description="Your supplier onboarding submission."
          breadcrumbs={[
            { label: 'Portal', href: routes.portal.dashboard },
            { label: 'Onboarding' },
          ]}
        />

        <Card className="mx-auto max-w-2xl">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <ClipboardCheck className="h-8 w-8 text-primary" />
            </div>
            <CardTitle>Onboarding Submitted</CardTitle>
            <CardDescription>
              Your onboarding application has been submitted for review.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-center">
            <Badge variant="outline" className="text-sm">
              Pending Approval
            </Badge>
            {submission.submittedAt && (
              <p className="text-sm text-muted-foreground">
                Submitted on{' '}
                {new Date(submission.submittedAt).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </p>
            )}
            <p className="text-sm text-muted-foreground">
              A member of our team will review your submission and get back to you shortly. If you
              have questions, you can{' '}
              <a href={routes.portal.caseNew} className="text-primary underline">
                open a support case
              </a>
              .
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Onboarding"
        description="Complete all steps to set up your supplier account."
        breadcrumbs={[{ label: 'Portal', href: routes.portal.dashboard }, { label: 'Onboarding' }]}
      />

      {submission.rejectionReason && (
        <Card className="border-destructive/50 bg-destructive/5">
          <CardContent className="py-4">
            <p className="text-sm font-medium text-destructive">
              Your previous submission was returned for revision:
            </p>
            <p className="mt-1 text-sm text-muted-foreground">{submission.rejectionReason}</p>
          </CardContent>
        </Card>
      )}

      <OnboardingWizard supplierId={supplier.supplierId} submission={submission} />
    </div>
  );
}

export default async function PortalOnboardingPage() {
  const ctx = await getRequestContext();

  return (
    <Suspense fallback={<LoadingSkeleton />}>
      <OnboardingPageContent ctx={ctx} />
    </Suspense>
  );
}
