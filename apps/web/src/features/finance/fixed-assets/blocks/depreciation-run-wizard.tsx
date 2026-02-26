'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn, formatCurrency, formatDate } from '@/lib/utils';
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
import type { DepreciationRun } from '../types';
import { depRunStatusConfig } from '../types';
import { calculateDepreciation, postDepreciationRun, cancelDepreciationRun } from '../actions/assets.actions';

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
    'July', 'August', 'September', 'October', 'November', 'December'
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
        <CardDescription>
          Choose the accounting period for the depreciation run.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="period">Accounting Period</Label>
          <Select value={selectedPeriod} onValueChange={onPeriodChange}>
            <SelectTrigger id="period">
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

        <div className="rounded-lg border p-4 bg-amber-50 dark:bg-amber-950 space-y-2">
          <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
            <AlertTriangle className="h-4 w-4" />
            <span className="font-medium">Important</span>
          </div>
          <p className="text-sm text-muted-foreground">
            Ensure the previous period's depreciation has been posted before running depreciation for a new period.
          </p>
        </div>
      </CardContent>
      <CardFooter className="justify-end">
        <Button onClick={onNext} disabled={!selectedPeriod}>
          Calculate Depreciation
          <ChevronRight className="ml-2 h-4 w-4" />
        </Button>
      </CardFooter>
    </Card>
  );
}

// ─── Calculation Step ────────────────────────────────────────────────────────

interface CalculationStepProps {
  selectedPeriod: string;
  onCalculated: (runId: string, assetCount: number, totalDepreciation: number) => void;
  onBack: () => void;
}

function CalculationStep({ selectedPeriod, onCalculated, onBack }: CalculationStepProps) {
  const [isPending, startTransition] = useTransition();

  const handleCalculate = () => {
    const [year, month] = selectedPeriod.split('-').map(Number) as [number, number];
    const periodStart = new Date(year, month - 1, 1);
    const periodEnd = new Date(year, month, 0);

    startTransition(async () => {
      const result = await calculateDepreciation({ periodStart, periodEnd });

      if (result.ok) {
        onCalculated(
          result.data.runId,
          result.data.assetCount,
          result.data.totalDepreciation
        );
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
          Calculate Depreciation
        </CardTitle>
        <CardDescription>
          Calculating depreciation for all active assets in the selected period.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isPending ? (
          <div className="flex flex-col items-center justify-center py-12 space-y-4">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <p className="text-muted-foreground">Calculating depreciation...</p>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 space-y-4">
            <Calculator className="h-12 w-12 text-muted-foreground" />
            <p className="text-muted-foreground">
              Ready to calculate depreciation for {selectedPeriod.replace('-', '/')}.
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
  totalDepreciation: number;
  selectedPeriod: string;
}

function ReviewPostStep({ runId, assetCount, totalDepreciation, selectedPeriod }: ReviewPostStepProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handlePost = () => {
    startTransition(async () => {
      const result = await postDepreciationRun(runId);

      if (result.ok) {
        toast.success(`Depreciation posted. Journal ${result.data.journalNumber} created.`);
        router.push(routes.finance.fixedAssets);
      } else {
        toast.error(result.error);
      }
    });
  };

  const handleCancel = () => {
    startTransition(async () => {
      const result = await cancelDepreciationRun(runId);

      if (result.ok) {
        toast.info('Depreciation run cancelled');
        router.push(routes.finance.fixedAssets);
      } else {
        toast.error(result.error);
      }
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Review & Post
        </CardTitle>
        <CardDescription>
          Review the calculated depreciation and post to the general ledger.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="rounded-lg border p-6 bg-green-50 dark:bg-green-950">
          <div className="flex items-center gap-2 text-green-600 dark:text-green-400 mb-4">
            <CheckCircle className="h-5 w-5" />
            <span className="font-medium">Calculation Complete</span>
          </div>

          <div className="grid grid-cols-3 gap-6 text-center">
            <div>
              <div className="text-3xl font-bold">{assetCount}</div>
              <div className="text-sm text-muted-foreground">Assets</div>
            </div>
            <div>
              <div className="text-3xl font-bold font-mono text-red-600 dark:text-red-400">
                {formatCurrency(totalDepreciation, 'USD')}
              </div>
              <div className="text-sm text-muted-foreground">Total Depreciation</div>
            </div>
            <div>
              <div className="text-lg font-medium">{selectedPeriod.replace('-', '/')}</div>
              <div className="text-sm text-muted-foreground">Period</div>
            </div>
          </div>
        </div>

        <div className="text-sm text-muted-foreground">
          Posting will create a journal entry debiting depreciation expense accounts and crediting accumulated depreciation accounts for each asset category.
        </div>
      </CardContent>
      <CardFooter className="justify-between">
        <Button variant="outline" onClick={handleCancel} disabled={isPending}>
          Cancel Run
        </Button>
        <Button onClick={handlePost} disabled={isPending}>
          {isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Posting...
            </>
          ) : (
            <>
              <CheckCircle className="mr-2 h-4 w-4" />
              Post to GL
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}

// ─── Main Wizard Component ───────────────────────────────────────────────────

export function DepreciationRunWizard() {
  const [step, setStep] = useState(0);
  const [selectedPeriod, setSelectedPeriod] = useState('');
  const [runId, setRunId] = useState('');
  const [assetCount, setAssetCount] = useState(0);
  const [totalDepreciation, setTotalDepreciation] = useState(0);

  const steps = ['Select Period', 'Calculate', 'Review & Post'];

  const handleCalculated = (id: string, count: number, total: number) => {
    setRunId(id);
    setAssetCount(count);
    setTotalDepreciation(total);
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
          totalDepreciation={totalDepreciation}
          selectedPeriod={selectedPeriod}
        />
      )}
    </div>
  );
}
