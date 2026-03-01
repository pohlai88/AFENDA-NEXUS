'use client';

// ─── Onboarding Hint Component ──────────────────────────────────────────────
//
// Reusable component for displaying module-specific onboarding steps with
// localStorage-backed dismissal state.
//
// Usage:
// ```tsx
// <OnboardingHint
//   moduleId="finance.ap"
//   title="Getting Started with Accounts Payable"
//   steps={[
//     "Set up your chart of accounts",
//     "Configure payment terms and suppliers",
//     "Import or create your first invoice",
//   ]}
// />
// ```
//
// ─────────────────────────────────────────────────────────────────────────────

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  readConveniencePrefs,
  writeConveniencePrefs,
} from '@/lib/shell/shell-persistence';

interface OnboardingHintProps {
  /** Unique module ID (e.g., 'finance.ap', 'hrm'). */
  moduleId: string;
  /** Array of onboarding steps (max 5 recommended). */
  steps: string[];
  /** Optional custom title (defaults to "Getting Started with {moduleId}"). */
  title?: string;
}

/**
 * OnboardingHint component with localStorage-backed dismissal.
 *
 * Displays a list of onboarding steps for a module. User can dismiss it, and
 * the dismissal state is persisted in localStorage under
 * `dismissed_onboarding:{moduleId}`.
 */
export function OnboardingHint({ moduleId, steps, title }: OnboardingHintProps) {
  const storageKey = `dismissed_onboarding:${moduleId}`;

  const [dismissed, setDismissed] = useState(() =>
    readConveniencePrefs<boolean>(storageKey, false)
  );

  const handleDismiss = () => {
    setDismissed(true);
    writeConveniencePrefs(storageKey, true);
  };

  // Don't render if dismissed or no steps
  if (dismissed || steps.length === 0) return null;

  return (
    <Card className="border-info/50 bg-info/5">
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-sm">
            {title ?? `Getting Started with ${moduleId}`}
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={handleDismiss}>
            Dismiss
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <ol className="space-y-2">
          {steps.slice(0, 5).map((step, idx) => (
            // eslint-disable-next-line react/no-array-index-key
            <li key={`step-${idx}`} className="flex gap-2 text-sm">
              <Badge variant="outline" className="shrink-0">
                {idx + 1}
              </Badge>
              <span>{step}</span>
            </li>
          ))}
        </ol>
      </CardContent>
    </Card>
  );
}
