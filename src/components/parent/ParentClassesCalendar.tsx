import { useMemo, useState } from 'react';
import { format, isAfter, isToday, parseISO } from 'date-fns';
import { Calendar as CalendarIcon, Clock, ArrowRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { ParentClass } from '@/lib/store/parentStore';
import { useNavigate } from 'react-router-dom';

export function ParentClassesCalendar({
  classes,
  className,
}: {
  classes: ParentClass[];
  className?: string;
}) {
  const navigate = useNavigate();

  // Get upcoming sessions from all classes
  const upcomingSessions = useMemo(() => {
    const sessions: Array<{
      id: string;
      className: string;
      tutor: string;
      date: string;
      startTime: string;
      endTime: string;
      room?: string;
      meetingLink?: string;
    }> = [];

    const today = new Date();

    (classes || []).forEach((cls) => {
      const scheduleData = (cls as any).scheduleData as Array<any> | undefined;
      if (!scheduleData || !Array.isArray(scheduleData)) return;

      scheduleData.forEach((s) => {
        // Handle both TutoringSession (has date field) and ClassSchedule (has day_of_week)
        let sessionDate: Date | null = null;

        if (s.date) {
          sessionDate = new Date(s.date);
        } else if (s.day_of_week) {
          // For day_of_week, get the next occurrence of that day
          const dayMap: { [key: string]: number } = {
            sunday: 0, monday: 1, tuesday: 2, wednesday: 3,
            thursday: 4, friday: 5, saturday: 6
          };
          const targetDay = dayMap[s.day_of_week.toLowerCase()];
          if (targetDay !== undefined) {
            const currentDay = today.getDay();
            let daysUntil = targetDay - currentDay;
            if (daysUntil <= 0) daysUntil += 7;
            sessionDate = new Date(today);
            sessionDate.setDate(today.getDate() + daysUntil);
          }
        }

        if (sessionDate && isAfter(sessionDate, today)) {
          sessions.push({
            id: `${cls.id}-${s.id || Math.random()}`,
            className: cls.name,
            tutor: cls.tutor,
            date: sessionDate.toISOString(),
            startTime: s.start_time,
            endTime: s.end_time,
            room: s.room,
            meetingLink: s.meeting_link,
          });
        }
      });
    });

    // Sort by date and return latest 5
    return sessions
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(0, 5);
  }, [classes]);

  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between gap-4">
        <div>
          <CardTitle className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5 text-muted-foreground" />
            Upcoming Schedule
          </CardTitle>
          <div className="text-sm text-muted-foreground">
            Next 5 sessions
          </div>
        </div>

        <Button variant="outline" size="sm" onClick={() => navigate('/parent/classes')}>
          View All
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </CardHeader>

      <CardContent>
        {upcomingSessions.length > 0 ? (
          <div className="space-y-3">
            {upcomingSessions.map((session) => (
              <div
                key={session.id}
                className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="secondary" className="text-xs">
                      {format(new Date(session.date), 'EEE')}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(session.date), 'MMM d, yyyy')}
                    </span>
                  </div>
                  <h4 className="font-medium text-sm">{session.className}</h4>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                    <Clock className="h-3 w-3" />
                    <span>{session.startTime?.substring(0, 5)} - {session.endTime?.substring(0, 5)}</span>
                    <span>•</span>
                    <span>{session.tutor}</span>
                  </div>
                </div>
                {session.room && (
                  <div className="text-xs text-muted-foreground text-right">
                    <div>Room: {session.room}</div>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No upcoming sessions scheduled</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

