'use client';

import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn, formatCurrency, formatDate } from '@/lib/utils';
import { routes } from '@/lib/constants';
import { Building2, CreditCard, PiggyBank, Landmark, ChevronRight, Plus } from 'lucide-react';
import type { BankAccount, BankAccountType } from '../types';

// ─── Account Type Icons ──────────────────────────────────────────────────────

const accountTypeConfig: Record<BankAccountType, { icon: typeof Building2; label: string }> = {
  checking: { icon: Building2, label: 'Checking' },
  savings: { icon: PiggyBank, label: 'Savings' },
  money_market: { icon: Landmark, label: 'Money Market' },
  credit_card: { icon: CreditCard, label: 'Credit Card' },
  loan: { icon: Landmark, label: 'Loan' },
};

// ─── Account Card ────────────────────────────────────────────────────────────

function BankAccountCard({ account }: { account: BankAccount }) {
  const config = accountTypeConfig[account.accountType];
  const Icon = config.icon;

  return (
    <Card className="group relative hover:shadow-md transition-shadow">
      <Link
        href={`${routes.finance.banking}/accounts/${account.id}`}
        className="absolute inset-0 z-10"
      >
        <span className="sr-only">View {account.name}</span>
      </Link>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-accent p-2">
              <Icon className="h-5 w-5"  aria-hidden="true" />
            </div>
            <div>
              <CardTitle className="text-base">{account.name}</CardTitle>
              <CardDescription className="text-xs">
                {account.bankName} • {account.accountNumber}
              </CardDescription>
            </div>
          </div>
          <ChevronRight className="h-5 w-5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div>
            <div className="text-2xl font-bold tabular-nums">
              {formatCurrency(account.currentBalance, account.currency)}
            </div>
            <div className="text-xs text-muted-foreground">Current Balance</div>
          </div>

          <div className="flex items-center justify-between text-sm">
            <div className="text-muted-foreground">GL Account</div>
            <Badge variant="secondary" className="font-mono">
              {account.glAccountCode}
            </Badge>
          </div>

          <div className="flex items-center justify-between text-sm">
            <div className="text-muted-foreground">Last Reconciled</div>
            <div className={cn(!account.lastReconciledDate && 'text-warning dark:text-warning')}>
              {account.lastReconciledDate ? formatDate(account.lastReconciledDate) : 'Never'}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Badge variant={account.status === 'active' ? 'default' : 'secondary'}>
              {account.status}
            </Badge>
            <Badge variant="outline">{config.label}</Badge>
            {account.isDefault && <Badge variant="outline">Default</Badge>}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Bank Accounts List ──────────────────────────────────────────────────────

interface BankAccountsListProps {
  accounts: BankAccount[];
}

export function BankAccountsList({ accounts }: BankAccountsListProps) {
  const activeAccounts = accounts.filter((a) => a.status === 'active');
  const inactiveAccounts = accounts.filter((a) => a.status !== 'active');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Bank Accounts</h2>
          <p className="text-sm text-muted-foreground">
            {activeAccounts.length} active account{activeAccounts.length !== 1 && 's'}
          </p>
        </div>
        <Button asChild>
          <Link href={`${routes.finance.banking}/accounts/new`}>
            <Plus className="mr-2 h-4 w-4" />
            Add Account
          </Link>
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {activeAccounts.map((account) => (
          <BankAccountCard key={account.id} account={account} />
        ))}
      </div>

      {inactiveAccounts.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-muted-foreground">Inactive Accounts</h3>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {inactiveAccounts.map((account) => (
              <BankAccountCard key={account.id} account={account} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
