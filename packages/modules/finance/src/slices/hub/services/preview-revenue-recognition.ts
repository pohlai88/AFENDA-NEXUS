import type { Result } from '@afenda/core';
import { ok, err, AppError, formatMinorUnits } from '@afenda/core';
import type { IRevenueContractRepo } from '../../../slices/hub/ports/revenue-contract-repo.js';
import type { IAccountRepo, ILedgerRepo } from '../../../shared/ports/gl-read-ports.js';
import type { IFiscalPeriodRepo } from '../../../shared/ports/fiscal-period-port.js';
import { computeStraightLineSchedule } from '../calculators/revenue-recognition.js';
import type {
  PostingLinePreview,
  PostingPreviewResult,
} from '../../../shared/types/posting-preview.js';

export interface PreviewRevenueRecognitionInput {
  readonly contractId: string;
  readonly periodId: string;
  readonly ledgerId: string;
}

export async function previewRevenueRecognition(
  input: PreviewRevenueRecognitionInput,
  deps: {
    revenueContractRepo: IRevenueContractRepo;
    accountRepo: IAccountRepo;
    ledgerRepo: ILedgerRepo;
    fiscalPeriodRepo?: IFiscalPeriodRepo;
  }
): Promise<Result<PostingPreviewResult>> {
  const contractResult = await deps.revenueContractRepo.findById(input.contractId);
  if (!contractResult.ok) return contractResult as Result<never>;
  const contract = contractResult.value;

  if (contract.status !== 'ACTIVE') {
    return err(
      new AppError(
        'VALIDATION',
        `Contract must be ACTIVE to preview recognition, current status: ${contract.status}`
      )
    );
  }

  if (contract.recognizedToDate >= contract.totalAmount) {
    return err(
      new AppError('VALIDATION', `Contract ${contract.contractNumber} is fully recognized`)
    );
  }

  const warnings: string[] = [];

  // Load ledger
  const ledgerResult = await deps.ledgerRepo.findById(input.ledgerId);
  if (!ledgerResult.ok) return ledgerResult as Result<never>;
  const ledger = ledgerResult.value;

  // Load period
  let periodName = input.periodId;
  if (deps.fiscalPeriodRepo) {
    const periodResult = await deps.fiscalPeriodRepo.findById(input.periodId);
    if (!periodResult.ok) return periodResult as Result<never>;
    periodName = periodResult.value.name;
    if (periodResult.value.status !== 'OPEN') {
      warnings.push(
        `Fiscal period "${periodName}" is ${periodResult.value.status} — posting may be rejected`
      );
    }
  }

  // Compute recognition amount
  const months = monthsBetween(contract.startDate, contract.endDate);
  const periodCount = months > 0 ? months : 1;
  const { result: schedule } = computeStraightLineSchedule({
    totalAmount: contract.totalAmount,
    periodCount,
    currency: contract.currency,
    alreadyRecognized: contract.recognizedToDate,
  });

  const remaining = contract.totalAmount - contract.recognizedToDate;
  const recognitionAmount =
    schedule.perPeriodAmount.amount > remaining ? remaining : schedule.perPeriodAmount.amount;

  if (recognitionAmount <= 0n) {
    return err(new AppError('VALIDATION', 'No amount to recognize this period'));
  }

  // Resolve accounts
  const deferredAcct = await resolveAccount(deps, contract.deferredAccountId);
  const revenueAcct = await resolveAccount(deps, contract.revenueAccountId);

  const lines: PostingLinePreview[] = [
    {
      accountId: contract.deferredAccountId,
      accountCode: deferredAcct.code,
      accountName: deferredAcct.name,
      debit: formatMinorUnits(recognitionAmount),
      credit: '0.00',
      description: `Deferred revenue release — ${contract.contractNumber}`,
    },
    {
      accountId: contract.revenueAccountId,
      accountCode: revenueAcct.code,
      accountName: revenueAcct.name,
      debit: '0.00',
      credit: formatMinorUnits(recognitionAmount),
      description: `Revenue recognized — ${contract.contractNumber} (${contract.customerName})`,
    },
  ];

  const recognizedPct =
    contract.totalAmount > 0n
      ? Number((contract.recognizedToDate * 100n) / contract.totalAmount)
      : 0;
  if (recognizedPct > 90) {
    warnings.push(`Contract is ${recognizedPct}% recognized — nearing completion`);
  }

  return ok({
    ledgerName: ledger.name,
    periodName,
    currency: contract.currency,
    lines,
    warnings,
  });
}

async function resolveAccount(
  deps: { accountRepo: IAccountRepo },
  id: string
): Promise<{ code: string; name: string }> {
  const acct = await deps.accountRepo.findById(id);
  return acct.ok
    ? { code: acct.value.code, name: acct.value.name }
    : { code: id.slice(0, 8), name: '(unknown account)' };
}

function monthsBetween(start: Date, end: Date): number {
  return (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth()) + 1;
}
