import type { Result } from '@afenda/core';
import { ok, err, AppError, formatMinorUnits } from '@afenda/core';
import type { IArInvoiceRepo } from '../ports/ar-invoice-repo.js';
import type { IAccountRepo } from '../../../shared/ports/gl-read-ports.js';
import type { ILedgerRepo } from '../../../shared/ports/gl-read-ports.js';
import type { IFiscalPeriodRepo } from '../../../shared/ports/fiscal-period-port.js';
import type {
  PostingLinePreview,
  PostingPreviewResult,
} from '../../ap/services/preview-ap-posting.js';

export interface PreviewArPostingInput {
  readonly invoiceId: string;
  readonly fiscalPeriodId: string;
  readonly arAccountId: string;
}

export async function previewArPosting(
  input: PreviewArPostingInput,
  deps: {
    arInvoiceRepo: IArInvoiceRepo;
    accountRepo: IAccountRepo;
    ledgerRepo: ILedgerRepo;
    fiscalPeriodRepo?: IFiscalPeriodRepo;
  }
): Promise<Result<PostingPreviewResult>> {
  const found = await deps.arInvoiceRepo.findById(input.invoiceId);
  if (!found.ok) return found as Result<never>;

  const invoice = found.value;

  if (invoice.status !== 'APPROVED') {
    return err(
      new AppError(
        'VALIDATION',
        `Invoice must be APPROVED to preview posting, current status: ${invoice.status}`
      )
    );
  }

  const warnings: string[] = [];

  // Load ledger for name + currency
  const ledgerResult = await deps.ledgerRepo.findById(invoice.ledgerId as string);
  if (!ledgerResult.ok) return ledgerResult as Result<never>;
  const ledger = ledgerResult.value;

  // Load fiscal period for name + status check
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

  // Resolve account codes/names
  const accountIds = new Set<string>();
  for (const line of invoice.lines) accountIds.add(line.accountId);
  accountIds.add(input.arAccountId);

  const accountMap = new Map<string, { code: string; name: string }>();
  for (const id of accountIds) {
    const acct = await deps.accountRepo.findById(id);
    if (acct.ok) {
      accountMap.set(id, { code: acct.value.code, name: acct.value.name });
    } else {
      accountMap.set(id, { code: id.slice(0, 8), name: '(unknown account)' });
    }
  }

  // Build preview lines: debit AR control, credit revenue accounts
  const lines: PostingLinePreview[] = [];

  const arAcct = accountMap.get(input.arAccountId)!;
  lines.push({
    accountId: input.arAccountId,
    accountCode: arAcct.code,
    accountName: arAcct.name,
    debit: formatMinorUnits(invoice.totalAmount.amount),
    credit: '0.00',
    description: `AR Invoice ${invoice.invoiceNumber}`,
  });

  for (let idx = 0; idx < invoice.lines.length; idx++) {
    const line = invoice.lines[idx]!;
    const acct = accountMap.get(line.accountId)!;
    const creditAmount = line.amount.amount + line.taxAmount.amount;
    lines.push({
      accountId: line.accountId,
      accountCode: acct.code,
      accountName: acct.name,
      debit: '0.00',
      credit: formatMinorUnits(creditAmount),
      description: line.description ?? `AR Invoice ${invoice.invoiceNumber} line ${idx + 1}`,
    });
  }

  return ok({
    ledgerName: ledger.name,
    periodName,
    currency: ledger.baseCurrency,
    lines,
    warnings,
  });
}
