"use client";

import { cn } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";

interface BusinessDocumentTab {
  value: string;
  label: string;
  content: React.ReactNode;
}

interface BusinessDocumentProps {
  header: React.ReactNode;
  tabs: BusinessDocumentTab[];
  defaultTab?: string;
  rightRail?: React.ReactNode;
  className?: string;
}

export function BusinessDocument({
  header,
  tabs,
  defaultTab,
  rightRail,
  className,
}: BusinessDocumentProps) {
  const defaultValue = defaultTab ?? tabs[0]?.value ?? "details";

  return (
    <div className={cn("flex flex-col gap-6", className)}>
      {/* Document header */}
      <div className="rounded-lg border bg-card p-6">{header}</div>

      {/* Body: tabs + optional right rail */}
      <div className="flex gap-6">
        {/* Main content area with tabs */}
        <div className="min-w-0 flex-1">
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
}
