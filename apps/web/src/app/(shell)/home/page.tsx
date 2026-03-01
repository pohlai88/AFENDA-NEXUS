import type { Metadata } from 'next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PageHeader } from '@/components/erp/page-header';
import { Home, CalendarDays, Star, Clock, Sparkles } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Home',
  description: 'Your personal dashboard — recent items, favorites, and quick actions.',
};

// ─── HomePage ────────────────────────────────────────────────────────────────

/**
 * Personal Home Dashboard — maintenance stub.
 *
 * This page will evolve into a personalised workspace with:
 *   - Recent items and quick resume
 *   - Favorite pages at a glance
 *   - Personal calendar / upcoming events
 *   - AI-powered insights and recommendations
 *
 * For now, renders a clean placeholder.
 */
export default function HomePage() {
  return (
    <>
      <PageHeader
        title="Home"
        description="Your personal workspace and quick access dashboard"
      />

      <div className="grid gap-4 px-(--spacing-page-x) py-(--spacing-page-y) sm:grid-cols-2 lg:grid-cols-3">
        {/* ─── Quick Resume ─── */}
        <Card className="col-span-full lg:col-span-2">
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="flex size-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-blue-700 text-white">
                <Home className="size-4" />
              </div>
              <div>
                <CardTitle>Welcome back</CardTitle>
                <CardDescription>Pick up where you left off</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex h-32 items-center justify-center rounded-lg border border-dashed text-sm text-muted-foreground">
              <Sparkles className="mr-2 size-4" />
              Recent activity will appear here
            </div>
          </CardContent>
        </Card>

        {/* ─── Upcoming ─── */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <CalendarDays className="size-4 text-muted-foreground" />
              <CardTitle className="text-sm">Upcoming</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex h-24 items-center justify-center rounded-lg border border-dashed text-sm text-muted-foreground">
              Calendar events will appear here
            </div>
          </CardContent>
        </Card>

        {/* ─── Favorites ─── */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Star className="size-4 text-muted-foreground" />
              <CardTitle className="text-sm">Favourites</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex h-24 items-center justify-center rounded-lg border border-dashed text-sm text-muted-foreground">
              Pinned pages will appear here
            </div>
          </CardContent>
        </Card>

        {/* ─── Recently Visited ─── */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Clock className="size-4 text-muted-foreground" />
              <CardTitle className="text-sm">Recent</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex h-24 items-center justify-center rounded-lg border border-dashed text-sm text-muted-foreground">
              Recently visited pages will appear here
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
