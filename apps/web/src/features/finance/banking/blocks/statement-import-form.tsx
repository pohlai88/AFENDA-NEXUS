'use client';

import { useState, useTransition } from 'react';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { DocumentUpload, type UploadedFile } from '@/components/erp/document-upload';
import { routes } from '@/lib/constants';
import { toast } from 'sonner';
import { ArrowRight, FileText, Loader2, Upload } from 'lucide-react';
import type { BankAccount, StatementSource } from '../types';
import { importStatement } from '../actions/banking.actions';

// ─── Format Options ──────────────────────────────────────────────────────────

const importFormats: { value: StatementSource; label: string; description: string }[] = [
  { value: 'ofx', label: 'OFX/QFX', description: 'Open Financial Exchange format' },
  { value: 'csv', label: 'CSV', description: 'Comma-separated values' },
  { value: 'manual', label: 'Manual Entry', description: 'Enter transactions manually' },
];

// ─── Statement Import Form ───────────────────────────────────────────────────

interface StatementImportFormProps {
  bankAccounts: BankAccount[];
}

export function StatementImportForm({ bankAccounts }: StatementImportFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [selectedAccount, setSelectedAccount] = useState<string>('');
  const [selectedFormat, setSelectedFormat] = useState<StatementSource | ''>('');
  const [files, setFiles] = useState<UploadedFile[]>([]);

  const activeAccounts = bankAccounts.filter((a) => a.status === 'active');

  const handleImport = () => {
    if (!selectedAccount || !selectedFormat) {
      toast.error('Please select a bank account and format');
      return;
    }

    if (selectedFormat !== 'manual' && files.length === 0) {
      toast.error('Please upload a statement file');
      return;
    }

    const formData = new FormData();
    formData.append('bankAccountId', selectedAccount);
    formData.append('format', selectedFormat);
    if (files.length > 0) {
      const file = files[0];
      if (file?.file) formData.append('file', file.file);
    }

    startTransition(async () => {
      const result = await importStatement(formData);

      if (result.ok) {
        toast.success(`Imported ${result.data.transactionCount} transactions`);
        router.push(`${routes.finance.banking}/reconcile/${result.data.statementId}`);
      } else {
        toast.error(result.error);
      }
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Import Bank Statement</CardTitle>
        <CardDescription>
          Upload a bank statement file to import transactions for reconciliation.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Bank Account Selection */}
        <div className="space-y-2">
          <Label htmlFor="bankAccount">Bank Account</Label>
          <Select value={selectedAccount} onValueChange={setSelectedAccount}>
            <SelectTrigger id="bankAccount">
              <SelectValue placeholder="Select a bank account" />
            </SelectTrigger>
            <SelectContent>
              {activeAccounts.map((account) => (
                <SelectItem key={account.id} value={account.id}>
                  <div className="flex items-center gap-2">
                    <span>{account.name}</span>
                    <span className="text-muted-foreground">({account.accountNumber})</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Format Selection */}
        <div className="space-y-2">
          <Label>Import Format</Label>
          <div className="grid gap-3 sm:grid-cols-3">
            {importFormats.map((format) => (
              <div
                key={format.value}
                className={cn(
                  'relative flex cursor-pointer flex-col rounded-lg border p-4 transition-colors',
                  selectedFormat === format.value
                    ? 'border-primary bg-accent'
                    : 'hover:bg-accent/50'
                )}
                onClick={() => setSelectedFormat(format.value)}
              >
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  <span className="font-medium">{format.label}</span>
                </div>
                <span className="mt-1 text-xs text-muted-foreground">
                  {format.description}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* File Upload */}
        {selectedFormat && selectedFormat !== 'manual' && (
          <div className="space-y-2">
            <Label>Statement File</Label>
            <DocumentUpload
              onUpload={async (inputFiles: File[]) => {
                const uploaded: UploadedFile[] = inputFiles.map((f, i) => ({
                  id: `temp-${Date.now()}-${i}`,
                  name: f.name,
                  size: f.size,
                  type: f.type,
                  status: 'complete' as const,
                  file: f,
                }));
                setFiles(uploaded);
                return uploaded;
              }}
              maxFiles={1}
              accept={{
                'text/csv': ['.csv'],
                'application/x-ofx': ['.ofx'],
                'application/x-qfx': ['.qfx'],
              }}
            />
          </div>
        )}

        {/* Manual Entry Info */}
        {selectedFormat === 'manual' && (
          <div className="rounded-lg border border-dashed p-6 text-center">
            <Upload className="mx-auto h-8 w-8 text-muted-foreground" />
            <p className="mt-2 text-sm text-muted-foreground">
              You'll be able to enter transactions manually after selecting the statement period.
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t">
          <Button
            variant="outline"
            onClick={() => router.push(routes.finance.banking)}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button onClick={handleImport} disabled={isPending || !selectedAccount || !selectedFormat}>
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Importing...
              </>
            ) : (
              <>
                Import & Reconcile
                <ArrowRight className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
