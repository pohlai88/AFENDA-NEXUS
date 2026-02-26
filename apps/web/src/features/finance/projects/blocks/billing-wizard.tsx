'use client';

import { useState, useTransition } from 'react';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { DatePickerWithRange } from '@/components/ui/date-picker';
import { Progress } from '@/components/ui/progress';
import { formatCurrency, formatDate } from '@/lib/utils';
import {
  ChevronLeft,
  ChevronRight,
  Receipt,
  Target,
  Clock,
  DollarSign,
  CheckCircle2,
  ArrowRight,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';
import { generateBillingPreview, submitBillingWizard } from '../actions/projects.actions';
import type { Project, ProjectMilestone, WIPCalculation } from '../types';
import { milestoneStatusConfig } from '../types';

type BillingType = 'milestone' | 'progress' | 'time_materials' | 'final';

interface WizardStep {
  id: string;
  title: string;
  description: string;
}

const STEPS: WizardStep[] = [
  { id: 'type', title: 'Billing Type', description: 'Select the type of billing' },
  { id: 'details', title: 'Billing Details', description: 'Configure billing parameters' },
  { id: 'preview', title: 'Preview', description: 'Review billing line items' },
  { id: 'confirm', title: 'Confirm', description: 'Generate invoice' },
];

interface BillingWizardProps {
  project: Project;
  milestones: ProjectMilestone[];
  wip: WIPCalculation;
}

export function BillingWizard({ project, milestones, wip }: BillingWizardProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [currentStep, setCurrentStep] = useState(0);
  const [billingType, setBillingType] = useState<BillingType>('milestone');
  const [selectedMilestones, setSelectedMilestones] = useState<string[]>([]);
  const [progressPercentage, setProgressPercentage] = useState(wip.percentComplete);
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date } | undefined>();
  const [customAmount, setCustomAmount] = useState<number>(0);
  const [notes, setNotes] = useState('');
  const [preview, setPreview] = useState<{
    lineItems: Array<{ description: string; amount: number }>;
    totalAmount: number;
    taxes: number;
    grandTotal: number;
  } | null>(null);
  const [createInvoice, setCreateInvoice] = useState(true);

  const pendingMilestones = milestones.filter((m) => m.status === 'completed' && !selectedMilestones.includes(m.id));
  const selectedMilestoneData = milestones.filter((m) => selectedMilestones.includes(m.id));

  const handleNext = async () => {
    if (currentStep === 2) {
      startTransition(async () => {
        const result = await generateBillingPreview({
          projectId: project.id,
          billingType,
          selectedMilestones: billingType === 'milestone' ? selectedMilestones : undefined,
          progressPercentage: billingType === 'progress' ? progressPercentage : undefined,
          dateRange: billingType === 'time_materials' ? dateRange : undefined,
          customAmount: billingType === 'final' ? customAmount : undefined,
          notes,
        });

        if (result.ok) {
          setPreview(result.preview);
          setCurrentStep(currentStep + 1);
        } else {
          toast.error(result.error);
        }
      });
    } else {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    setCurrentStep(currentStep - 1);
  };

  const handleSubmit = () => {
    startTransition(async () => {
      const result = await submitBillingWizard({
        projectId: project.id,
        billingType,
        selectedMilestones: billingType === 'milestone' ? selectedMilestones : undefined,
        progressPercentage: billingType === 'progress' ? progressPercentage : undefined,
        dateRange: billingType === 'time_materials' ? dateRange : undefined,
        customAmount: billingType === 'final' ? customAmount : undefined,
        notes,
      });

      if (result.ok) {
        toast.success('Billing created successfully');
        if (result.invoiceId) {
          toast.info(`Invoice ${result.invoiceId} generated`);
        }
        router.push(`/finance/projects/${project.id}`);
      } else {
        toast.error(result.error);
      }
    });
  };

  const toggleMilestone = (id: string) => {
    setSelectedMilestones((prev) =>
      prev.includes(id) ? prev.filter((m) => m !== id) : [...prev, id]
    );
  };

  const canProceed = () => {
    switch (currentStep) {
      case 0:
        return billingType !== null;
      case 1:
        if (billingType === 'milestone') return selectedMilestones.length > 0;
        if (billingType === 'progress') return progressPercentage > 0;
        if (billingType === 'time_materials') return dateRange !== undefined;
        if (billingType === 'final') return customAmount > 0 || wip.wipBalance > 0;
        return false;
      case 2:
        return preview !== null;
      default:
        return true;
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <ChevronLeft className="h-4 w-4" />
        <span
          className="hover:text-foreground cursor-pointer"
          onClick={() => router.push(`/finance/projects/${project.id}`)}
        >
          {project.name}
        </span>
      </div>

      <div>
        <h1 className="text-2xl font-bold tracking-tight">Create Billing</h1>
        <p className="text-muted-foreground">Generate billing for project {project.projectNumber}</p>
      </div>

      {/* Progress */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          {STEPS.map((step, index) => (
            <div
              key={step.id}
              className={cn('flex items-center gap-2',
                index <= currentStep ? 'text-foreground' : 'text-muted-foreground'
              )}
            >
              <div
                className={cn('h-6 w-6 rounded-full flex items-center justify-center text-xs',
                  index < currentStep
                    ? 'bg-primary text-primary-foreground'
                    : index === currentStep
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted'
                )}
              >
                {index < currentStep ? <CheckCircle2 className="h-4 w-4" /> : index + 1}
              </div>
              <span className="hidden sm:inline">{step.title}</span>
            </div>
          ))}
        </div>
        <Progress value={((currentStep + 1) / STEPS.length) * 100} className="h-2" />
      </div>

      {/* Step Content */}
      <Card>
        <CardHeader>
          <CardTitle>{STEPS[currentStep]?.title}</CardTitle>
          <CardDescription>{STEPS[currentStep]?.description}</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Step 0: Billing Type */}
          {currentStep === 0 && (
            <RadioGroup
              value={billingType}
              onValueChange={(v) => setBillingType(v as BillingType)}
              className="space-y-3"
            >
              <div className="flex items-start space-x-3 p-4 border rounded-lg cursor-pointer hover:bg-accent">
                <RadioGroupItem value="milestone" id="milestone" />
                <div className="flex-1">
                  <Label htmlFor="milestone" className="cursor-pointer">
                    <div className="flex items-center gap-2">
                      <Target className="h-4 w-4" />
                      Milestone-Based
                    </div>
                  </Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    Bill for completed project milestones
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3 p-4 border rounded-lg cursor-pointer hover:bg-accent">
                <RadioGroupItem value="progress" id="progress" />
                <div className="flex-1">
                  <Label htmlFor="progress" className="cursor-pointer">
                    <div className="flex items-center gap-2">
                      <Receipt className="h-4 w-4" />
                      Progress Billing
                    </div>
                  </Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    Bill based on percentage of completion
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3 p-4 border rounded-lg cursor-pointer hover:bg-accent">
                <RadioGroupItem value="time_materials" id="time_materials" />
                <div className="flex-1">
                  <Label htmlFor="time_materials" className="cursor-pointer">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      Time & Materials
                    </div>
                  </Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    Bill for time and expenses within a date range
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3 p-4 border rounded-lg cursor-pointer hover:bg-accent">
                <RadioGroupItem value="final" id="final" />
                <div className="flex-1">
                  <Label htmlFor="final" className="cursor-pointer">
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4" />
                      Final Billing
                    </div>
                  </Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    Final invoice including remaining WIP
                  </p>
                </div>
              </div>
            </RadioGroup>
          )}

          {/* Step 1: Details */}
          {currentStep === 1 && (
            <div className="space-y-6">
              {billingType === 'milestone' && (
                <div className="space-y-4">
                  <Label>Select Completed Milestones</Label>
                  <div className="space-y-2">
                    {milestones.filter((m) => m.status === 'completed').length === 0 ? (
                      <p className="text-muted-foreground text-sm">No completed milestones available for billing.</p>
                    ) : (
                      milestones
                        .filter((m) => m.status === 'completed')
                        .map((milestone) => (
                          <div
                            key={milestone.id}
                            className="flex items-center space-x-3 p-3 border rounded-lg cursor-pointer hover:bg-accent"
                            onClick={() => toggleMilestone(milestone.id)}
                          >
                            <Checkbox
                              checked={selectedMilestones.includes(milestone.id)}
                              onCheckedChange={() => toggleMilestone(milestone.id)}
                            />
                            <div className="flex-1">
                              <div className="font-medium">{milestone.name}</div>
                              <div className="text-sm text-muted-foreground">
                                Completed: {formatDate(milestone.completedDate!)}
                              </div>
                            </div>
                            <div className="font-mono">
                              {formatCurrency(milestone.billingAmount, project.currency)}
                            </div>
                          </div>
                        ))
                    )}
                  </div>
                  {selectedMilestones.length > 0 && (
                    <div className="flex justify-between p-3 bg-muted rounded-lg">
                      <span className="font-medium">Total Selected</span>
                      <span className="font-mono font-bold">
                        {formatCurrency(
                          selectedMilestoneData.reduce((sum, m) => sum + m.billingAmount, 0),
                          project.currency
                        )}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {billingType === 'progress' && (
                <div className="space-y-4">
                  <div>
                    <Label>Current Progress: {wip.percentComplete}%</Label>
                    <Progress value={wip.percentComplete} className="h-3 mt-2" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="progress">Bill to Percentage</Label>
                      <Input
                        id="progress"
                        type="number"
                        min={0}
                        max={100}
                        value={progressPercentage}
                        onChange={(e) => setProgressPercentage(Number(e.target.value))}
                      />
                    </div>
                    <div>
                      <Label>Calculated Amount</Label>
                      <div className="h-10 flex items-center font-mono text-lg">
                        {formatCurrency(
                          (progressPercentage / 100) * project.contractValue - wip.billedToDate,
                          project.currency
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {billingType === 'time_materials' && (
                <div className="space-y-4">
                  <div>
                    <Label>Billing Period</Label>
                    <DatePickerWithRange
                      value={dateRange}
                      onChange={(range) => setDateRange(range as { from: Date; to: Date })}
                    />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    All billable time entries and expenses within this period will be included.
                  </p>
                </div>
              )}

              {billingType === 'final' && (
                <div className="space-y-4">
                  <div className="p-4 bg-muted rounded-lg space-y-2">
                    <div className="flex justify-between">
                      <span>Contract Value</span>
                      <span className="font-mono">
                        {formatCurrency(project.contractValue, project.currency)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Billed to Date</span>
                      <span className="font-mono">
                        {formatCurrency(wip.billedToDate, project.currency)}
                      </span>
                    </div>
                    <Separator />
                    <div className="flex justify-between font-medium">
                      <span>Remaining Balance</span>
                      <span className="font-mono">
                        {formatCurrency(project.contractValue - wip.billedToDate, project.currency)}
                      </span>
                    </div>
                    <div className="flex justify-between text-amber-600">
                      <span>WIP Adjustment</span>
                      <span className="font-mono">
                        {formatCurrency(wip.wipBalance, project.currency)}
                      </span>
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="custom">Custom Adjustment (optional)</Label>
                    <Input
                      id="custom"
                      type="number"
                      value={customAmount}
                      onChange={(e) => setCustomAmount(Number(e.target.value))}
                      placeholder="0.00"
                    />
                  </div>
                </div>
              )}

              <div>
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Additional notes for the invoice..."
                  rows={3}
                />
              </div>
            </div>
          )}

          {/* Step 2: Preview */}
          {currentStep === 2 && (
            <div className="space-y-4">
              <p className="text-muted-foreground">
                Click "Generate Preview" to see the billing line items.
              </p>
              {!preview && (
                <Button onClick={handleNext} disabled={isPending}>
                  {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Generate Preview
                </Button>
              )}
            </div>
          )}

          {/* Step 3: Confirm */}
          {currentStep === 3 && preview && (
            <div className="space-y-4">
              <div className="border rounded-lg overflow-hidden">
                <div className="bg-muted p-3 font-medium">Billing Line Items</div>
                <div className="divide-y">
                  {preview.lineItems.map((item, index) => (
                    <div key={index} className="p-3 flex justify-between">
                      <span>{item.description}</span>
                      <span className="font-mono">{formatCurrency(item.amount, project.currency)}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-4 bg-muted rounded-lg space-y-2">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="font-mono">{formatCurrency(preview.totalAmount, project.currency)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Taxes</span>
                  <span className="font-mono">{formatCurrency(preview.taxes, project.currency)}</span>
                </div>
                <Separator />
                <div className="flex justify-between font-bold text-lg">
                  <span>Grand Total</span>
                  <span className="font-mono">{formatCurrency(preview.grandTotal, project.currency)}</span>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="createInvoice"
                  checked={createInvoice}
                  onCheckedChange={(checked) => setCreateInvoice(!!checked)}
                />
                <Label htmlFor="createInvoice">Automatically create AR invoice</Label>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between">
        <Button variant="outline" onClick={handleBack} disabled={currentStep === 0 || isPending}>
          <ChevronLeft className="mr-2 h-4 w-4" />
          Back
        </Button>

        {currentStep < STEPS.length - 1 ? (
          currentStep !== 2 && (
            <Button onClick={handleNext} disabled={!canProceed() || isPending}>
              Next
              <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          )
        ) : (
          <Button onClick={handleSubmit} disabled={isPending}>
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {createInvoice ? 'Create Billing & Invoice' : 'Create Billing'}
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
