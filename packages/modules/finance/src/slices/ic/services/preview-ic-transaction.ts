import type { Result } from '@afenda/core';
import { ok, err, AppError, formatMinorUnits } from '@afenda/core';
import type { IIcAgreementRepo } from '../../../slices/ic/ports/ic-repo.js';
import type { IAccountRepo, ILedgerRepo } from '../../../shared/ports/gl-read-ports.js';
import type { IFiscalPeriodRepo } from '../../../shared/ports/fiscal-period-port.js';
import type {
  PostingLinePreview,
  PostingPreviewResult,
} from '../../../shared/types/posting-preview.js';

export interface IcLinePreviewInput {
  readonly accountId: string;
  readonly debit: bigint;
  readonly credit: bigint;
}

export interface PreviewIcTransactionInput {
  readonly agreementId: string;
  readonly sourceLedgerId: string;
  readonly mirrorLedgerId: string;
  readonly fiscalPeriodId: string;
  readonly description: string;
  readonly currency: string;
  readonly sourceLines: readonly IcLinePreviewInput[];
  readonly mirrorLines: readonly IcLinePreviewInput[];
}

export interface IcTransactionPreviewResult {
  readonly sourceJournal: PostingPreviewResult;
  readonly mirrorJournal: PostingPreviewResult;
}

export async function previewIcTransaction(
  input: PreviewIcTransactionInput,
  deps: {
    icAgreementRepo: IIcAgreementRepo;
    accountRepo: IAccountRepo;
    ledgerRepo: ILedgerRepo;
    fiscalPeriodRepo?: IFiscalPeriodRepo;
  }
): Promise<Result<IcTransactionPreviewResult>> {
  // Validate agreement
  const agreementResult = await deps.icAgreementRepo.findById(input.agreementId);
  if (!agreementResult.ok) return agreementResult as Result<never>;
  const agreement = agreementResult.value;

  if (!agreement.isActive) {
    return err(new AppError('VALIDATION', `IC agreement ${agreement.id} is inactive`));
  }

  if (input.sourceLines.length < 1 || input.mirrorLines.length < 1) {
    return err(
      new AppError('VALIDATION', 'IC transaction requires at least 1 source and 1 mirror line')
    );
  }

  const warnings: string[] = [];

  // Load ledgers
  const sourceLedgerResult = await deps.ledgerRepo.findById(input.sourceLedgerId);
  if (!sourceLedgerResult.ok) return sourceLedgerResult as Result<never>;
  const mirrorLedgerResult = await deps.ledgerRepo.findById(input.mirrorLedgerId);
  if (!mirrorLedgerResult.ok) return mirrorLedgerResult as Result<never>;

  // Load period
  let periodName = input.fiscalPeriodId;
  if (deps.fiscalPeriodRepo) {
    const periodResult = await deps.fiscalPeriodRepo.findById(input.fiscalPeriodId);
    if (!periodResult.ok) return periodResult as Result<never>;
    periodName = periodResult.value.name;
    if (periodResult.value.status !== 'OPEN') {
      warnings.push(
        `Fiscal period "${periodName}" is ${periodResult.value.status} — posting may be rejected`
      );
    }
  }

  // Resolve accounts and build source lines
  const sourceLines = await buildPreviewLines(deps, input.sourceLines, input.description, 'Source');
  const mirrorLines = await buildPreviewLines(deps, input.mirrorLines, input.description, 'Mirror');

  return ok({
    sourceJournal: {
      ledgerName: sourceLedgerResult.value.name,
      periodName,
      currency: input.currency,
      lines: sourceLines,
      warnings,
    },
    mirrorJournal: {
      ledgerName: mirrorLedgerResult.value.name,
      periodName,
      currency: input.currency,
      lines: mirrorLines,
      warnings: [],
    },
  });
}

async function buildPreviewLines(
  deps: { accountRepo: IAccountRepo },
  lines: readonly IcLinePreviewInput[],
  description: string,
  side: string
): Promise<PostingLinePreview[]> {
  const result: PostingLinePreview[] = [];
  for (let idx = 0; idx < lines.length; idx++) {
    const line = lines[idx]!;
    const acct = await resolveAccount(deps, line.accountId);
    result.push({
      accountId: line.accountId,
      accountCode: acct.code,
      accountName: acct.name,
      debit: formatMinorUnits(line.debit),
      credit: formatMinorUnits(line.credit),
      description: `[IC ${side}] ${description} line ${idx + 1}`,
    });
  }
  return result;
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
