import { useState, useEffect, useMemo } from 'react';
import { Calendar, Users, TrendingUp, Download, Filter, Loader2, Search } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { adminApi, apiClient } from '@/lib/api';

interface AttendanceRecord {
  id: number;
  date: string;
  start_time: string;
  end_time: string;
  subject?: string;
  location?: string;
  status: string;
  attendance_marked: boolean;
  teacher?: {
    id: number;
    user?: {
      id: number;
      name: string;
      email: string;
    };
  };
  classModel?: {
    id: number;
    name: string;
    code: string;
  };
  attendance_stats?: {
    total_students: number;
  present: number;
  absent: number;
  late: number;
    attendance_rate: number;
  };
}

interface StudentAttendanceRecord {
  id: number;
  student_id: number;
  student_name: string;
  student_email?: string;
  attendance_status: 'present' | 'absent' | 'late';
  session_id: number;
  session_date: string;
  session_time: string;
  class_name?: string;
  tutor_name?: string;
  mode?: string;
}

interface TimesheetRecord {
  tutor_id: number;
  tutor_name: string;
  week_ending: string;
  total_hours: number;
  online_hours: number;
  offline_hours: number;
  amount: number;
  status: 'pending' | 'approved' | 'paid';
}

export default function AdminAttendance() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [attendanceLoading, setAttendanceLoading] = useState(false);
  const [studentAttendanceLoading, setStudentAttendanceLoading] = useState(false);
  const [timesheetLoading, setTimesheetLoading] = useState(false);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [studentAttendanceRecords, setStudentAttendanceRecords] = useState<StudentAttendanceRecord[]>([]);
  const [timesheetRecords, setTimesheetRecords] = useState<TimesheetRecord[]>([]);
  
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage] = useState(15);
  const [totalRecords, setTotalRecords] = useState(0);
  const [lastPage, setLastPage] = useState(1);
  
  // View Details Dialog
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [selectedAttendance, setSelectedAttendance] = useState<AttendanceRecord | null>(null);
  const [attendanceDetails, setAttendanceDetails] = useState<any>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  // Fetch attendance records
  const fetchAttendanceRecords = async () => {
    try {
      setAttendanceLoading(true);
      const params: any = {
        page: currentPage,
        per_page: perPage,
      };

      if (statusFilter !== 'all') {
        params.status = statusFilter;
      }

      // Use apiClient for proper error handling
      const response = await apiClient.get<any>('/admin/attendance', params);
      
      if (response.success && response.data) {
        // Handle paginated response
        if (response.data.data && Array.isArray(response.data.data)) {
          setAttendanceRecords(response.data.data);
          setTotalRecords(response.data.total || 0);
          setLastPage(response.data.last_page || 1);
        } else if (Array.isArray(response.data)) {
          setAttendanceRecords(response.data);
          setTotalRecords(response.data.length);
          setLastPage(1);
        } else {
          setAttendanceRecords([]);
        }
      } else {
        setAttendanceRecords([]);
      }
    } catch (error: any) {
      console.error('Error fetching attendance records:', error);
      toast({
        title: "Error",
        description: error.message || 'Failed to fetch attendance records',
        variant: "destructive",
      });
      setAttendanceRecords([]);
    } finally {
      setAttendanceLoading(false);
      setLoading(false);
    }
  };

  // Fetch student attendance records - optimized single API call
  const fetchStudentAttendance = async () => {
    try {
      setStudentAttendanceLoading(true);
      const params: any = {
        per_page: 50,
        page: 1,
      };

      if (searchTerm) {
        params.search = searchTerm;
      }

      const result = await adminApi.getStudentAttendance(params);
      // Map the API response to our interface
      const mappedRecords: StudentAttendanceRecord[] = result.records.map((record: any) => ({
        id: record.id,
        student_id: record.student_id,
        student_name: record.student_name || 'Unknown',
        student_email: record.student_email,
        attendance_status: record.attendance_status || 'absent',
        session_id: record.session_id,
        session_date: record.session_date,
        session_time: record.session_time || '',
        class_name: record.class_name || 'N/A',
        tutor_name: record.tutor_name || 'N/A',
        mode: record.location ? 'offline' : 'online',
      }));
      setStudentAttendanceRecords(mappedRecords);
    } catch (error: any) {
      console.error('Error fetching student attendance:', error);
      toast({
        title: "Error",
        description: error.message || 'Failed to fetch student attendance',
        variant: "destructive",
      });
      setStudentAttendanceRecords([]);
    } finally {
      setStudentAttendanceLoading(false);
    }
  };

  // Fetch timesheet records (calculate from sessions)
  const fetchTimesheets = async () => {
    try {
      setTimesheetLoading(true);
      // Get all sessions that have attendance marked (only these should be in timesheets)
      const sessions = await adminApi.getSessions({ 
        per_page: 200,
        // Only get sessions with attendance marked
      });
      
      // Filter to only sessions with attendance_marked = true
      const sessionsWithAttendance = sessions.filter((session: any) => session.attendance_marked === true);
      
      // Group by tutor and week
      const timesheetMap = new Map<string, TimesheetRecord>();
      
      sessionsWithAttendance.forEach((session: any) => {
        if (!session.teacher?.id || !session.date) return;
        
        const tutorId = session.teacher.id;
        const tutorName = session.teacher.user?.name || 'Unknown';
        const sessionDate = new Date(session.date);
        const weekEnding = getWeekEnding(sessionDate);
        const key = `${tutorId}-${weekEnding}`;
        
        // Skip if already invoiced
        if (session.ready_for_invoicing) {
          // Check if timesheet already exists and mark as approved
          if (!timesheetMap.has(key)) {
            timesheetMap.set(key, {
              tutor_id: tutorId,
              tutor_name: tutorName,
              week_ending: weekEnding,
              total_hours: 0,
              online_hours: 0,
              offline_hours: 0,
              amount: 0,
              status: 'approved' as const,
            });
          }
          return; // Don't add hours to already invoiced sessions
        }
        
        // Calculate hours
        const hours = calculateHours(session.start_time, session.end_time);
        const isOnline = !session.location || session.location.toLowerCase().includes('online');
        
        if (!timesheetMap.has(key)) {
          timesheetMap.set(key, {
            tutor_id: tutorId,
            tutor_name: tutorName,
            week_ending: weekEnding,
            total_hours: 0,
            online_hours: 0,
            offline_hours: 0,
            amount: 0,
            status: 'pending' as const,
          });
        }
        
        const timesheet = timesheetMap.get(key)!;
        timesheet.total_hours += hours;
        if (isOnline) {
          timesheet.online_hours += hours;
        } else {
          timesheet.offline_hours += hours;
        }
        
        // Calculate amount (assuming $100/hour for now)
        const hourlyRate = 100;
        timesheet.amount = timesheet.total_hours * hourlyRate;
      });
      
      setTimesheetRecords(Array.from(timesheetMap.values()));
    } catch (error: any) {
      console.error('Error fetching timesheets:', error);
      toast({
        title: "Error",
        description: error.message || 'Failed to fetch timesheets',
        variant: "destructive",
      });
      setTimesheetRecords([]);
    } finally {
      setTimesheetLoading(false);
    }
  };

  const getWeekEnding = (date: Date): string => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 0); // Monday
    const monday = new Date(d.setDate(diff));
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    return sunday.toISOString().split('T')[0];
  };

  const calculateHours = (start: string, end: string): number => {
    if (!start || !end) return 0;
    const startTime = new Date(`2000-01-01 ${start}`);
    const endTime = new Date(`2000-01-01 ${end}`);
    const diff = (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60);
    return Math.max(0, diff);
  };

  useEffect(() => {
    fetchAttendanceRecords();
  }, [currentPage, statusFilter]);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (currentPage === 1) {
        fetchAttendanceRecords();
      } else {
        setCurrentPage(1);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Fetch student attendance when tab is active
  const [activeTab, setActiveTab] = useState('attendance');
  useEffect(() => {
    if (activeTab === 'students') {
      fetchStudentAttendance();
    }
    if (activeTab === 'timesheets' && timesheetRecords.length === 0) {
      fetchTimesheets();
    }
  }, [activeTab]);

  // Debounce search for student attendance
  useEffect(() => {
    if (activeTab === 'students') {
      const timer = setTimeout(() => {
        fetchStudentAttendance();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [searchTerm, activeTab]);

  const filteredAttendance = useMemo(() => {
    return attendanceRecords.filter(record => {
      const className = ((record as any).class_name || record.classModel?.name || '').toLowerCase();
      const tutorName = ((record as any).tutor_name || record.teacher?.user?.name || '').toLowerCase();
      const matchesSearch = 
        className.includes(searchTerm.toLowerCase()) ||
        tutorName.includes(searchTerm.toLowerCase());
      return matchesSearch;
    });
  }, [attendanceRecords, searchTerm]);

  const filteredStudentAttendance = useMemo(() => {
    return studentAttendanceRecords.filter(record => {
      const matchesSearch = 
        record.student_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (record.class_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (record.tutor_name || '').toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });
  }, [studentAttendanceRecords, searchTerm]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
      case 'approved':
      case 'paid':
        return 'bg-green-500/10 text-green-700 dark:text-green-400';
      case 'pending':
        return 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-400';
      default:
        return 'bg-gray-500/10 text-gray-700 dark:text-gray-400';
    }
  };

  const getModeColor = (mode: string | undefined) => {
    return mode === 'online' || !mode
      ? 'bg-purple-500/10 text-purple-700 dark:text-purple-400'
      : 'bg-blue-500/10 text-blue-700 dark:text-blue-400';
  };

  const handleExportAttendance = () => {
    toast({
      title: "Export Started",
      description: "Attendance data is being prepared for download.",
    });
  };

  const handleApproveTimesheet = async (timesheet: TimesheetRecord) => {
    try {
      setTimesheetLoading(true);
      
      // Ensure week_ending is in YYYY-MM-DD format
      const weekEndingDate = new Date(timesheet.week_ending);
      const weekEndingFormatted = weekEndingDate.toISOString().split('T')[0];
      
      console.log('Approving timesheet:', {
        tutor_id: timesheet.tutor_id,
        week_ending: weekEndingFormatted,
        original_week_ending: timesheet.week_ending,
      });
      
      const result = await adminApi.approveTimesheet(timesheet.tutor_id, weekEndingFormatted);
      
      console.log('Timesheet approval result:', result);
      
      if (!result || !result.invoice_number) {
        throw new Error('Invalid response from server');
      }
      
      // Update the timesheet status in the local state
      setTimesheetRecords(prev => 
        prev.map(ts => 
          ts.tutor_id === timesheet.tutor_id && ts.week_ending === timesheet.week_ending
            ? { ...ts, status: 'approved' as const }
            : ts
        )
      );

      toast({
        title: "Timesheet Approved",
        description: `Invoice ${result.invoice_number} has been generated for ${result.total_hours}h ($${result.amount.toFixed(2)}).`,
      });
      
      // Refresh timesheets to get updated data
      await fetchTimesheets();
    } catch (error: any) {
      console.error('Error approving timesheet:', error);
      const errorMessage = error.message || 'Failed to approve timesheet';
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setTimesheetLoading(false);
    }
  };

  const handleMarkPaid = (timesheet: TimesheetRecord) => {
    toast({
      title: "Marked as Paid",
      description: "The timesheet has been marked as paid.",
    });
  };

  const handleViewDetails = async (record: AttendanceRecord) => {
    setSelectedAttendance(record);
    setDetailsDialogOpen(true);
    setLoadingDetails(true);
    setAttendanceDetails(null); // Clear previous data
    
    try {
      console.log('Fetching attendance details for session ID:', record.id);
      const details = await adminApi.getAttendanceDetails(record.id);
      console.log('Raw attendance details response:', details);
      
      // Normalize the response - handle both snake_case and camelCase
      if (details) {
        // Handle class_model -> classModel
        if (!details.classModel && (details as any).class_model) {
          (details as any).classModel = (details as any).class_model;
        }
        
        // Ensure attendance_records is an array
        if (!details.attendance_records && (details as any).attendance_records) {
          details.attendance_records = (details as any).attendance_records;
        }
        
        console.log('Normalized attendance details:', details);
        setAttendanceDetails(details);
      } else {
        console.warn('No details returned from API');
        setAttendanceDetails(null);
      }
    } catch (error: any) {
      console.error('Error fetching attendance details:', error);
      toast({
        title: "Error",
        description: error.message || 'Failed to fetch attendance details',
        variant: "destructive",
      });
      setAttendanceDetails(null);
    } finally {
      setLoadingDetails(false);
    }
  };

  // Calculate stats
  const stats = useMemo(() => {
    const totalClasses = attendanceRecords.length;
    const completedClasses = attendanceRecords.filter(r => r.status === 'completed' || r.attendance_marked).length;
    const avgAttendanceRate = attendanceRecords.length > 0
      ? Math.round(
          attendanceRecords.reduce((sum, r) => sum + (r.attendance_stats?.attendance_rate || 0), 0) / attendanceRecords.length
        )
      : 0;
    const totalTutorHours = timesheetRecords.reduce((sum, t) => sum + t.total_hours, 0);
    const pendingTimesheets = timesheetRecords.filter(t => t.status === 'pending').length;

    return {
      totalClasses,
      completedClasses,
      avgAttendanceRate,
      totalTutorHours,
      pendingTimesheets,
    };
  }, [attendanceRecords, timesheetRecords]);

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Attendance & Timesheet Management</h1>
        <p className="text-muted-foreground mt-2">
          Monitor attendance records and manage tutor timesheets
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Classes</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalClasses}</div>
            <p className="text-xs text-muted-foreground">{stats.completedClasses} completed</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Attendance</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.avgAttendanceRate}%</div>
            <p className="text-xs text-muted-foreground">Across all classes</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tutor Hours</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalTutorHours}h</div>
            <p className="text-xs text-muted-foreground">This week</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Filter className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingTimesheets}</div>
            <p className="text-xs text-muted-foreground">Timesheets to review</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="attendance" className="space-y-4" onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="attendance">Attendance Records</TabsTrigger>
          <TabsTrigger value="students">Student Attendance</TabsTrigger>
          <TabsTrigger value="timesheets">Tutor Timesheets</TabsTrigger>
        </TabsList>

        <TabsContent value="attendance" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Attendance Overview</CardTitle>
                  <CardDescription>View and manage all class attendance records</CardDescription>
                </div>
                <Button onClick={handleExportAttendance}>
                  <Download className="mr-2 h-4 w-4" />
                  Export
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-4">
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by class or tutor..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {attendanceLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Class</TableHead>
                    <TableHead>Tutor</TableHead>
                    <TableHead>Date & Time</TableHead>
                    <TableHead>Mode</TableHead>
                    <TableHead>Attendance</TableHead>
                    <TableHead>Rate</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                    {filteredAttendance.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                          No attendance records found
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredAttendance.map((record) => {
                        const stats = record.attendance_stats;
                        const isCompleted = record.attendance_marked;
                        return (
                    <TableRow key={record.id}>
                            <TableCell className="font-medium">
                              {(record as any).class_name || record.classModel?.name || 'N/A'}
                            </TableCell>
                            <TableCell>{(record as any).tutor_name || record.teacher?.user?.name || 'N/A'}</TableCell>
                      <TableCell>
                        <div className="text-sm">
                                <div>{new Date(record.date).toLocaleDateString()}</div>
                                <div className="text-muted-foreground">
                                  {record.start_time} - {record.end_time}
                                </div>
                        </div>
                      </TableCell>
                      <TableCell>
                              <Badge className={getModeColor(record.location ? 'offline' : 'online')}>
                                {record.location ? 'offline' : 'online'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                              {isCompleted && stats ? (
                          <div className="text-sm">
                            <div className="text-green-600 dark:text-green-400">
                                    ✓ {stats.present} Present
                            </div>
                            <div className="text-red-600 dark:text-red-400">
                                    ✗ {stats.absent} Absent
                            </div>
                                  {stats.late > 0 && (
                              <div className="text-orange-600 dark:text-orange-400">
                                      ⚠ {stats.late} Late
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-sm">Not marked</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="font-semibold">
                                {isCompleted && stats ? `${stats.attendance_rate}%` : '-'}
                        </div>
                      </TableCell>
                      <TableCell>
                              <Badge className={getStatusColor(isCompleted ? 'completed' : 'pending')}>
                                {isCompleted ? 'completed' : 'pending'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                              <Button 
                                size="sm" 
                                variant="ghost"
                                onClick={() => handleViewDetails(record)}
                              >
                          View Details
                        </Button>
                      </TableCell>
                    </TableRow>
                        );
                      })
                    )}
                </TableBody>
              </Table>
              )}

              {/* Pagination */}
              {!attendanceLoading && lastPage > 1 && (
                <div className="flex items-center justify-between">
                  <div className="text-sm text-muted-foreground">
                    Showing {((currentPage - 1) * perPage) + 1} to {Math.min(currentPage * perPage, totalRecords)} of {totalRecords} records
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(p => Math.min(lastPage, p + 1))}
                      disabled={currentPage === lastPage}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="students" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Student Attendance Records</CardTitle>
                  <CardDescription>View individual student attendance marked by tutors</CardDescription>
                </div>
                <Button onClick={handleExportAttendance}>
                  <Download className="mr-2 h-4 w-4" />
                  Export
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-4">
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by student, class, or tutor..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                />
                </div>
              </div>

              {studentAttendanceLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student Name</TableHead>
                    <TableHead>Class</TableHead>
                    <TableHead>Tutor</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Time</TableHead>
                    <TableHead>Mode</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                    {filteredStudentAttendance.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                          No student attendance records found
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredStudentAttendance.map((record) => (
                        <TableRow key={`${record.session_id}-${record.student_id}`}>
                          <TableCell className="font-medium">{record.student_name}</TableCell>
                          <TableCell>{record.class_name || 'N/A'}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                            {record.tutor_name || 'N/A'}
                      </TableCell>
                          <TableCell>{new Date(record.session_date).toLocaleDateString()}</TableCell>
                          <TableCell>{record.session_time}</TableCell>
                      <TableCell>
                        <Badge variant={record.mode === 'online' ? 'default' : 'secondary'}>
                              {record.mode || 'online'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          className={
                                record.attendance_status === 'present'
                              ? 'bg-green-500/10 text-green-700 dark:text-green-400'
                                  : record.attendance_status === 'late'
                              ? 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-400'
                              : 'bg-red-500/10 text-red-700 dark:text-red-400'
                          }
                        >
                              {record.attendance_status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                      ))
                    )}
                </TableBody>
              </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="timesheets" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Tutor Timesheets</CardTitle>
                  <CardDescription>Review and approve tutor work hours for billing</CardDescription>
                </div>
                <Button onClick={handleExportAttendance}>
                  <Download className="mr-2 h-4 w-4" />
                  Export
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {timesheetLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tutor Name</TableHead>
                    <TableHead>Week Ending</TableHead>
                    <TableHead>Total Hours</TableHead>
                    <TableHead>Online</TableHead>
                    <TableHead>Offline</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                    {timesheetRecords.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                          No timesheet records found
                        </TableCell>
                      </TableRow>
                    ) : (
                      timesheetRecords.map((timesheet, idx) => (
                        <TableRow key={`${timesheet.tutor_id}-${timesheet.week_ending}-${idx}`}>
                          <TableCell className="font-medium">{timesheet.tutor_name}</TableCell>
                          <TableCell>{new Date(timesheet.week_ending).toLocaleDateString()}</TableCell>
                          <TableCell className="font-semibold">{timesheet.total_hours}h</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                            {timesheet.online_hours}h
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                            {timesheet.offline_hours}h
                      </TableCell>
                      <TableCell className="font-semibold">
                        ${timesheet.amount.toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(timesheet.status)}>
                          {timesheet.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {timesheet.status === 'pending' && (
                          <Button
                            size="sm"
                                onClick={() => handleApproveTimesheet(timesheet)}
                          >
                            Approve
                          </Button>
                        )}
                        {timesheet.status === 'approved' && (
                              <Button size="sm" variant="outline" onClick={() => handleMarkPaid(timesheet)}>
                            Mark Paid
                          </Button>
                        )}
                        {timesheet.status === 'paid' && (
                          <Button size="sm" variant="ghost">
                            View Receipt
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                      ))
                    )}
                </TableBody>
              </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* View Details Dialog */}
      <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Attendance Details</DialogTitle>
            <DialogDescription>
              Detailed attendance information for this session
            </DialogDescription>
          </DialogHeader>
          
          {loadingDetails ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : attendanceDetails ? (
            <div className="space-y-6 mt-4">
              {/* Session Info */}
              <div className="space-y-4">
                <h3 className="font-semibold text-lg">Session Information</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Class:</span>
                    <p className="font-medium">
                      {(attendanceDetails as any).class_name || 
                       (attendanceDetails as any).class_model?.name || 
                       attendanceDetails.classModel?.name || 
                       (selectedAttendance as any)?.class_name ||
                       selectedAttendance?.classModel?.name || 
                       'N/A'}
                    </p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Tutor:</span>
                    <p className="font-medium">
                      {(attendanceDetails as any).tutor_name || attendanceDetails.teacher?.user?.name || selectedAttendance?.teacher?.user?.name || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Date:</span>
                    <p className="font-medium">
                      {new Date(attendanceDetails.date || selectedAttendance?.date || '').toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Time:</span>
                    <p className="font-medium">
                      {attendanceDetails.start_time || selectedAttendance?.start_time} - {attendanceDetails.end_time || selectedAttendance?.end_time}
                    </p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Mode:</span>
                    <p className="font-medium">
                      {attendanceDetails.location ? 'Offline' : 'Online'}
                    </p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Subject:</span>
                    <p className="font-medium">
                      {attendanceDetails.subject || 'N/A'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Attendance Records */}
              {(() => {
                const records = attendanceDetails.attendance_records;
                const hasRecords = records && Array.isArray(records) && records.length > 0;
                
                if (!hasRecords) {
                  // Try to get students from the session if attendance_records is not available
                  const students = attendanceDetails.students;
                  if (students && Array.isArray(students) && students.length > 0) {
                    return (
                      <div className="space-y-4">
                        <h3 className="font-semibold text-lg">Students in Session</h3>
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Student Name</TableHead>
                              <TableHead>Email</TableHead>
                              <TableHead>Status</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {students.map((student: any) => (
                              <TableRow key={student.id || student.user_id}>
                                <TableCell className="font-medium">
                                  {student.user?.name || 'Unknown'}
                                </TableCell>
                                <TableCell className="text-sm text-muted-foreground">
                                  {student.user?.email || 'N/A'}
                                </TableCell>
                                <TableCell>
                                  <Badge variant="outline">Enrolled</Badge>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    );
                  }
                  return null;
                }
                
                return (
                  <div className="space-y-4">
                    <h3 className="font-semibold text-lg">Student Attendance</h3>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Student Name</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {records.map((record: any) => (
                          <TableRow key={record.student_id || record.id}>
                            <TableCell className="font-medium">
                              {record.student_name || 'Unknown'}
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {record.student_email || 'N/A'}
                            </TableCell>
                            <TableCell>
                              <Badge 
                                className={
                                  record.attendance_status === 'present'
                                    ? 'bg-green-500/10 text-green-700 dark:text-green-400'
                                    : record.attendance_status === 'late'
                                    ? 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-400'
                                    : 'bg-red-500/10 text-red-700 dark:text-red-400'
                                }
                              >
                                {record.attendance_status}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                );
              })()}

              {/* Summary Stats */}
              {selectedAttendance?.attendance_stats && (
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg">Summary</h3>
                  <div className="grid grid-cols-4 gap-4">
                    <div className="text-center p-4 bg-muted rounded-lg">
                      <p className="text-2xl font-bold">{selectedAttendance.attendance_stats.total_students}</p>
                      <p className="text-xs text-muted-foreground">Total Students</p>
                    </div>
                    <div className="text-center p-4 bg-green-50 dark:bg-green-950 rounded-lg">
                      <p className="text-2xl font-bold text-green-700 dark:text-green-400">
                        {selectedAttendance.attendance_stats.present}
                      </p>
                      <p className="text-xs text-muted-foreground">Present</p>
                    </div>
                    <div className="text-center p-4 bg-red-50 dark:bg-red-950 rounded-lg">
                      <p className="text-2xl font-bold text-red-700 dark:text-red-400">
                        {selectedAttendance.attendance_stats.absent}
                      </p>
                      <p className="text-xs text-muted-foreground">Absent</p>
                    </div>
                    <div className="text-center p-4 bg-yellow-50 dark:bg-yellow-950 rounded-lg">
                      <p className="text-2xl font-bold text-yellow-700 dark:text-yellow-400">
                        {selectedAttendance.attendance_stats.late}
                      </p>
                      <p className="text-xs text-muted-foreground">Late</p>
                    </div>
                  </div>
                  <div className="text-center p-4 bg-primary/10 rounded-lg">
                    <p className="text-3xl font-bold text-primary">
                      {selectedAttendance.attendance_stats.attendance_rate}%
                    </p>
                    <p className="text-sm text-muted-foreground">Attendance Rate</p>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <p>No details available</p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
