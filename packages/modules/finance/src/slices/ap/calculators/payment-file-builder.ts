/**
 * AP-06: ISO 20022 pain.001 payment file builder.
 * Generates XML payment initiation messages.
 * Pure calculator — no DB, no side effects.
 *
 * Uses raw bigint for amounts (minor units, e.g. cents).
 */

export interface PaymentInstruction {
  readonly paymentId: string;
  readonly debtorName: string;
  readonly debtorIban: string;
  readonly debtorBic: string;
  readonly creditorName: string;
  readonly creditorIban: string;
  readonly creditorBic: string;
  readonly amount: bigint;
  readonly currencyCode: string;
  readonly remittanceInfo: string;
  readonly executionDate: Date;
}

export interface Pain001Output {
  readonly xml: string;
  readonly messageId: string;
  readonly numberOfTransactions: number;
  readonly controlSum: bigint;
}

function escapeXml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function formatMinorUnits(amount: bigint, decimalPlaces: number = 2): string {
  const str = amount.toString();
  if (decimalPlaces === 0) return str;
  const padded = str.padStart(decimalPlaces + 1, '0');
  return `${padded.slice(0, -decimalPlaces)}.${padded.slice(-decimalPlaces)}`;
}

function formatDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export function buildPain001(
  messageId: string,
  debtorName: string,
  instructions: readonly PaymentInstruction[]
): Pain001Output {
  let controlSum = 0n;
  for (const instr of instructions) {
    controlSum += instr.amount;
  }

  const txBlocks = instructions
    .map(
      (instr) => `
    <CdtTrfTxInf>
      <PmtId><EndToEndId>${escapeXml(instr.paymentId)}</EndToEndId></PmtId>
      <Amt><InstdAmt Ccy="${escapeXml(instr.currencyCode)}">${formatMinorUnits(instr.amount)}</InstdAmt></Amt>
      <CdtrAgt><FinInstnId><BIC>${escapeXml(instr.creditorBic)}</BIC></FinInstnId></CdtrAgt>
      <Cdtr><Nm>${escapeXml(instr.creditorName)}</Nm></Cdtr>
      <CdtrAcct><Id><IBAN>${escapeXml(instr.creditorIban)}</IBAN></Id></CdtrAcct>
      <RmtInf><Ustrd>${escapeXml(instr.remittanceInfo)}</Ustrd></RmtInf>
    </CdtTrfTxInf>`
    )
    .join('');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<Document xmlns="urn:iso:std:iso:20022:tech:xsd:pain.001.001.03">
  <CstmrCdtTrfInitn>
    <GrpHdr>
      <MsgId>${escapeXml(messageId)}</MsgId>
      <CreDtTm>${new Date().toISOString()}</CreDtTm>
      <NbOfTxs>${instructions.length}</NbOfTxs>
      <CtrlSum>${formatMinorUnits(controlSum)}</CtrlSum>
      <InitgPty><Nm>${escapeXml(debtorName)}</Nm></InitgPty>
    </GrpHdr>
    <PmtInf>
      <PmtInfId>${escapeXml(messageId)}-PMT</PmtInfId>
      <PmtMtd>TRF</PmtMtd>
      <NbOfTxs>${instructions.length}</NbOfTxs>
      <ReqdExctnDt>${instructions.length > 0 ? formatDate(instructions[0]!.executionDate) : formatDate(new Date())}</ReqdExctnDt>
      <Dbtr><Nm>${escapeXml(debtorName)}</Nm></Dbtr>
      <DbtrAcct><Id><IBAN>${instructions.length > 0 ? escapeXml(instructions[0]!.debtorIban) : ''}</IBAN></Id></DbtrAcct>
      <DbtrAgt><FinInstnId><BIC>${instructions.length > 0 ? escapeXml(instructions[0]!.debtorBic) : ''}</BIC></FinInstnId></DbtrAgt>${txBlocks}
    </PmtInf>
  </CstmrCdtTrfInitn>
</Document>`;

  return {
    xml,
    messageId,
    numberOfTransactions: instructions.length,
    controlSum,
  };
}
