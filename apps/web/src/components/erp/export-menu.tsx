'use client';

import * as React from 'react';
import { useCallback } from 'react';
import { Download, FileJson, Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toCSV, toJSON, exportFilename, type ExportPayload } from '@/lib/report-export';

export type { ExportPayload };

// ─── Types ──────────────────────────────────────────────────────────────────

type ExportFormat = 'csv' | 'json';

interface ExportMenuProps {
  /** Pre-built payload from the RSC page. */
  payload: ExportPayload;
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function triggerDownload(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  // Clean up after a short delay to ensure download starts
  setTimeout(() => {
    URL.revokeObjectURL(url);
    document.body.removeChild(a);
  }, 100);
}

// ─── Component ──────────────────────────────────────────────────────────────

/**
 * Dropdown menu for exporting reports in CSV, JSON, or print-to-PDF.
 *
 * Usage:
 * ```tsx
 * <PageHeader
 *   title="Trial Balance"
 *   actions={
 *     <ExportMenu payload={buildTrialBalanceExport(data)} />
 *   }
 * />
 * ```
 */
export function ExportMenu({ payload }: ExportMenuProps) {
  const handleDownload = useCallback(
    (format: ExportFormat) => {
      const content = format === 'csv' ? toCSV(payload) : toJSON(payload);
      const mimeType =
        format === 'csv' ? 'text/csv;charset=utf-8' : 'application/json;charset=utf-8';
      const filename = exportFilename(payload.title, format);
      triggerDownload(content, filename, mimeType);
    },
    [payload]
  );

  const handlePrint = useCallback(() => {
    window.print();
  }, []);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm">
          <Download className="mr-2 h-4 w-4" aria-hidden="true" />
          Export
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onSelect={() => handleDownload('csv')}>
          <Download className="mr-2 h-4 w-4" aria-hidden="true" />
          Download CSV
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => handleDownload('json')}>
          <FileJson className="mr-2 h-4 w-4" aria-hidden="true" />
          Download JSON
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={handlePrint}>
          <Printer className="mr-2 h-4 w-4" aria-hidden="true" />
          Print / PDF
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
ExportMenu.displayName = 'ExportMenu';

export type { ExportMenuProps, ExportFormat };
