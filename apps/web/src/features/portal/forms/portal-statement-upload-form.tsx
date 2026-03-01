'use client';

import { useTransition, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { submitStatementReconAction } from '../actions/portal.actions';
import { Loader2, Upload } from 'lucide-react';
import type { PortalReconResult } from '../queries/portal.queries';

interface PortalStatementUploadFormProps {
  supplierId: string;
  onResult: (result: PortalReconResult) => void;
}

export function PortalStatementUploadForm({
  supplierId,
  onResult,
}: PortalStatementUploadFormProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [csvText, setCsvText] = useState('');

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setCsvText(reader.result as string);
    };
    reader.readAsText(file);
  }

  function parseCsv(text: string): Record<string, unknown>[] {
    const rows = text.trim().split('\n');
    if (rows.length < 2) return [];

    const headerRow = rows[0];
    if (!headerRow) return [];
    const headers = headerRow.split(',').map((h) => h.trim());
    return rows.slice(1).map((row) => {
      const values = row.split(',').map((v) => v.trim());
      const obj: Record<string, unknown> = {};
      headers.forEach((h, i) => {
        obj[h] = values[i] ?? '';
      });
      return obj;
    });
  }

  function handleSubmit() {
    setError(null);

    if (!csvText.trim()) {
      setError('Please upload or paste a CSV statement file.');
      return;
    }

    const lines = parseCsv(csvText);
    if (lines.length === 0) {
      setError('CSV must contain at least one data row with a header row.');
      return;
    }

    startTransition(async () => {
      const result = await submitStatementReconAction(supplierId, { lines });

      if (!result.ok) {
        setError(result.error.message);
        return;
      }

      onResult(result.value);
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Upload Statement</CardTitle>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="statementFile">CSV Statement File</Label>
            <Input
              id="statementFile"
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              className="cursor-pointer"
            />
            <p className="text-xs text-muted-foreground">
              Upload a CSV file with columns: reference, date, amount, description
            </p>
          </div>

          {csvText && (
            <div className="rounded-md border bg-muted/50 p-3">
              <p className="text-xs font-medium text-muted-foreground">Preview</p>
              <pre className="mt-1 max-h-32 overflow-auto text-xs">
                {csvText.slice(0, 500)}
                {csvText.length > 500 ? '...' : ''}
              </pre>
            </div>
          )}

          <div className="flex justify-end">
            <Button onClick={handleSubmit} disabled={isPending}>
              { isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              <Upload className="mr-2 h-4 w-4" />
              Reconcile
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
