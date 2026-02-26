/**
 * GAP-G5: Local Bank Payment Format builders.
 * Pure calculators — generate payment files for formats beyond PAIN.001:
 * - SWIFT MT101 (cross-border request for transfer)
 * - DuitNow (Malaysia)
 * - FAST/GIRO (Singapore)
 * - RTGS/SKN (Indonesia)
 * - BAHTNET/PromptPay (Thailand)
 *
 * All monetary amounts are bigint (minor units).
 */

export interface LocalPaymentInstruction {
  readonly paymentId: string;
  readonly debtorName: string;
  readonly debtorAccountNumber: string;
  readonly debtorBankCode: string;
  readonly creditorName: string;
  readonly creditorAccountNumber: string;
  readonly creditorBankCode: string;
  readonly amount: bigint;
  readonly currencyCode: string;
  readonly remittanceInfo: string;
  readonly executionDate: Date;
  readonly creditorIdType?: string;
  readonly creditorIdNumber?: string;
}

export type PaymentFormat =
  | 'SWIFT_MT101'
  | 'MY_DUITNOW'
  | 'MY_IBG'
  | 'SG_FAST'
  | 'SG_GIRO'
  | 'ID_RTGS'
  | 'ID_SKN'
  | 'TH_BAHTNET'
  | 'TH_PROMPTPAY';

export interface PaymentFileOutput {
  readonly format: PaymentFormat;
  readonly content: string;
  readonly messageId: string;
  readonly numberOfTransactions: number;
  readonly controlSum: bigint;
}

function formatMinorUnits(amount: bigint, decimalPlaces: number = 2): string {
  const str = amount.toString();
  if (decimalPlaces === 0) return str;
  const padded = str.padStart(decimalPlaces + 1, '0');
  return `${padded.slice(0, -decimalPlaces)}.${padded.slice(-decimalPlaces)}`;
}

function formatDate(d: Date): string {
  return d.toISOString().slice(0, 10).replace(/-/g, '');
}

function pad(s: string, len: number, char = ' '): string {
  return s.padEnd(len, char).slice(0, len);
}

/**
 * Builds SWIFT MT101 (Request for Transfer) message.
 * Dominant format for cross-border payments in APAC.
 */
export function buildSwiftMt101(
  messageId: string,
  senderBic: string,
  receiverBic: string,
  instructions: readonly LocalPaymentInstruction[]
): PaymentFileOutput {
  let controlSum = 0n;
  for (const instr of instructions) {
    controlSum += instr.amount;
  }

  const lines: string[] = [];
  lines.push(`{1:F01${pad(senderBic, 12)}0000000000}`);
  lines.push(`{2:I101${pad(receiverBic, 12)}N}`);
  lines.push('{4:');
  lines.push(`:20:${messageId.slice(0, 16)}`);
  lines.push(`:28D:1/1`);
  lines.push(`:50H:/${instructions[0]?.debtorAccountNumber ?? ''}`);
  lines.push(instructions[0]?.debtorName ?? '');
  lines.push(`:30:${instructions.length > 0 ? formatDate(instructions[0]!.executionDate) : ''}`);

  for (const instr of instructions) {
    lines.push(`:21:${instr.paymentId.slice(0, 16)}`);
    lines.push(`:32B:${instr.currencyCode}${formatMinorUnits(instr.amount)}`);
    lines.push(`:57A:${instr.creditorBankCode}`);
    lines.push(`:59:/${instr.creditorAccountNumber}`);
    lines.push(instr.creditorName);
    lines.push(`:70:${instr.remittanceInfo.slice(0, 35)}`);
  }

  lines.push('-}');

  return {
    format: 'SWIFT_MT101',
    content: lines.join('\n'),
    messageId,
    numberOfTransactions: instructions.length,
    controlSum,
  };
}

/**
 * Builds Malaysia DuitNow payment file (simplified CSV format).
 * DuitNow is Malaysia's national real-time payment platform.
 */
export function buildDuitNow(
  messageId: string,
  instructions: readonly LocalPaymentInstruction[]
): PaymentFileOutput {
  let controlSum = 0n;
  const lines: string[] = [];

  // Header
  lines.push(
    `H|${messageId}|${instructions.length}|${instructions.length > 0 ? formatDate(instructions[0]!.executionDate) : ''}`
  );

  for (const instr of instructions) {
    controlSum += instr.amount;
    lines.push(
      `D|${instr.paymentId}|${instr.creditorIdType ?? 'ACCT'}|${instr.creditorAccountNumber}|` +
        `${instr.creditorName}|${instr.currencyCode}|${formatMinorUnits(instr.amount)}|` +
        `${instr.remittanceInfo}`
    );
  }

  // Trailer
  lines.push(`T|${instructions.length}|${formatMinorUnits(controlSum)}`);

  return {
    format: 'MY_DUITNOW',
    content: lines.join('\n'),
    messageId,
    numberOfTransactions: instructions.length,
    controlSum,
  };
}

/**
 * Builds Singapore FAST (Fast And Secure Transfers) payment file.
 * FAST is Singapore's real-time payment system via ABS.
 */
export function buildSgFast(
  messageId: string,
  instructions: readonly LocalPaymentInstruction[]
): PaymentFileOutput {
  let controlSum = 0n;
  const lines: string[] = [];

  // Header record
  lines.push(
    `01|${messageId}|FAST|${instructions.length > 0 ? formatDate(instructions[0]!.executionDate) : ''}|SGD`
  );

  for (const instr of instructions) {
    controlSum += instr.amount;
    lines.push(
      `02|${instr.paymentId}|${instr.debtorAccountNumber}|${instr.creditorBankCode}|` +
        `${instr.creditorAccountNumber}|${instr.creditorName}|` +
        `${formatMinorUnits(instr.amount)}|${instr.remittanceInfo}`
    );
  }

  // Trailer
  lines.push(`99|${instructions.length}|${formatMinorUnits(controlSum)}`);

  return {
    format: 'SG_FAST',
    content: lines.join('\n'),
    messageId,
    numberOfTransactions: instructions.length,
    controlSum,
  };
}

/**
 * Builds Indonesia RTGS (Bank Indonesia Real Time Gross Settlement) file.
 */
export function buildIdRtgs(
  messageId: string,
  instructions: readonly LocalPaymentInstruction[]
): PaymentFileOutput {
  let controlSum = 0n;
  const lines: string[] = [];

  lines.push(
    `HDR|${messageId}|RTGS|${instructions.length > 0 ? formatDate(instructions[0]!.executionDate) : ''}`
  );

  for (const instr of instructions) {
    controlSum += instr.amount;
    lines.push(
      `TXN|${instr.paymentId}|${instr.debtorBankCode}|${instr.debtorAccountNumber}|` +
        `${instr.creditorBankCode}|${instr.creditorAccountNumber}|${instr.creditorName}|` +
        `IDR|${formatMinorUnits(instr.amount, 0)}|${instr.remittanceInfo}`
    );
  }

  lines.push(`TRL|${instructions.length}|${formatMinorUnits(controlSum, 0)}`);

  return {
    format: 'ID_RTGS',
    content: lines.join('\n'),
    messageId,
    numberOfTransactions: instructions.length,
    controlSum,
  };
}

/**
 * Builds Thailand PromptPay payment file.
 * PromptPay is Thailand's national e-payment system.
 */
export function buildThPromptPay(
  messageId: string,
  instructions: readonly LocalPaymentInstruction[]
): PaymentFileOutput {
  let controlSum = 0n;
  const lines: string[] = [];

  lines.push(
    `H|${messageId}|PROMPTPAY|${instructions.length > 0 ? formatDate(instructions[0]!.executionDate) : ''}`
  );

  for (const instr of instructions) {
    controlSum += instr.amount;
    lines.push(
      `P|${instr.paymentId}|${instr.creditorIdType ?? 'ACCT'}|${instr.creditorIdNumber ?? instr.creditorAccountNumber}|` +
        `${instr.creditorName}|THB|${formatMinorUnits(instr.amount)}|${instr.remittanceInfo}`
    );
  }

  lines.push(`T|${instructions.length}|${formatMinorUnits(controlSum)}`);

  return {
    format: 'TH_PROMPTPAY',
    content: lines.join('\n'),
    messageId,
    numberOfTransactions: instructions.length,
    controlSum,
  };
}
