import { getRequestContext } from '@/lib/auth';
import {
  getTaxCodes,
  getTaxReturnPeriods,
  getWHTCertificates,
  getTaxSummary,
} from '@/features/finance/tax/queries/tax.queries';
import { TaxSummaryCards } from '@/features/finance/tax/blocks/tax-summary-cards';
import { TaxCodesTable } from '@/features/finance/tax/blocks/tax-codes-table';
import { TaxReturnsTable } from '@/features/finance/tax/blocks/tax-returns-table';
import { WHTCertificatesTable } from '@/features/finance/tax/blocks/wht-certificates-table';

export async function TaxSummarySection() {
  const ctx = await getRequestContext();
  const result = await getTaxSummary(ctx);
  if (!result.ok) throw new Error(result.error);
  return <TaxSummaryCards summary={result.data} />;
}

export async function TaxCodesSection() {
  const ctx = await getRequestContext();
  const result = await getTaxCodes(ctx, { status: 'active' });
  if (!result.ok) throw new Error(result.error);
  return <TaxCodesTable taxCodes={result.data} />;
}

export async function TaxReturnsSection() {
  const ctx = await getRequestContext();
  const result = await getTaxReturnPeriods(ctx, { year: 2026 });
  if (!result.ok) throw new Error(result.error);
  return <TaxReturnsTable periods={result.data} />;
}

export async function WHTCertificatesSection() {
  const ctx = await getRequestContext();
  const result = await getWHTCertificates(ctx);
  if (!result.ok) throw new Error(result.error);
  return <WHTCertificatesTable certificates={result.data} />;
}
