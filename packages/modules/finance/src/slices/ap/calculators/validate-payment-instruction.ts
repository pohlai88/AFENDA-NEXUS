/**
 * Shared payment instruction validator.
 * Pure calculator — validates instructions before they reach file builders.
 * Catches data quality issues early with clear error messages.
 */

export interface PaymentInstructionValidation {
  readonly field: string;
  readonly message: string;
}

export function validatePaymentInstruction(
  instr: {
    paymentId: string;
    amount: bigint;
    currencyCode: string;
    creditorName: string;
    creditorIban?: string;
    creditorBic?: string;
    creditorAccountNumber?: string;
    creditorBankCode?: string;
    debtorName?: string;
    remittanceInfo?: string;
  },
  index: number
): PaymentInstructionValidation[] {
  const errors: PaymentInstructionValidation[] = [];
  const prefix = `instructions[${index}]`;

  if (!instr.paymentId || instr.paymentId.trim().length === 0) {
    errors.push({ field: `${prefix}.paymentId`, message: 'paymentId is required' });
  }

  if (instr.amount <= 0n) {
    errors.push({ field: `${prefix}.amount`, message: 'amount must be positive' });
  }

  if (!instr.currencyCode || instr.currencyCode.length !== 3) {
    errors.push({
      field: `${prefix}.currencyCode`,
      message: 'currencyCode must be a 3-letter ISO code',
    });
  }

  if (!instr.creditorName || instr.creditorName.trim().length === 0) {
    errors.push({ field: `${prefix}.creditorName`, message: 'creditorName is required' });
  }

  // IBAN validation (basic: 2 letters + 2 digits + up to 30 alphanumeric)
  if (instr.creditorIban !== undefined) {
    const iban = instr.creditorIban.replace(/\s/g, '');
    if (!/^[A-Z]{2}\d{2}[A-Z0-9]{4,30}$/.test(iban)) {
      errors.push({ field: `${prefix}.creditorIban`, message: 'creditorIban format is invalid' });
    }
  }

  // BIC validation (8 or 11 chars)
  if (instr.creditorBic !== undefined) {
    if (!/^[A-Z]{4}[A-Z]{2}[A-Z0-9]{2}([A-Z0-9]{3})?$/.test(instr.creditorBic)) {
      errors.push({
        field: `${prefix}.creditorBic`,
        message: 'creditorBic must be 8 or 11 characters (SWIFT format)',
      });
    }
  }

  return errors;
}

export function validatePaymentInstructions(
  instructions: readonly {
    paymentId: string;
    amount: bigint;
    currencyCode: string;
    creditorName: string;
    creditorIban?: string;
    creditorBic?: string;
    creditorAccountNumber?: string;
    creditorBankCode?: string;
    debtorName?: string;
    remittanceInfo?: string;
  }[]
): PaymentInstructionValidation[] {
  if (instructions.length === 0) {
    return [{ field: 'instructions', message: 'At least one payment instruction is required' }];
  }

  return instructions.flatMap((instr, i) => validatePaymentInstruction(instr, i));
}
