import Link from "next/link";
import { PageHeader } from "@/components/erp/page-header";
import { BarChart3, Scale, TrendingUp, Banknote } from "lucide-react";

export const metadata = { title: "Financial Reports" };

const reports = [
  {
    title: "Trial Balance",
    description: "Account balances for a selected period.",
    href: "/finance/trial-balance",
    icon: Scale,
  },
  {
    title: "Balance Sheet",
    description: "Assets, liabilities, and equity at a point in time.",
    href: "/finance/reports",
    icon: BarChart3,
  },
  {
    title: "Income Statement",
    description: "Revenue and expenses over a period.",
    href: "/finance/reports",
    icon: TrendingUp,
  },
  {
    title: "Cash Flow",
    description: "Operating, investing, and financing activities.",
    href: "/finance/reports",
    icon: Banknote,
  },
];

export default function ReportsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Financial Reports"
        description="Standard financial statements and analysis."
        breadcrumbs={[
          { label: "Finance" },
          { label: "Reports" },
        ]}
      />

      <div className="grid gap-4 sm:grid-cols-2">
        {reports.map((report) => (
          <Link
            key={report.title}
            href={report.href}
            className="group rounded-lg border p-4 transition-colors hover:bg-accent"
          >
            <div className="flex items-center gap-3">
              <report.icon className="h-5 w-5 text-muted-foreground group-hover:text-foreground" />
              <div>
                <h3 className="text-sm font-semibold">{report.title}</h3>
                <p className="text-xs text-muted-foreground">{report.description}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
