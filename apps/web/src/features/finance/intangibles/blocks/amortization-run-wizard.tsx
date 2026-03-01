'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn, formatCurrency } from '@/lib/utils';
import { routes } from '@/lib/constants';
import { toast } from 'sonner';
import {
  Calculator,
  Calendar,
  CheckCircle,
  ChevronRight,
  FileText,
  Loader2,
  Play,
  AlertTriangle,
} from 'lucide-react';
import { PostingPreview, type PostingPreviewData } from '@/components/erp/posting-preview';
import {
  calculateAmortization,
  postAmortizationRun,
  previewAmortizationRunAction,
} from '../actions/intangibles.actions';

// ─── Step Indicator ──────────────────────────────────────────────────────────

interface StepIndicatorProps {
  currentStep: number;
  steps: string[];
}

function StepIndicator({ currentStep, steps }: StepIndicatorProps) {
  return (
    <div className="flex items-center justify-center gap-2 mb-6">
      {steps.map((step, index) => (
        <div key={step} className="flex items-center">
          <div
            className={cn(
              'flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium',
              index < currentStep
                ? 'bg-primary text-primary-foreground'
                : index === currentStep
                  ? 'bg-primary text-primary-foreground ring-2 ring-primary ring-offset-2'
                  : 'bg-muted text-muted-foreground'
            )}
          >
            {index < currentStep ? <CheckCircle className="h-4 w-4" /> : index + 1}
          </div>
          <span
            className={cn(
              'ml-2 text-sm hidden sm:inline',
              index === currentStep ? 'font-medium' : 'text-muted-foreground'
            )}
          >
            {step}
          </span>
          {index < steps.length - 1 && (
            <ChevronRight className="mx-2 h-4 w-4 text-muted-foreground" />
          )}
        </div>
      ))}
    </div>
  );
}

// ─── Period Selection Step ───────────────────────────────────────────────────

interface PeriodSelectionStepProps {
  selectedPeriod: string;
  onPeriodChange: (period: string) => void;
  onNext: () => void;
}

function PeriodSelectionStep({ selectedPeriod, onPeriodChange, onNext }: PeriodSelectionStepProps) {
  const currentYear = new Date().getFullYear();
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];
  const periods = months.map((month, index) => ({
    value: `${currentYear}-${String(index + 1).padStart(2, '0')}`,
    label: `${month} ${currentYear}`,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Select Period
        </CardTitle>
        <CardDescription>Choose the accounting period for the amortization run.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="amortPeriod">Accounting Period</Label>
          <Select value={selectedPeriod} onValueChange={onPeriodChange}>
            <SelectTrigger id="amortPeriod">
              <SelectValue placeholder="Select a period" />
            </SelectTrigger>
            <SelectContent>
              {periods.map((period) => (
                <SelectItem key={period.value} value={period.value}>
                  {period.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="rounded-lg border p-4 bg-warning/10 dark:bg-warning/20 space-y-2">
          <div className="flex items-center gap-2 text-warning dark:text-warning">
            <AlertTriangle className="h-4 w-4" />
            <span className="font-medium">Important</span>
          </div>
          <p className="text-sm text-muted-foreground">
            Ensure the previous period's amortization has been posted before running amortization
            for a new period.
          </p>
        </div>
      </CardContent>
      <CardFooter className="justify-end">
        <Button onClick={onNext} disabled={!selectedPeriod}>
          Calculate Amortization
          <ChevronRight className="ml-2 h-4 w-4" />
        </Button>
      </CardFooter>
    </Card>
  );
}

// ─── Calculation Step ────────────────────────────────────────────────────────

interface CalculationStepProps {
  selectedPeriod: string;
  onCalculated: (runId: string, assetCount: number, totalAmortization: number) => void;
  onBack: () => void;
}

function CalculationStep({ selectedPeriod, onCalculated, onBack }: CalculationStepProps) {
  const [isPending, startTransition] = useTransition();

  const handleCalculate = () => {
    const [year, month] = selectedPeriod.split('-').map(Number) as [number, number];
    const periodStart = new Date(year, month - 1, 1);
    const periodEnd = new Date(year, month, 0);

    startTransition(async () => {
      const result = await calculateAmortization({ periodStart, periodEnd });
      if (result.ok) {
        onCalculated(result.data.runId, result.data.assetCount, result.data.totalAmortization);
      } else {
        toast.error(result.error);
      }
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calculator className="h-5 w-5" />
          Calculate Amortization
        </CardTitle>
        <CardDescription>
          Calculating amortization for all active intangible assets in the selected period.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isPending ? (
          <div className="flex flex-col items-center justify-center py-12 space-y-4">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <p className="text-muted-foreground">Calculating amortization...</p>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 space-y-4">
            <Calculator className="h-12 w-12 text-muted-foreground" />
            <p className="text-muted-foreground">
              Ready to calculate amortization for {selectedPeriod.replace('-', '/')}.
            </p>
            <Button onClick={handleCalculate} size="lg">
              <Play className="mr-2 h-4 w-4" />
              Start Calculation
            </Button>
          </div>
        )}
      </CardContent>
      <CardFooter>
        <Button variant="outline" onClick={onBack} disabled={isPending}>
          Back
        </Button>
      </CardFooter>
    </Card>
  );
}

// ─── Review & Post Step ──────────────────────────────────────────────────────

interface ReviewPostStepProps {
  runId: string;
  assetCount: number;
  totalAmortization: number;
  selectedPeriod: string;
}

function ReviewPostStep({
  runId,
  assetCount,
  totalAmortization,
  selectedPeriod,
}: ReviewPostStepProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [previewData, setPreviewData] = useState<PostingPreviewData | null>(null);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);

  const handleLoadPreview = () => {
    setIsLoadingPreview(true);
    setPreviewError(null);
    const [year, month] = selectedPeriod.split('-').map(Number) as [number, number];
    const periodStart = new Date(year, month - 1, 1).toISOString();
    const periodEnd = new Date(year, month, 0).toISOString();

    startTransition(async () => {
      const result = await previewAmortizationRunAction(periodStart, periodEnd);
      setIsLoadingPreview(false);
      if (result.ok) {
        const preview = result.value;
        setPreviewData({
          ledgerName: preview.ledgerName,
          periodName: preview.periodName,
          currency: preview.currency,
          lines: preview.lines.map((l) => ({
            accountCode: l.accountCode,
            accountName: l.accountName,
            debit: Number(l.debit),
            credit: Number(l.credit),
            description: l.description,
          })),
          warnings: preview.warnings,
        });
      } else {
        setPreviewError(result.error.message);
      }
    });
  };

  const handlePost = async () => {
    const result = await postAmortizationRun(runId);
    if (result.ok) {
      toast.success(`Amortization posted. Journal ${result.data.journalNumber} created.`);
      router.push(routes.finance.intangibles);
    } else {
      toast.error(result.error);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Review & Post
        </CardTitle>
        <CardDescription>
          Review the calculated amortization and post to the general ledger.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="rounded-lg border p-6 bg-success/10 dark:bg-success/20">
          <div className="flex items-center gap-2 text-success mb-4">
            <CheckCircle className="h-5 w-5" />
            <span className="font-medium">Calculation Complete</span>
          </div>
          <div className="grid grid-cols-3 gap-6 text-center">
            <div>
              <div className="text-3xl font-bold">{assetCount}</div>
              <div className="text-sm text-muted-foreground">Assets</div>
            </div>
            <div>
              <div className="text-3xl font-bold font-mono text-destructive">
                {formatCurrency(totalAmortization, 'USD')}
              </div>
              <div className="text-sm text-muted-foreground">Total Amortization</div>
            </div>
            <div>
              <div className="text-lg font-medium">{selectedPeriod.replace('-', '/')}</div>
              <div className="text-sm text-muted-foreground">Period</div>
            </div>
          </div>
        </div>

        {!previewData && !previewError && (
          <div className="flex flex-col items-center gap-3 py-4">
            <p className="text-sm text-muted-foreground">
              Preview the journal entries that will be created before posting.
            </p>
            <Button variant="outline" onClick={handleLoadPreview} disabled={isLoadingPreview || isPending}>
              {isLoadingPreview ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Loading Preview...
                </>
              ) : (
                'Preview Journal Entries'
              )}
            </Button>
          </div>
        )}

        {previewError && (
          <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 rounded-md px-3 py-2" role="alert">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            {previewError}
          </div>
        )}

        {previewData && (
          <PostingPreview
            data={previewData}
            onConfirm={handlePost}
            title="Amortization Posting Preview"
            description="The following journal entries will debit amortization expense and credit accumulated amortization."
            confirmLabel="Post to GL"
          />
        )}
      </CardContent>
      {!previewData && (
        <CardFooter className="justify-end">
          <Button onClick={handleLoadPreview} disabled={isPending || isLoadingPreview}>
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Loading...
              </>
            ) : (
              <>
                <CheckCircle className="mr-2 h-4 w-4" />
                Preview & Post to GL
              </>
            )}
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}

// ─── Main Wizard Component ───────────────────────────────────────────────────

export function AmortizationRunWizard() {
  const [step, setStep] = useState(0);
  const [selectedPeriod, setSelectedPeriod] = useState('');
  const [runId, setRunId] = useState('');
  const [assetCount, setAssetCount] = useState(0);
  const [totalAmortization, setTotalAmortization] = useState(0);

  const steps = ['Select Period', 'Calculate', 'Review & Post'];

  const handleCalculated = (id: string, count: number, total: number) => {
    setRunId(id);
    setAssetCount(count);
    setTotalAmortization(total);
    setStep(2);
  };

  return (
    <div className="max-w-2xl mx-auto">
      <StepIndicator currentStep={step} steps={steps} />

      {step === 0 && (
        <PeriodSelectionStep
          selectedPeriod={selectedPeriod}
          onPeriodChange={setSelectedPeriod}
          onNext={() => setStep(1)}
        />
      )}

      {step === 1 && (
        <CalculationStep
          selectedPeriod={selectedPeriod}
          onCalculated={handleCalculated}
          onBack={() => setStep(0)}
        />
      )}

      {step === 2 && (
        <ReviewPostStep
          runId={runId}
          assetCount={assetCount}
          totalAmortization={totalAmortization}
          selectedPeriod={selectedPeriod}
        />
      )}
    </div>
  );
}
