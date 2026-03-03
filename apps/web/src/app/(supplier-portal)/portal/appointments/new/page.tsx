/**
 * Phase 1.2.6 CAP-APPT (P27) — New Appointment Request Form
 *
 * Supplier proposes up to 3 time slots for a meeting with a buyer contact.
 * This is a Client Component form — action submission is handled via server action.
 *
 * SP-5020: /portal/appointments/new
 */
'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { CalendarClock, Plus, Trash2, Info, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { routes } from '@/lib/constants';
import { requestMeetingAction } from '@/features/portal/actions/portal.actions';
import type { MeetingType } from '@/features/portal/queries/portal.queries';

function toLocalDatetimeValue(iso: string): string {
  // Convert ISO-8601 to `datetime-local` input value (YYYY-MM-DDTHH:mm)
  try {
    const d = new Date(iso);
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  } catch {
    return '';
  }
}

function localToIso(local: string): string {
  // datetime-local value → ISO-8601 (interpreted as local time)
  return new Date(local).toISOString();
}

const MIN_SLOTS = 1;
const MAX_SLOTS = 3;

export default function NewAppointmentPage({
  searchParams,
}: {
  searchParams?: { caseId?: string; escalationId?: string; supplierId?: string };
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [agenda, setAgenda] = useState('');
  const [meetingType, setMeetingType] = useState<MeetingType>('VIRTUAL');
  const [location, setLocation] = useState('');
  const [duration, setDuration] = useState<'15' | '30' | '45' | '60'>('30');
  const [slots, setSlots] = useState<string[]>(['']); // datetime-local values

  const addSlot = () => {
    if (slots.length < MAX_SLOTS) setSlots((s) => [...s, '']);
  };

  const removeSlot = (i: number) => {
    if (slots.length > MIN_SLOTS) setSlots((s) => s.filter((_, idx) => idx !== i));
  };

  const updateSlot = (i: number, value: string) => {
    setSlots((s) => s.map((v, idx) => (idx === i ? value : v)));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const filledSlots = slots.filter((s) => s.trim());
    if (!filledSlots.length) {
      setError('At least one proposed time is required.');
      return;
    }

    if (!agenda.trim()) {
      setError('Please provide an agenda.');
      return;
    }

    startTransition(async () => {
      try {
        const result = await requestMeetingAction(searchParams?.supplierId ?? '', {
          agenda: agenda.trim(),
          meetingType,
          location: location.trim() || undefined,
          proposedTimes: filledSlots.map(localToIso),
          durationMinutes: duration,
          caseId: searchParams?.caseId,
          escalationId: searchParams?.escalationId,
        });

        if (!result.ok) {
          setError(String((result as any).error ?? 'Failed to submit request'));
          return;
        }

        router.push(routes.portal.appointments);
      } catch (err) {
        setError('An unexpected error occurred. Please try again.');
      }
    });
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6 py-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild className="-ml-2">
          <Link href={routes.portal.appointments} aria-label="Back to appointments">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="flex items-center gap-2 text-xl font-semibold">
            <CalendarClock className="h-5 w-5 text-primary" aria-hidden="true" />
            Request a Meeting
          </h1>
          <p className="text-sm text-muted-foreground">
            Propose up to {MAX_SLOTS} time slots and your buyer contact will confirm the best one.
          </p>
        </div>
      </div>

      {searchParams?.caseId && (
        <div className="flex items-start gap-2 rounded-lg bg-blue-50 p-3 text-sm text-blue-800 dark:bg-blue-900/20 dark:text-blue-200">
          <Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <span>This meeting will be linked to the selected support case.</span>
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Meeting Details</CardTitle>
            <CardDescription>Tell us what you'd like to discuss.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* Agenda */}
            <div className="space-y-1.5">
              <Label htmlFor="agenda">
                Agenda <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="agenda"
                placeholder="What would you like to discuss?"
                value={agenda}
                onChange={(e) => setAgenda(e.target.value)}
                maxLength={2000}
                rows={3}
                required
                disabled={isPending}
              />
              <p className="text-right text-[10px] text-muted-foreground">{agenda.length}/2000</p>
            </div>

            {/* Meeting Type & Duration */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="meeting-type">Meeting Type</Label>
                <Select
                  value={meetingType}
                  onValueChange={(v) => setMeetingType(v as MeetingType)}
                  disabled={isPending}
                >
                  <SelectTrigger id="meeting-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="VIRTUAL">Virtual</SelectItem>
                    <SelectItem value="IN_PERSON">In Person</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="duration">Duration</Label>
                <Select
                  value={duration}
                  onValueChange={(v) => setDuration(v as typeof duration)}
                  disabled={isPending}
                >
                  <SelectTrigger id="duration">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="15">15 minutes</SelectItem>
                    <SelectItem value="30">30 minutes</SelectItem>
                    <SelectItem value="45">45 minutes</SelectItem>
                    <SelectItem value="60">60 minutes</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Location (optional) */}
            <div className="space-y-1.5">
              <Label htmlFor="location">
                Location / Link <span className="text-muted-foreground">(optional)</span>
              </Label>
              <Input
                id="location"
                placeholder={
                  meetingType === 'VIRTUAL'
                    ? 'Zoom/Teams link or dial-in (buyer may fill this in)'
                    : 'Physical address or room number'
                }
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                maxLength={500}
                disabled={isPending}
              />
            </div>

            {/* Proposed Times */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>
                  Proposed Times <span className="text-destructive">*</span>
                </Label>
                {slots.length < MAX_SLOTS && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={addSlot}
                    disabled={isPending}
                  >
                    <Plus className="mr-1 h-3 w-3" />
                    Add slot
                  </Button>
                )}
              </div>
              <div className="space-y-2">
                {slots.map((slot, i) => (
                  <div key={`slot-${i}`} className="flex items-center gap-2">
                    <Input
                      type="datetime-local"
                      aria-label={`Proposed time ${i + 1}`}
                      value={slot}
                      onChange={(e) => updateSlot(i, e.target.value)}
                      className="flex-1"
                      required={i === 0}
                      disabled={isPending}
                    />
                    {slots.length > MIN_SLOTS && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 shrink-0 text-muted-foreground hover:text-destructive"
                        onClick={() => removeSlot(i)}
                        disabled={isPending}
                        aria-label={`Remove time slot ${i + 1}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                Propose up to {MAX_SLOTS} times. Your buyer will confirm one.
              </p>
            </div>

            {/* Error */}
            {error && (
              <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {error}
              </p>
            )}

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-2">
              <Button variant="outline" asChild disabled={isPending}>
                <Link href={routes.portal.appointments}>Cancel</Link>
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? 'Submitting…' : 'Submit Request'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
