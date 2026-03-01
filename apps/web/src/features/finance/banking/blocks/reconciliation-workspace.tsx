'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn, formatCurrency, formatDate } from '@/lib/utils';
import { routes } from '@/lib/constants';
import { toast } from 'sonner';
import {
  Check,
  ChevronDown,
  Link2,
  Link2Off,
  Sparkles,
  X,
} from 'lucide-react';
import { getIcon } from '@/lib/modules/icon-map';
import type {
  BankTransaction,
  GLTransaction,
  MatchSuggestion,
  ReconciliationSession,
  MatchStatus,
  MatchConfidence,
} from '../types';
import { matchStatusConfig, matchConfidenceConfig } from '../types';
import {
  matchTransactions,
  unmatchTransactions,
  autoMatchTransactions,
  excludeTransactions,
  completeReconciliation,
} from '../actions/banking.actions';

const ZapIcon = getIcon('Zap');

// ─── Reconciliation Summary ──────────────────────────────────────────────────

interface ReconciliationSummaryProps {
  session: ReconciliationSession;
}

function ReconciliationSummary({ session }: ReconciliationSummaryProps) {
  const isBalanced = Math.abs(session.difference) < 0.01;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Reconciliation Summary</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <div className="text-muted-foreground">Statement Opening</div>
            <div className="font-mono font-medium">
              {formatCurrency(session.openingBalanceStatement, 'USD')}
            </div>
          </div>
          <div>
            <div className="text-muted-foreground">Statement Closing</div>
            <div className="font-mono font-medium">
              {formatCurrency(session.closingBalanceStatement, 'USD')}
            </div>
          </div>
          <div>
            <div className="text-muted-foreground">Book Opening</div>
            <div className="font-mono font-medium">
              {formatCurrency(session.openingBalanceBook, 'USD')}
            </div>
          </div>
          <div>
            <div className="text-muted-foreground">Book Closing</div>
            <div className="font-mono font-medium">
              {formatCurrency(session.closingBalanceBook, 'USD')}
            </div>
          </div>
        </div>

        <div
          className={cn(
            'rounded-lg p-3 text-center',
            isBalanced
              ? 'bg-success/10 dark:bg-success/20'
              : 'bg-destructive/10 dark:bg-destructive/20'
          )}
        >
          <div className="text-xs text-muted-foreground">Difference</div>
          <div
            className={cn(
              'text-xl font-bold font-mono',
              isBalanced ? 'text-success' : 'text-destructive'
            )}
          >
            {formatCurrency(session.difference, 'USD')}
          </div>
        </div>

        <div className="grid grid-cols-4 gap-2 text-center text-xs">
          <div className="rounded bg-accent p-2">
            <div className="font-bold">{session.totalMatched}</div>
            <div className="text-muted-foreground">Matched</div>
          </div>
          <div className="rounded bg-accent p-2">
            <div className="font-bold">{session.totalUnmatched}</div>
            <div className="text-muted-foreground">Unmatched</div>
          </div>
          <div className="rounded bg-accent p-2">
            <div className="font-bold">{session.totalCreated}</div>
            <div className="text-muted-foreground">Created</div>
          </div>
          <div className="rounded bg-accent p-2">
            <div className="font-bold">{session.totalExcluded}</div>
            <div className="text-muted-foreground">Excluded</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Match Status Badge ──────────────────────────────────────────────────────

function MatchStatusBadge({ status }: { status: MatchStatus }) {
  const config = matchStatusConfig[status];
  return <Badge className={cn('text-xs', config.color)}>{config.label}</Badge>;
}

// ─── Confidence Badge ────────────────────────────────────────────────────────

function ConfidenceBadge({ confidence }: { confidence: MatchConfidence }) {
  const config = matchConfidenceConfig[confidence];
  return (
    <Badge variant="outline" className={cn('text-xs gap-1', config.color)}>
      <Sparkles className="h-3 w-3" />
      {config.label}
    </Badge>
  );
}

// ─── Bank Transaction Row ────────────────────────────────────────────────────

interface BankTransactionRowProps {
  transaction: BankTransaction;
  isSelected: boolean;
  onSelect: (id: string) => void;
  suggestion?: MatchSuggestion;
}

function BankTransactionRow({
  transaction,
  isSelected,
  onSelect,
  suggestion,
}: BankTransactionRowProps) {
  return (
    <div
      className={cn(
        'flex items-start gap-3 p-3 rounded-lg border transition-colors cursor-pointer',
        isSelected && 'border-primary bg-accent',
        !isSelected && 'hover:bg-accent/50'
      )}
      role="button"
      tabIndex={0}
      onClick={() => onSelect(transaction.id)}
      onKeyDown={(e: React.KeyboardEvent) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSelect(transaction.id); } }}
    >
      <Checkbox
        checked={isSelected}
        onCheckedChange={() => onSelect(transaction.id)}
        onClick={(e) => e.stopPropagation()}
      />
      <div className="flex-1 min-w-0 space-y-1">
        <div className="flex items-center justify-between gap-2">
          <span className="font-medium text-sm truncate">{transaction.description}</span>
          <span
            className={cn(
              'font-mono font-medium',
              transaction.type === 'credit' ? 'text-success' : 'text-destructive'
            )}
          >
            {transaction.type === 'credit' ? '+' : '-'}
            {formatCurrency(transaction.amount, transaction.currency)}
          </span>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>{formatDate(transaction.transactionDate)}</span>
          <span>•</span>
          <span className="font-mono">{transaction.reference}</span>
          {transaction.payeeName && (
            <>
              <span>•</span>
              <span>{transaction.payeeName}</span>
            </>
          )}
        </div>
        <div className="flex items-center gap-2">
          <MatchStatusBadge status={transaction.matchStatus} />
          { suggestion ? <ConfidenceBadge confidence={suggestion.confidence} /> : null}
        </div>
      </div>
    </div>
  );
}

// ─── GL Transaction Row ──────────────────────────────────────────────────────

interface GLTransactionRowProps {
  transaction: GLTransaction;
  isSelected: boolean;
  onSelect: (id: string) => void;
}

function GLTransactionRow({ transaction, isSelected, onSelect }: GLTransactionRowProps) {
  return (
    <div
      className={cn(
        'flex items-start gap-3 p-3 rounded-lg border transition-colors cursor-pointer',
        isSelected && 'border-primary bg-accent',
        !isSelected && 'hover:bg-accent/50'
      )}
      role="button"
      tabIndex={0}
      onClick={() => onSelect(transaction.id)}
      onKeyDown={(e: React.KeyboardEvent) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSelect(transaction.id); } }}
    >
      <Checkbox
        checked={isSelected}
        onCheckedChange={() => onSelect(transaction.id)}
        onClick={(e) => e.stopPropagation()}
      />
      <div className="flex-1 min-w-0 space-y-1">
        <div className="flex items-center justify-between gap-2">
          <span className="font-medium text-sm truncate">{transaction.description}</span>
          <span
            className={cn(
              'font-mono font-medium',
              transaction.amount > 0 ? 'text-success' : 'text-destructive'
            )}
          >
            {transaction.amount > 0 ? '+' : ''}
            {formatCurrency(Math.abs(transaction.amount), 'USD')}
          </span>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>{formatDate(transaction.date)}</span>
          <span>•</span>
          <span className="font-mono">{transaction.journalNumber}</span>
          <span>•</span>
          <span>{transaction.source}</span>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={transaction.isReconciled ? 'default' : 'secondary'} className="text-xs">
            {transaction.isReconciled ? 'Reconciled' : 'Unreconciled'}
          </Badge>
        </div>
      </div>
    </div>
  );
}

// ─── Main Workspace ──────────────────────────────────────────────────────────

interface ReconciliationWorkspaceProps {
  session: ReconciliationSession;
  bankTransactions: BankTransaction[];
  glTransactions: GLTransaction[];
  suggestions: MatchSuggestion[];
  statementId: string;
}

export function ReconciliationWorkspace({
  session,
  bankTransactions,
  glTransactions,
  suggestions,
  statementId,
}: ReconciliationWorkspaceProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [selectedBankTxns, setSelectedBankTxns] = useState<Set<string>>(new Set());
  const [selectedGLTxns, setSelectedGLTxns] = useState<Set<string>>(new Set());
  const [filterStatus, setFilterStatus] = useState<MatchStatus | 'all'>('all');

  const filteredBankTxns = bankTransactions.filter(
    (t) => filterStatus === 'all' || t.matchStatus === filterStatus
  );

  const suggestionMap = new Map(suggestions.map((s) => [s.bankTransactionId, s]));

  const toggleBankSelection = (id: string) => {
    setSelectedBankTxns((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const toggleGLSelection = (id: string) => {
    setSelectedGLTxns((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleMatch = () => {
    if (selectedBankTxns.size === 0 || selectedGLTxns.size === 0) {
      toast.error('Select transactions from both sides to match');
      return;
    }

    startTransition(async () => {
      const result = await matchTransactions({
        bankTransactionIds: Array.from(selectedBankTxns),
        glTransactionIds: Array.from(selectedGLTxns),
        statementId,
      });

      if (result.ok) {
        toast.success('Transactions matched successfully');
        setSelectedBankTxns(new Set());
        setSelectedGLTxns(new Set());
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  };

  const handleUnmatch = () => {
    if (selectedBankTxns.size === 0) {
      toast.error('Select matched transactions to unmatch');
      return;
    }

    startTransition(async () => {
      const result = await unmatchTransactions({
        bankTransactionIds: Array.from(selectedBankTxns),
        statementId,
      });

      if (result.ok) {
        toast.success('Transactions unmatched');
        setSelectedBankTxns(new Set());
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  };

  const handleAutoMatch = (threshold: 'high' | 'medium' | 'low') => {
    startTransition(async () => {
      const result = await autoMatchTransactions({
        statementId,
        confidenceThreshold: threshold,
      });

      if (result.ok) {
        toast.success(`Auto-matched ${result.data.matchedCount} transactions`);
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  };

  const handleExclude = () => {
    if (selectedBankTxns.size === 0) {
      toast.error('Select transactions to exclude');
      return;
    }

    startTransition(async () => {
      const result = await excludeTransactions({
        bankTransactionIds: Array.from(selectedBankTxns),
        statementId,
        reason: 'Manually excluded during reconciliation',
      });

      if (result.ok) {
        toast.success('Transactions excluded');
        setSelectedBankTxns(new Set());
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  };

  const handleComplete = () => {
    startTransition(async () => {
      const result = await completeReconciliation({ statementId });

      if (result.ok) {
        toast.success('Reconciliation completed');
        router.push(`${routes.finance.banking}/statements`);
      } else {
        toast.error(result.error);
      }
    });
  };

  const canComplete = session.totalUnmatched === 0 && Math.abs(session.difference) < 0.01;

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_300px]">
      {/* Main Workspace */}
      <div className="space-y-4">
        {/* Toolbar */}
        <Card>
          <CardContent className="flex items-center justify-between p-3">
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                onClick={handleMatch}
                disabled={isPending || selectedBankTxns.size === 0 || selectedGLTxns.size === 0}
              >
                <Link2 className="mr-2 h-4 w-4" />
                Match Selected
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={handleUnmatch}
                disabled={isPending || selectedBankTxns.size === 0}
              >
                <Link2Off className="mr-2 h-4 w-4" />
                Unmatch
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={handleExclude}
                disabled={isPending || selectedBankTxns.size === 0}
              >
                <X className="mr-2 h-4 w-4" />
                Exclude
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button size="sm" variant="outline" disabled={isPending}>
                    <ZapIcon className="mr-2 h-4 w-4" />
                    Auto-Match
                    <ChevronDown className="ml-2 h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => handleAutoMatch('high')}>
                    High confidence only
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleAutoMatch('medium')}>
                    Medium+ confidence
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleAutoMatch('low')}>
                    All suggestions
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <Button onClick={handleComplete} disabled={isPending || !canComplete}>
              <Check className="mr-2 h-4 w-4" />
              Complete Reconciliation
            </Button>
          </CardContent>
        </Card>

        {/* Split View */}
        <div className="grid gap-4 lg:grid-cols-2">
          {/* Bank Transactions */}
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Bank Statement</CardTitle>
                <Tabs
                  value={filterStatus}
                  onValueChange={(v) => setFilterStatus(v as MatchStatus | 'all')}
                >
                  <TabsList className="h-8">
                    <TabsTrigger value="all" className="text-xs h-7">
                      All
                    </TabsTrigger>
                    <TabsTrigger value="unmatched" className="text-xs h-7">
                      Unmatched
                    </TabsTrigger>
                    <TabsTrigger value="matched" className="text-xs h-7">
                      Matched
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
              <CardDescription>
                {selectedBankTxns.size} selected of {filteredBankTxns.length} transactions
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[500px]">
                <div className="space-y-2 p-4">
                  {filteredBankTxns.map((txn) => (
                    <BankTransactionRow
                      key={txn.id}
                      transaction={txn}
                      isSelected={selectedBankTxns.has(txn.id)}
                      onSelect={toggleBankSelection}
                      suggestion={suggestionMap.get(txn.id)}
                    />
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          {/* GL Transactions */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Book Transactions</CardTitle>
              <CardDescription>
                {selectedGLTxns.size} selected of {glTransactions.length} unreconciled entries
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[500px]">
                <div className="space-y-2 p-4">
                  {glTransactions.map((txn) => (
                    <GLTransactionRow
                      key={txn.id}
                      transaction={txn}
                      isSelected={selectedGLTxns.has(txn.id)}
                      onSelect={toggleGLSelection}
                    />
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Sidebar */}
      <div className="space-y-4">
        <ReconciliationSummary session={session} />

        {/* Match Suggestions */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-warning" />
              Smart Suggestions
            </CardTitle>
            <CardDescription>{suggestions.length} potential matches found</CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[200px]">
              <div className="space-y-2">
                {suggestions.map((suggestion) => {
                  const bankTxn = bankTransactions.find(
                    (t) => t.id === suggestion.bankTransactionId
                  );
                  if (!bankTxn) return null;

                  return (
                    <div
                      key={suggestion.id}
                      className="p-2 rounded border text-xs space-y-1 cursor-pointer hover:bg-accent"
                      role="button"
                      tabIndex={0}
                      onClick={() => {
                        setSelectedBankTxns(new Set([suggestion.bankTransactionId]));
                        setSelectedGLTxns(new Set(suggestion.glTransactionIds));
                      }}
                      onKeyDown={(e: React.KeyboardEvent) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          setSelectedBankTxns(new Set([suggestion.bankTransactionId]));
                          setSelectedGLTxns(new Set(suggestion.glTransactionIds));
                        }
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium truncate">{bankTxn.description}</span>
                        <ConfidenceBadge confidence={suggestion.confidence} />
                      </div>
                      <div className="text-muted-foreground">{suggestion.matchReason}</div>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
