import { MoneyCell } from '@/components/erp/money-cell';

interface CashFlowData {
  operatingActivities: string;
  investingActivities: string;
  financingActivities: string;
  netCashFlow: string;
}

function CashFlowRow({ label, amount }: { label: string; amount: string }) {
  return (
    <div className="rounded-md border p-4">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">{label}</span>
        <MoneyCell amount={amount} className="font-semibold" />
      </div>
    </div>
  );
}

export function CashFlowDisplay({ data }: { data: CashFlowData }) {
  return (
    <div className="space-y-4">
      <CashFlowRow label="Operating Activities" amount={data.operatingActivities} />
      <CashFlowRow label="Investing Activities" amount={data.investingActivities} />
      <CashFlowRow label="Financing Activities" amount={data.financingActivities} />
      <div className="rounded-md border-2 border-primary/30 bg-primary/5 p-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-bold">Net Cash Flow</span>
          <MoneyCell amount={data.netCashFlow} className="text-base font-bold" />
        </div>
      </div>
    </div>
  );
}
