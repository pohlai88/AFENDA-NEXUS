'use client';

import Link from 'next/link';
import { routes } from '@/lib/constants';
import { cn } from '@/lib/utils';
import { ShieldCheck, Bell, Clock } from 'lucide-react';

type ComplianceTab = 'summary' | 'alerts' | 'timeline';

interface PortalComplianceNavProps {
  activeTab: ComplianceTab;
}

const tabs: { id: ComplianceTab; label: string; href: string; icon: React.ElementType }[] = [
  { id: 'summary', label: 'Summary', href: routes.portal.compliance, icon: ShieldCheck },
  { id: 'alerts', label: 'Alerts', href: routes.portal.complianceAlerts, icon: Bell },
  { id: 'timeline', label: 'Timeline', href: routes.portal.complianceTimeline, icon: Clock },
];

export function PortalComplianceNav({ activeTab }: PortalComplianceNavProps) {
  return (
    <nav aria-label="Compliance sections" className="flex gap-1 rounded-lg border bg-muted/50 p-1">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = tab.id === activeTab;

        return (
          <Link
            key={tab.id}
            href={tab.href}
            className={cn(
              'flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors',
              isActive
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:bg-background/50 hover:text-foreground'
            )}
            aria-current={isActive ? 'page' : undefined}
          >
            <Icon className="h-4 w-4" aria-hidden />
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
