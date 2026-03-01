import type { Result } from '@afenda/core';
import { ok, formatMinorUnits } from '@afenda/core';
import type { IAssetRepo } from '../ports/asset-repo.js';
import type { IAccountRepo } from '../../../shared/ports/gl-read-ports.js';
import { computeDepreciation } from '../calculators/depreciation.js';
import type { PostingLinePreview, PostingPreviewResult } from '../../ap/services/preview-ap-posting.js';

export interface PreviewDepreciationRunInput {
  readonly periodStart: Date;
  readonly periodEnd: Date;
}

export async function previewDepreciationRun(
  input: PreviewDepreciationRunInput,
  deps: {
    assetRepo: IAssetRepo;
    accountRepo: IAccountRepo;
  }
): Promise<Result<PostingPreviewResult>> {
  const assets = await deps.assetRepo.findActive();
  const periodMonths = monthsBetween(input.periodStart, input.periodEnd);
  const warnings: string[] = [];

  if (assets.length === 0) {
    warnings.push('No active assets found for depreciation');
  }

  const accountMap = new Map<string, { code: string; name: string }>();
  async function resolveAccount(id: string) {
    if (accountMap.has(id)) return accountMap.get(id)!;
    const acct = await deps.accountRepo.findById(id);
    const info = acct.ok
      ? { code: acct.value.code, name: acct.value.name }
      : { code: id.slice(0, 8), name: '(unknown account)' };
    accountMap.set(id, info);
    return info;
  }

  const lines: PostingLinePreview[] = [];
  let totalDepreciation = 0n;

  for (const asset of assets) {
    const result = computeDepreciation({
      assetId: asset.id,
      acquisitionCost: asset.acquisitionCost,
      residualValue: asset.residualValue,
      usefulLifeMonths: asset.usefulLifeMonths,
      depreciationMethod: asset.depreciationMethod,
      accumulatedDepreciation: asset.accumulatedDepreciation,
      periodMonths,
    });

    if (result.depreciationAmount <= 0n) continue;

    const expenseAcct = await resolveAccount(asset.depreciationAccountId);
    const accumAcct = await resolveAccount(asset.accumulatedDepreciationAccountId);

    lines.push({
      accountId: asset.depreciationAccountId,
      accountCode: expenseAcct.code,
      accountName: expenseAcct.name,
      debit: formatMinorUnits(result.depreciationAmount),
      credit: '0.00',
      description: `Depreciation — ${asset.assetNumber} ${asset.name}`,
    });

    lines.push({
      accountId: asset.accumulatedDepreciationAccountId,
      accountCode: accumAcct.code,
      accountName: accumAcct.name,
      debit: '0.00',
      credit: formatMinorUnits(result.depreciationAmount),
      description: `Accum. depreciation — ${asset.assetNumber} ${asset.name}`,
    });

    totalDepreciation += result.depreciationAmount;

    if (result.isFullyDepreciated) {
      warnings.push(`Asset ${asset.assetNumber} will be fully depreciated after this run`);
    }
  }

  const periodLabel = `${input.periodStart.toISOString().slice(0, 10)} to ${input.periodEnd.toISOString().slice(0, 10)}`;

  return ok({
    ledgerName: 'Fixed Assets',
    periodName: periodLabel,
    currency: assets[0]?.currencyCode ?? 'USD',
    lines,
    warnings,
  });
}

function monthsBetween(start: Date, end: Date): number {
  return (
    (end.getFullYear() - start.getFullYear()) * 12 +
    (end.getMonth() - start.getMonth()) +
    1
  );
}
