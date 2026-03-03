'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Mail, Phone, Clock, Shield, User } from 'lucide-react';
import type { PortalDirectoryEntry, Department } from '../queries/portal.queries';

interface PortalDirectorySectionsProps {
  entries: PortalDirectoryEntry[];
}

const DEPARTMENT_LABELS: Record<Department, string> = {
  ACCOUNTS_PAYABLE: 'Accounts Payable',
  PROCUREMENT: 'Procurement',
  COMPLIANCE: 'Compliance',
  FINANCE_MANAGEMENT: 'Finance Management',
  EXECUTIVE: 'Executive',
  OPERATIONS: 'Operations',
  LEGAL: 'Legal',
};

export function PortalDirectorySections({ entries }: PortalDirectorySectionsProps) {
  // Group by department
  const byDepartment = entries.reduce(
    (acc, entry) => {
      if (!acc[entry.department]) {
        acc[entry.department] = [];
      }
      acc[entry.department].push(entry);
      return acc;
    },
    {} as Record<Department, PortalDirectoryEntry[]>
  );

  const departments = Object.keys(byDepartment) as Department[];

  return (
    <div className="space-y-8">
      {departments.map((dept) => (
        <div key={dept} className="space-y-3">
          <h2 className="text-lg font-semibold">{DEPARTMENT_LABELS[dept]}</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {byDepartment[dept].map((entry) => (
              <Card key={entry.id} className="relative">
                {entry.isEscalationContact && (
                  <div className="absolute right-3 top-3">
                    <div className="flex items-center gap-1 rounded-full bg-warning/10 px-2 py-0.5 text-xs font-medium text-warning-foreground">
                      <Shield className="h-3 w-3" />
                      <span>Escalation Contact</span>
                    </div>
                  </div>
                )}
                <CardHeader className="pb-3">
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
                      <User className="h-5 w-5 text-primary" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <CardTitle className="text-base">{entry.fullName}</CardTitle>
                      <p className="text-sm text-muted-foreground">{entry.title}</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Mail className="h-4 w-4 shrink-0" />
                    <div className="min-w-0">
                      <p className="truncate">{entry.emailAddress}</p>
                      {entry.masked && (
                        <p className="text-xs text-warning">Email address is masked</p>
                      )}
                    </div>
                  </div>

                  {entry.phoneNumber && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Phone className="h-4 w-4 shrink-0" />
                      <p>{entry.phoneNumber}</p>
                    </div>
                  )}

                  {entry.availability && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Clock className="h-4 w-4 shrink-0" />
                      <p className="text-xs">
                        {entry.availability}
                        {entry.timezone && ` (${entry.timezone})`}
                      </p>
                    </div>
                  )}

                  {entry.bio && (
                    <div className="mt-3 rounded-md bg-muted/50 p-2 text-xs text-muted-foreground">
                      {entry.bio}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
