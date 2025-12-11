import { Session } from '@/lib/types/session';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { formatTimeDisplay, calculateDuration } from '@/lib/utils/sessionUtils';
import { LessonNoteModal } from '@/components/modals/LessonNoteModal';
import { 
  Calendar, 
  Clock, 
  User, 
  Users, 
  BookOpen, 
  MapPin, 
  FileText, 
  CheckCircle, 
  DollarSign,
  Edit
} from 'lucide-react';
import { format } from 'date-fns';
import { useState } from 'react';

interface SessionDetailSheetProps {
  session: Session | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit?: (session: Session) => void;
  onAddLessonNote?: (session: Session) => void;
  onMarkAttendance?: (session: Session) => void;
  onMarkComplete?: (session: Session) => void;
  onMarkReadyForInvoicing?: (session: Session) => void;
  onSaveLessonNote?: (sessionId: string, lessonNote: string, topicsTaught: string, homeworkResources: string, studentNotes: any[]) => void;
}

export function SessionDetailSheet({
  session,
  open,
  onOpenChange,
  onEdit,
  onAddLessonNote,
  onMarkAttendance,
  onMarkComplete,
  onMarkReadyForInvoicing,
  onSaveLessonNote,
}: SessionDetailSheetProps) {
  const [isLessonNoteOpen, setIsLessonNoteOpen] = useState(false);

  if (!session) return null;

  const handleAddLessonNote = () => {
    setIsLessonNoteOpen(true);
  };

  const handleSaveLessonNote = (sessionId: string, lessonNote: string, topicsTaught: string, homeworkResources: string, studentNotes: any[]) => {
    if (onSaveLessonNote) {
      onSaveLessonNote(sessionId, lessonNote, topicsTaught, homeworkResources, studentNotes);
    }
    setIsLessonNoteOpen(false);
  };

  const duration = calculateDuration(session.startTime, session.endTime);

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      planned: 'outline',
      completed: 'default',
      cancelled: 'destructive',
      'no-show': 'destructive',
      rescheduled: 'secondary',
    };
    return <Badge variant={variants[status] || 'outline'}>{status}</Badge>;
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center justify-between">
            <span>Session Details</span>
            {getStatusBadge(session.status)}
          </SheetTitle>
          <SheetDescription>
            View and manage session information
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-6 mt-6">
          {/* Basic Info */}
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm font-medium">Date</p>
                <p className="text-sm text-muted-foreground">
                  {format(new Date(session.date), 'EEEE, MMMM d, yyyy')}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Clock className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm font-medium">Time</p>
                <p className="text-sm text-muted-foreground">
                  {formatTimeDisplay(session.startTime)} - {formatTimeDisplay(session.endTime)} ({duration}h)
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <User className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm font-medium">Teacher</p>
                <p className="text-sm text-muted-foreground">{session.teacherName}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Users className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm font-medium">Students ({session.studentNames.length})</p>
                <div className="space-y-1">
                  {session.studentNames.map((name, idx) => (
                    <p key={idx} className="text-sm text-muted-foreground">• {name}</p>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <Separator />

          {/* Session Details */}
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <BookOpen className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm font-medium">Subject & Year</p>
                <p className="text-sm text-muted-foreground">
                  {session.subject} - Year {session.yearLevel}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm font-medium">Location</p>
                <p className="text-sm text-muted-foreground capitalize">{session.location}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Users className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm font-medium">Session Type</p>
                <Badge variant="outline">{session.sessionType}</Badge>
              </div>
            </div>
          </div>

          <Separator />

          {/* Lesson Notes Display */}
          {session.lessonNote && (
            <>
              <div className="space-y-3">
                {session.topicsTaught && (
                  <div>
                    <p className="text-sm font-semibold mb-1">Topics Taught</p>
                    <p className="text-sm text-muted-foreground bg-muted p-3 rounded-lg">
                      {session.topicsTaught}
                    </p>
                  </div>
                )}
                {session.homeworkResources && (
                  <div>
                    <p className="text-sm font-semibold mb-1">Homework Resources</p>
                    <p className="text-sm text-muted-foreground bg-muted p-3 rounded-lg">
                      {session.homeworkResources}
                    </p>
                  </div>
                )}
                <div>
                  <p className="text-sm font-semibold mb-1">Lesson Notes</p>
                  <p className="text-sm text-muted-foreground bg-muted p-3 rounded-lg">
                    {session.lessonNote}
                  </p>
                </div>
              </div>
              <Separator />
            </>
          )}

          {/* Individual Student Notes */}
          {session.studentNotes && session.studentNotes.length > 0 && (
            <>
              <div className="space-y-3">
                <p className="text-sm font-semibold">Student Feedback</p>
                {session.studentNotes.map((note, idx) => (
                  <div key={idx} className="bg-muted/50 p-3 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm font-medium">{note.studentName}</p>
                      <Badge variant={note.homeworkCompleted ? 'default' : 'destructive'} className="text-xs">
                        {note.homeworkCompleted ? 'Homework Done' : 'Homework Pending'}
                      </Badge>
                    </div>
                    {note.homeworkNotes && (
                      <p className="text-xs text-muted-foreground mb-1">Homework: {note.homeworkNotes}</p>
                    )}
                    {note.behaviorIssues && (
                      <p className="text-xs text-yellow-600 mb-1">⚠️ {note.behaviorIssues}</p>
                    )}
                    {note.privateNotes && (
                      <p className="text-xs text-muted-foreground">{note.privateNotes}</p>
                    )}
                  </div>
                ))}
              </div>
              <Separator />
            </>
          )}

          {/* Status Indicators */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">Lesson Note</span>
              </div>
              <Badge variant={session.lessonNote ? 'default' : 'outline'}>
                {session.lessonNote ? 'Added' : 'Not Added'}
              </Badge>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">Attendance</span>
              </div>
              <Badge variant={session.attendanceMarked ? 'default' : 'outline'}>
                {session.attendanceMarked ? 'Marked' : 'Not Marked'}
              </Badge>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">Invoicing</span>
              </div>
              <Badge variant={session.readyForInvoicing ? 'default' : 'outline'}>
                {session.readyForInvoicing ? 'Ready' : 'Not Ready'}
              </Badge>
            </div>
          </div>

          <Separator />

          {/* Quick Actions */}
          <div className="space-y-2">
            <p className="text-sm font-medium mb-3">Quick Actions</p>
            
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => onEdit?.(session)}
            >
              <Edit className="mr-2 h-4 w-4" />
              Edit Session
            </Button>

            {!session.lessonNote && (
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={handleAddLessonNote}
              >
                <FileText className="mr-2 h-4 w-4" />
                Add Lesson Note
              </Button>
            )}
            {session.lessonNote && (
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={handleAddLessonNote}
              >
                <FileText className="mr-2 h-4 w-4" />
                Edit Lesson Note
              </Button>
            )}

            {!session.attendanceMarked && (
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => onMarkAttendance?.(session)}
              >
                <CheckCircle className="mr-2 h-4 w-4" />
                Mark Attendance
              </Button>
            )}

            {session.status !== 'completed' && (
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => onMarkComplete?.(session)}
              >
                <CheckCircle className="mr-2 h-4 w-4" />
                Mark Complete
              </Button>
            )}

            {session.status === 'completed' && !session.readyForInvoicing && (
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => onMarkReadyForInvoicing?.(session)}
              >
                <DollarSign className="mr-2 h-4 w-4" />
                Mark Ready for Invoicing
              </Button>
            )}
          </div>
        </div>
      </SheetContent>

      <LessonNoteModal
        open={isLessonNoteOpen}
        onOpenChange={setIsLessonNoteOpen}
        session={session}
        onSave={handleSaveLessonNote}
      />
    </Sheet>
  );
}
