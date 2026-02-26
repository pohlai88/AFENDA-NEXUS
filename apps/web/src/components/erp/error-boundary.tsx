'use client';

import { Component, type ErrorInfo, type ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, RefreshCw, Copy, Home, ArrowLeft } from 'lucide-react';
import { reportError, getCorrelationId, getUserFriendlyMessage } from '@/lib/error-reporting';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

// ─── Types ───────────────────────────────────────────────────────────────────

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  componentName?: string;
  showCorrelationId?: boolean;
  onError?: (error: Error, correlationId: string) => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  correlationId: string | null;
}

// ─── Error Boundary Component ────────────────────────────────────────────────

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null, correlationId: null };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const correlationId = reportError(error, {
      component: this.props.componentName ?? 'ErrorBoundary',
      extra: {
        componentStack: errorInfo.componentStack,
      },
    });

    this.setState({ correlationId });
    this.props.onError?.(error, correlationId);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, correlationId: null });
  };

  handleCopyId = () => {
    if (this.state.correlationId) {
      navigator.clipboard.writeText(this.state.correlationId);
      toast.success('Error ID copied to clipboard');
    }
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      const userMessage = getUserFriendlyMessage(this.state.error);
      const showCorrelationId = this.props.showCorrelationId ?? true;

      return (
        <Card className="mx-auto max-w-md border-destructive/20 bg-destructive/5">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-destructive/20 p-2">
                <AlertTriangle className="h-5 w-5 text-destructive" />
              </div>
              <CardTitle className="text-lg">Something went wrong</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">{userMessage}</p>
            {showCorrelationId && this.state.correlationId && (
              <div className="flex items-center gap-2 rounded-md bg-muted px-3 py-2">
                <span className="text-xs text-muted-foreground">Error ID:</span>
                <code className="flex-1 text-xs font-mono">{this.state.correlationId}</code>
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={this.handleCopyId}>
                  <Copy className="h-3 w-3" />
                  <span className="sr-only">Copy error ID</span>
                </Button>
              </div>
            )}
          </CardContent>
          <CardFooter className="gap-2">
            <Button variant="outline" size="sm" onClick={this.handleReset}>
              <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
              Try Again
            </Button>
          </CardFooter>
        </Card>
      );
    }

    return this.props.children;
  }
}

// ─── Error Display Component (for error.tsx pages) ───────────────────────────

interface ErrorDisplayProps {
  error: Error & { digest?: string };
  reset: () => void;
  title?: string;
  showHomeLink?: boolean;
  showBackLink?: boolean;
  className?: string;
}

export function ErrorDisplay({
  error,
  reset,
  title = 'Something went wrong',
  showHomeLink = true,
  showBackLink = true,
  className,
}: ErrorDisplayProps) {
  const correlationId = error.digest ?? getCorrelationId();
  const userMessage = getUserFriendlyMessage(error);

  const handleCopyId = () => {
    navigator.clipboard.writeText(correlationId);
    toast.success('Error ID copied to clipboard');
  };

  return (
    <div className={cn('flex flex-col items-center justify-center gap-6 p-6', className)}>
      <div className="flex flex-col items-center gap-4 text-center">
        <div className="rounded-full bg-destructive/10 p-4">
          <AlertTriangle className="h-8 w-8 text-destructive" />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-bold">{title}</h1>
          <p className="max-w-md text-muted-foreground">{userMessage}</p>
        </div>
      </div>

      {/* Correlation ID */}
      <div className="flex items-center gap-2 rounded-lg bg-muted px-4 py-2">
        <span className="text-xs text-muted-foreground">Reference:</span>
        <code className="text-xs font-mono">{correlationId}</code>
        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={handleCopyId}>
          <Copy className="h-3 w-3" />
          <span className="sr-only">Copy reference ID</span>
        </Button>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap items-center justify-center gap-3">
        <Button onClick={reset}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Try Again
        </Button>
        {showBackLink && (
          <Button variant="outline" onClick={() => window.history.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Go Back
          </Button>
        )}
        {showHomeLink && (
          <Button variant="ghost" asChild>
            <a href="/">
              <Home className="mr-2 h-4 w-4" />
              Home
            </a>
          </Button>
        )}
      </div>

      {/* Debug info in development */}
      {process.env.NODE_ENV === 'development' && (
        <details className="w-full max-w-2xl">
          <summary className="cursor-pointer text-xs text-muted-foreground hover:text-foreground">
            Debug information
          </summary>
          <pre className="mt-2 overflow-auto rounded-lg bg-muted p-4 text-xs">{error.stack}</pre>
        </details>
      )}
    </div>
  );
}

// ─── Not Found Display Component ─────────────────────────────────────────────

interface NotFoundDisplayProps {
  title?: string;
  description?: string;
  showHomeLink?: boolean;
  showBackLink?: boolean;
  className?: string;
}

export function NotFoundDisplay({
  title = 'Page not found',
  description = "The page you're looking for doesn't exist or has been moved.",
  showHomeLink = true,
  showBackLink = true,
  className,
}: NotFoundDisplayProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center gap-6 p-6', className)}>
      <div className="flex flex-col items-center gap-4 text-center">
        <div className="text-6xl font-bold text-muted-foreground">404</div>
        <div className="space-y-2">
          <h1 className="text-2xl font-bold">{title}</h1>
          <p className="max-w-md text-muted-foreground">{description}</p>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-3">
        {showBackLink && (
          <Button variant="outline" onClick={() => window.history.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Go Back
          </Button>
        )}
        {showHomeLink && (
          <Button asChild>
            <a href="/">
              <Home className="mr-2 h-4 w-4" />
              Home
            </a>
          </Button>
        )}
      </div>
    </div>
  );
}
