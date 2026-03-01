import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface ExpensePolicy {
  id: string;
  name: string;
  isDefault: boolean;
  requiresPreApproval: boolean;
  preApprovalThreshold: number;
  dailyLimit: number;
  monthlyLimit: number;
  requiresReceipt: boolean;
  receiptThreshold: number;
  allowedCurrencies: string[];
  categoryLimits: Record<string, number>;
}

export function ExpensePoliciesList({ policies }: { policies: ExpensePolicy[] }) {
  return (
    <div className="space-y-4">
      {policies.map((p) => (
        <Card key={p.id}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">{p.name}</CardTitle>
              <div className="flex gap-2">
                {p.isDefault && <Badge variant="default">Default</Badge>}
                <Badge variant="outline">
                  {p.requiresPreApproval ? `Pre-approval > ${p.preApprovalThreshold}` : 'No pre-approval'}
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <span className="text-xs text-muted-foreground">Daily Limit</span>
                <p className="font-mono font-medium">{p.dailyLimit.toLocaleString()}</p>
              </div>
              <div>
                <span className="text-xs text-muted-foreground">Monthly Limit</span>
                <p className="font-mono font-medium">{p.monthlyLimit.toLocaleString()}</p>
              </div>
              <div>
                <span className="text-xs text-muted-foreground">Receipt Required</span>
                <p className="font-medium">{p.requiresReceipt ? `Over ${p.receiptThreshold}` : 'No'}</p>
              </div>
              <div>
                <span className="text-xs text-muted-foreground">Currencies</span>
                <p className="font-medium">{p.allowedCurrencies.join(', ')}</p>
              </div>
            </div>
            {Object.keys(p.categoryLimits).length > 0 && (
              <div className="mt-4">
                <span className="text-xs text-muted-foreground">Category Limits</span>
                <div className="mt-1 flex flex-wrap gap-2">
                  {Object.entries(p.categoryLimits).map(([cat, limit]) => (
                    <Badge key={cat} variant="secondary">{cat}: {limit.toLocaleString()}</Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
