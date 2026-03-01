'use client';

import { useState } from 'react';
import { PortalStatementUploadForm } from '../forms/portal-statement-upload-form';
import { PortalReconResults } from './portal-recon-results';
import type { PortalReconResult } from '../queries/portal.queries';

interface PortalReconciliationPageClientProps {
  supplierId: string;
  currencyCode: string;
}

export function PortalReconciliationPageClient({
  supplierId,
  currencyCode,
}: PortalReconciliationPageClientProps) {
  const [reconResult, setReconResult] = useState<PortalReconResult | null>(null);

  return (
    <div className="space-y-6">
      <PortalStatementUploadForm supplierId={supplierId} onResult={setReconResult} />

      { reconResult ? <PortalReconResults result={reconResult} currencyCode={currencyCode} /> : null}
    </div>
  );
}
