import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { routes } from '@/lib/constants';
import {
  BarChart3,
  Scale,
  TrendingUp,
  Banknote,
  PieChart,
  Receipt,
  HandCoins,
  ArrowLeftRight,
  Target,
  Package,
  FileCheck,
  GitBranch,
  type LucideIcon,
} from 'lucide-react';

// ─── Report Category Config ─────────────────────────────────────────────────

interface ReportItem {
  title: string;
  description: string;
  href: string;
  icon: LucideIcon;
}

interface ReportCategory {
  title: string;
  description: string;
  reports: ReportItem[];
}

const reportCategories: ReportCategory[] = [
  {
    title: 'Financial Statements',
    description: 'Core financial reports for external and internal stakeholders',
    reports: [
      { title: 'Balance Sheet', description: 'Assets, liabilities, and equity at a point in time', href: routes.finance.balanceSheet, icon: BarChart3 },
      { title: 'Income Statement', description: 'Revenue and expenses over a period', href: routes.finance.incomeStatement, icon: TrendingUp },
      { title: 'Cash Flow Statement', description: 'Operating, investing, and financing activities', href: routes.finance.cashFlow, icon: Banknote },
      { title: 'Statement of Equity', description: 'Changes in shareholders equity over a period', href: routes.finance.equityStatement, icon: PieChart },
    ],
  },
  {
    title: 'General Ledger',
    description: 'Account-level analysis and verification',
    reports: [
      { title: 'Trial Balance', description: 'Account balances for a selected period', href: routes.finance.trialBalance, icon: Scale },
      { title: 'Budget Variance', description: 'Actual vs budget comparison', href: routes.finance.budgetVariance, icon: Target },
    ],
  },
  {
    title: 'Payables & Receivables',
    description: 'Aging analysis and customer/vendor insights',
    reports: [
      { title: 'AP Aging', description: 'Accounts payable aging by vendor', href: routes.finance.apAging, icon: Receipt },
      { title: 'AR Aging', description: 'Accounts receivable aging by customer', href: routes.finance.arAging, icon: HandCoins },
      { title: 'Intercompany Aging', description: 'Intercompany balances by entity', href: routes.finance.icAging, icon: ArrowLeftRight },
    ],
  },
  {
    title: 'Assets & Tax',
    description: 'Asset tracking and tax compliance',
    reports: [
      { title: 'Asset Register', description: 'Complete fixed asset listing with depreciation', href: routes.finance.assetRegister, icon: Package },
      { title: 'Tax Summary', description: 'Tax liabilities and payments summary', href: routes.finance.taxSummary, icon: FileCheck },
    ],
  },
  {
    title: 'Cost & Consolidation',
    description: 'Cost analysis and group reporting',
    reports: [
      { title: 'Cost Allocation', description: 'Cost distribution across cost centers', href: routes.finance.costAllocation, icon: PieChart },
      { title: 'Consolidation', description: 'Consolidated group financials', href: routes.finance.consolidationReport, icon: GitBranch },
    ],
  },
];

// ─── Report Categories Grid ─────────────────────────────────────────────────

export function ReportCategoriesGrid() {
  return (
    <>
      {reportCategories.map((category) => (
        <Card key={category.title}>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">{category.title}</CardTitle>
            <p className="text-sm text-muted-foreground">{category.description}</p>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {category.reports.map((report) => (
                <Link
                  key={report.title}
                  href={report.href}
                  className="group flex items-start gap-3 rounded-lg border p-3 transition-colors hover:bg-accent"
                >
                  <div className="rounded-md bg-muted p-2">
                    <report.icon className="h-4 w-4 text-muted-foreground group-hover:text-foreground" />
                  </div>
                  <div className="space-y-0.5">
                    <h3 className="text-sm font-medium">{report.title}</h3>
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {report.description}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
    </>
  );
}
