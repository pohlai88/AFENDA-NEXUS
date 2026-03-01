import Link from 'next/link';
import { PageHeader } from '@/components/erp/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Settings, CreditCard, Scale } from 'lucide-react';
import { routes } from '@/lib/constants';

export const metadata = { title: 'Finance Settings' };

export default function FinanceSettingsPage() {
  const sections = [
    {
      title: 'Payment Terms',
      description: 'Manage payment terms templates used during invoice creation.',
      href: routes.finance.paymentTerms,
      icon: CreditCard,
    },
    {
      title: 'Match Tolerance',
      description: 'Configure AP auto-matching thresholds by scope.',
      href: routes.finance.matchTolerance,
      icon: Scale,
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Finance Settings"
        description="Configure finance module behavior."
        breadcrumbs={[
          { label: 'Finance' },
          { label: 'Settings' },
        ]}
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {sections.map((s) => (
          <Link key={s.href} href={s.href}>
            <Card className="h-full transition-colors hover:border-primary/50">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <s.icon className="h-5 w-5 text-muted-foreground" />
                  <CardTitle className="text-base">{s.title}</CardTitle>
                </div>
                <CardDescription>{s.description}</CardDescription>
              </CardHeader>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
