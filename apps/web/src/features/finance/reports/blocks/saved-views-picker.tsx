'use client';

import { useState } from 'react';
import { useSavedViews, type SavedView } from '@/hooks/use-saved-views';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Bookmark, ChevronDown, Plus, Star, Trash2, Copy } from 'lucide-react';

interface SavedViewsPickerProps {
  /** Unique key for this report's saved views (e.g. 'balance-sheet', 'ap-aging') */
  moduleKey: string;
  /** Current filters applied on the page (from searchParams) */
  currentFilters: Record<string, string | number | boolean | null>;
  /** Called when user selects a saved view — parent should navigate to the new params */
  onApply: (filters: Record<string, string | number | boolean | null>) => void;
}

export function SavedViewsPicker({ moduleKey, currentFilters, onApply }: SavedViewsPickerProps) {
  const {
    views,
    activeView,
    defaultView,
    createView,
    deleteView,
    duplicateView,
    setActiveView,
    setDefaultView,
    clearActiveView,
  } = useSavedViews({ moduleKey });

  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [newViewName, setNewViewName] = useState('');

  const handleSave = () => {
    if (!newViewName.trim()) return;
    const view = createView(newViewName.trim(), currentFilters, { setAsActive: true });
    setNewViewName('');
    setSaveDialogOpen(false);
  };

  const handleSelectView = (view: SavedView) => {
    setActiveView(view.id);
    onApply(view.filters);
  };

  return (
    <div className="flex items-center gap-2">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="gap-1.5">
            <Bookmark className="h-3.5 w-3.5" />
            {activeView ? activeView.name : 'Saved Views'}
            <ChevronDown className="h-3 w-3 opacity-50" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-56">
          <DropdownMenuLabel className="text-xs text-muted-foreground">
            Saved Views
          </DropdownMenuLabel>
          <DropdownMenuSeparator />

          {views.length === 0 ? (
            <div className="px-2 py-3 text-center text-sm text-muted-foreground">
              No saved views yet
            </div>
          ) : (
            views.map((view) => (
              <DropdownMenuItem
                key={view.id}
                className="flex items-center justify-between"
                onClick={() => handleSelectView(view)}
              >
                <span className="truncate">{view.name}</span>
                <div className="flex items-center gap-1 ml-2">
                  {view.isDefault && (
                    <Star className="h-3 w-3 text-warning fill-warning" />
                  )}
                  {activeView?.id === view.id && (
                    <Badge variant="secondary" className="text-[10px] h-4 px-1">Active</Badge>
                  )}
                </div>
              </DropdownMenuItem>
            ))
          )}

          <DropdownMenuSeparator />

          {activeView && (
            <>
              <DropdownMenuItem onClick={() => clearActiveView()}>
                Clear active view
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setDefaultView(activeView.id)}>
                <Star className="mr-2 h-3.5 w-3.5" /> Set as default
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => duplicateView(activeView.id)}>
                <Copy className="mr-2 h-3.5 w-3.5" /> Duplicate
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-destructive"
                onClick={() => {
                  deleteView(activeView.id);
                  clearActiveView();
                }}
              >
                <Trash2 className="mr-2 h-3.5 w-3.5" /> Delete
              </DropdownMenuItem>
              <DropdownMenuSeparator />
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
        <DialogTrigger asChild>
          <Button variant="ghost" size="sm" className="gap-1.5">
            <Plus className="h-3.5 w-3.5" />
            Save View
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Save Current View</DialogTitle>
            <DialogDescription>
              Save the current filters as a named view for quick access.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Input
              placeholder="View name (e.g. Q4 2024 Report)"
              value={newViewName}
              onChange={(e) => setNewViewName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSave()}
            />
            <div className="text-xs text-muted-foreground">
              Filters: {Object.entries(currentFilters).filter(([, v]) => v != null).length} active
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSaveDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={!newViewName.trim()}>
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
