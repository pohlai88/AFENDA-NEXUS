import { getRequestContext } from '@/lib/auth';
import { getLedgers } from '@/features/finance/ledgers/queries/ledger.queries';
import { getPeriods } from '@/features/finance/periods/queries/period.queries';
import { currencyConfig } from '@/lib/constants';

export async function getReportFilterData() {
  const ctx = await getRequestContext();

  const [ledgersResult, periodsResult] = await Promise.all([
    getLedgers(ctx, { limit: '100' }),
    getPeriods(ctx, { limit: '100' }),
  ]);

  const ledgers = ledgersResult.ok
    ? ledgersResult.value.data.map((l) => ({ id: l.id, name: l.name }))
    : [];

  const periods = periodsResult.ok
    ? periodsResult.value.data.map((p) => ({ id: p.id, name: p.name }))
    : [];

  const currencies = Object.keys(currencyConfig);

  return { ledgers, periods, currencies };
}
