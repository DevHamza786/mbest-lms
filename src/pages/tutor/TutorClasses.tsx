import { useState, useEffect } from 'react';
import { Calendar, Users, Clock, MapPin, Plus, Settings, Video, FileText, Trash2, Loader2, BookOpen, MessageSquare } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { tutorApi, TutoringSession, TutorClass, TutorStudent, TutorAssignment, StudentNote } from '@/lib/api/tutor';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Pagination, 
  PaginationContent, 
  PaginationItem, 
  PaginationLink, 
  PaginationNext, 
  PaginationPrevious 
} from '@/components/ui/pagination';
import { Separator } from '@/components/ui/separator';

interface SessionDisplay {
  id: number;
  title: string;
  date: string;
  time: string;
  duration: string;
  room: string;
  meetingLink: string;
  attendees: number;
  maxAttendees: number;
  status: 'scheduled' | 'live' | 'completed';
  rawSession: TutoringSession;
}

export default function TutorClasses() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  
  // Reset pagination when search changes
  useEffect(() => {
    setSessionsPage(1);
  }, [searchTerm]);
  const [isCreateSessionOpen, setIsCreateSessionOpen] = useState(false);
  const [isEditSessionOpen, setIsEditSessionOpen] = useState(false);
  const [isViewSummaryOpen, setIsViewSummaryOpen] = useState(false);
  const [isViewClassStudentsOpen, setIsViewClassStudentsOpen] = useState(false);
  const [selectedSession, setSelectedSession] = useState<TutoringSession | null>(null);
  const [selectedClass, setSelectedClass] = useState<TutorClass | null>(null);
  const [sessions, setSessions] = useState<SessionDisplay[]>([]);
  const [classes, setClasses] = useState<TutorClass[]>([]);
  const [students, setStudents] = useState<TutorStudent[]>([]);
  const [classStudents, setClassStudents] = useState<TutorStudent[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [loadingClassStudents, setLoadingClassStudents] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [deleting, setDeleting] = useState<number | null>(null);
  
  // View Summary states
  const [sessionAssignments, setSessionAssignments] = useState<TutorAssignment[]>([]);
  const [loadingAssignments, setLoadingAssignments] = useState(false);
  const [studentsPage, setStudentsPage] = useState(1);
  const [notesPage, setNotesPage] = useState(1);
  const [assignmentsPage, setAssignmentsPage] = useState(1);
  const itemsPerPage = 5;
  
  // Sessions list pagination
  const [sessionsPage, setSessionsPage] = useState(1);
  const sessionsPerPage = 10;

  const [newSession, setNewSession] = useState({
    subject: '',
    date: '',
    start_time: '',
    end_time: '',
    duration: '60',
    location: 'online',
    session_type: 'group',
    year_level: '',
    student_ids: [] as number[],
  });

  const [editSession, setEditSession] = useState({
    id: 0,
    subject: '',
    date: '',
    start_time: '',
    end_time: '',
    duration: '60',
    location: 'online',
    session_type: 'group',
    year_level: '',
    status: 'planned',
    class_id: null as number | null,
  });

  // Fetch sessions and classes on mount
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [sessionsData, classesData] = await Promise.all([
        tutorApi.getSessions({ per_page: 100 }),
        tutorApi.getClasses({ per_page: 100 }),
      ]);
      
      setSessions(mapSessionsToDisplay(sessionsData));
      setClasses(classesData);
    } catch (err: any) {
      setError(err.message || 'Failed to load data');
      toast({
        title: "Error",
        description: err.message || 'Failed to load sessions and classes',
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Fetch students when a class is selected (for create session)
  const handleClassSelect = async (classId: string) => {
    setSelectedClassId(classId);
    if (!classId) {
      setStudents([]);
      setNewSession(prev => ({ ...prev, student_ids: [], class_id: null }));
      return;
    }
    
    // Set class_id in the session form
    setNewSession(prev => ({ ...prev, class_id: Number(classId) }));

    try {
      setLoadingStudents(true);
      const fetchedStudents = await tutorApi.getClassStudents(Number(classId));
      console.log('Loaded students:', fetchedStudents); // Debug log
      console.log('Students count:', fetchedStudents?.length); // Debug log
      
      // Ensure we have an array and it's not empty
      if (Array.isArray(fetchedStudents) && fetchedStudents.length > 0) {
        setStudents(fetchedStudents);
        // Clear previous selections when loading new class
        setNewSession(prev => ({ ...prev, student_ids: [] }));
      } else {
        console.warn('No students returned or invalid format:', fetchedStudents);
        setStudents([]);
        toast({
          title: "No Students",
          description: "This class has no enrolled students.",
          variant: "default",
        });
      }
    } catch (err: any) {
      console.error('Error loading students:', err); // Debug log
      toast({
        title: "Error",
        description: err.message || 'Failed to load students',
        variant: "destructive",
      });
      setStudents([]);
    } finally {
      setLoadingStudents(false);
    }
  };

  // Handle viewing students for a class (from Classes Overview tab)
  const handleViewClassStudents = async (classItem: TutorClass) => {
    setSelectedClass(classItem);
    setIsViewClassStudentsOpen(true);
    
    try {
      setLoadingClassStudents(true);
      const fetchedStudents = await tutorApi.getClassStudents(classItem.id);
      console.log('Loaded class students:', fetchedStudents);
      
      if (Array.isArray(fetchedStudents) && fetchedStudents.length > 0) {
        setClassStudents(fetchedStudents);
      } else {
        setClassStudents([]);
      }
    } catch (err: any) {
      console.error('Error loading class students:', err);
      toast({
        title: "Error",
        description: err.message || 'Failed to load students',
        variant: "destructive",
      });
      setClassStudents([]);
    } finally {
      setLoadingClassStudents(false);
    }
  };

  // Map API session format to display format
  const mapSessionsToDisplay = (apiSessions: TutoringSession[]): SessionDisplay[] => {
    return apiSessions.map(session => {
      const startTime = new Date(`2000-01-01T${session.start_time}`);
      const endTime = new Date(`2000-01-01T${session.end_time}`);
      const durationMs = endTime.getTime() - startTime.getTime();
      const durationMinutes = Math.round(durationMs / 60000);
      
      const timeStr = startTime.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
      });

      // Map API status to UI status
      let displayStatus: 'scheduled' | 'live' | 'completed' = 'scheduled';
      if (session.status === 'completed') {
        displayStatus = 'completed';
      } else if (session.status === 'live' || session.status === 'in-progress') {
        displayStatus = 'live';
      }

      // Generate meeting link for online sessions
      const meetingLink = session.location === 'online' 
        ? `https://meet.google.com/${Math.random().toString(36).substr(2, 9)}`
        : '#';

      // Get location display
      const locationDisplay = session.location === 'online' 
        ? 'Online' 
        : session.location === 'centre' 
        ? 'Centre' 
        : session.location === 'home'
        ? 'Home'
        : session.location;

      // Format date for display
      const dateObj = typeof session.date === 'string' 
        ? new Date(session.date) 
        : session.date;
      const formattedDate = dateObj.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: '2-digit', 
        day: '2-digit' 
      });

      return {
        id: session.id,
        title: session.subject,
        date: formattedDate,
        time: timeStr,
        duration: `${durationMinutes} min`,
        room: locationDisplay,
        meetingLink,
        attendees: session.students?.length || 0,
        maxAttendees: session.session_type === '1:1' ? 1 : 25,
        status: displayStatus,
        rawSession: session,
      };
    });
  };

  const handleCreateSession = async () => {
    if (!newSession.subject || !newSession.date || !newSession.start_time || newSession.student_ids.length === 0) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields and select at least one student.",
        variant: "destructive",
      });
      return;
    }

    // Calculate end_time from start_time and duration
    // Ensure start_time is in HH:mm format (24-hour)
    const [hours, minutes] = newSession.start_time.split(':');
    const startDate = new Date();
    startDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);
    
    const durationMinutes = parseInt(newSession.duration);
    const endDate = new Date(startDate.getTime() + durationMinutes * 60000);
    
    // Format as H:i (24-hour format, e.g., "14:30")
    const endTimeStr = `${String(endDate.getHours()).padStart(2, '0')}:${String(endDate.getMinutes()).padStart(2, '0')}`;

    try {
      setCreating(true);
      const createdSession = await tutorApi.createSession({
        date: newSession.date,
        start_time: newSession.start_time,
        end_time: endTimeStr,
        subject: newSession.subject,
        year_level: newSession.year_level || undefined,
        location: newSession.location,
        session_type: newSession.session_type,
        student_ids: newSession.student_ids,
        class_id: newSession.class_id || undefined,
      });

      // Refresh sessions
      const sessionsData = await tutorApi.getSessions({ per_page: 100 });
      setSessions(mapSessionsToDisplay(sessionsData));

      // Reset form
      setNewSession({
        subject: '',
        date: '',
        start_time: '',
        end_time: '',
        duration: '60',
        location: 'online',
        session_type: 'group',
        year_level: '',
        student_ids: [],
        class_id: null,
      });
      setStudents([]);
      setSelectedClassId('');
      setIsCreateSessionOpen(false);

      toast({
        title: "Session Created",
        description: "Your session has been scheduled successfully.",
      });
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || 'Failed to create session',
        variant: "destructive",
      });
    } finally {
      setCreating(false);
    }
  };

  const handleEditClick = (session: SessionDisplay) => {
    const rawSession = session.rawSession;
    const startTime = new Date(`2000-01-01T${rawSession.start_time}`);
    const endTime = new Date(`2000-01-01T${rawSession.end_time}`);
    const durationMs = endTime.getTime() - startTime.getTime();
    const durationMinutes = Math.round(durationMs / 60000);

    // Format date for input field (YYYY-MM-DD)
    const dateStr = typeof rawSession.date === 'string' 
      ? rawSession.date.split('T')[0] 
      : new Date(rawSession.date).toISOString().split('T')[0];

    setEditSession({
      id: rawSession.id,
      subject: rawSession.subject,
      date: dateStr,
      start_time: rawSession.start_time,
      end_time: rawSession.end_time,
      duration: durationMinutes.toString(),
      location: rawSession.location,
      session_type: rawSession.session_type,
      year_level: rawSession.year_level || '',
      status: rawSession.status,
      class_id: (rawSession as any).class_id || null,
    });
    setSelectedSession(rawSession);
    setIsEditSessionOpen(true);
  };

  const handleUpdateSession = async () => {
    if (!editSession.subject || !editSession.date || !editSession.start_time) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    // Calculate end_time from start_time and duration
    // Ensure start_time is in HH:mm format (24-hour)
    const [hours, minutes] = editSession.start_time.split(':');
    const startDate = new Date();
    startDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);
    
    const durationMinutes = parseInt(editSession.duration);
    const endDate = new Date(startDate.getTime() + durationMinutes * 60000);
    
    // Format as H:i (24-hour format, e.g., "14:30")
    const endTimeStr = `${String(endDate.getHours()).padStart(2, '0')}:${String(endDate.getMinutes()).padStart(2, '0')}`;

    try {
      setUpdating(true);
      await tutorApi.updateSession(editSession.id, {
        date: editSession.date,
        start_time: editSession.start_time,
        end_time: endTimeStr,
        subject: editSession.subject,
        year_level: editSession.year_level || undefined,
        location: editSession.location,
        session_type: editSession.session_type,
        status: editSession.status,
        class_id: editSession.class_id || undefined,
      });

      // Refresh sessions
      const sessionsData = await tutorApi.getSessions({ per_page: 100 });
      setSessions(mapSessionsToDisplay(sessionsData));

      setIsEditSessionOpen(false);
      setSelectedSession(null);

      toast({
        title: "Session Updated",
        description: "Your session has been updated successfully.",
      });
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || 'Failed to update session',
        variant: "destructive",
      });
    } finally {
      setUpdating(false);
    }
  };

  const handleDeleteSession = async (sessionId: number) => {
    if (!confirm('Are you sure you want to delete this session?')) {
      return;
    }

    try {
      setDeleting(sessionId);
      await tutorApi.deleteSession(sessionId);

      // Refresh sessions
      const sessionsData = await tutorApi.getSessions({ per_page: 100 });
      setSessions(mapSessionsToDisplay(sessionsData));

      toast({
        title: "Session Deleted",
        description: "The session has been deleted successfully.",
      });
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || 'Failed to delete session',
        variant: "destructive",
      });
    } finally {
      setDeleting(null);
    }
  };

  const handleViewSummary = async (session: SessionDisplay) => {
    try {
      setLoadingAssignments(true);
      setStudentsPage(1);
      setNotesPage(1);
      setAssignmentsPage(1);
      
      // Fetch full session details
      const fullSession = await tutorApi.getSession(session.id);
      console.log('Fetched session:', fullSession); // Debug log
      console.log('Session students:', fullSession.students); // Debug log
      console.log('Session student_notes (raw):', (fullSession as any).student_notes); // Debug log
      console.log('Session studentNotes (camelCase):', fullSession.studentNotes); // Debug log
      
      // Ensure studentNotes is properly mapped (API returns student_notes in snake_case)
      if (fullSession) {
        if (!fullSession.studentNotes && (fullSession as any).student_notes) {
          fullSession.studentNotes = (fullSession as any).student_notes;
        }
        // Also ensure students array exists
        if (!fullSession.students && (fullSession as any).students) {
          fullSession.students = (fullSession as any).students;
        }
      }
      
      console.log('Processed session:', fullSession); // Debug log
      setSelectedSession(fullSession);
      
      // Fetch assignments - try to get assignments that might be related
      // Since sessions don't have class_id, we'll fetch all tutor assignments
      // and filter by subject if possible, or show recent assignments
      try {
        const assignmentsResponse = await tutorApi.getAssignments({ per_page: 50 });
        // Handle both object response and array response
        const assignments = Array.isArray(assignmentsResponse) 
          ? assignmentsResponse 
          : (assignmentsResponse?.assignments || []);
        // Filter assignments that might be related (by subject or recent)
        const relatedAssignments = assignments.filter(assignment => 
          assignment.title.toLowerCase().includes(fullSession.subject.toLowerCase()) ||
          assignment.description?.toLowerCase().includes(fullSession.subject.toLowerCase())
        ).slice(0, 20); // Limit to 20 most relevant
        setSessionAssignments(relatedAssignments);
      } catch (assignErr) {
        console.error('Failed to load assignments:', assignErr);
        setSessionAssignments([]);
      }
      
      setIsViewSummaryOpen(true);
    } catch (err: any) {
      console.error('Error loading session:', err); // Debug log
      toast({
        title: "Error",
        description: err.message || 'Failed to load session details',
        variant: "destructive",
      });
    } finally {
      setLoadingAssignments(false);
    }
  };

  const handleStudentToggle = (studentId: number) => {
    setNewSession(prev => ({
      ...prev,
      student_ids: prev.student_ids.includes(studentId)
        ? prev.student_ids.filter(id => id !== studentId)
        : [...prev.student_ids, studentId],
    }));
  };

  const getStatusColor = (status: SessionDisplay['status']) => {
    switch (status) {
      case 'scheduled': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'live': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'completed': return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  const filteredSessions = sessions.filter(session =>
    session.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    session.date.includes(searchTerm) ||
    session.room.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Paginate filtered sessions
  const totalSessionsPages = Math.ceil(filteredSessions.length / sessionsPerPage);
  const startSessionIndex = (sessionsPage - 1) * sessionsPerPage;
  const endSessionIndex = startSessionIndex + sessionsPerPage;
  const paginatedSessions = filteredSessions.slice(startSessionIndex, endSessionIndex);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading sessions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Classes</h1>
          <p className="text-muted-foreground">
            Manage your classes and create sessions for your students
          </p>
        </div>
        <Dialog open={isCreateSessionOpen} onOpenChange={(open) => {
          setIsCreateSessionOpen(open);
          if (!open) {
            // Reset form when dialog closes
            setNewSession({
              subject: '',
              date: '',
              start_time: '',
              end_time: '',
              duration: '60',
              location: 'online',
              session_type: 'group',
              year_level: '',
              student_ids: [],
            });
            setStudents([]);
            setSelectedClassId('');
          }
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create Session
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Session</DialogTitle>
              <DialogDescription>
                Schedule a new session for your students
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="subject">Subject/Title *</Label>
                <Input
                  id="subject"
                  value={newSession.subject}
                  onChange={(e) => setNewSession(prev => ({ ...prev, subject: e.target.value }))}
                  placeholder="e.g., Advanced React Patterns"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="date">Date *</Label>
                  <Input
                    id="date"
                    type="date"
                    value={newSession.date}
                    onChange={(e) => setNewSession(prev => ({ ...prev, date: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="start_time">Start Time *</Label>
                  <Input
                    id="start_time"
                    type="time"
                    value={newSession.start_time}
                    onChange={(e) => setNewSession(prev => ({ ...prev, start_time: e.target.value }))}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="duration">Duration (minutes) *</Label>
                  <Select value={newSession.duration} onValueChange={(value) => setNewSession(prev => ({ ...prev, duration: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="30">30 minutes</SelectItem>
                      <SelectItem value="45">45 minutes</SelectItem>
                      <SelectItem value="60">60 minutes</SelectItem>
                      <SelectItem value="90">90 minutes</SelectItem>
                      <SelectItem value="120">120 minutes</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="location">Location *</Label>
                  <Select value={newSession.location} onValueChange={(value) => setNewSession(prev => ({ ...prev, location: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="online">Online</SelectItem>
                      <SelectItem value="centre">Centre</SelectItem>
                      <SelectItem value="home">Home</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="session_type">Session Type *</Label>
                  <Select value={newSession.session_type} onValueChange={(value) => setNewSession(prev => ({ ...prev, session_type: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1:1">1:1</SelectItem>
                      <SelectItem value="group">Group</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="year_level">Year Level (Optional)</Label>
                  <Input
                    id="year_level"
                    value={newSession.year_level}
                    onChange={(e) => setNewSession(prev => ({ ...prev, year_level: e.target.value }))}
                    placeholder="e.g., Year 10"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Select Class to Load Students *</Label>
                <Select value={selectedClassId} onValueChange={handleClassSelect}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a class to load students" />
                  </SelectTrigger>
                  <SelectContent>
                    {classes.length > 0 ? (
                      classes.map(cls => (
                        <SelectItem key={cls.id} value={cls.id.toString()}>{cls.name}</SelectItem>
                      ))
                    ) : (
                      <div className="px-2 py-1.5 text-sm text-muted-foreground">No classes available</div>
                    )}
                  </SelectContent>
                </Select>
                {loadingStudents && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mt-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Loading students...
                  </div>
                )}
                {!loadingStudents && students.length === 0 && (
                  <p className="text-xs text-muted-foreground mt-2">
                    Select a class above to load students
                  </p>
                )}
              </div>

              {!loadingStudents && students.length > 0 && (
                <div className="space-y-2">
                  <Label>Select Students * ({students.length} available)</Label>
                  <div className="border rounded-md p-4 max-h-48 overflow-y-auto bg-muted/30">
                    {students.map((student) => (
                      <div key={student.id} className="flex items-center space-x-2 py-2 hover:bg-muted/50 rounded px-2 transition-colors">
                        <Checkbox
                          id={`student-${student.id}`}
                          checked={newSession.student_ids.includes(student.id)}
                          onCheckedChange={() => handleStudentToggle(student.id)}
                        />
                        <label
                          htmlFor={`student-${student.id}`}
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex-1"
                        >
                          {student.user?.name || `Student ${student.id}`}
                          {student.user?.email && (
                            <span className="text-xs text-muted-foreground block font-normal">
                              {student.user.email}
                            </span>
                          )}
                        </label>
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-muted-foreground">
                      {newSession.student_ids.length} of {students.length} student(s) selected
                    </p>
                    {newSession.student_ids.length > 0 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-6 text-xs"
                        onClick={() => setNewSession(prev => ({ ...prev, student_ids: [] }))}
                      >
                        Clear selection
                      </Button>
                    )}
                  </div>
                </div>
              )}
              {!loadingStudents && students.length === 0 && selectedClassId && (
                <div className="space-y-2">
                  <Label>Select Students *</Label>
                  <div className="border rounded-md p-4 text-center">
                    <p className="text-sm text-muted-foreground">No students found in this class</p>
                  </div>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateSessionOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateSession} disabled={creating}>
                {creating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  'Create Session'
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="sessions" className="space-y-4">
        <TabsList>
          <TabsTrigger value="sessions">Sessions</TabsTrigger>
          <TabsTrigger value="classes">Classes Overview</TabsTrigger>
        </TabsList>

        <TabsContent value="sessions" className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search sessions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-sm"
              />
            </div>
          </div>

          {filteredSessions.length === 0 ? (
            <Card>
              <CardContent className="p-6 text-center">
                <p className="text-muted-foreground">No sessions found. Create your first session to get started.</p>
              </CardContent>
            </Card>
          ) : (
            <>
              <div className="grid gap-4">
                {paginatedSessions.map((session) => (
                <Card key={session.id}>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="space-y-2 flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-lg">{session.title}</h3>
                          <Badge className={getStatusColor(session.status)}>
                            {session.status}
                          </Badge>
                        </div>
                        
                        <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            {session.date}
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            {session.time} ({session.duration})
                          </div>
                          <div className="flex items-center gap-1">
                            <MapPin className="h-4 w-4" />
                            {session.room}
                          </div>
                          <div className="flex items-center gap-1">
                            <Users className="h-4 w-4" />
                            {session.attendees}/{session.maxAttendees} attendees
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {session.status === 'live' && (
                          <Button size="sm" asChild>
                            <a href={session.meetingLink} target="_blank" rel="noopener noreferrer">
                              <Video className="mr-2 h-4 w-4" />
                              Join Live
                            </a>
                          </Button>
                        )}
                        {session.status === 'scheduled' && (
                          <>
                            {session.rawSession.location === 'online' && (
                              <Button size="sm" variant="outline" asChild>
                                <a href={session.meetingLink} target="_blank" rel="noopener noreferrer">
                                  <Video className="mr-2 h-4 w-4" />
                                  Meeting Link
                                </a>
                              </Button>
                            )}
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handleEditClick(session)}
                            >
                              <Settings className="mr-2 h-4 w-4" />
                              Edit
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handleDeleteSession(session.id)}
                              disabled={deleting === session.id}
                            >
                              {deleting === session.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Trash2 className="h-4 w-4" />
                              )}
                            </Button>
                          </>
                        )}
                        {session.status === 'completed' && (
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleViewSummary(session)}
                          >
                            <FileText className="mr-2 h-4 w-4" />
                            View Summary
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              </div>
              
              {/* Sessions Pagination */}
              {totalSessionsPages > 1 && (
                <div className="flex items-center justify-between pt-4">
                  <p className="text-sm text-muted-foreground">
                    Showing {startSessionIndex + 1} to {Math.min(endSessionIndex, filteredSessions.length)} of {filteredSessions.length} sessions
                  </p>
                  <Pagination>
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious 
                          onClick={(e) => {
                            e.preventDefault();
                            setSessionsPage(prev => Math.max(1, prev - 1));
                          }}
                          className={sessionsPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                          href="#"
                        />
                      </PaginationItem>
                      {Array.from({ length: totalSessionsPages }, (_, i) => i + 1).map((page) => (
                        <PaginationItem key={page}>
                          <PaginationLink
                            onClick={(e) => {
                              e.preventDefault();
                              setSessionsPage(page);
                            }}
                            isActive={sessionsPage === page}
                            className="cursor-pointer"
                            href="#"
                          >
                            {page}
                          </PaginationLink>
                        </PaginationItem>
                      ))}
                      <PaginationItem>
                        <PaginationNext 
                          onClick={(e) => {
                            e.preventDefault();
                            setSessionsPage(prev => Math.min(totalSessionsPages, prev + 1));
                          }}
                          className={sessionsPage === totalSessionsPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                          href="#"
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </div>
              )}
            </>
          )}
        </TabsContent>

        <TabsContent value="classes" className="space-y-4">
          {classes.length === 0 ? (
            <Card>
              <CardContent className="p-6 text-center">
                <p className="text-muted-foreground">No classes found.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6 md:grid-cols-2">
              {classes.map((classItem) => (
                <Card key={classItem.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle>{classItem.name}</CardTitle>
                        <CardDescription className="mt-1">
                          {classItem.code} • {classItem.level}
                        </CardDescription>
                      </div>
                      <Badge variant="secondary">{classItem.status}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {classItem.description && (
                      <p className="text-sm text-muted-foreground">{classItem.description}</p>
                    )}
                    
                    <div className="space-y-2">
                      <div className="flex items-center text-sm">
                        <Users className="mr-2 h-4 w-4" />
                        {classItem.enrolled}/{classItem.capacity} students enrolled
                      </div>
                    </div>

                    <div className="flex gap-2 pt-2">
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleViewClassStudents(classItem)}
                      >
                        View Students
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Edit Session Dialog */}
      <Dialog open={isEditSessionOpen} onOpenChange={setIsEditSessionOpen}>
        <DialogContent className="sm:max-w-[525px]">
          <DialogHeader>
            <DialogTitle>Edit Session</DialogTitle>
            <DialogDescription>
              Update session details
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-subject">Subject/Title *</Label>
              <Input
                id="edit-subject"
                value={editSession.subject}
                onChange={(e) => setEditSession(prev => ({ ...prev, subject: e.target.value }))}
                placeholder="e.g., Advanced React Patterns"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-date">Date *</Label>
                <Input
                  id="edit-date"
                  type="date"
                  value={editSession.date}
                  onChange={(e) => setEditSession(prev => ({ ...prev, date: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-start_time">Start Time *</Label>
                <Input
                  id="edit-start_time"
                  type="time"
                  value={editSession.start_time}
                  onChange={(e) => setEditSession(prev => ({ ...prev, start_time: e.target.value }))}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-duration">Duration (minutes) *</Label>
                <Select value={editSession.duration} onValueChange={(value) => setEditSession(prev => ({ ...prev, duration: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="30">30 minutes</SelectItem>
                    <SelectItem value="45">45 minutes</SelectItem>
                    <SelectItem value="60">60 minutes</SelectItem>
                    <SelectItem value="90">90 minutes</SelectItem>
                    <SelectItem value="120">120 minutes</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-location">Location *</Label>
                <Select value={editSession.location} onValueChange={(value) => setEditSession(prev => ({ ...prev, location: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="online">Online</SelectItem>
                    <SelectItem value="centre">Centre</SelectItem>
                    <SelectItem value="home">Home</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-session_type">Session Type *</Label>
                <Select value={editSession.session_type} onValueChange={(value) => setEditSession(prev => ({ ...prev, session_type: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1:1">1:1</SelectItem>
                    <SelectItem value="group">Group</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-status">Status *</Label>
                <Select value={editSession.status} onValueChange={(value) => setEditSession(prev => ({ ...prev, status: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="planned">Planned</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                    <SelectItem value="no-show">No Show</SelectItem>
                    <SelectItem value="rescheduled">Rescheduled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-year_level">Year Level (Optional)</Label>
                <Input
                  id="edit-year_level"
                  value={editSession.year_level}
                  onChange={(e) => setEditSession(prev => ({ ...prev, year_level: e.target.value }))}
                  placeholder="e.g., Year 10"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-class_id">Class (Optional)</Label>
                <Select 
                  value={editSession.class_id?.toString() || undefined} 
                  onValueChange={(value) => setEditSession(prev => ({ ...prev, class_id: value === 'none' ? null : Number(value) }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a class" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {classes.map(cls => (
                      <SelectItem key={cls.id} value={cls.id.toString()}>{cls.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditSessionOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateSession} disabled={updating}>
              {updating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                'Update Session'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Summary Dialog */}
      <Dialog open={isViewSummaryOpen} onOpenChange={setIsViewSummaryOpen}>
        <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Session Summary</DialogTitle>
            <DialogDescription>
              View complete session details, students, assignments, and feedback
            </DialogDescription>
          </DialogHeader>
          {loadingAssignments && !selectedSession ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin mr-2" />
              <span>Loading session details...</span>
            </div>
          ) : selectedSession ? (
            <div className="space-y-6 py-4">
              {/* Session Basic Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Session Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-semibold">Subject</Label>
                      <p className="text-sm">{selectedSession.subject || 'N/A'}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-semibold">Status</Label>
                      <Badge className={selectedSession.status === 'completed' ? 'bg-green-100 text-green-800' : ''}>
                        {selectedSession.status || 'N/A'}
                      </Badge>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-semibold">Date</Label>
                      <p className="text-sm">
                        {selectedSession.date 
                          ? new Date(selectedSession.date).toLocaleDateString() 
                          : 'N/A'}
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm font-semibold">Time</Label>
                      <p className="text-sm">
                        {selectedSession.start_time && selectedSession.end_time
                          ? `${selectedSession.start_time} - ${selectedSession.end_time}`
                          : 'N/A'}
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-semibold">Location</Label>
                      <p className="text-sm capitalize">{selectedSession.location || 'N/A'}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-semibold">Session Type</Label>
                      <p className="text-sm">{selectedSession.session_type || 'N/A'}</p>
                    </div>
                  </div>
                  {selectedSession.year_level && (
                    <div>
                      <Label className="text-sm font-semibold">Year Level</Label>
                      <p className="text-sm">{selectedSession.year_level}</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Students Section with Pagination */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Students ({selectedSession.students?.length || 0})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {selectedSession.students && selectedSession.students.length > 0 ? (
                    (() => {
                      const totalPages = Math.ceil(selectedSession.students.length / itemsPerPage);
                      const startIndex = (studentsPage - 1) * itemsPerPage;
                      const endIndex = startIndex + itemsPerPage;
                      const paginatedStudents = selectedSession.students.slice(startIndex, endIndex);
                      
                      return (
                        <>
                          <div className="space-y-2 mb-4">
                            {paginatedStudents.map((student) => (
                              <div key={student.id} className="flex items-center gap-2 p-2 border rounded">
                                <Users className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm font-medium">{student.user?.name || `Student ${student.id}`}</span>
                              </div>
                            ))}
                          </div>
                          {totalPages > 1 && (
                            <Pagination>
                              <PaginationContent>
                                <PaginationItem>
                                  <PaginationPrevious 
                                    onClick={(e) => {
                                      e.preventDefault();
                                      setStudentsPage(prev => Math.max(1, prev - 1));
                                    }}
                                    className={studentsPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                                    href="#"
                                  />
                                </PaginationItem>
                                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                                  <PaginationItem key={page}>
                                    <PaginationLink
                                      onClick={(e) => {
                                        e.preventDefault();
                                        setStudentsPage(page);
                                      }}
                                      isActive={studentsPage === page}
                                      className="cursor-pointer"
                                      href="#"
                                    >
                                      {page}
                                    </PaginationLink>
                                  </PaginationItem>
                                ))}
                                <PaginationItem>
                                  <PaginationNext 
                                    onClick={(e) => {
                                      e.preventDefault();
                                      setStudentsPage(prev => Math.min(totalPages, prev + 1));
                                    }}
                                    className={studentsPage === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                                    href="#"
                                  />
                                </PaginationItem>
                              </PaginationContent>
                            </Pagination>
                          )}
                          {totalPages === 1 && (
                            <p className="text-xs text-muted-foreground text-center">Showing all {selectedSession.students.length} students</p>
                          )}
                        </>
                      );
                    })()
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-4">No students enrolled in this session</p>
                  )}
                </CardContent>
              </Card>

              {/* Student Notes/Feedback Section with Pagination - Only show if completed */}
              {selectedSession.status === 'completed' && selectedSession.studentNotes && selectedSession.studentNotes.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <MessageSquare className="h-5 w-5" />
                      Student Feedback & Notes ({selectedSession.studentNotes.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {(() => {
                      const totalPages = Math.ceil(selectedSession.studentNotes.length / itemsPerPage);
                      const startIndex = (notesPage - 1) * itemsPerPage;
                      const endIndex = startIndex + itemsPerPage;
                      const paginatedNotes = selectedSession.studentNotes.slice(startIndex, endIndex);
                      
                      return (
                        <>
                          <div className="space-y-4 mb-4">
                            {paginatedNotes.map((note) => (
                              <Card key={note.id} className="border-l-4 border-l-primary">
                                <CardContent className="p-4">
                                  <div className="flex items-center gap-2 mb-2">
                                    <Users className="h-4 w-4 text-muted-foreground" />
                                    <span className="text-sm font-semibold">
                                      {note.student?.user.name || 'Student'}
                                    </span>
                                  </div>
                                  {note.behavior_issues && (
                                    <div className="mb-2">
                                      <Label className="text-xs font-semibold text-muted-foreground">Behavior Issues</Label>
                                      <p className="text-sm">{note.behavior_issues}</p>
                                    </div>
                                  )}
                                  <div className="mb-2">
                                    <Label className="text-xs font-semibold text-muted-foreground">Homework Completed</Label>
                                    <Badge variant={note.homework_completed ? "default" : "secondary"}>
                                      {note.homework_completed ? "Yes" : "No"}
                                    </Badge>
                                  </div>
                                  {note.homework_notes && (
                                    <div className="mb-2">
                                      <Label className="text-xs font-semibold text-muted-foreground">Homework Notes</Label>
                                      <p className="text-sm whitespace-pre-wrap">{note.homework_notes}</p>
                                    </div>
                                  )}
                                  {note.private_notes && (
                                    <div>
                                      <Label className="text-xs font-semibold text-muted-foreground">Private Notes</Label>
                                      <p className="text-sm whitespace-pre-wrap">{note.private_notes}</p>
                                    </div>
                                  )}
                                </CardContent>
                              </Card>
                            ))}
                          </div>
                          {totalPages > 1 && (
                            <Pagination>
                              <PaginationContent>
                                <PaginationItem>
                                  <PaginationPrevious 
                                    onClick={(e) => {
                                      e.preventDefault();
                                      setNotesPage(prev => Math.max(1, prev - 1));
                                    }}
                                    className={notesPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                                    href="#"
                                  />
                                </PaginationItem>
                                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                                  <PaginationItem key={page}>
                                    <PaginationLink
                                      onClick={(e) => {
                                        e.preventDefault();
                                        setNotesPage(page);
                                      }}
                                      isActive={notesPage === page}
                                      className="cursor-pointer"
                                      href="#"
                                    >
                                      {page}
                                    </PaginationLink>
                                  </PaginationItem>
                                ))}
                                <PaginationItem>
                                  <PaginationNext 
                                    onClick={(e) => {
                                      e.preventDefault();
                                      setNotesPage(prev => Math.min(totalPages, prev + 1));
                                    }}
                                    className={notesPage === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                                    href="#"
                                  />
                                </PaginationItem>
                              </PaginationContent>
                            </Pagination>
                          )}
                          {totalPages === 1 && (
                            <p className="text-xs text-muted-foreground text-center">Showing all {selectedSession.studentNotes.length} notes</p>
                          )}
                        </>
                      );
                    })()}
                  </CardContent>
                </Card>
              )}

              {/* Assignments Section with Pagination */}
              {loadingAssignments ? (
                <Card>
                  <CardContent className="p-6 text-center">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">Loading assignments...</p>
                  </CardContent>
                </Card>
              ) : sessionAssignments.length > 0 ? (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <BookOpen className="h-5 w-5" />
                      Related Assignments ({sessionAssignments.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {(() => {
                      const totalPages = Math.ceil(sessionAssignments.length / itemsPerPage);
                      const startIndex = (assignmentsPage - 1) * itemsPerPage;
                      const endIndex = startIndex + itemsPerPage;
                      const paginatedAssignments = sessionAssignments.slice(startIndex, endIndex);
                      
                      return (
                        <>
                          <div className="space-y-3 mb-4">
                            {paginatedAssignments.map((assignment) => (
                              <Card key={assignment.id} className="border">
                                <CardContent className="p-4">
                                  <div className="flex items-start justify-between mb-2">
                                    <div>
                                      <h4 className="font-semibold text-sm">{assignment.title}</h4>
                                      {assignment.description && (
                                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                          {assignment.description}
                                        </p>
                                      )}
                                    </div>
                                    <Badge variant="outline">{assignment.status}</Badge>
                                  </div>
                                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                    <span>Due: {new Date(assignment.due_date).toLocaleDateString()}</span>
                                    <span>Points: {assignment.max_points}</span>
                                    <span className="capitalize">{assignment.submission_type}</span>
                                  </div>
                                </CardContent>
                              </Card>
                            ))}
                          </div>
                          {totalPages > 1 && (
                            <Pagination>
                              <PaginationContent>
                                <PaginationItem>
                                  <PaginationPrevious 
                                    onClick={(e) => {
                                      e.preventDefault();
                                      setAssignmentsPage(prev => Math.max(1, prev - 1));
                                    }}
                                    className={assignmentsPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                                    href="#"
                                  />
                                </PaginationItem>
                                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                                  <PaginationItem key={page}>
                                    <PaginationLink
                                      onClick={(e) => {
                                        e.preventDefault();
                                        setAssignmentsPage(page);
                                      }}
                                      isActive={assignmentsPage === page}
                                      className="cursor-pointer"
                                      href="#"
                                    >
                                      {page}
                                    </PaginationLink>
                                  </PaginationItem>
                                ))}
                                <PaginationItem>
                                  <PaginationNext 
                                    onClick={(e) => {
                                      e.preventDefault();
                                      setAssignmentsPage(prev => Math.min(totalPages, prev + 1));
                                    }}
                                    className={assignmentsPage === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                                    href="#"
                                  />
                                </PaginationItem>
                              </PaginationContent>
                            </Pagination>
                          )}
                          {totalPages === 1 && sessionAssignments.length > 0 && (
                            <p className="text-xs text-muted-foreground text-center">Showing all {sessionAssignments.length} assignments</p>
                          )}
                        </>
                      );
                    })()}
                  </CardContent>
                </Card>
              ) : selectedSession.status === 'completed' ? (
                <Card>
                  <CardContent className="p-6 text-center">
                    <BookOpen className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">No related assignments found</p>
                  </CardContent>
                </Card>
              ) : null}

              {/* Lesson Feedback - Only show if completed */}
              {selectedSession.status === 'completed' && (
                <>
                  {selectedSession.lesson_note && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Lesson Notes</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm whitespace-pre-wrap">{selectedSession.lesson_note}</p>
                      </CardContent>
                    </Card>
                  )}
                  
                  {selectedSession.topics_taught && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Topics Taught</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm whitespace-pre-wrap">{selectedSession.topics_taught}</p>
                      </CardContent>
                    </Card>
                  )}
                  
                  {selectedSession.homework_resources && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Homework & Resources</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm whitespace-pre-wrap">{selectedSession.homework_resources}</p>
                      </CardContent>
                    </Card>
                  )}
                </>
              )}
            </div>
          ) : (
            <div className="flex items-center justify-center py-8">
              <p className="text-sm text-muted-foreground">No session data available</p>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsViewSummaryOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Class Students Dialog */}
      <Dialog open={isViewClassStudentsOpen} onOpenChange={setIsViewClassStudentsOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedClass ? `${selectedClass.name} - Enrolled Students` : 'Enrolled Students'}
            </DialogTitle>
            <DialogDescription>
              View all students enrolled in this class
            </DialogDescription>
          </DialogHeader>
          {loadingClassStudents ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin mr-2" />
              <span>Loading students...</span>
            </div>
          ) : selectedClass ? (
            <div className="space-y-4 py-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold">Class Information</p>
                  <p className="text-sm text-muted-foreground">
                    {selectedClass.code} • {selectedClass.level} • {selectedClass.enrolled}/{selectedClass.capacity} students
                  </p>
                </div>
              </div>
              
              <Separator />
              
              {classStudents.length > 0 ? (
                <div className="space-y-2">
                  <Label className="text-sm font-semibold">Students ({classStudents.length})</Label>
                  <div className="border rounded-md divide-y max-h-[400px] overflow-y-auto">
                    {classStudents.map((student) => (
                      <div key={student.id} className="p-4 hover:bg-muted/50 transition-colors">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <Users className="h-4 w-4 text-muted-foreground" />
                              <span className="font-medium">{student.user?.name || `Student ${student.id}`}</span>
                            </div>
                            {student.user?.email && (
                              <p className="text-sm text-muted-foreground ml-6">{student.user.email}</p>
                            )}
                            <div className="mt-2 ml-6 space-y-1">
                              {student.grade && (
                                <p className="text-xs text-muted-foreground">Grade: {student.grade}</p>
                              )}
                              {student.enrollment_id && (
                                <p className="text-xs text-muted-foreground">Enrollment ID: {student.enrollment_id}</p>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <p className="text-sm text-muted-foreground">No students enrolled in this class</p>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-sm text-muted-foreground">No class selected</p>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsViewClassStudentsOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
