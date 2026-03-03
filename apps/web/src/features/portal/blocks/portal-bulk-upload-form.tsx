'use client';

/**
 * PortalBulkUploadForm — CAP-BULK P13
 *
 * Client component that:
 * 1. Provides a CSV template download
 * 2. Accepts CSV file upload and parses it client-side
 * 3. Shows a parsed-row preview table with validation indicators
 * 4. Submits the batch to POST /portal/suppliers/:id/invoices/bulk-upload
 * 5. Shows per-row results with status badges
 */

import { useState, useRef, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Upload,
  Download,
  CheckCircle2,
  XCircle,
  AlertCircle,
  FileText,
  SkipForward,
  RefreshCw,
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// ─── CSV Template ─────────────────────────────────────────────────────────────

const CSV_HEADERS = [
  'invoice_number',
  'invoice_date',
  'amount',
  'currency',
  'vendor_reference',
  'description',
  'due_date',
];

const CSV_EXAMPLE_ROWS = [
  [
    'INV-001',
    '2025-01-15',
    '1234.50',
    'USD',
    'PO-2025-0001',
    'Consulting services Jan 2025',
    '2025-02-15',
  ],
  ['INV-002', '2025-01-20', '8750.00', 'USD', 'PO-2025-0002', 'Software licenses Q1', '2025-02-20'],
];

function downloadTemplate() {
  const rows = [CSV_HEADERS, ...CSV_EXAMPLE_ROWS];
  const csv = rows.map((r) => r.map((v) => `"${v}"`).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'afenda_bulk_invoice_template.csv';
  a.click();
  URL.revokeObjectURL(url);
}

// ─── CSV Parsing ──────────────────────────────────────────────────────────────

interface ParsedRow {
  rowNumber: number;
  invoiceNumber: string;
  invoiceDate: string;
  amount: string;
  currency: string;
  vendorReference: string;
  description?: string;
  dueDate?: string;
  _raw: string[];
}

function parseCsv(text: string): { rows: ParsedRow[]; errors: string[] } {
  const lines = text.trim().split(/\r?\n/);
  if (lines.length < 2) {
    return { rows: [], errors: ['CSV file must have at least a header row and one data row.'] };
  }

  const errors: string[] = [];
  const rows: ParsedRow[] = [];

  // Skip header row (line 0)
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line?.trim()) continue;

    // Simple CSV split (handles quoted values without embedded commas)
    const rawCols = line.match(/("(?:[^"]|"")*"|[^,]*)/g) ?? [];
    const cols = rawCols.map((c) => c.replace(/^"|"$/g, '').replace(/""/g, '"').trim());

    if (cols.length < 4) {
      errors.push(
        `Row ${i + 1}: too few columns (expected at least 4: invoice_number, invoice_date, amount, currency)`
      );
      continue;
    }

    rows.push({
      rowNumber: i,
      invoiceNumber: cols[0] ?? '',
      invoiceDate: cols[1] ?? '',
      amount: cols[2] ?? '',
      currency: (cols[3] ?? '').toUpperCase(),
      vendorReference: cols[4] ?? '',
      description: cols[5] || undefined,
      dueDate: cols[6] || undefined,
      _raw: cols,
    });
  }

  return { rows, errors };
}

// ─── Result Status Config ─────────────────────────────────────────────────────

const ROW_STATUS_CONFIG = {
  CREATED: { label: 'Created', Icon: CheckCircle2, cls: 'text-success' },
  SKIPPED_DUPLICATE: {
    label: 'Skipped (duplicate)',
    Icon: SkipForward,
    cls: 'text-muted-foreground',
  },
  UPDATED_DRAFT: { label: 'Updated draft', Icon: RefreshCw, cls: 'text-blue-600' },
  REJECTED_CONFLICT: { label: 'Rejected', Icon: XCircle, cls: 'text-destructive' },
  VALIDATION_ERROR: { label: 'Validation error', Icon: AlertCircle, cls: 'text-destructive' },
};

// ─── Types ────────────────────────────────────────────────────────────────────

type DedupePolicy = 'SKIP_DUPLICATES' | 'UPDATE_DRAFT' | 'REJECT_CONFLICTS';

interface UploadRowResult {
  rowNumber: number;
  status: keyof typeof ROW_STATUS_CONFIG;
  invoiceId?: string;
  fingerprint?: string;
  errors?: string[];
}

interface UploadResponse {
  batchId: string;
  totalRows: number;
  created: number;
  skipped: number;
  updated: number;
  failed: number;
  results: UploadRowResult[];
  processedAt: string;
}

// ─── Main Component ──────────────────────────────────────────────────────────

interface PortalBulkUploadFormProps {
  supplierId: string;
  supplierName: string;
}

export function PortalBulkUploadForm({ supplierId, supplierName }: PortalBulkUploadFormProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [parsedRows, setParsedRows] = useState<ParsedRow[]>([]);
  const [parseErrors, setParseErrors] = useState<string[]>([]);
  const [dedupePolicy, setDedupePolicy] = useState<DedupePolicy>('SKIP_DUPLICATES');
  const [uploadResult, setUploadResult] = useState<UploadResponse | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setUploadResult(null);
    setSubmitError(null);

    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const { rows, errors } = parseCsv(text);
      setParsedRows(rows);
      setParseErrors(errors);
    };
    reader.readAsText(file);
  }, []);

  const handleSubmit = useCallback(async () => {
    if (parsedRows.length === 0) return;

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const rows = parsedRows.map((r) => ({
        rowNumber: r.rowNumber,
        invoiceNumber: r.invoiceNumber,
        invoiceDate: r.invoiceDate,
        amount: r.amount,
        currency: r.currency,
        vendorReference: r.vendorReference,
        description: r.description,
        dueDate: r.dueDate,
      }));

      const res = await fetch(`/api/portal/suppliers/${supplierId}/invoices/bulk-upload`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rows, dedupePolicy }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error?.message ?? `Server error: ${res.status}`);
      }

      const result: UploadResponse = await res.json();
      setUploadResult(result);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setIsSubmitting(false);
    }
  }, [parsedRows, dedupePolicy, supplierId]);

  const handleReset = useCallback(() => {
    setParsedRows([]);
    setParseErrors([]);
    setUploadResult(null);
    setSubmitError(null);
    setFileName(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, []);

  return (
    <div className="space-y-6">
      {/* Step 1: Download template + upload file */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Upload Invoice CSV</CardTitle>
          <CardDescription>
            Download the template, fill in your invoices, and upload the completed file.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Template download */}
          <div className="flex items-center justify-between rounded-lg border bg-muted/40 px-4 py-3">
            <div className="flex items-center gap-3">
              <FileText className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Invoice Upload Template</p>
                <p className="text-xs text-muted-foreground">
                  CSV format — include at minimum: invoice number, date, amount, currency
                </p>
              </div>
            </div>
            <Button variant="outline" size="sm" className="gap-2" onClick={downloadTemplate}>
              <Download className="h-4 w-4" />
              Download
            </Button>
          </div>

          {/* File input */}
          <div
            className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/25 px-6 py-10 text-center transition-colors hover:border-muted-foreground/50"
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="h-8 w-8 text-muted-foreground" />
            <p className="mt-2 text-sm font-medium">
              {fileName ? fileName : 'Click to upload or drag and drop'}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">CSV files only — max 500 rows</p>
            <Input
              ref={fileInputRef}
              type="file"
              accept=".csv,text/csv"
              className="hidden"
              aria-label="Upload CSV file"
              onChange={handleFileChange}
            />
          </div>

          {/* Parse errors */}
          {parseErrors.length > 0 && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <ul className="mt-1 list-inside list-disc space-y-1 text-sm">
                  {parseErrors.map((e) => (
                    <li key={e}>{e}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Step 2: Preview + settings */}
      {parsedRows.length > 0 && !uploadResult && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">
                  Preview — {parsedRows.length} rows detected
                </CardTitle>
                <CardDescription>Review the parsed data before submitting.</CardDescription>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-muted-foreground">Dedup policy:</span>
                  <Select
                    value={dedupePolicy}
                    onValueChange={(v) => setDedupePolicy(v as DedupePolicy)}
                  >
                    <SelectTrigger className="h-8 w-44 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="SKIP_DUPLICATES">Skip duplicates</SelectItem>
                      <SelectItem value="UPDATE_DRAFT">Update drafts</SelectItem>
                      <SelectItem value="REJECT_CONFLICTS">Reject conflicts</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="max-h-80 overflow-auto rounded-md border">
              <Table>
                <caption className="sr-only">Invoice bulk upload preview</caption>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">#</TableHead>
                    <TableHead>Invoice No.</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Currency</TableHead>
                    <TableHead>Vendor Ref</TableHead>
                    <TableHead>Due Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {parsedRows.map((row) => (
                    <TableRow key={row.rowNumber}>
                      <TableCell className="text-xs text-muted-foreground">
                        {row.rowNumber}
                      </TableCell>
                      <TableCell className="text-sm font-medium">{row.invoiceNumber}</TableCell>
                      <TableCell className="text-sm">{row.invoiceDate}</TableCell>
                      <TableCell className="text-sm">{row.amount}</TableCell>
                      <TableCell className="text-xs">{row.currency}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {row.vendorReference || '—'}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {row.dueDate || '—'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {submitError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{submitError}</AlertDescription>
              </Alert>
            )}

            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={handleReset} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button onClick={handleSubmit} disabled={isSubmitting} className="gap-2">
                {isSubmitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Upload className="h-4 w-4" />
                )}
                {isSubmitting ? 'Uploading…' : `Submit ${parsedRows.length} invoices`}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Results */}
      {uploadResult && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">Upload Complete</CardTitle>
                <CardDescription>Batch ID: {uploadResult.batchId}</CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={handleReset}>
                Upload another file
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Summary counters */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                { label: 'Created', value: uploadResult.created, cls: 'text-success' },
                { label: 'Skipped', value: uploadResult.skipped, cls: 'text-muted-foreground' },
                { label: 'Updated', value: uploadResult.updated, cls: 'text-blue-600' },
                { label: 'Failed', value: uploadResult.failed, cls: 'text-destructive' },
              ].map(({ label, value, cls }) => (
                <div key={label} className="rounded-lg border bg-muted/30 px-4 py-3 text-center">
                  <p className={cn('text-2xl font-bold', cls)}>{value}</p>
                  <p className="text-xs text-muted-foreground">{label}</p>
                </div>
              ))}
            </div>

            {/* Per-row results */}
            <div className="max-h-80 overflow-auto rounded-md border">
              <Table>
                <caption className="sr-only">Upload results per row</caption>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">Row</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Invoice ID</TableHead>
                    <TableHead>Notes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {uploadResult.results.map((r) => {
                    const cfg = ROW_STATUS_CONFIG[r.status];
                    const Icon = cfg.Icon;
                    return (
                      <TableRow key={r.rowNumber}>
                        <TableCell className="text-xs text-muted-foreground">
                          {r.rowNumber}
                        </TableCell>
                        <TableCell>
                          <span
                            className={cn('flex items-center gap-1.5 text-sm font-medium', cfg.cls)}
                          >
                            <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                            {cfg.label}
                          </span>
                        </TableCell>
                        <TableCell className="font-mono text-xs text-muted-foreground">
                          {r.invoiceId ? r.invoiceId.slice(0, 8) + '…' : '—'}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {r.errors?.join(', ') || '—'}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
