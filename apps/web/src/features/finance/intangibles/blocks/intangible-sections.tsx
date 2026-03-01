import { getRequestContext } from '@/lib/auth';
import {
  getIntangibleAssets,
  getIntangibleSummary,
  getAmortizationSchedule,
  getImpairmentTests,
} from '@/features/finance/intangibles/queries/intangibles.queries';
import { IntangibleSummaryCards } from '@/features/finance/intangibles/blocks/intangible-summary-cards';
import { IntangiblesTable } from '@/features/finance/intangibles/blocks/intangibles-table';
import { AmortizationSchedule, ImpairmentTestsTable } from '@/features/finance/intangibles/blocks/intangible-detail';

export async function IntangibleSummarySection() {
  const ctx = await getRequestContext();
  const result = await getIntangibleSummary(ctx);
  if (!result.ok) throw new Error(result.error);
  return <IntangibleSummaryCards summary={result.data} />;
}

export async function IntangibleAssetsSection({ status, type }: { status?: string; type?: string }) {
  const ctx = await getRequestContext();
  const result = await getIntangibleAssets(ctx, { status, intangibleType: type });
  if (!result.ok) throw new Error(result.error);
  return <IntangiblesTable assets={result.data} pagination={result.pagination} />;
}

export async function AmortizationSection({ assetId }: { assetId: string }) {
  const ctx = await getRequestContext();
  const result = await getAmortizationSchedule(ctx, assetId);
  if (!result.ok) return <p className="text-sm text-destructive">{result.error}</p>;
  return <AmortizationSchedule entries={result.data} />;
}

export async function ImpairmentSection({ assetId }: { assetId: string }) {
  const ctx = await getRequestContext();
  const result = await getImpairmentTests(ctx, assetId);
  if (!result.ok) return <p className="text-sm text-destructive">{result.error}</p>;
  return <ImpairmentTestsTable tests={result.data} />;
}
