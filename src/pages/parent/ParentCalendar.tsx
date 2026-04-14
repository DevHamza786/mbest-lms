import { useEffect, useState, useMemo } from 'react';
import { addDays, endOfMonth, endOfWeek, format, startOfMonth, startOfWeek, isSameDay } from 'date-fns';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Clock, MapPin, User, BookOpen, X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { ChildSwitcher } from '@/components/parent/ChildSwitcher';
import { useParentStore } from '@/lib/store/parentStore';
import { parentApi } from '@/lib/api';
import type { ParentClass } from '@/lib/store/parentStore';

interface SessionData {
  id: number;
  classId: number;
  className: string;
  tutor: string;
  date: string;
  startTime: string;
  endTime: string;
  subject: string;
  room?: string;
  meetingLink?: string;
  status: string;
  locationType?: string;
  locationDetail?: string;
}

export default function ParentCalendar() {
  const [cursorDate, setCursorDate] = useState(() => new Date());
  const [classes, setClasses] = useState<ParentClass[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedSession, setSelectedSession] = useState<SessionData | null>(null);

  const activeChildId = useParentStore((state) => state.activeChildId);

  // Load classes data
  useEffect(() => {
    const loadData = async () => {
      if (!activeChildId) return;
      try {
        setLoading(true);
        const classesData = await parentApi.getChildClasses(Number(activeChildId));

        const mappedClasses = classesData.map((cls: any) => ({
          id: String(cls.id),
          name: cls.name,
          tutor: cls.tutor?.user?.name || 'Unknown',
          schedule: '',
          scheduleData: cls.schedules || [],
          status: cls.status as any,
        }));

        setClasses(mappedClasses);
      } catch (error) {
        console.error('Failed to load classes:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [activeChildId]);

  // Build month grid
  const monthGrid = useMemo(() => {
    const start = startOfWeek(startOfMonth(cursorDate), { weekStartsOn: 0 });
    const end = endOfWeek(endOfMonth(cursorDate), { weekStartsOn: 0 });
    const days: Date[] = [];
    let current = start;
    while (current <= end) {
      days.push(current);
      current = addDays(current, 1);
    }
    return days;
  }, [cursorDate]);

  // Map sessions to days
  const dayEvents = useMemo(() => {
    const today = new Date();

    return monthGrid.map((day) => {
      const events: SessionData[] = [];

      classes.forEach((cls) => {
        const scheduleData = (cls as any).scheduleData as Array<any> | undefined;
        if (!scheduleData || !Array.isArray(scheduleData)) return;

        scheduleData.forEach((s) => {
          let sessionDate: Date | null = null;

          if (s.date) {
            sessionDate = new Date(s.date);
          } else if (s.day_of_week) {
            const dayMap: { [key: string]: number } = {
              sunday: 0, monday: 1, tuesday: 2, wednesday: 3,
              thursday: 4, friday: 5, saturday: 6
            };
            const targetDay = dayMap[s.day_of_week?.toLowerCase()];
            if (targetDay !== undefined) {
              const currentDay = today.getDay();
              let daysUntil = targetDay - currentDay;
              if (daysUntil < 0) daysUntil += 7;
              sessionDate = new Date(today);
              sessionDate.setDate(today.getDate() + daysUntil);
            }
          }

          if (sessionDate && isSameDay(sessionDate, day)) {
            events.push({
              id: s.id || Math.random(),
              classId: Number(cls.id),
              className: cls.name,
              tutor: cls.tutor,
              date: sessionDate.toISOString(),
              startTime: s.start_time,
              endTime: s.end_time,
              subject: s.subject || 'General',
              room: s.room,
              meetingLink: s.meeting_link,
              status: s.status || 'scheduled',
              locationType: s.location_type,
              locationDetail: s.location_detail,
            });
          }
        });
      });

      // Sort by start time
      events.sort((a, b) => {
        const timeA = a.startTime || '';
        const timeB = b.startTime || '';
        return timeA.localeCompare(timeB);
      });

      return { day, events };
    });
  }, [classes, monthGrid]);

  const today = new Date();

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Calendar</h1>
          <p className="text-muted-foreground">
            View your child's class session schedule
          </p>
        </div>
        <ChildSwitcher />
      </div>

      {/* Calendar */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <CalendarIcon className="h-5 w-5 text-muted-foreground" />
              Session Calendar
            </CardTitle>
            <div className="text-sm text-muted-foreground">
              {format(cursorDate, 'MMMM yyyy')}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                setCursorDate((d) => new Date(d.getFullYear(), d.getMonth() - 1, 1))
              }
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCursorDate(new Date())}
            >
              Today
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                setCursorDate((d) => new Date(d.getFullYear(), d.getMonth() + 1, 1))
              }
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>

        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                <p className="mt-2 text-muted-foreground">Loading calendar...</p>
              </div>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-7 gap-1 text-xs text-muted-foreground mb-2">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
                  <div key={d} className="text-center font-medium">
                    {d}
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-1">
                {dayEvents.map(({ day, events }) => {
                  const isToday = format(day, 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd');
                  const isCurrentMonth = day.getMonth() === cursorDate.getMonth();

                  const visible = events.slice(0, 2);
                  const hidden = Math.max(0, events.length - visible.length);

                  return (
                    <div
                      key={day.toISOString()}
                      className={[
                        'min-h-[100px] rounded-md border p-2 cursor-pointer hover:bg-muted/50 transition-colors',
                        isCurrentMonth ? 'bg-background' : 'bg-muted/30',
                        isToday ? 'border-primary ring-1 ring-primary/30' : 'border-border',
                      ].join(' ')}
                      onClick={() => {
                        if (events.length > 0) {
                          setSelectedSession(events[0]);
                        }
                      }}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <div className={`text-sm font-medium ${isToday ? 'text-primary' : ''}`}>
                          {day.getDate()}
                        </div>
                        {events.length > 0 && (
                          <Badge variant="secondary" className="text-xs">
                            {events.length}
                          </Badge>
                        )}
                      </div>

                      <div className="space-y-1">
                        {visible.map((e) => (
                          <div
                            key={e.id}
                            className="text-[11px] leading-tight bg-primary/10 px-1 py-0.5 rounded truncate"
                            onClick={(evt) => {
                              evt.stopPropagation();
                              setSelectedSession(e);
                            }}
                          >
                            <span className="font-medium">{e.className}</span>
                            {e.startTime && (
                              <span className="text-muted-foreground ml-1">
                                {e.startTime.substring(0, 5)}
                              </span>
                            )}
                          </div>
                        ))}
                        {hidden > 0 && (
                          <div className="text-xs text-muted-foreground">+{hidden} more</div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Session Details Dialog */}
      <Dialog open={!!selectedSession} onOpenChange={() => setSelectedSession(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              Session Details
            </DialogTitle>
          </DialogHeader>

          {selectedSession && (
            <div className="space-y-4 mt-4">
              <div className="flex items-center gap-2">
                <Badge variant="default">{selectedSession.status}</Badge>
                <span className="text-sm text-muted-foreground">
                  {format(new Date(selectedSession.date), 'EEEE, MMMM d, yyyy')}
                </span>
              </div>

              <Separator />

              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <BookOpen className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="font-medium">{selectedSession.className}</p>
                    <p className="text-sm text-muted-foreground">{selectedSession.subject}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <User className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm">Tutor</p>
                    <p className="font-medium">{selectedSession.tutor}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Clock className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm">Time</p>
                    <p className="font-medium">
                      {selectedSession.startTime?.substring(0, 5)} - {selectedSession.endTime?.substring(0, 5)}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm">Location</p>
                    <p className="font-medium">
                      {selectedSession.locationType === 'online'
                        ? `Online - ${selectedSession.meetingLink || 'Link will be provided'}`
                        : selectedSession.room || 'Centre'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <Button variant="outline" onClick={() => setSelectedSession(null)}>
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}