'use client';

import { useState, useTransition, useCallback } from 'react';
import {
  saveOnboardingDraftAction,
  submitOnboardingAction,
} from '@/features/portal/actions/portal.actions';
import type {
  PortalOnboardingSubmission,
  OnboardingStep,
} from '@/features/portal/queries/portal.queries';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import {
  Building2,
  Landmark,
  ShieldCheck,
  FileText,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Save,
  Send,
  AlertCircle,
} from 'lucide-react';
import { useRouter } from 'next/navigation';

// ─── Constants ──────────────────────────────────────────────────────────────

const STEPS: {
  key: OnboardingStep;
  label: string;
  description: string;
  icon: React.ElementType;
}[] = [
  {
    key: 'company_info',
    label: 'Company Information',
    description: 'General business details',
    icon: Building2,
  },
  {
    key: 'bank_details',
    label: 'Bank Details',
    description: 'Payment account information',
    icon: Landmark,
  },
  {
    key: 'kyc_documents',
    label: 'KYC Documents',
    description: 'Identity & compliance documents',
    icon: ShieldCheck,
  },
  {
    key: 'tax_registration',
    label: 'Tax Registration',
    description: 'Tax identification details',
    icon: FileText,
  },
  {
    key: 'review',
    label: 'Review & Submit',
    description: 'Verify all information',
    icon: CheckCircle2,
  },
];

const REQUIRED_STEPS: OnboardingStep[] = [
  'company_info',
  'bank_details',
  'kyc_documents',
  'tax_registration',
];

// ─── Types ──────────────────────────────────────────────────────────────────

interface OnboardingWizardProps {
  supplierId: string;
  submission: PortalOnboardingSubmission;
}

type DraftData = Record<string, unknown>;

// ─── Step Stepper ───────────────────────────────────────────────────────────

function StepIndicator({
  steps,
  currentIndex,
  completedSteps,
}: {
  steps: typeof STEPS;
  currentIndex: number;
  completedSteps: OnboardingStep[];
}) {
  const progress = (completedSteps.length / REQUIRED_STEPS.length) * 100;

  return (
    <div className="space-y-4">
      <Progress value={progress} className="h-2" />
      <div className="flex justify-between">
        {steps.map((step, idx) => {
          const isCompleted = completedSteps.includes(step.key);
          const isCurrent = idx === currentIndex;
          const Icon = step.icon;

          return (
            <div
              key={step.key}
              className={cn(
                'flex flex-col items-center gap-1 text-center',
                isCurrent && 'text-primary',
                isCompleted && !isCurrent && 'text-emerald-600 dark:text-emerald-400',
                !isCurrent && !isCompleted && 'text-muted-foreground'
              )}
            >
              <div
                className={cn(
                  'flex h-10 w-10 items-center justify-center rounded-full border-2 transition-colors',
                  isCurrent && 'border-primary bg-primary/10',
                  isCompleted &&
                    !isCurrent &&
                    'border-emerald-500 bg-emerald-50 dark:bg-emerald-950',
                  !isCurrent && !isCompleted && 'border-muted-foreground/30'
                )}
              >
                {isCompleted && !isCurrent ? (
                  <CheckCircle2 className="h-5 w-5" />
                ) : (
                  <Icon className="h-5 w-5" aria-hidden="true" />
                )}
              </div>
              <span className="hidden text-xs font-medium sm:block">{step.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Company Info Step ──────────────────────────────────────────────────────

function CompanyInfoForm({
  draft,
  onChange,
}: {
  draft: DraftData;
  onChange: (data: DraftData) => void;
}) {
  const update = (field: string, value: string) => {
    onChange({ ...draft, [field]: value });
  };

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div className="space-y-2">
        <Label htmlFor="companyName">Company Legal Name *</Label>
        <Input
          id="companyName"
          placeholder="Enter registered company name"
          value={(draft.companyName as string) ?? ''}
          onChange={(e) => update('companyName', e.target.value)}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="tradingName">Trading Name</Label>
        <Input
          id="tradingName"
          placeholder="If different from legal name"
          value={(draft.tradingName as string) ?? ''}
          onChange={(e) => update('tradingName', e.target.value)}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="registrationNumber">Registration Number *</Label>
        <Input
          id="registrationNumber"
          placeholder="Company registration / CR number"
          value={(draft.registrationNumber as string) ?? ''}
          onChange={(e) => update('registrationNumber', e.target.value)}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="country">Country of Registration *</Label>
        <Input
          id="country"
          placeholder="e.g. Saudi Arabia"
          value={(draft.country as string) ?? ''}
          onChange={(e) => update('country', e.target.value)}
        />
      </div>
      <div className="space-y-2 sm:col-span-2">
        <Label htmlFor="address">Registered Address *</Label>
        <Textarea
          id="address"
          placeholder="Full registered address"
          rows={3}
          value={(draft.address as string) ?? ''}
          onChange={(e) => update('address', e.target.value)}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="contactName">Primary Contact Name *</Label>
        <Input
          id="contactName"
          placeholder="Full name"
          value={(draft.contactName as string) ?? ''}
          onChange={(e) => update('contactName', e.target.value)}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="contactEmail">Contact Email *</Label>
        <Input
          id="contactEmail"
          type="email"
          placeholder="email@company.com"
          value={(draft.contactEmail as string) ?? ''}
          onChange={(e) => update('contactEmail', e.target.value)}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="contactPhone">Contact Phone</Label>
        <Input
          id="contactPhone"
          type="tel"
          placeholder="+966 ..."
          value={(draft.contactPhone as string) ?? ''}
          onChange={(e) => update('contactPhone', e.target.value)}
        />
      </div>
    </div>
  );
}

// ─── Bank Details Step ──────────────────────────────────────────────────────

function BankDetailsForm({
  draft,
  onChange,
}: {
  draft: DraftData;
  onChange: (data: DraftData) => void;
}) {
  const update = (field: string, value: string) => {
    onChange({ ...draft, [field]: value });
  };

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div className="space-y-2">
        <Label htmlFor="bankName">Bank Name *</Label>
        <Input
          id="bankName"
          placeholder="Bank institution name"
          value={(draft.bankName as string) ?? ''}
          onChange={(e) => update('bankName', e.target.value)}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="accountName">Account Holder Name *</Label>
        <Input
          id="accountName"
          placeholder="Name on the account"
          value={(draft.accountName as string) ?? ''}
          onChange={(e) => update('accountName', e.target.value)}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="iban">IBAN *</Label>
        <Input
          id="iban"
          placeholder="SA..."
          value={(draft.iban as string) ?? ''}
          onChange={(e) => update('iban', e.target.value)}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="swiftCode">SWIFT / BIC Code *</Label>
        <Input
          id="swiftCode"
          placeholder="e.g. RIBLSARI"
          value={(draft.swiftCode as string) ?? ''}
          onChange={(e) => update('swiftCode', e.target.value)}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="accountNumber">Account Number</Label>
        <Input
          id="accountNumber"
          placeholder="If different from IBAN"
          value={(draft.accountNumber as string) ?? ''}
          onChange={(e) => update('accountNumber', e.target.value)}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="currency">Currency *</Label>
        <Input
          id="currency"
          placeholder="e.g. SAR"
          value={(draft.currency as string) ?? ''}
          onChange={(e) => update('currency', e.target.value)}
        />
      </div>
    </div>
  );
}

// ─── KYC Documents Step ─────────────────────────────────────────────────────

function KycDocumentsForm({
  draft,
  onChange,
}: {
  draft: DraftData;
  onChange: (data: DraftData) => void;
}) {
  const update = (field: string, value: string) => {
    onChange({ ...draft, [field]: value });
  };

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">
        Provide references to the required identity and compliance documents. Document uploads will
        be available in the Documents section after onboarding is approved.
      </p>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="commercialRegistration">Commercial Registration Number *</Label>
          <Input
            id="commercialRegistration"
            placeholder="CR number"
            value={(draft.commercialRegistration as string) ?? ''}
            onChange={(e) => update('commercialRegistration', e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="crExpiryDate">CR Expiry Date *</Label>
          <Input
            id="crExpiryDate"
            type="date"
            value={(draft.crExpiryDate as string) ?? ''}
            onChange={(e) => update('crExpiryDate', e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="nationalId">Authorized Person National ID *</Label>
          <Input
            id="nationalId"
            placeholder="National ID / Iqama number"
            value={(draft.nationalId as string) ?? ''}
            onChange={(e) => update('nationalId', e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="chamberOfCommerce">Chamber of Commerce Membership</Label>
          <Input
            id="chamberOfCommerce"
            placeholder="Membership number (if applicable)"
            value={(draft.chamberOfCommerce as string) ?? ''}
            onChange={(e) => update('chamberOfCommerce', e.target.value)}
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="kycNotes">Additional Notes</Label>
        <Textarea
          id="kycNotes"
          placeholder="Any additional KYC-related notes..."
          rows={3}
          value={(draft.kycNotes as string) ?? ''}
          onChange={(e) => update('kycNotes', e.target.value)}
        />
      </div>
    </div>
  );
}

// ─── Tax Registration Step ──────────────────────────────────────────────────

function TaxRegistrationForm({
  draft,
  onChange,
}: {
  draft: DraftData;
  onChange: (data: DraftData) => void;
}) {
  const update = (field: string, value: string) => {
    onChange({ ...draft, [field]: value });
  };

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div className="space-y-2">
        <Label htmlFor="vatNumber">VAT Registration Number *</Label>
        <Input
          id="vatNumber"
          placeholder="VAT number"
          value={(draft.vatNumber as string) ?? ''}
          onChange={(e) => update('vatNumber', e.target.value)}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="taxId">Tax Identification Number *</Label>
        <Input
          id="taxId"
          placeholder="TIN"
          value={(draft.taxId as string) ?? ''}
          onChange={(e) => update('taxId', e.target.value)}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="zakatCertificate">Zakat Certificate Number</Label>
        <Input
          id="zakatCertificate"
          placeholder="If applicable"
          value={(draft.zakatCertificate as string) ?? ''}
          onChange={(e) => update('zakatCertificate', e.target.value)}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="zakatExpiry">Zakat Certificate Expiry</Label>
        <Input
          id="zakatExpiry"
          type="date"
          value={(draft.zakatExpiry as string) ?? ''}
          onChange={(e) => update('zakatExpiry', e.target.value)}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="whtRate">Withholding Tax Rate (%)</Label>
        <Input
          id="whtRate"
          type="number"
          min="0"
          max="100"
          step="0.01"
          placeholder="e.g. 5"
          value={(draft.whtRate as string) ?? ''}
          onChange={(e) => update('whtRate', e.target.value)}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="gosi">GOSI Certificate Number</Label>
        <Input
          id="gosi"
          placeholder="If applicable"
          value={(draft.gosi as string) ?? ''}
          onChange={(e) => update('gosi', e.target.value)}
        />
      </div>
    </div>
  );
}

// ─── Review Step ────────────────────────────────────────────────────────────

function ReviewStep({
  submission,
  drafts,
}: {
  submission: PortalOnboardingSubmission;
  drafts: Record<OnboardingStep, DraftData>;
}) {
  const allComplete = REQUIRED_STEPS.every((s) => submission.completedSteps.includes(s));

  return (
    <div className="space-y-6">
      {!allComplete && (
        <div className="flex items-start gap-3 rounded-lg border border-warning/30 bg-warning/10 p-4">
          <AlertCircle className="mt-0.5 h-5 w-5 text-warning" />
          <div>
            <p className="text-sm font-medium text-warning-foreground">Incomplete Steps</p>
            <p className="mt-1 text-sm text-warning">
              Please go back and complete all required steps before submitting. Missing:{' '}
              {REQUIRED_STEPS.filter((s) => !submission.completedSteps.includes(s))
                .map((s) => STEPS.find((st) => st.key === s)?.label)
                .join(', ')}
            </p>
          </div>
        </div>
      )}

      {REQUIRED_STEPS.map((stepKey) => {
        const step = STEPS.find((s) => s.key === stepKey)!;
        const draft = drafts[stepKey];
        const isComplete = submission.completedSteps.includes(stepKey);
        const Icon = step.icon;

        return (
          <Card key={stepKey} className={cn(!isComplete && 'opacity-60')}>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Icon className="h-4 w-4" aria-hidden="true" />
                <CardTitle className="text-base">{step.label}</CardTitle>
                {isComplete ? (
                  <CheckCircle2 className="ml-auto h-4 w-4 text-emerald-500" />
                ) : (
                  <span className="ml-auto text-xs text-muted-foreground">Not completed</span>
                )}
              </div>
            </CardHeader>
            {isComplete && Object.keys(draft).length > 0 && (
              <CardContent>
                <dl className="grid gap-2 text-sm sm:grid-cols-2">
                  {Object.entries(draft).map(([key, value]) => (
                    <div key={key}>
                      <dt className="font-medium capitalize text-muted-foreground">
                        {key.replace(/([A-Z])/g, ' $1').trim()}
                      </dt>
                      <dd className="mt-0.5">{String(value || '\u2014')}</dd>
                    </div>
                  ))}
                </dl>
              </CardContent>
            )}
          </Card>
        );
      })}
    </div>
  );
}

// ─── Main Wizard ────────────────────────────────────────────────────────────

export function OnboardingWizard({ supplierId, submission }: OnboardingWizardProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Track current step index
  const initialIndex = STEPS.findIndex((s) => s.key === submission.currentStep);
  const [stepIndex, setStepIndex] = useState(Math.max(0, initialIndex));

  // Track local draft state per step (hydrated from server submission)
  const [drafts, setDrafts] = useState<Record<OnboardingStep, DraftData>>({
    company_info: (submission.companyInfoDraft as DraftData) ?? {},
    bank_details: (submission.bankDetailsDraft as DraftData) ?? {},
    kyc_documents: (submission.kycDocumentsDraft as DraftData) ?? {},
    tax_registration: (submission.taxRegistrationDraft as DraftData) ?? {},
    review: {},
  });

  const [completedSteps, setCompletedSteps] = useState<OnboardingStep[]>(
    submission.completedSteps ?? []
  );
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const currentStep = STEPS[stepIndex]!;
  const isFirstStep = stepIndex === 0;
  const isLastStep = stepIndex === STEPS.length - 1;
  const isReviewStep = currentStep.key === 'review';

  const updateDraft = useCallback(
    (data: DraftData) => {
      setDrafts((prev) => ({ ...prev, [currentStep.key]: data }));
    },
    [currentStep.key]
  );

  // Save current step draft to server
  const saveDraft = useCallback(
    async (stepKey?: OnboardingStep) => {
      const key = stepKey ?? currentStep.key;
      if (key === 'review') return true;

      setError(null);

      return new Promise<boolean>((resolve) => {
        startTransition(async () => {
          const result = await saveOnboardingDraftAction(supplierId, key, drafts[key]);
          if (result.ok) {
            setCompletedSteps(result.value.completedSteps);
            setSuccessMessage('Draft saved');
            setTimeout(() => setSuccessMessage(null), 2000);
            resolve(true);
          } else {
            setError(result.error.message);
            resolve(false);
          }
        });
      });
    },
    [currentStep.key, drafts, supplierId]
  );

  const handleNext = useCallback(async () => {
    if (isLastStep) return;
    const saved = await saveDraft();
    if (saved) {
      setStepIndex((i) => i + 1);
    }
  }, [isLastStep, saveDraft]);

  const handlePrev = useCallback(() => {
    if (isFirstStep) return;
    setStepIndex((i) => i - 1);
  }, [isFirstStep]);

  const handleSubmit = useCallback(() => {
    setError(null);
    startTransition(async () => {
      const result = await submitOnboardingAction(supplierId);
      if (result.ok) {
        router.refresh();
      } else {
        setError(result.error.message);
      }
    });
  }, [supplierId, router]);

  const allRequiredComplete = REQUIRED_STEPS.every((s) => completedSteps.includes(s));

  return (
    <div className="space-y-6">
      {/* Step indicator */}
      <Card>
        <CardContent className="pt-6">
          <StepIndicator steps={STEPS} currentIndex={stepIndex} completedSteps={completedSteps} />
        </CardContent>
      </Card>

      {/* Status messages */}
      {error && (
        <div className="flex items-start gap-3 rounded-lg border border-destructive/50 bg-destructive/5 p-4">
          <AlertCircle className="mt-0.5 h-5 w-5 text-destructive" />
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}
      {successMessage && (
        <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-3 dark:border-emerald-800 dark:bg-emerald-950">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          <p className="text-sm text-emerald-700 dark:text-emerald-300">{successMessage}</p>
        </div>
      )}

      {/* Step content */}
      <Card>
        <CardHeader>
          <CardTitle>{currentStep.label}</CardTitle>
          <CardDescription>{currentStep.description}</CardDescription>
        </CardHeader>
        <CardContent>
          {currentStep.key === 'company_info' && (
            <CompanyInfoForm draft={drafts.company_info} onChange={updateDraft} />
          )}
          {currentStep.key === 'bank_details' && (
            <BankDetailsForm draft={drafts.bank_details} onChange={updateDraft} />
          )}
          {currentStep.key === 'kyc_documents' && (
            <KycDocumentsForm draft={drafts.kyc_documents} onChange={updateDraft} />
          )}
          {currentStep.key === 'tax_registration' && (
            <TaxRegistrationForm draft={drafts.tax_registration} onChange={updateDraft} />
          )}
          {currentStep.key === 'review' && (
            <ReviewStep submission={{ ...submission, completedSteps }} drafts={drafts} />
          )}
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Button variant="outline" onClick={handlePrev} disabled={isFirstStep || isPending}>
          <ChevronLeft className="mr-1 h-4 w-4" />
          Previous
        </Button>

        <div className="flex items-center gap-2">
          {!isReviewStep && (
            <Button variant="ghost" onClick={() => saveDraft()} disabled={isPending}>
              {isPending ? (
                <Loader2 className="mr-1 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-1 h-4 w-4" />
              )}
              Save Draft
            </Button>
          )}

          {isReviewStep ? (
            <Button onClick={handleSubmit} disabled={isPending || !allRequiredComplete}>
              {isPending ? (
                <Loader2 className="mr-1 h-4 w-4 animate-spin" />
              ) : (
                <Send className="mr-1 h-4 w-4" />
              )}
              Submit for Review
            </Button>
          ) : (
            <Button onClick={handleNext} disabled={isPending}>
              {isPending ? (
                <Loader2 className="mr-1 h-4 w-4 animate-spin" />
              ) : (
                <>
                  Next
                  <ChevronRight className="ml-1 h-4 w-4" />
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
