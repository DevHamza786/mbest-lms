import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChevronLeft, ChevronRight, Plus, Calendar as CalendarIcon } from "lucide-react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, startOfWeek, endOfWeek, addDays, isSameWeek, startOfDay } from 'date-fns';
import { Session, SessionFilter, SessionFormData } from '@/lib/types/session';
import { SessionFormModal } from '@/components/calendar/SessionFormModal';
import { SessionDetailSheet } from '@/components/calendar/SessionDetailSheet';
import { CalendarFilters } from '@/components/calendar/CalendarFilters';
import { getSessionColor, formatTimeDisplay } from '@/lib/utils/sessionUtils';
import { useToast } from '@/hooks/use-toast';

// Mock session data
const mockSessions: Session[] = [
  {
    id: '1',
    date: '2025-01-15',
    startTime: '16:00',
    endTime: '17:00',
    teacherId: 'tutor-1',
    teacherName: 'Dr. Michael Rodriguez',
    studentIds: ['student-1'],
    studentNames: ['Emma Thompson'],
    subject: 'Mathematics',
    yearLevel: '12',
    location: 'online',
    sessionType: '1:1',
    status: 'planned',
    lessonNote: '',
    attendanceMarked: false,
    readyForInvoicing: false,
    createdAt: '2025-01-10T10:00:00Z',
    updatedAt: '2025-01-10T10:00:00Z',
  },
  {
    id: '2',
    date: '2025-01-15',
    startTime: '17:30',
    endTime: '19:00',
    teacherId: 'tutor-2',
    teacherName: 'Sarah Chen',
    studentIds: ['student-2', 'student-3'],
    studentNames: ['Sampoorna Arora', 'Xavier Dean'],
    subject: 'Physics',
    yearLevel: '11',
    location: 'centre',
    sessionType: 'group',
    status: 'completed',
    lessonNote: 'Covered kinematics',
    attendanceMarked: true,
    readyForInvoicing: false,
    createdAt: '2025-01-10T10:00:00Z',
    updatedAt: '2025-01-15T19:00:00Z',
  },
  {
    id: '3',
    date: '2025-01-16',
    startTime: '14:00',
    endTime: '15:30',
    teacherId: 'tutor-1',
    teacherName: 'Dr. Michael Rodriguez',
    studentIds: ['student-4'],
    studentNames: ['Ethan Sutton'],
    subject: 'Computer Science',
    yearLevel: '10',
    location: 'online',
    sessionType: '1:1',
    status: 'planned',
    lessonNote: '',
    attendanceMarked: false,
    readyForInvoicing: false,
    createdAt: '2025-01-10T10:00:00Z',
    updatedAt: '2025-01-10T10:00:00Z',
  },
];

type ViewMode = 'day' | 'week' | 'month';

export default function AdminCalendar() {
  const { toast } = useToast();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>('month');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [sessions, setSessions] = useState<Session[]>(mockSessions);
  const [filters, setFilters] = useState<SessionFilter>({});
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');

  const handlePrevious = () => {
    if (viewMode === 'day') {
      setCurrentDate(addDays(currentDate, -1));
      setSelectedDate(addDays(currentDate, -1));
    } else if (viewMode === 'week') {
      setCurrentDate(addDays(currentDate, -7));
    } else {
      setCurrentDate(subMonths(currentDate, 1));
    }
  };

  const handleNext = () => {
    if (viewMode === 'day') {
      setCurrentDate(addDays(currentDate, 1));
      setSelectedDate(addDays(currentDate, 1));
    } else if (viewMode === 'week') {
      setCurrentDate(addDays(currentDate, 7));
    } else {
      setCurrentDate(addMonths(currentDate, 1));
    }
  };

  const handleToday = () => {
    setCurrentDate(new Date());
    setSelectedDate(new Date());
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
    return getFilteredSessions().filter(s => s.date === dateKey);
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

  const handleMarkComplete = (session: Session) => {
    setSessions(sessions.map(s =>
      s.id === session.id
        ? { ...s, status: 'completed', updatedAt: new Date().toISOString() }
        : s
    ));
    toast({ title: 'Session Completed', description: 'Session marked as completed' });
    setIsDetailOpen(false);
  };

  const handleMarkReadyForInvoicing = (session: Session) => {
    setSessions(sessions.map(s =>
      s.id === session.id
        ? { ...s, readyForInvoicing: true, updatedAt: new Date().toISOString() }
        : s
    ));
    toast({ title: 'Ready for Invoicing', description: 'Session marked ready for invoicing' });
    setIsDetailOpen(false);
  };

  const handleAddLessonNote = (session: Session) => {
    // This will be handled by SessionDetailSheet
  };

  const handleSaveLessonNote = (sessionId: string, lessonNote: string, topicsTaught: string, homeworkResources: string, studentNotes: any[]) => {
    setSessions(sessions.map(s =>
      s.id === sessionId
        ? { 
            ...s, 
            lessonNote,
            topicsTaught,
            homeworkResources,
            studentNotes,
            updatedAt: new Date().toISOString() 
          }
        : s
    ));
    toast({ title: 'Lesson Note Saved', description: 'Lesson notes have been saved successfully.' });
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
                        <Badge variant={session.status === 'completed' ? 'default' : 'outline'} className="text-xs">
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
        </CardContent>
      </Card>
    );
  };

  // Render Month View
  const renderMonthView = () => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

    return (
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-7 gap-2">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="text-center text-sm font-medium text-muted-foreground py-2">
                {day}
              </div>
            ))}
            
            {daysInMonth.map((day, idx) => {
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
        onSave={handleSaveSession}
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
