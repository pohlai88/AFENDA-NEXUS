import { BankAccountsList } from './bank-accounts-list';
import { StatementsTable } from './statements-table';
import { getBankAccounts, getBankStatements } from '../queries/banking.queries';
import { getRequestContext } from '@/lib/auth';

// ─── Async Server Sections ──────────────────────────────────────────────────

export async function BankAccountsSection() {
  const ctx = await getRequestContext();
  const result = await getBankAccounts(ctx);
  if (!result.ok) throw new Error(result.error);
  return <BankAccountsList accounts={result.data} />;
}

export async function StatementsSection() {
  const ctx = await getRequestContext();
  const result = await getBankStatements(ctx);
  if (!result.ok) throw new Error(result.error);
  return <StatementsTable statements={result.data} pagination={result.pagination} />;
}
