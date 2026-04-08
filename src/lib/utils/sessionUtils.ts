import { Session, SessionConflict } from '@/lib/types/session';
import { format, parse, isWithinInterval, parseISO } from 'date-fns';

// Check if two time ranges overlap
export function timeRangesOverlap(
  start1: string,
  end1: string,
  start2: string,
  end2: string
): boolean {
  const s1 = parse(start1, 'HH:mm', new Date());
  const e1 = parse(end1, 'HH:mm', new Date());
  const s2 = parse(start2, 'HH:mm', new Date());
  const e2 = parse(end2, 'HH:mm', new Date());

  return (s1 < e2 && e1 > s2);
}

// Detect conflicts for a session
export function detectSessionConflicts(
  session: Session | Partial<Session>,
  allSessions: Session[]
): SessionConflict[] {
  const conflicts: SessionConflict[] = [];
  
  if (!session.date || !session.startTime || !session.endTime) {
    return conflicts;
  }

  // Check for teacher conflicts
  if (session.teacherId) {
    const teacherConflicts = allSessions.filter(s => 
      s.id !== session.id &&
      s.teacherId === session.teacherId &&
      s.date === session.date &&
      s.status !== 'cancelled' &&
      timeRangesOverlap(session.startTime!, session.endTime!, s.startTime, s.endTime)
    );

    if (teacherConflicts.length > 0) {
      conflicts.push({
        sessionId: session.id || 'new',
        conflictType: 'teacher-double-booked',
        message: `Teacher is already booked for another session at this time`,
        conflictingSessions: teacherConflicts
      });
    }
  }

  // Check for student conflicts
  if (session.studentIds && session.studentIds.length > 0) {
    const studentConflicts = allSessions.filter(s =>
      s.id !== session.id &&
      s.date === session.date &&
      s.status !== 'cancelled' &&
      s.studentIds.some(studentId => session.studentIds!.includes(studentId)) &&
      timeRangesOverlap(session.startTime!, session.endTime!, s.startTime, s.endTime)
    );

    if (studentConflicts.length > 0) {
      conflicts.push({
        sessionId: session.id || 'new',
        conflictType: 'student-double-booked',
        message: `One or more students are already booked at this time`,
        conflictingSessions: studentConflicts
      });
    }
  }

  return conflicts;
}

// Calculate duration in hours
export function calculateDuration(startTime: string, endTime: string): number {
  if (!startTime || !endTime) return 0;

  // Expect either "HH:mm" or "HH:mm:ss" (sometimes backend provides seconds).
  const timeToSeconds = (timeStr: string): number | null => {
    const trimmed = String(timeStr).trim();
    const parts = trimmed.split(':');
    if (parts.length < 2) return null;

    const [hhRaw, mmRaw, ssRaw] = parts;
    const hh = parseInt(hhRaw, 10);
    const mm = parseInt(mmRaw, 10);
    const ss = ssRaw !== undefined ? parseInt(ssRaw, 10) : 0;

    if (Number.isNaN(hh) || Number.isNaN(mm) || Number.isNaN(ss)) return null;
    if (mm < 0 || mm > 59) return null;
    if (ss < 0 || ss > 59) return null;

    return hh * 3600 + mm * 60 + ss;
  };

  const startSeconds = timeToSeconds(startTime);
  const endSeconds = timeToSeconds(endTime);
  if (startSeconds == null || endSeconds == null) return 0;

  const diffSeconds = endSeconds - startSeconds;
  // If end is before start (e.g., bad input), don't show NaN; treat as 0 hours.
  if (diffSeconds <= 0) return 0;

  return diffSeconds / 3600;
}

// Format time for display
export function formatTimeDisplay(time: string): string {
  try {
    const parsed = parse(time, 'HH:mm', new Date());
    return format(parsed, 'h:mm a');
  } catch {
    return time;
  }
}

// Get color for session based on criteria
export function getSessionColor(session: Session): string {
  // Color by status first
  if (session.status === 'planned') return 'hsl(221, 83%, 53%)'; // blue (primary color)
  if (session.status === 'cancelled') return 'hsl(var(--destructive))'; // red
  if (session.status === 'no-show') return 'hsl(var(--destructive))'; // red
  if (session.status === 'completed') return 'hsl(var(--success))'; // green
  if (session.status === 'rescheduled') return 'hsl(25, 95%, 53%)'; // orange
  
  // Otherwise color by teacher (generate from teacher ID)
  const colors = [
    'hsl(221, 83%, 53%)', // primary (blue)
    'hsl(25, 95%, 53%)', // secondary (orange)
    'hsl(142, 76%, 36%)', // success (green)
    'hsl(271, 76%, 53%)', // purple
    'hsl(199, 89%, 48%)', // cyan
    'hsl(346, 77%, 50%)', // pink
  ];
  
  const index = session.teacherId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % colors.length;
  return colors[index];
}

// Filter sessions
export function filterSessions(sessions: Session[], filter: Partial<Session>): Session[] {
  return sessions.filter(session => {
    if (filter.teacherId && session.teacherId !== filter.teacherId) return false;
    if (filter.subject && session.subject !== filter.subject) return false;
    if (filter.location && session.locationType !== filter.location) return false;
    if (filter.sessionType && session.sessionType !== filter.sessionType) return false;
    if (filter.status && session.status !== filter.status) return false;
    return true;
  });
}
