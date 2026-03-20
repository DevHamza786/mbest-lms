import { useMemo, useState } from 'react';
import { addDays, endOfMonth, endOfWeek, format, startOfMonth, startOfWeek } from 'date-fns';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { ParentClass } from '@/lib/store/parentStore';

const normalizeDayOfWeekToIndex = (dayOfWeek: unknown): number | null => {
  if (!dayOfWeek) return null;
  const s = String(dayOfWeek).trim().toLowerCase();
  if (!s) return null;

  if (s.startsWith('sun')) return 0;
  if (s.startsWith('mon')) return 1;
  if (s.startsWith('tue')) return 2;
  if (s.startsWith('wed')) return 3;
  if (s.startsWith('thu')) return 4;
  if (s.startsWith('fri')) return 5;
  if (s.startsWith('sat')) return 6;

  return null;
};

export function ParentClassesCalendar({
  classes,
  className,
}: {
  classes: ParentClass[];
  className?: string;
}) {
  const [cursorDate, setCursorDate] = useState(() => new Date());

  const monthGrid = useMemo(() => {
    const start = startOfWeek(startOfMonth(cursorDate), { weekStartsOn: 0 }); // Sunday-start
    const end = endOfWeek(endOfMonth(cursorDate), { weekStartsOn: 0 });
    const days: Date[] = [];
    let current = start;
    while (current <= end) {
      days.push(current);
      current = addDays(current, 1);
    }
    return days;
  }, [cursorDate]);

  const dayEvents = useMemo(() => {
    const activeClasses = (classes || []).filter(
      (c) => c.status === 'active' || c.status === 'upcoming'
    );

    return monthGrid.map((day) => {
      const idx = day.getDay();
      const events: Array<{ key: string; label: string; time?: string }> = [];

      for (const cls of activeClasses) {
        const scheduleData = (cls as any).scheduleData as Array<any> | undefined;
        if (!scheduleData || !Array.isArray(scheduleData)) continue;

        for (const s of scheduleData) {
          const normalized = normalizeDayOfWeekToIndex(s?.day_of_week);
          if (normalized !== idx) continue;

          const slot = s?.start_time && s?.end_time ? `${s.start_time}-${s.end_time}` : '';
          events.push({
            key: `${cls.id}-${s?.day_of_week}-${slot}`,
            label: cls.name,
            time: slot || undefined,
          });
        }
      }

      events.sort(
        (a, b) =>
          a.label.localeCompare(b.label) ||
          String(a.time || '').localeCompare(String(b.time || ''))
      );

      const uniq: typeof events = [];
      const seen = new Set<string>();
      for (const e of events) {
        if (seen.has(e.key)) continue;
        seen.add(e.key);
        uniq.push(e);
      }

      return { day, events: uniq };
    });
  }, [classes, monthGrid]);

  const today = new Date();

  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between gap-4">
        <div>
          <CardTitle className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5 text-muted-foreground" />
            Student Calendar
          </CardTitle>
          <div className="text-sm text-muted-foreground">
            Classes by day of week • {format(cursorDate, 'MMMM yyyy')}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              setCursorDate((d) => new Date(d.getFullYear(), d.getMonth() - 1, 1))
            }
            aria-label="Previous month"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              setCursorDate((d) => new Date(d.getFullYear(), d.getMonth() + 1, 1))
            }
            aria-label="Next month"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>

      <CardContent>
        <div className="grid grid-cols-7 gap-1 text-xs text-muted-foreground mb-2">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
            <div key={d} className="text-center">
              {d}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {dayEvents.map(({ day, events }) => {
            const isToday = format(day, 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd');
            const isCurrentMonth = day.getMonth() === cursorDate.getMonth();

            const visible = events.slice(0, 3);
            const hidden = Math.max(0, events.length - visible.length);

            return (
              <div
                key={day.toISOString()}
                className={[
                  'min-h-[92px] rounded-md border p-2',
                  isCurrentMonth ? 'bg-background' : 'bg-muted/30',
                  isToday ? 'border-primary ring-1 ring-primary/30' : 'border-border',
                ].join(' ')}
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="text-sm font-medium">{day.getDate()}</div>
                  {events.length > 0 && <Badge variant="secondary">{events.length}</Badge>}
                </div>

                <div className="space-y-1">
                  {visible.map((e) => (
                    <div key={e.key} className="text-[12px] leading-tight">
                      <span className="font-medium">{e.label}</span>
                      {e.time ? (
                        <span className="text-muted-foreground">
                          {' '}
                          • <Clock className="inline h-3 w-3" /> {e.time}
                        </span>
                      ) : null}
                    </div>
                  ))}
                  {hidden > 0 ? (
                    <div className="text-xs text-muted-foreground">+{hidden} more</div>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

