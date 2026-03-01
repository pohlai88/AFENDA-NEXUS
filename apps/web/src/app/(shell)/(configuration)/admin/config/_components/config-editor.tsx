'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Loader2, Plus, Save } from 'lucide-react';
import { saveConfigAction } from '../actions';

interface ConfigEntry {
  key: string;
  value: Record<string, unknown>;
  updatedAt: string;
}

export function ConfigEditor({ entries }: { entries: ConfigEntry[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [newKey, setNewKey] = useState('');
  const [newValue, setNewValue] = useState('');
  const [showAdd, setShowAdd] = useState(false);

  function handleEdit(key: string, value: Record<string, unknown>) {
    setEditingKey(key);
    setEditValue(JSON.stringify(value, null, 2));
    setError(null);
  }

  function handleSave(key: string) {
    setError(null);
    let parsed: Record<string, unknown>;
    try {
      parsed = JSON.parse(editValue);
    } catch {
      setError('Invalid JSON');
      return;
    }

    startTransition(async () => {
      const result = await saveConfigAction(key, parsed);
      if (result.ok) {
        setEditingKey(null);
        router.refresh();
      } else {
        setError(result.error ?? 'Failed to save');
      }
    });
  }

  function handleAdd() {
    if (!newKey.trim()) return;
    setError(null);
    let parsed: Record<string, unknown>;
    try {
      parsed = JSON.parse(newValue || '{}');
    } catch {
      setError('Invalid JSON for new entry');
      return;
    }

    startTransition(async () => {
      const result = await saveConfigAction(newKey.trim(), parsed);
      if (result.ok) {
        setNewKey('');
        setNewValue('');
        setShowAdd(false);
        router.refresh();
      } else {
        setError(result.error ?? 'Failed to add');
      }
    });
  }

  return (
    <div className="space-y-4">
      { error ? <p className="text-sm text-destructive" role="alert">{error}</p> : null}

      <Table>
        <TableCaption className="sr-only">System configuration entries</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead className="col-key">Key</TableHead>
            <TableHead>Value</TableHead>
            <TableHead className="col-date">Updated</TableHead>
            <TableHead className="col-actions">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {entries.length === 0 && (
            <TableRow>
              <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                No configuration entries.
              </TableCell>
            </TableRow>
          )}
          {entries.map((entry) => (
            <TableRow key={entry.key}>
              <TableCell className="font-mono text-sm">{entry.key}</TableCell>
              <TableCell>
                {editingKey === entry.key ? (
                  <Textarea
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    className="w-full min-h-[80px] font-mono text-xs"
                    aria-label={`Edit value for ${entry.key}`}
                  />
                ) : (
                  <pre className="max-w-md truncate font-mono text-xs text-muted-foreground">
                    {JSON.stringify(entry.value)}
                  </pre>
                )}
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {new Date(entry.updatedAt).toLocaleDateString()}
              </TableCell>
              <TableCell>
                {editingKey === entry.key ? (
                  <Button size="sm" onClick={() => handleSave(entry.key)} disabled={isPending}>
                    {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  </Button>
                ) : (
                  <Button size="sm" variant="ghost" onClick={() => handleEdit(entry.key, entry.value)}>
                    Edit
                  </Button>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {showAdd ? (
        <div className="rounded-lg border p-4 space-y-3 max-w-lg">
          <div className="space-y-2">
            <Label htmlFor="new-config-key">Key</Label>
            <Input
              id="new-config-key"
              value={newKey}
              onChange={(e) => setNewKey(e.target.value)}
              placeholder="feature.new_flag"
              className="font-mono"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="new-config-value">Value (JSON)</Label>
            <Textarea
              id="new-config-value"
              value={newValue}
              onChange={(e) => setNewValue(e.target.value)}
              placeholder='{"enabled": true}'
              className="w-full min-h-[60px] font-mono text-xs"
            />
          </div>
          <div className="flex gap-2">
            <Button size="sm" onClick={handleAdd} disabled={isPending}>
              { isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Save
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setShowAdd(false)}>Cancel</Button>
          </div>
        </div>
      ) : (
        <Button variant="outline" onClick={() => setShowAdd(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Config Entry
        </Button>
      )}
    </div>
  );
}
