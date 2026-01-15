import { useState, useEffect } from 'react';
import { Calendar, Clock, Users, Download, FileText, CheckCircle, UserCheck, Loader2, Eye, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { tutorApi, TutoringSession, TutorClass } from '@/lib/api/tutor';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Pagination, 
  PaginationContent, 
  PaginationItem, 
  PaginationLink, 
  PaginationNext, 
  PaginationPrevious 
} from '@/components/ui/pagination';

interface AttendanceSession extends TutoringSession {
  attendance_summary?: {
    total_students: number;
    present: number;
    absent: number;
    late: number;
    attendance_rate: number;
  };
}

interface StudentAttendance {
  student_id: number;
  student_name: string;
  student_email: string;
  attendance_status: 'present' | 'absent' | 'late' | 'excused';
  notes?: string;
}

interface AttendanceHistoryRecord {
  record_id: number;
  session_id: number;
  date: string;
  start_time: string;
  end_time: string;
  subject: string;
  location: string;
  class_name?: string;
  student_id: number;
  student_name: string;
  student_email: string;
  attendance_status: string;
  notes?: string;
}

interface TimesheetEntry {
  id: number;
  date: string;
  subject: string;
  start_time: string;
  end_time: string;
  location: string;
  hours: number;
  status: string;
  ready_for_invoicing: boolean;
}

export default function TutorAttendance() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [loadingHours, setLoadingHours] = useState(true);
  const [attendanceSessions, setAttendanceSessions] = useState<AttendanceSession[]>([]);
  const [timesheetEntries, setTimesheetEntries] = useState<TimesheetEntry[]>([]);
  const [classes, setClasses] = useState<TutorClass[]>([]);
  const [sessions, setSessions] = useState<TutoringSession[]>([]);
  
  // Stats
  const [stats, setStats] = useState({
    pendingClasses: 0,
    totalHoursThisWeek: 0,
    classesToday: 0,
    attendanceRate: 0,
    totalHours: 0,
  });

  // Dialogs
  const [markAttendanceOpen, setMarkAttendanceOpen] = useState(false);
  const [viewHistoryOpen, setViewHistoryOpen] = useState(false);
  const [addTimesheetOpen, setAddTimesheetOpen] = useState(false);
  
  // Mark attendance state
  const [selectedSessionForAttendance, setSelectedSessionForAttendance] = useState<TutoringSession | null>(null);
  const [studentAttendances, setStudentAttendances] = useState<Record<number, StudentAttendance>>({});
  const [attendanceNotes, setAttendanceNotes] = useState('');
  
  // View history state
  const [selectedStudentId, setSelectedStudentId] = useState<number | null>(null);
  const [attendanceHistory, setAttendanceHistory] = useState<AttendanceHistoryRecord[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  
  // Add timesheet state
  const [newTimesheetEntry, setNewTimesheetEntry] = useState({
    session_id: '',
    date: '',
    start_time: '',
    end_time: '',
    notes: '',
  });
  const [duplicateWarning, setDuplicateWarning] = useState<string | null>(null);
  
  // Filters
  const [selectedClassFilter, setSelectedClassFilter] = useState<string>('all');
  const [attendancePage, setAttendancePage] = useState(1);
  const [attendancePerPage] = useState(10);
  const [totalAttendancePages, setTotalAttendancePages] = useState(1);
  
  // Mark attendance - class selection
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [classSessions, setClassSessions] = useState<TutoringSession[]>([]);
  const [loadingClassSessions, setLoadingClassSessions] = useState(false);

  // Fetch data on mount
  useEffect(() => {
    fetchData();
  }, [selectedClassFilter, attendancePage]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Get current week dates
      const today = new Date();
      const startOfWeek = new Date(today);
      startOfWeek.setDate(today.getDate() - today.getDay());
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);
      
      const dateFrom = startOfWeek.toISOString().split('T')[0];
      const dateTo = endOfWeek.toISOString().split('T')[0];
      const todayStr = today.toISOString().split('T')[0];

      // Fetch all sessions (for attendance table - both marked and unmarked)
      const allSessionsResponse = await tutorApi.getSessions({ 
        per_page: 100,
        date_from: dateFrom,
        date_to: dateTo,
      });
      const allSessions = Array.isArray(allSessionsResponse) 
        ? allSessionsResponse 
        : (allSessionsResponse?.data || []);
      
      // Fetch marked attendance sessions (for stats)
      const attendanceResponse = await tutorApi.getAttendance({ 
        per_page: attendancePerPage,
        page: attendancePage,
        date_from: dateFrom,
        date_to: dateTo,
        class_id: selectedClassFilter !== 'all' ? Number(selectedClassFilter) : undefined,
      });
      
      // Handle paginated or array response
      let attendanceData: any[] = [];
      if (Array.isArray(attendanceResponse)) {
        attendanceData = attendanceResponse;
        setTotalAttendancePages(1);
      } else if (attendanceResponse?.data) {
        // Paginated response
        if (Array.isArray(attendanceResponse.data)) {
          attendanceData = attendanceResponse.data;
          setTotalAttendancePages(attendanceResponse.last_page || 1);
        } else if (attendanceResponse.data?.data) {
          // Nested paginated response
          attendanceData = attendanceResponse.data.data || [];
          setTotalAttendancePages(attendanceResponse.data.last_page || 1);
        }
      }
      
      // Create a map of marked sessions for quick lookup
      const markedSessionsMap = new Map();
      attendanceData.forEach((session: any) => {
        markedSessionsMap.set(session.id, session);
      });
      
      // Combine all sessions with attendance data
      const combinedSessions = allSessions.map((session: TutoringSession) => {
        const markedSession = markedSessionsMap.get(session.id);
        return markedSession || session;
      });
      
      // Fetch hours worked
      const hoursDataResponse = await tutorApi.getHoursWorked({
        date_from: dateFrom,
        date_to: dateTo,
      });
      const hoursData = hoursDataResponse?.summary || hoursDataResponse || {};

      // Fetch completed sessions for timesheet
      const completedSessions = await tutorApi.getSessions({
        status: 'completed',
        per_page: 100,
      });

      // For attendance table, show only marked sessions from attendance API
      setAttendanceSessions(attendanceData.length > 0 ? attendanceData : []);
      setSessions(allSessions);
      
      // Calculate stats
      const pendingSessions = allSessions.filter((s: TutoringSession) => !s.attendance_marked && s.status !== 'completed');
      const todaySessions = allSessions.filter((s: TutoringSession) => {
        const sessionDate = new Date(s.date).toISOString().split('T')[0];
        return sessionDate === todayStr;
      });
      
      // Calculate attendance rate
      let totalAttendanceRate = 0;
      let sessionsWithAttendance = 0;
      attendanceData.forEach((session: any) => {
        if (session.attendance_summary) {
          totalAttendanceRate += session.attendance_summary.attendance_rate || 0;
          sessionsWithAttendance++;
        }
      });
      const avgAttendanceRate = sessionsWithAttendance > 0 
        ? Math.round(totalAttendanceRate / sessionsWithAttendance) 
        : 0;

      // Calculate hours from completed sessions
      const hoursThisWeek = completedSessions
        .filter((s: TutoringSession) => {
          const dateStr = typeof s.date === 'string' 
            ? s.date.split('T')[0] 
            : new Date(s.date).toISOString().split('T')[0];
          const sessionDate = new Date(dateStr);
          return sessionDate >= startOfWeek && sessionDate <= endOfWeek;
        })
        .reduce((total: number, session: TutoringSession) => {
          const dateStr = typeof session.date === 'string' 
            ? session.date.split('T')[0] 
            : new Date(session.date).toISOString().split('T')[0];
          const startTimeStr = session.start_time.length > 5 
            ? session.start_time.slice(0, 5) 
            : session.start_time;
          const endTimeStr = session.end_time.length > 5 
            ? session.end_time.slice(0, 5) 
            : session.end_time;
          
          const start = new Date(`${dateStr}T${startTimeStr}:00`);
          const end = new Date(`${dateStr}T${endTimeStr}:00`);
          const hours = isNaN(start.getTime()) || isNaN(end.getTime()) 
            ? 0 
            : (end.getTime() - start.getTime()) / (1000 * 60 * 60);
          return total + (isNaN(hours) ? 0 : hours);
        }, 0);

      setStats({
        pendingClasses: pendingSessions.length,
        totalHoursThisWeek: Math.round(hoursThisWeek * 10) / 10,
        classesToday: todaySessions.length,
        attendanceRate: avgAttendanceRate,
        totalHours: hoursData?.total_hours || 0,
      });

      // Transform completed sessions for timesheet
      const timesheetData = completedSessions.map((session: TutoringSession) => {
        // Format date properly (handle both string and Date object)
        const dateStr = typeof session.date === 'string' 
          ? session.date.split('T')[0] 
          : new Date(session.date).toISOString().split('T')[0];
        
        // Format time (remove seconds if present)
        const startTimeStr = session.start_time.length > 5 
          ? session.start_time.slice(0, 5) 
          : session.start_time;
        const endTimeStr = session.end_time.length > 5 
          ? session.end_time.slice(0, 5) 
          : session.end_time;
        
        // Calculate hours
        const start = new Date(`${dateStr}T${startTimeStr}:00`);
        const end = new Date(`${dateStr}T${endTimeStr}:00`);
        const hours = isNaN(start.getTime()) || isNaN(end.getTime()) 
          ? 0 
          : (end.getTime() - start.getTime()) / (1000 * 60 * 60);
        
        return {
          id: session.id,
          date: dateStr,
          subject: session.subject,
          start_time: startTimeStr,
          end_time: endTimeStr,
          location: session.location,
          hours: isNaN(hours) ? 0 : Math.round(hours * 10) / 10,
          status: session.ready_for_invoicing ? 'submitted' : 'pending',
          ready_for_invoicing: session.ready_for_invoicing,
        };
      });
      
      setTimesheetEntries(timesheetData);
      
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || 'Failed to load attendance data',
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      setLoadingHours(false);
    }
  };

  // Fetch classes for mark attendance
  useEffect(() => {
    const fetchClasses = async () => {
      try {
        const classesData = await tutorApi.getClasses({ per_page: 100 });
        setClasses(classesData);
      } catch (err) {
        console.error('Failed to load classes:', err);
      }
    };
    fetchClasses();
  }, []);

  const handleMarkAttendanceClick = async (sessionId?: number) => {
    if (sessionId) {
      // Mark attendance for specific session
      const session = sessions.find(s => s.id === sessionId);
      if (session) {
        setSelectedSessionForAttendance(session);
        // Load students for this session
        const fullSession = await tutorApi.getSession(sessionId);
        if (fullSession.students) {
          const initialAttendances: Record<number, StudentAttendance> = {};
          fullSession.students.forEach(student => {
            initialAttendances[student.id] = {
              student_id: student.id,
              student_name: student.user?.name || `Student ${student.id}`,
              student_email: student.user?.email || '',
              attendance_status: 'present',
            };
          });
          setStudentAttendances(initialAttendances);
        }
        setMarkAttendanceOpen(true);
      }
    } else {
      // Open dialog to select session
      setMarkAttendanceOpen(true);
    }
  };

  const handleClassSelectForAttendance = async (classId: string) => {
    if (!classId) {
      setSelectedClassId('');
      setClassSessions([]);
      setSelectedSessionForAttendance(null);
      setStudentAttendances({});
      return;
    }
    
    setSelectedClassId(classId);
    setLoadingClassSessions(true);
    setSelectedSessionForAttendance(null);
    setStudentAttendances({});
    
    try {
      // Get sessions filtered by class_id (backend will filter by students in this class)
      const allSessionsResponse = await tutorApi.getSessions({ 
        per_page: 100,
        class_id: Number(classId) // Pass class_id to filter sessions - backend filters by students in this class
      });
      
      // Handle both array and paginated response
      const allSessions = Array.isArray(allSessionsResponse) 
        ? allSessionsResponse 
        : (allSessionsResponse?.data || []);
      
      // Filter only unmarked sessions (sessions that need attendance)
      const classSessionsList = allSessions.filter((s: TutoringSession) => !s.attendance_marked);
      
      setClassSessions(classSessionsList);
      
      if (classSessionsList.length === 0) {
        toast({
          title: "No Sessions",
          description: "No pending sessions found for this class",
        });
      }
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || 'Failed to load class sessions',
        variant: "destructive",
      });
      setClassSessions([]);
    } finally {
      setLoadingClassSessions(false);
    }
  };

  const handleSessionSelect = async (sessionId: string) => {
    if (!sessionId) return;
    
    try {
      const session = await tutorApi.getSession(Number(sessionId));
      setSelectedSessionForAttendance(session);
      
      if (session.students) {
        const initialAttendances: Record<number, StudentAttendance> = {};
        session.students.forEach(student => {
          initialAttendances[student.id] = {
            student_id: student.id,
            student_name: student.user?.name || `Student ${student.id}`,
            student_email: student.user?.email || '',
            attendance_status: 'present',
          };
        });
        setStudentAttendances(initialAttendances);
      }
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || 'Failed to load session',
        variant: "destructive",
      });
    }
  };

  const handleExportAttendance = async () => {
    try {
      // Fetch all attendance data
      const allAttendance = await tutorApi.getAttendance({ per_page: 1000 });
      const attendanceData = Array.isArray(allAttendance) 
        ? allAttendance 
        : (allAttendance?.data || []);
      
      // Create CSV content
      const headers = ['Date', 'Subject', 'Time', 'Location', 'Present', 'Absent', 'Late', 'Attendance Rate'];
      const rows = attendanceData.map((session: any) => {
        const summary = session.attendance_summary || {};
        return [
          new Date(session.date).toLocaleDateString(),
          session.subject,
          `${session.start_time.slice(0, 5)} - ${session.end_time.slice(0, 5)}`,
          session.location,
          summary.present || 0,
          summary.absent || 0,
          summary.late || 0,
          `${summary.attendance_rate || 0}%`,
        ];
      });
      
      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
      ].join('\n');
      
      // Download CSV
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `attendance_export_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast({
        title: "Export Successful",
        description: "Attendance data has been exported to CSV",
      });
    } catch (err: any) {
      toast({
        title: "Export Failed",
        description: err.message || 'Failed to export attendance data',
        variant: "destructive",
      });
    }
  };

  const handleMarkAttendance = async () => {
    if (!selectedSessionForAttendance) {
      toast({
        title: "Error",
        description: "Please select a session",
        variant: "destructive",
      });
      return;
    }

    const attendanceData = Object.values(studentAttendances).map(att => ({
      student_id: att.student_id,
      status: att.attendance_status,
      notes: att.notes,
    }));

    try {
      await tutorApi.markAttendance(selectedSessionForAttendance.id, {
        attendance: attendanceData,
      });

      toast({
        title: "Success",
        description: "Attendance marked successfully",
      });

      setMarkAttendanceOpen(false);
      setSelectedSessionForAttendance(null);
      setStudentAttendances({});
      setAttendanceNotes('');
      fetchData(); // Refresh data
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || 'Failed to mark attendance',
        variant: "destructive",
      });
    }
  };

  const handleViewHistory = async (session: AttendanceSession) => {
    setViewHistoryOpen(true);
    setLoadingHistory(true);
    
    try {
      const recordsResponse = await tutorApi.getAttendanceRecords({
        date_from: session.date,
        date_to: session.date,
        per_page: 100,
      });
      
      // Handle paginated or array response
      const records = Array.isArray(recordsResponse) 
        ? recordsResponse 
        : (recordsResponse?.data || []);
      
      // Filter by this session, remove duplicates by record_id, and group by student, showing date-wise
      const seenRecordIds = new Set();
      const sessionRecords = records
        .filter((r: any) => {
          // Filter by session and remove duplicates
          if (r.session_id !== session.id) return false;
          if (seenRecordIds.has(r.record_id)) return false;
          seenRecordIds.add(r.record_id);
          return true;
        })
        .sort((a: any, b: any) => {
          // Sort by date, then by student name
          const dateCompare = new Date(a.date).getTime() - new Date(b.date).getTime();
          if (dateCompare !== 0) return dateCompare;
          return a.student_name.localeCompare(b.student_name);
        });
      
      setAttendanceHistory(sessionRecords);
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || 'Failed to load attendance history',
        variant: "destructive",
      });
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleAddTimesheetEntry = async () => {
    if (!newTimesheetEntry.session_id || !newTimesheetEntry.date || !newTimesheetEntry.start_time || !newTimesheetEntry.end_time) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    // Check for duplicate
    const sessionId = Number(newTimesheetEntry.session_id);
    const existingEntry = timesheetEntries.find(
      entry => entry.id === sessionId && entry.date === newTimesheetEntry.date
    );

    if (existingEntry) {
      setDuplicateWarning(`This session (${existingEntry.subject}) on ${existingEntry.date} is already in the timesheet.`);
      return;
    }

    // Check if session exists and is completed
    try {
      const session = await tutorApi.getSession(sessionId);
      
      if (session.status !== 'completed') {
        toast({
          title: "Error",
          description: "Only completed sessions can be added to timesheet",
          variant: "destructive",
        });
        return;
      }

      // Calculate hours
      const startTimeStr = newTimesheetEntry.start_time.length > 5 
        ? newTimesheetEntry.start_time.slice(0, 5) 
        : newTimesheetEntry.start_time;
      const endTimeStr = newTimesheetEntry.end_time.length > 5 
        ? newTimesheetEntry.end_time.slice(0, 5) 
        : newTimesheetEntry.end_time;
      
      const start = new Date(`${newTimesheetEntry.date}T${startTimeStr}:00`);
      const end = new Date(`${newTimesheetEntry.date}T${endTimeStr}:00`);
      const hours = isNaN(start.getTime()) || isNaN(end.getTime()) 
        ? 0 
        : (end.getTime() - start.getTime()) / (1000 * 60 * 60);

      // Add to timesheet (in a real app, this would be saved to backend)
      const newEntry: TimesheetEntry = {
        id: session.id,
        date: newTimesheetEntry.date,
        subject: session.subject,
        start_time: startTimeStr,
        end_time: endTimeStr,
        location: session.location,
        hours: isNaN(hours) ? 0 : Math.round(hours * 10) / 10,
        status: 'pending',
        ready_for_invoicing: false,
      };

      setTimesheetEntries(prev => [...prev, newEntry]);
      
      // Update stats
      setStats(prev => ({
        ...prev,
        totalHoursThisWeek: prev.totalHoursThisWeek + newEntry.hours,
        totalHours: prev.totalHours + newEntry.hours,
      }));

      toast({
        title: "Success",
        description: "Timesheet entry added successfully",
      });

      setAddTimesheetOpen(false);
      setNewTimesheetEntry({
        session_id: '',
        date: '',
        start_time: '',
        end_time: '',
        notes: '',
      });
      setDuplicateWarning(null);
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || 'Failed to add timesheet entry',
        variant: "destructive",
      });
    }
  };

  const updateStudentAttendance = (studentId: number, status: 'present' | 'absent' | 'late' | 'excused') => {
    setStudentAttendances(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        attendance_status: status,
      },
    }));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
      case 'approved':
        return 'bg-green-500/10 text-green-700 dark:text-green-400';
      case 'submitted':
        return 'bg-blue-500/10 text-blue-700 dark:text-blue-400';
      case 'pending':
        return 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-400';
      default:
        return 'bg-gray-500/10 text-gray-700 dark:text-gray-400';
    }
  };

  const getModeColor = (location: string) => {
    return location === 'online'
      ? 'bg-purple-500/10 text-purple-700 dark:text-purple-400'
      : 'bg-orange-500/10 text-orange-700 dark:text-orange-400';
  };

  const getAttendanceStatusColor = (status: string) => {
    switch (status) {
      case 'present':
        return 'text-green-600 dark:text-green-400';
      case 'absent':
        return 'text-red-600 dark:text-red-400';
      case 'late':
        return 'text-orange-600 dark:text-orange-400';
      case 'excused':
        return 'text-blue-600 dark:text-blue-400';
      default:
        return 'text-gray-600 dark:text-gray-400';
    }
  };

  // Get sessions that need attendance (pending)
  const pendingSessions = sessions.filter(s => !s.attendance_marked && s.status !== 'completed');

  if (loading) {
    return (
      <div className="flex items-center justify-center p-6">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Attendance & Timesheet</h1>
        <p className="text-muted-foreground mt-2">
          Mark attendance and track your work hours
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Classes</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingClasses}</div>
            <p className="text-xs text-muted-foreground">Attendance to be marked</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Week</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalHoursThisWeek}h</div>
            <p className="text-xs text-muted-foreground">Total work hours</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Classes Today</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.classesToday}</div>
            <p className="text-xs text-muted-foreground">Scheduled sessions</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Attendance Rate</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.attendanceRate}%</div>
            <p className="text-xs text-muted-foreground">Average across classes</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="attendance" className="space-y-4">
        <TabsList>
          <TabsTrigger value="attendance">Attendance</TabsTrigger>
          <TabsTrigger value="timesheet">Timesheet</TabsTrigger>
        </TabsList>

        <TabsContent value="attendance" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Class Attendance</CardTitle>
                  <CardDescription>Mark and manage student attendance</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Select value={selectedClassFilter} onValueChange={(value) => {
                    setSelectedClassFilter(value);
                    setAttendancePage(1);
                  }}>
                    <SelectTrigger className="w-[200px]">
                      <SelectValue placeholder="Filter by class" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Classes</SelectItem>
                      {classes.map((classItem) => (
                        <SelectItem key={classItem.id} value={classItem.id.toString()}>
                          {classItem.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                <Dialog open={markAttendanceOpen} onOpenChange={setMarkAttendanceOpen}>
                  <DialogTrigger asChild>
                    <Button onClick={() => handleMarkAttendanceClick()}>
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Mark Attendance
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Mark Student Attendance</DialogTitle>
                      <DialogDescription>
                        Mark attendance for each student in your class
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-6">
                      {!selectedSessionForAttendance && (
                        <>
                          <div className="space-y-2">
                            <Label>Select Class</Label>
                            <Select onValueChange={handleClassSelectForAttendance} value={selectedClassId}>
                              <SelectTrigger>
                                <SelectValue placeholder="Choose a class" />
                              </SelectTrigger>
                              <SelectContent>
                                {classes.map((classItem) => (
                                  <SelectItem key={classItem.id} value={classItem.id.toString()}>
                                    {classItem.name} - {classItem.subject}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          
                          {selectedClassId && (
                            <div className="space-y-2">
                              <Label>Select Session</Label>
                              {loadingClassSessions ? (
                                <div className="flex items-center justify-center py-4">
                                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                  <span className="text-sm text-muted-foreground">Loading sessions...</span>
                                </div>
                              ) : (
                                <Select 
                                  onValueChange={handleSessionSelect} 
                                  disabled={classSessions.length === 0}
                                  value={selectedSessionForAttendance?.id?.toString() || ''}
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder={classSessions.length === 0 ? "No pending sessions for this class" : "Choose a session"} />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {classSessions.length > 0 ? (
                                      classSessions.map((session) => (
                                        <SelectItem key={session.id} value={session.id.toString()}>
                                          {session.subject} - {new Date(session.date).toLocaleDateString()} {session.start_time.slice(0, 5)}
                                        </SelectItem>
                                      ))
                                    ) : (
                                      <div className="px-2 py-1.5 text-sm text-muted-foreground">No sessions available</div>
                                    )}
                                  </SelectContent>
                                </Select>
                              )}
                            </div>
                          )}
                        </>
                      )}

                      {selectedSessionForAttendance && (
                        <>
                          <div className="grid gap-4 p-4 border rounded-lg bg-muted/30">
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <Label className="text-xs text-muted-foreground">Subject</Label>
                                <p className="font-medium">{selectedSessionForAttendance.subject}</p>
                              </div>
                              <div>
                                <Label className="text-xs text-muted-foreground">Date</Label>
                                <p className="font-medium">{new Date(selectedSessionForAttendance.date).toLocaleDateString()}</p>
                              </div>
                              <div>
                                <Label className="text-xs text-muted-foreground">Time</Label>
                                <p className="font-medium">{selectedSessionForAttendance.start_time} - {selectedSessionForAttendance.end_time}</p>
                              </div>
                              <div>
                                <Label className="text-xs text-muted-foreground">Location</Label>
                                <p className="font-medium capitalize">{selectedSessionForAttendance.location}</p>
                              </div>
                            </div>
                          </div>

                          {/* Student Attendance List */}
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <Label className="text-base font-semibold">Student Attendance</Label>
                              <div className="flex gap-2 text-xs text-muted-foreground">
                                <span className="flex items-center gap-1">
                                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                                  Present: {Object.values(studentAttendances).filter(s => s.attendance_status === 'present').length}
                                </span>
                                <span className="flex items-center gap-1">
                                  <div className="w-3 h-3 rounded-full bg-red-500"></div>
                                  Absent: {Object.values(studentAttendances).filter(s => s.attendance_status === 'absent').length}
                                </span>
                                <span className="flex items-center gap-1">
                                  <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                                  Late: {Object.values(studentAttendances).filter(s => s.attendance_status === 'late').length}
                                </span>
                              </div>
                            </div>
                            <div className="border rounded-lg divide-y max-h-[300px] overflow-y-auto">
                              {Object.values(studentAttendances).map((student) => (
                                <div key={student.student_id} className="p-3 flex items-center justify-between hover:bg-muted/50 transition-colors">
                                  <div className="flex items-center gap-3">
                                    <UserCheck className="h-4 w-4 text-muted-foreground" />
                                    <div>
                                      <span className="font-medium">{student.student_name}</span>
                                      {student.student_email && (
                                        <p className="text-xs text-muted-foreground">{student.student_email}</p>
                                      )}
                                    </div>
                                  </div>
                                  <div className="flex gap-2">
                                    <Button
                                      size="sm"
                                      variant={student.attendance_status === 'present' ? 'default' : 'outline'}
                                      className={student.attendance_status === 'present' ? 'bg-green-600 hover:bg-green-700' : ''}
                                      onClick={() => updateStudentAttendance(student.student_id, 'present')}
                                    >
                                      Present
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant={student.attendance_status === 'late' ? 'default' : 'outline'}
                                      className={student.attendance_status === 'late' ? 'bg-orange-600 hover:bg-orange-700' : ''}
                                      onClick={() => updateStudentAttendance(student.student_id, 'late')}
                                    >
                                      Late
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant={student.attendance_status === 'absent' ? 'default' : 'outline'}
                                      className={student.attendance_status === 'absent' ? 'bg-red-600 hover:bg-red-700' : ''}
                                      onClick={() => updateStudentAttendance(student.student_id, 'absent')}
                                    >
                                      Absent
                                    </Button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>

                          <div className="space-y-4">
                            <div className="space-y-2">
                              <Label>Notes (Optional)</Label>
                              <Textarea 
                                placeholder="Add any additional notes about the class..." 
                                value={attendanceNotes}
                                onChange={(e) => setAttendanceNotes(e.target.value)}
                              />
                            </div>
                          </div>

                          <div className="flex justify-end gap-2 pt-4 border-t">
                            <Button variant="outline" onClick={() => {
                              setMarkAttendanceOpen(false);
                              setSelectedSessionForAttendance(null);
                              setStudentAttendances({});
                              setSelectedClassId('');
                              setClassSessions([]);
                            }}>
                              Cancel
                            </Button>
                            <Button onClick={handleMarkAttendance}>Save Attendance</Button>
                          </div>
                        </>
                      )}
                    </div>
                  </DialogContent>
                </Dialog>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Class</TableHead>
                    <TableHead>Date & Time</TableHead>
                    <TableHead>Mode</TableHead>
                    <TableHead>Attendance</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {attendanceSessions.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        No attendance records found
                      </TableCell>
                    </TableRow>
                  ) : (
                    attendanceSessions.map((session) => {
                      const summary = session.attendance_summary;
                      const dateStr = new Date(session.date).toLocaleDateString();
                      const timeStr = session.start_time.slice(0, 5);
                      
                      return (
                        <TableRow key={session.id}>
                          <TableCell className="font-medium">{session.subject}</TableCell>
                          <TableCell>
                            <div className="text-sm">
                              <div>{dateStr}</div>
                              <div className="text-muted-foreground">{timeStr}</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className={getModeColor(session.location)}>
                              {session.location}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {summary ? (
                              <div className="text-sm">
                                <div className="text-green-600 dark:text-green-400">
                                  ✓ {summary.present} Present
                                </div>
                                {summary.absent > 0 && (
                                  <div className="text-red-600 dark:text-red-400">
                                    ✗ {summary.absent} Absent
                                  </div>
                                )}
                                {summary.late > 0 && (
                                  <div className="text-orange-600 dark:text-orange-400">
                                    ▲ {summary.late} Late
                                  </div>
                                )}
                              </div>
                            ) : (
                              <span className="text-muted-foreground text-sm">Not marked</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge className={getStatusColor(session.attendance_marked ? 'completed' : 'pending')}>
                              {session.attendance_marked ? 'completed' : 'pending'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {session.attendance_marked ? (
                              <Button size="sm" variant="ghost" onClick={() => handleViewHistory(session)}>
                                <Eye className="mr-2 h-4 w-4" />
                                View
                              </Button>
                            ) : (
                              <Button size="sm" variant="outline" onClick={() => handleMarkAttendanceClick(session.id)}>
                                Mark
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
              {totalAttendancePages > 1 && (
                <div className="flex items-center justify-center space-x-2 py-4">
                  <Pagination>
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious 
                          onClick={() => setAttendancePage(prev => Math.max(1, prev - 1))}
                          className={attendancePage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                        />
                      </PaginationItem>
                      {Array.from({ length: Math.min(totalAttendancePages, 5) }, (_, i) => {
                        let page;
                        if (totalAttendancePages <= 5) {
                          page = i + 1;
                        } else if (attendancePage <= 3) {
                          page = i + 1;
                        } else if (attendancePage >= totalAttendancePages - 2) {
                          page = totalAttendancePages - 4 + i;
                        } else {
                          page = attendancePage - 2 + i;
                        }
                        return (
                          <PaginationItem key={page}>
                            <PaginationLink
                              onClick={() => setAttendancePage(page)}
                              isActive={attendancePage === page}
                              className="cursor-pointer"
                            >
                              {page}
                            </PaginationLink>
                          </PaginationItem>
                        );
                      })}
                      <PaginationItem>
                        <PaginationNext 
                          onClick={() => setAttendancePage(prev => Math.min(totalAttendancePages, prev + 1))}
                          className={attendancePage === totalAttendancePages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="timesheet" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Work Hours & Timesheet</CardTitle>
                  <CardDescription>Track your teaching hours for billing</CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={handleExportAttendance}>
                    <Download className="mr-2 h-4 w-4" />
                    Export
                  </Button>
                  <Dialog open={addTimesheetOpen} onOpenChange={(open) => {
                    setAddTimesheetOpen(open);
                    if (!open) {
                      setNewTimesheetEntry({
                        session_id: '',
                        date: '',
                        start_time: '',
                        end_time: '',
                        notes: '',
                      });
                      setDuplicateWarning(null);
                    }
                  }}>
                    <DialogTrigger asChild>
                      <Button>
                        <FileText className="mr-2 h-4 w-4" />
                        Add Entry
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Add Timesheet Entry</DialogTitle>
                        <DialogDescription>
                          Log your work hours for a class session
                        </DialogDescription>
                      </DialogHeader>
                      {duplicateWarning && (
                        <Alert variant="destructive">
                          <AlertCircle className="h-4 w-4" />
                          <AlertDescription>{duplicateWarning}</AlertDescription>
                        </Alert>
                      )}
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label>Select Session *</Label>
                          <Select 
                            value={newTimesheetEntry.session_id} 
                            onValueChange={(value) => {
                              setNewTimesheetEntry(prev => ({ ...prev, session_id: value }));
                              setDuplicateWarning(null);
                              
                              // Auto-fill date and time from session
                              const session = sessions.find(s => s.id === Number(value));
                              if (session) {
                                setNewTimesheetEntry(prev => ({
                                  ...prev,
                                  date: session.date,
                                  start_time: session.start_time.slice(0, 5),
                                  end_time: session.end_time.slice(0, 5),
                                }));
                                
                                // Check for duplicate
                                const existing = timesheetEntries.find(
                                  e => e.id === session.id && e.date === session.date
                                );
                                if (existing) {
                                  setDuplicateWarning(`This session is already in the timesheet.`);
                                }
                              }
                            }}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Choose a session" />
                            </SelectTrigger>
                            <SelectContent>
                              {sessions
                                .filter(s => s.status === 'completed')
                                .map((session) => (
                                  <SelectItem key={session.id} value={session.id.toString()}>
                                    {session.subject} - {new Date(session.date).toLocaleDateString()}
                                  </SelectItem>
                                ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Date *</Label>
                          <Input 
                            type="date" 
                            value={newTimesheetEntry.date}
                            onChange={(e) => {
                              setNewTimesheetEntry(prev => ({ ...prev, date: e.target.value }));
                              setDuplicateWarning(null);
                            }}
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Start Time *</Label>
                            <Input 
                              type="time" 
                              value={newTimesheetEntry.start_time}
                              onChange={(e) => setNewTimesheetEntry(prev => ({ ...prev, start_time: e.target.value }))}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>End Time *</Label>
                            <Input 
                              type="time" 
                              value={newTimesheetEntry.end_time}
                              onChange={(e) => setNewTimesheetEntry(prev => ({ ...prev, end_time: e.target.value }))}
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label>Notes (Optional)</Label>
                          <Textarea 
                            placeholder="Describe the work done..." 
                            value={newTimesheetEntry.notes}
                            onChange={(e) => setNewTimesheetEntry(prev => ({ ...prev, notes: e.target.value }))}
                          />
                        </div>
                        <div className="flex justify-end gap-2">
                          <Button variant="outline" onClick={() => {
                            setAddTimesheetOpen(false);
                            setNewTimesheetEntry({
                              session_id: '',
                              date: '',
                              start_time: '',
                              end_time: '',
                              notes: '',
                            });
                            setDuplicateWarning(null);
                          }}>
                            Cancel
                          </Button>
                          <Button 
                            onClick={handleAddTimesheetEntry}
                            disabled={!!duplicateWarning}
                          >
                            Add Entry
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Class</TableHead>
                    <TableHead>Time</TableHead>
                    <TableHead>Mode</TableHead>
                    <TableHead>Hours</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Notes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {timesheetEntries.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                        No timesheet entries found
                      </TableCell>
                    </TableRow>
                  ) : (
                    timesheetEntries.map((entry) => (
                      <TableRow key={entry.id}>
                        <TableCell>{new Date(entry.date).toLocaleDateString()}</TableCell>
                        <TableCell className="font-medium">{entry.subject}</TableCell>
                        <TableCell className="text-sm">
                          {entry.start_time.slice(0, 5)} - {entry.end_time.slice(0, 5)}
                        </TableCell>
                        <TableCell>
                          <Badge className={getModeColor(entry.location)}>
                            {entry.location}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-semibold">{entry.hours}h</TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(entry.status)}>
                            {entry.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="max-w-xs truncate text-sm text-muted-foreground">
                          {entry.notes || '-'}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* View Attendance History Dialog */}
      <Dialog open={viewHistoryOpen} onOpenChange={setViewHistoryOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Attendance History</DialogTitle>
            <DialogDescription>
              View detailed attendance records for this session
            </DialogDescription>
          </DialogHeader>
          {loadingHistory ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin mr-2" />
              <span>Loading attendance history...</span>
            </div>
          ) : (
            <div className="space-y-4">
              {attendanceHistory.length === 0 ? (
                <p className="text-center py-8 text-muted-foreground">No attendance records found</p>
              ) : (
                <div className="space-y-4">
                  {/* Group by date */}
                  {(() => {
                    const groupedByDate: Record<string, AttendanceHistoryRecord[]> = {};
                    attendanceHistory.forEach(record => {
                      const dateKey = record.date;
                      if (!groupedByDate[dateKey]) {
                        groupedByDate[dateKey] = [];
                      }
                      groupedByDate[dateKey].push(record);
                    });

                    return Object.entries(groupedByDate)
                      .sort(([dateA], [dateB]) => new Date(dateB).getTime() - new Date(dateA).getTime())
                      .map(([date, records]) => (
                        <div key={date} className="space-y-2">
                          <h4 className="font-semibold text-sm text-muted-foreground">
                            {new Date(date).toLocaleDateString('en-US', { 
                              weekday: 'long', 
                              year: 'numeric', 
                              month: 'long', 
                              day: 'numeric' 
                            })}
                          </h4>
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Student</TableHead>
                                <TableHead>Email</TableHead>
                                <TableHead>Time</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Notes</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {records.map((record, index) => (
                                <TableRow key={`${record.record_id}-${record.student_id}-${index}`}>
                                  <TableCell className="font-medium">{record.student_name}</TableCell>
                                  <TableCell>{record.student_email}</TableCell>
                                  <TableCell>{record.start_time.slice(0, 5)} - {record.end_time.slice(0, 5)}</TableCell>
                                  <TableCell>
                                    <Badge className={getStatusColor(record.attendance_status)}>
                                      {record.attendance_status}
                                    </Badge>
                                  </TableCell>
                                  <TableCell className="max-w-xs truncate text-sm text-muted-foreground">
                                    {record.notes || '-'}
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      ));
                  })()}
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewHistoryOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
