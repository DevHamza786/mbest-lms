import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChevronLeft, ChevronRight, Plus, Calendar as CalendarIcon, Loader2 } from "lucide-react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, startOfWeek, endOfWeek, addDays, isSameWeek, startOfDay } from 'date-fns';
import { Session, SessionFilter, SessionFormData } from '@/lib/types/session';
import { SessionFormModal } from '@/components/calendar/SessionFormModal';
import { SessionDetailSheet } from '@/components/calendar/SessionDetailSheet';
import { CalendarFilters } from '@/components/calendar/CalendarFilters';
import { getSessionColor, formatTimeDisplay } from '@/lib/utils/sessionUtils';
import { useToast } from '@/hooks/use-toast';
import { adminApi, AdminSession } from '@/lib/api/admin';

// Map AdminSession to Session type
const mapAdminSessionToSession = (adminSession: AdminSession): Session => {
  // Normalize date format to YYYY-MM-DD
  let sessionDate = adminSession.date;
  if (sessionDate && sessionDate.includes('T')) {
    // If date includes time, extract just the date part
    sessionDate = sessionDate.split('T')[0];
  }
  
  return {
    id: String(adminSession.id),
    date: sessionDate,
    startTime: adminSession.start_time,
    endTime: adminSession.end_time,
    teacherId: String(adminSession.teacher?.id || adminSession.teacher?.user?.id || ''),
    teacherName: adminSession.teacher?.user?.name || 'Unknown Teacher',
    studentIds: adminSession.students?.map(s => String(s.id)) || [],
    studentNames: adminSession.students?.map(s => s.user?.name || 'Unknown Student') || [],
    subject: adminSession.subject,
    yearLevel: adminSession.year_level || '',
    location: adminSession.location as 'online' | 'centre' | 'home',
    sessionType: adminSession.session_type as '1:1' | 'group',
    status: adminSession.status as Session['status'],
    lessonNote: (adminSession as any).lesson_note || '',
    topicsTaught: (adminSession as any).topics_taught || '',
    homeworkResources: (adminSession as any).homework_resources || '',
    studentNotes: (adminSession as any).student_notes || [],
    attendanceMarked: (adminSession as any).attendance_marked || false,
    readyForInvoicing: (adminSession as any).ready_for_invoicing || false,
    createdAt: (adminSession as any).created_at || new Date().toISOString(),
    updatedAt: (adminSession as any).updated_at || new Date().toISOString(),
  };
};

type ViewMode = 'day' | 'week' | 'month';

export default function AdminCalendar() {
  const { toast } = useToast();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>('month');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [sessions, setSessions] = useState<Session[]>([]);
  const [filters, setFilters] = useState<SessionFilter>({});
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');
  const [isLoading, setIsLoading] = useState(false);
  const [filterOptions, setFilterOptions] = useState<{
    teachers: Array<{ id: string; name: string }>;
    students: Array<{ id: string; name: string }>;
    subjects: string[];
    locations: string[];
    session_types: string[];
    statuses: string[];
  } | null>(null);
  const [isLoadingFilters, setIsLoadingFilters] = useState(false);

  // Calculate date range based on view mode
  const getDateRange = () => {
    if (viewMode === 'day') {
      const day = selectedDate;
      return {
        date_from: format(day, 'yyyy-MM-dd'),
        date_to: format(day, 'yyyy-MM-dd'),
      };
    } else if (viewMode === 'week') {
      const weekStart = startOfWeek(currentDate);
      const weekEnd = endOfWeek(currentDate);
      return {
        date_from: format(weekStart, 'yyyy-MM-dd'),
        date_to: format(weekEnd, 'yyyy-MM-dd'),
      };
    } else {
      // month view
      const monthStart = startOfMonth(currentDate);
      const monthEnd = endOfMonth(currentDate);
      return {
        date_from: format(monthStart, 'yyyy-MM-dd'),
        date_to: format(monthEnd, 'yyyy-MM-dd'),
      };
    }
  };

  // Fetch sessions from API
  const fetchSessions = async () => {
    try {
      setIsLoading(true);
      const dateRange = getDateRange();
      const params: any = {
        ...dateRange,
        per_page: 1000, // Get all sessions for the date range
      };

      // Apply filters
      if (filters.status) {
        params.status = filters.status;
      }
      if (filters.teacherId) {
        params.tutor_id = parseInt(filters.teacherId);
      }
      if (filters.subject) {
        params.subject = filters.subject;
      }
      if (filters.location) {
        params.location = filters.location;
      }
      // Note: student_id filter might need to be handled differently
      // as the API might not support it directly

      console.log('Fetching sessions with params:', params);
      const adminSessions = await adminApi.getSessions(params);
      console.log('Received sessions from API:', adminSessions);
      const mappedSessions = adminSessions.map(mapAdminSessionToSession);
      console.log('Mapped sessions:', mappedSessions);
      setSessions(mappedSessions);
    } catch (error) {
      console.error('Failed to fetch sessions:', error);
      toast({
        title: 'Error',
        description: 'Failed to load calendar sessions',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch filter options on mount
  useEffect(() => {
    const loadFilterOptions = async () => {
      try {
        setIsLoadingFilters(true);
        const options = await adminApi.getCalendarFilterOptions();
        console.log('Loaded filter options:', options);
        setFilterOptions(options);
      } catch (error) {
        console.error('Failed to load filter options:', error);
      } finally {
        setIsLoadingFilters(false);
      }
    };
    loadFilterOptions();
  }, []);

  // Fetch sessions when date range or filters change
  useEffect(() => {
    fetchSessions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentDate, viewMode, selectedDate, filters.status, filters.teacherId, filters.subject, filters.location]);

  const handlePrevious = () => {
    if (viewMode === 'day') {
      const newDate = addDays(currentDate, -1);
      setCurrentDate(newDate);
      setSelectedDate(newDate);
    } else if (viewMode === 'week') {
      setCurrentDate(addDays(currentDate, -7));
    } else {
      setCurrentDate(subMonths(currentDate, 1));
    }
  };

  const handleNext = () => {
    if (viewMode === 'day') {
      const newDate = addDays(currentDate, 1);
      setCurrentDate(newDate);
      setSelectedDate(newDate);
    } else if (viewMode === 'week') {
      setCurrentDate(addDays(currentDate, 7));
    } else {
      setCurrentDate(addMonths(currentDate, 1));
    }
  };

  const handleToday = () => {
    const today = new Date();
    setCurrentDate(today);
    setSelectedDate(today);
  };

  const getFilteredSessions = () => {
    return sessions.filter(session => {
      if (filters.teacherId && session.teacherId !== filters.teacherId) return false;
      if (filters.studentId && !session.studentIds.includes(filters.studentId)) return false;
      if (filters.subject && session.subject !== filters.subject) return false;
      if (filters.location && session.location !== filters.location) return false;
      if (filters.sessionType && session.sessionType !== filters.sessionType) return false;
      if (filters.status && session.status !== filters.status) return false;
      return true;
    });
  };

  const getDaySessions = (date: Date) => {
    const dateKey = format(date, 'yyyy-MM-dd');
    const filtered = getFilteredSessions().filter(s => {
      // Normalize session date for comparison
      let sessionDate = s.date;
      if (sessionDate && sessionDate.includes('T')) {
        sessionDate = sessionDate.split('T')[0];
      }
      return sessionDate === dateKey;
    });
    return filtered;
  };

  const handleCreateSession = () => {
    setFormMode('create');
    setSelectedSession(null);
    setIsFormOpen(true);
  };

  const handleEditSession = (session: Session) => {
    setFormMode('edit');
    setSelectedSession(session);
    setIsFormOpen(true);
    setIsDetailOpen(false);
  };

  const handleSessionClick = (session: Session) => {
    setSelectedSession(session);
    setIsDetailOpen(true);
  };

  const handleSaveSession = (formData: SessionFormData) => {
    if (formMode === 'create') {
      const newSession: Session = {
        id: `session-${Date.now()}`,
        ...formData,
        teacherName: 'Dr. Michael Rodriguez', // Mock - would fetch from teacherId
        studentNames: ['Emma Thompson'], // Mock - would fetch from studentIds
        lessonNote: '',
        attendanceMarked: false,
        readyForInvoicing: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setSessions([...sessions, newSession]);
    } else if (selectedSession) {
      setSessions(sessions.map(s =>
        s.id === selectedSession.id
          ? { ...s, ...formData, updatedAt: new Date().toISOString() }
          : s
      ));
    }
  };

  const handleMarkComplete = async (session: Session) => {
    try {
      const updatedSession = await adminApi.updateSession(parseInt(session.id), {
        status: 'completed',
      });
      const mappedSession = mapAdminSessionToSession(updatedSession);
      
      setSessions(sessions.map(s => s.id === session.id ? mappedSession : s));
      if (selectedSession?.id === session.id) {
        setSelectedSession(mappedSession);
      }

      toast({ 
        title: 'Session Completed', 
        description: 'Session marked as completed' 
      });
      setIsDetailOpen(false);
    } catch (error) {
      console.error('Failed to mark session complete:', error);
      toast({
        title: 'Error',
        description: 'Failed to mark session as completed',
        variant: 'destructive',
      });
    }
  };

  const handleAddLessonNote = (session: Session) => {
    // This will be handled by SessionDetailSheet
  };

  const handleSaveLessonNote = async (sessionId: string, lessonNote: string, topicsTaught: string, homeworkResources: string, studentNotes: any[]) => {
    try {
      const session = sessions.find(s => s.id === sessionId);
      if (!session) return;

      // Map student notes to API format
      const studentNotesData = studentNotes.map(note => ({
        student_id: parseInt(note.studentId),
        behavior_issues: note.behaviorIssues || null,
        homework_completed: note.homeworkCompleted || false,
        homework_notes: note.homeworkNotes || null,
        private_notes: note.privateNotes || null,
      }));

      const updatedSession = await adminApi.addSessionNotes(parseInt(sessionId), {
        lesson_note: lessonNote,
        topics_taught: topicsTaught,
        homework_resources: homeworkResources,
        student_notes: studentNotesData,
      });

      // Update session in state
      const mappedSession = mapAdminSessionToSession(updatedSession);
      setSessions(sessions.map(s => s.id === sessionId ? mappedSession : s));
      
      // Update selected session if it's the same one
      if (selectedSession?.id === sessionId) {
        setSelectedSession(mappedSession);
      }

      toast({ 
        title: 'Lesson Note Saved', 
        description: 'Lesson notes have been saved successfully.' 
      });
    } catch (error) {
      console.error('Failed to save lesson note:', error);
      toast({
        title: 'Error',
        description: 'Failed to save lesson notes',
        variant: 'destructive',
      });
    }
  };

  const handleMarkAttendance = async (session: Session) => {
    try {
      // For now, mark all students as present
      // In a real implementation, you'd show a modal to select attendance for each student
      const attendanceData = session.studentIds.map(studentId => ({
        student_id: parseInt(studentId),
        status: 'present' as const,
      }));

      const updatedSession = await adminApi.markSessionAttendance(parseInt(session.id), attendanceData);
      const mappedSession = mapAdminSessionToSession(updatedSession);
      
      setSessions(sessions.map(s => s.id === session.id ? mappedSession : s));
      if (selectedSession?.id === session.id) {
        setSelectedSession(mappedSession);
      }

      toast({
        title: 'Attendance Marked',
        description: 'Attendance has been marked successfully.',
      });
      setIsDetailOpen(false);
    } catch (error) {
      console.error('Failed to mark attendance:', error);
      toast({
        title: 'Error',
        description: 'Failed to mark attendance',
        variant: 'destructive',
      });
    }
  };

  const handleMarkReadyForInvoicing = async (session: Session) => {
    try {
      const updatedSession = await adminApi.markSessionReadyForInvoicing(parseInt(session.id));
      const mappedSession = mapAdminSessionToSession(updatedSession);
      
      setSessions(sessions.map(s => s.id === session.id ? mappedSession : s));
      if (selectedSession?.id === session.id) {
        setSelectedSession(mappedSession);
      }

      toast({
        title: 'Ready for Invoicing',
        description: 'Session marked ready for invoicing',
      });
      setIsDetailOpen(false);
    } catch (error) {
      console.error('Failed to mark ready for invoicing:', error);
      toast({
        title: 'Error',
        description: 'Failed to mark session ready for invoicing',
        variant: 'destructive',
      });
    }
  };

  // Render Day View
  const renderDayView = () => {
    const daySessions = getDaySessions(selectedDate).sort((a, b) => 
      a.startTime.localeCompare(b.startTime)
    );

    return (
      <Card>
        <CardHeader>
          <CardTitle>{format(selectedDate, 'EEEE, MMMM d, yyyy')}</CardTitle>
          <CardDescription>{daySessions.length} sessions scheduled</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : (
            <div className="space-y-3">
              {daySessions.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No sessions scheduled</p>
              ) : (
                daySessions.map(session => (
                  <div
                    key={session.id}
                    className="p-4 rounded-lg border hover:border-primary cursor-pointer transition-colors"
                    style={{ borderLeftWidth: '4px', borderLeftColor: getSessionColor(session) }}
                    onClick={() => handleSessionClick(session)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="space-y-1 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{session.subject}</span>
                          <Badge variant="outline" className="text-xs">{session.sessionType}</Badge>
                          <Badge 
                            variant={
                              session.status === 'completed' ? 'default' : 
                              session.status === 'cancelled' || session.status === 'no-show' ? 'destructive' :
                              session.status === 'planned' ? 'default' : 'outline'
                            } 
                            className="text-xs"
                            style={
                              session.status === 'planned' ? { backgroundColor: 'hsl(221, 83%, 53%)', color: 'white' } : undefined
                            }
                          >
                            {session.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {formatTimeDisplay(session.startTime)} - {formatTimeDisplay(session.endTime)}
                        </p>
                        <p className="text-sm">{session.teacherName}</p>
                        <p className="text-sm text-muted-foreground">
                          {session.studentNames.join(', ')}
                        </p>
                      </div>
                      <div className="text-right text-sm text-muted-foreground">
                        <p className="capitalize">{session.location}</p>
                        <p>Year {session.yearLevel}</p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  // Render Week View
  const renderWeekView = () => {
    const weekStart = startOfWeek(currentDate);
    const weekEnd = endOfWeek(currentDate);
    const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });

    return (
      <Card>
        <CardContent className="p-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : (
            <div className="grid grid-cols-7 gap-2">
              {weekDays.map(day => {
                const daySessions = getDaySessions(day);
                const isToday = isSameDay(day, new Date());
                
                return (
                  <div key={day.toISOString()} className="min-h-[200px]">
                    <div className={`text-center p-2 rounded-t-lg ${isToday ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                      <p className="text-xs font-medium">{format(day, 'EEE')}</p>
                      <p className="text-lg font-bold">{format(day, 'd')}</p>
                    </div>
                    <div className="space-y-1 p-2 border border-t-0 rounded-b-lg min-h-[150px]">
                      {daySessions.slice(0, 3).map(session => (
                        <div
                          key={session.id}
                          className="text-xs p-2 rounded cursor-pointer hover:opacity-80 transition-opacity text-white"
                          style={{ backgroundColor: getSessionColor(session) }}
                          onClick={() => handleSessionClick(session)}
                        >
                          <p className="font-medium truncate">{formatTimeDisplay(session.startTime)}</p>
                          <p className="truncate">{session.subject}</p>
                          <p className="truncate text-[10px] opacity-90">{session.teacherName}</p>
                        </div>
                      ))}
                      {daySessions.length > 3 && (
                        <p className="text-[10px] text-muted-foreground text-center">
                          +{daySessions.length - 3} more
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  // Render Month View
  const renderMonthView = () => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const calendarStart = startOfWeek(monthStart);
    const calendarEnd = endOfWeek(monthEnd);
    const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

    return (
      <Card>
        <CardContent className="p-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : (
            <div className="grid grid-cols-7 gap-2">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div key={day} className="text-center text-sm font-medium text-muted-foreground py-2">
                  {day}
                </div>
              ))}
              
              {calendarDays.map((day, idx) => {
                const daySessions = getDaySessions(day);
                const isSelected = isSameDay(day, selectedDate);
                const isToday = isSameDay(day, new Date());
                const isCurrentMonth = isSameMonth(day, currentDate);
                
                return (
                  <button
                    key={idx}
                    onClick={() => setSelectedDate(day)}
                    className={`
                      min-h-[100px] p-2 rounded-lg border transition-all
                      ${isSelected ? 'border-primary bg-primary/5 ring-2 ring-primary/20' : 'border-border hover:border-primary/50'}
                      ${!isCurrentMonth ? 'opacity-40' : ''}
                      ${isToday ? 'bg-primary/10' : ''}
                    `}
                  >
                    <div className={`text-sm font-medium mb-1 ${isToday ? 'text-primary font-bold' : ''}`}>
                      {format(day, 'd')}
                    </div>
                    <div className="space-y-1">
                      {daySessions.slice(0, 2).map(session => (
                        <div
                          key={session.id}
                          className="text-[10px] rounded px-1 py-0.5 truncate text-white"
                          style={{ backgroundColor: getSessionColor(session) }}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSessionClick(session);
                          }}
                        >
                          {formatTimeDisplay(session.startTime)} {session.subject}
                        </div>
                      ))}
                      {daySessions.length > 2 && (
                        <div className="text-[10px] text-muted-foreground">
                          +{daySessions.length - 2} more
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  const getHeaderTitle = () => {
    if (viewMode === 'day') return format(currentDate, 'EEEE, MMMM d, yyyy');
    if (viewMode === 'week') return `Week of ${format(startOfWeek(currentDate), 'MMM d, yyyy')}`;
    return format(currentDate, 'MMMM yyyy');
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Calendar</h1>
          <p className="text-muted-foreground mt-2">
            Manage all tutoring sessions across the organization
          </p>
        </div>
        <Button onClick={handleCreateSession}>
          <Plus className="mr-2 h-4 w-4" />
          New Session
        </Button>
      </div>

      {/* Filters */}
      <CalendarFilters
        filters={filters}
        onFilterChange={setFilters}
        onClearFilters={() => setFilters({})}
        filterOptions={filterOptions || undefined}
        isLoading={isLoadingFilters}
      />

      {/* View Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={handlePrevious}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" onClick={handleToday}>
            <CalendarIcon className="h-4 w-4 mr-2" />
            Today
          </Button>
          <Button variant="outline" size="icon" onClick={handleNext}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <span className="ml-2 font-medium">{getHeaderTitle()}</span>
        </div>

        <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as ViewMode)}>
          <TabsList>
            <TabsTrigger value="day">Day</TabsTrigger>
            <TabsTrigger value="week">Week</TabsTrigger>
            <TabsTrigger value="month">Month</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Calendar Views */}
      {viewMode === 'day' && renderDayView()}
      {viewMode === 'week' && renderWeekView()}
      {viewMode === 'month' && renderMonthView()}

      {/* Modals */}
      <SessionFormModal
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        session={selectedSession}
        allSessions={sessions}
        onSave={formMode === 'edit' ? handleUpdateSession : handleSaveSession}
        mode={formMode}
      />

      <SessionDetailSheet
        session={selectedSession}
        open={isDetailOpen}
        onOpenChange={setIsDetailOpen}
        onEdit={handleEditSession}
        onAddLessonNote={handleAddLessonNote}
        onMarkComplete={handleMarkComplete}
        onMarkReadyForInvoicing={handleMarkReadyForInvoicing}
        onSaveLessonNote={handleSaveLessonNote}
      />
    </div>
  );
}
