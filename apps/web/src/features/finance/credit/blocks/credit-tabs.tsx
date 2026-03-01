interface CreditLimit {
  paymentTermsDays: number;
  avgPaymentDays: number;
  overdueAmount: number;
  currency: string;
  creditScoreExternal: number | null;
  creditScoreInternal: number | null;
  reviewFrequency: string;
  nextReviewDate: string;
  isOnHold: boolean;
  holdReason?: string | null;
  holdDate?: string | null;
  holdBy?: string | null;
}

export function CreditOverviewTab({ credit }: { credit: CreditLimit }) {
  return (
    <div className="grid gap-6 sm:grid-cols-2">
      <div className="space-y-4">
        <div><h3 className="text-sm font-medium text-muted-foreground">Payment Terms</h3><p className="mt-1 text-sm">{credit.paymentTermsDays} days</p></div>
        <div><h3 className="text-sm font-medium text-muted-foreground">Average Payment Days</h3><p className="mt-1 text-sm">{credit.avgPaymentDays} days</p></div>
        <div><h3 className="text-sm font-medium text-muted-foreground">Overdue Amount</h3><p className="mt-1 text-sm">{credit.overdueAmount.toLocaleString()} {credit.currency}</p></div>
      </div>
      <div className="space-y-4">
        <div><h3 className="text-sm font-medium text-muted-foreground">External Credit Score</h3><p className="mt-1 text-sm">{credit.creditScoreExternal ?? '—'}</p></div>
        <div><h3 className="text-sm font-medium text-muted-foreground">Internal Credit Score</h3><p className="mt-1 text-sm">{credit.creditScoreInternal ?? '—'}</p></div>
        <div><h3 className="text-sm font-medium text-muted-foreground">Review Frequency</h3><p className="mt-1 text-sm capitalize">{credit.reviewFrequency}</p></div>
        <div><h3 className="text-sm font-medium text-muted-foreground">Next Review</h3><p className="mt-1 text-sm">{credit.nextReviewDate}</p></div>
      </div>
    </div>
  );
}

export function CreditHoldTab({ credit }: { credit: CreditLimit }) {
  if (!credit.isOnHold) {
    return <p className="text-sm text-muted-foreground">This customer is not currently on hold.</p>;
  }
  return (
    <div className="space-y-4">
      <div><h3 className="text-sm font-medium text-muted-foreground">Hold Reason</h3><p className="mt-1 text-sm">{credit.holdReason}</p></div>
      <div><h3 className="text-sm font-medium text-muted-foreground">Held Since</h3><p className="mt-1 text-sm">{credit.holdDate}</p></div>
      <div><h3 className="text-sm font-medium text-muted-foreground">Held By</h3><p className="mt-1 text-sm">{credit.holdBy}</p></div>
    </div>
  );
}
