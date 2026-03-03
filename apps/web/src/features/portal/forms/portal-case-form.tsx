'use client';

import { useTransition, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { routes } from '@/lib/constants';
import { createCaseAction } from '../actions/portal.actions';
import { Loader2 } from 'lucide-react';

const CASE_CATEGORIES = [
  { value: 'PAYMENT', label: 'Payment' },
  { value: 'INVOICE', label: 'Invoice' },
  { value: 'COMPLIANCE', label: 'Compliance' },
  { value: 'DELIVERY', label: 'Delivery' },
  { value: 'QUALITY', label: 'Quality' },
  { value: 'ONBOARDING', label: 'Onboarding' },
  { value: 'GENERAL', label: 'General' },
  { value: 'ESCALATION', label: 'Escalation' },
] as const;

const CASE_PRIORITIES = [
  { value: 'LOW', label: 'Low' },
  { value: 'MEDIUM', label: 'Medium' },
  { value: 'HIGH', label: 'High' },
  { value: 'CRITICAL', label: 'Critical' },
] as const;

interface PortalCaseFormProps {
  supplierId: string;
}

export function PortalCaseForm({ supplierId }: PortalCaseFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [subject, setSubject] = useState('');
  const [category, setCategory] = useState('');
  const [priority, setPriority] = useState('MEDIUM');
  const [description, setDescription] = useState('');

  function handleSubmit() {
    setError(null);

    if (!subject || subject.trim().length < 5) {
      setError('Subject must be at least 5 characters.');
      return;
    }
    if (!category) {
      setError('Please select a category.');
      return;
    }
    if (!description || description.trim().length < 10) {
      setError('Description must be at least 10 characters.');
      return;
    }

    startTransition(async () => {
      const result = await createCaseAction(supplierId, {
        subject,
        category,
        priority,
        description,
      });

      if (!result.ok) {
        setError(result.error.message);
        return;
      }

      router.push(routes.portal.caseDetail(result.value.id));
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Case Details</CardTitle>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="caseSubject">Subject</Label>
            <Input
              id="caseSubject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Brief description of the issue"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="caseCategory">Category</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger id="caseCategory">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {CASE_CATEGORIES.map((c) => (
                  <SelectItem key={c.value} value={c.value}>
                    {c.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="casePriority">Priority</Label>
            <Select value={priority} onValueChange={setPriority}>
              <SelectTrigger id="casePriority">
                <SelectValue placeholder="Select priority" />
              </SelectTrigger>
              <SelectContent>
                {CASE_PRIORITIES.map((p) => (
                  <SelectItem key={p.value} value={p.value}>
                    {p.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="caseDescription">Description</Label>
            <Textarea
              id="caseDescription"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the issue in detail..."
              rows={5}
            />
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <Button variant="outline" onClick={() => router.push(routes.portal.cases)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isPending}>
            {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Submit Case
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
