'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';

// ─── Types ───────────────────────────────────────────────────────────────────

/** A single tab definition within a business document. */
interface BusinessDocumentTab {
  /** Unique value used as the tab key. */
  value: string;
  /** Label shown in the tab trigger. */
  label: string;
  /** Content rendered for this tab. */
  content: React.ReactNode;
}

interface BusinessDocumentProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Document header (title, status, amounts, etc.). */
  header?: React.ReactNode;
  /** Tab definitions for the body section. */
  tabs?: BusinessDocumentTab[];
  /** Value of the initially selected tab. Defaults to the first tab. */
  defaultTab?: string;
  /** Optional right-rail content (audit panel, metadata, actions). */
  rightRail?: React.ReactNode;
}

// ─── Component ───────────────────────────────────────────────────────────────

const BusinessDocument = React.forwardRef<HTMLDivElement, BusinessDocumentProps>(
  ({ header, tabs, defaultTab, rightRail, className, children, ...props }, ref) => {
    // If no header/tabs provided, render as a simple card container with children
    if (!header && !tabs) {
      return (
        <div ref={ref} className={cn('rounded-lg border bg-card p-6', className)} {...props}>
          {children}
        </div>
      );
    }

    const defaultValue = defaultTab ?? tabs?.[0]?.value ?? 'details';

    return (
      <div ref={ref} className={cn('flex flex-col gap-6', className)} {...props}>
        {/* Document header */}
        <div className="rounded-lg border bg-card p-6">{header}</div>

        {/* Body: tabs + optional right rail */}
        <div className="flex gap-6">
          {/* Main content area with tabs */}
          <div className="min-w-0 flex-1">
            {tabs && tabs.length > 0 && (
            <Tabs defaultValue={defaultValue}>
              <TabsList>
                {tabs.map((tab) => (
                  <TabsTrigger key={tab.value} value={tab.value}>
                    {tab.label}
                  </TabsTrigger>
                ))}
              </TabsList>
              <Separator className="my-4" />
              {tabs.map((tab) => (
                <TabsContent key={tab.value} value={tab.value}>
                  {tab.content}
                </TabsContent>
              ))}
            </Tabs>
            )}
          </div>

          {/* Right rail (audit panel, metadata, actions) */}
          {rightRail && (
            <aside className="hidden w-80 shrink-0 lg:block">
              <div className="sticky top-6 space-y-4">{rightRail}</div>
            </aside>
          )}
        </div>
      </div>
    );
  },
);
BusinessDocument.displayName = 'BusinessDocument';

export { BusinessDocument };
export type { BusinessDocumentProps, BusinessDocumentTab };
