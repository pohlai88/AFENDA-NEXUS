'use client';

import { useEffect, useRef, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Copy, Download } from 'lucide-react';

interface MermaidDiagramProps {
  code: string;
  title?: string;
  description?: string;
  className?: string;
}

export function MermaidDiagram({ code, title, description, className }: MermaidDiagramProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [svg, setSvg] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function renderDiagram() {
      try {
        const mermaid = (await import('mermaid')).default;
        
        mermaid.initialize({
          startOnLoad: false,
          theme: 'base',
          themeVariables: {
            primaryColor: 'hsl(var(--chart-1))',
            primaryTextColor: 'hsl(var(--foreground))',
            primaryBorderColor: 'hsl(var(--border))',
            lineColor: 'hsl(var(--border))',
            secondaryColor: 'hsl(var(--chart-2))',
            tertiaryColor: 'hsl(var(--chart-3))',
            background: 'hsl(var(--background))',
            mainBkg: 'hsl(var(--card))',
            secondBkg: 'hsl(var(--muted))',
            border1: 'hsl(var(--border))',
            border2: 'hsl(var(--border))',
            note: 'hsl(var(--muted))',
            text: 'hsl(var(--foreground))',
            critical: 'hsl(var(--destructive))',
            done: 'hsl(var(--success))',
            active: 'hsl(var(--primary))',
          },
        });

        const { svg: renderedSvg } = await mermaid.render(
          `mermaid-${crypto.randomUUID()}`,
          code
        );

        if (!cancelled) {
          setSvg(renderedSvg);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to render diagram');
        }
      }
    }

    renderDiagram();

    return () => {
      cancelled = true;
    };
  }, [code]);

  const handleCopyCode = async () => {
    await navigator.clipboard.writeText(code);
  };

  const handleExportSvg = () => {
    const blob = new Blob([svg], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title?.replace(/\s+/g, '-').toLowerCase() || 'diagram'}.svg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (error) {
    return (
      <Card className={className}>
        {title && (
          <CardHeader>
            <CardTitle>{title}</CardTitle>
            {description && <CardDescription>{description}</CardDescription>}
          </CardHeader>
        )}
        <CardContent>
          <div className="text-destructive text-sm p-4 rounded-md bg-destructive/10">
            <p className="font-semibold">Error rendering diagram:</p>
            <p className="mt-1">{error}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      {title && (
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle>{title}</CardTitle>
              {description && <CardDescription>{description}</CardDescription>}
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopyCode}
                title="Copy Mermaid code"
              >
                <Copy className="h-4 w-4" />
              </Button>
              {svg && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleExportSvg}
                  title="Export as SVG"
                >
                  <Download className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
      )}
      <CardContent>
        <div
          ref={containerRef}
          className="mermaid-container overflow-x-auto"
          dangerouslySetInnerHTML={{ __html: svg }}
        />
      </CardContent>
    </Card>
  );
}
