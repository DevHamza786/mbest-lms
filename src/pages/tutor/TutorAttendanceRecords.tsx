import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CheckCircle2, XCircle, Clock, Search, Download, CalendarIcon, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { tutorApi, TutorClass } from '@/lib/api';

interface AttendanceRecord {
  id: string;
  date: string;
  className: string;
  studentName: string;
  status: 'present' | 'absent' | 'late';
  time: string;
  notes?: string;
}

export default function TutorAttendanceRecords() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterClass, setFilterClass] = useState<string>('all');
  const [filterStudent, setFilterStudent] = useState<string>('all');
  const [dateRange, setDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({
    from: undefined,
    to: undefined,
  });
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [classes, setClasses] = useState<TutorClass[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [allRecords, setAllRecords] = useState<AttendanceRecord[]>([]); // Store all records for stats

  // Load attendance records, classes, and students on mount
  useEffect(() => {
    loadAttendanceRecords();
    loadClasses();
    loadStudents();
  }, []);

  // Reload records when filters change
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      loadAttendanceRecords();
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [filterStatus, filterClass, filterStudent, dateRange]);

  const loadAttendanceRecords = async () => {
    try {
      setIsLoading(true);
      const params: {
        date_from?: string;
        date_to?: string;
        attendance_status?: string;
        class_id?: number;
        student_id?: number;
        per_page?: number;
      } = {
        per_page: 100, // Load more records for filtering
      };

      if (dateRange.from) {
        params.date_from = format(dateRange.from, 'yyyy-MM-dd');
      }
      if (dateRange.to) {
        params.date_to = format(dateRange.to, 'yyyy-MM-dd');
      }
      if (filterStatus !== 'all') {
        params.attendance_status = filterStatus;
      }
      if (filterClass !== 'all') {
        params.class_id = parseInt(filterClass);
      }
      if (filterStudent !== 'all') {
        params.student_id = parseInt(filterStudent);
      }

      const records = await tutorApi.getAttendanceRecords(params);
      
      // Map API response to component's data structure
      const mappedRecords: AttendanceRecord[] = records.map((record: any) => ({
        id: String(record.record_id || record.id),
        date: record.date,
        className: record.subject || 'N/A',
        studentName: record.student_name || 'Unknown',
        status: record.attendance_status === 'excused' ? 'absent' : (record.attendance_status || 'absent') as 'present' | 'absent' | 'late',
        time: record.start_time ? format(new Date(`2000-01-01T${record.start_time}`), 'hh:mm a') : '-',
        notes: undefined, // API doesn't return notes in attendance records
      }));

      setAllRecords(mappedRecords);
      
      // Apply client-side search filter
      if (searchQuery) {
        const filtered = mappedRecords.filter(record =>
          record.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          record.className.toLowerCase().includes(searchQuery.toLowerCase())
        );
        setAttendanceRecords(filtered);
      } else {
        setAttendanceRecords(mappedRecords);
      }
    } catch (error) {
      console.error('Failed to load attendance records:', error);
      toast({
        title: 'Error',
        description: 'Failed to load attendance records. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadClasses = async () => {
    try {
      const classesData = await tutorApi.getClasses();
      setClasses(classesData);
    } catch (error) {
      console.error('Failed to load classes:', error);
    }
  };

  const loadStudents = async () => {
    try {
      const studentsData = await tutorApi.getStudents();
      setStudents(studentsData);
    } catch (error) {
      console.error('Failed to load students:', error);
    }
  };

  // Apply search filter
  useEffect(() => {
    if (searchQuery) {
      const filtered = allRecords.filter(record =>
        record.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        record.className.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setAttendanceRecords(filtered);
    } else {
      setAttendanceRecords(allRecords);
    }
  }, [searchQuery, allRecords]);

  const getStatusBadge = (status: AttendanceRecord['status']) => {
    switch (status) {
      case 'present':
        return (
          <Badge variant="outline" className="bg-success/10 text-success border-success/20">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Present
          </Badge>
        );
      case 'absent':
        return (
          <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/20">
            <XCircle className="h-3 w-3 mr-1" />
            Absent
          </Badge>
        );
      case 'late':
        return (
          <Badge variant="outline" className="bg-warning/10 text-warning border-warning/20">
            <Clock className="h-3 w-3 mr-1" />
            Late
          </Badge>
        );
    }
  };

  // Get unique class names from records for dropdown
  const uniqueClassNames = Array.from(new Set(allRecords.map(r => r.className)));

  const handleExport = () => {
    toast({
      title: "Exporting Attendance Records",
      description: "Your attendance records are being exported to CSV.",
    });
  };

  const stats = {
    totalRecords: allRecords.length,
    present: allRecords.filter(r => r.status === 'present').length,
    absent: allRecords.filter(r => r.status === 'absent').length,
    late: allRecords.filter(r => r.status === 'late').length,
  };

  const attendanceRate = stats.totalRecords > 0 ? ((stats.present / stats.totalRecords) * 100).toFixed(1) : '0.0';

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Attendance Records</h1>
          <p className="text-muted-foreground mt-2">
            View and track student attendance across all your classes
          </p>
        </div>
        <Button onClick={handleExport}>
          <Download className="h-4 w-4 mr-2" />
          Export Records
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Records</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            ) : (
              <div className="text-2xl font-bold">{stats.totalRecords}</div>
            )}
          </CardContent>
        </Card>
        
        <Card className="border-success/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Present</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            ) : (
              <>
                <div className="text-2xl font-bold text-success">{stats.present}</div>
                <p className="text-xs text-muted-foreground mt-1">{attendanceRate}% attendance rate</p>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="border-destructive/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Absent</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            ) : (
              <div className="text-2xl font-bold text-destructive">{stats.absent}</div>
            )}
          </CardContent>
        </Card>

        <Card className="border-warning/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Late</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            ) : (
              <div className="text-2xl font-bold text-warning">{stats.late}</div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filter Records</CardTitle>
          <CardDescription>Search and filter attendance records</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search student or class..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select value={filterStudent} onValueChange={setFilterStudent}>
              <SelectTrigger>
                <SelectValue placeholder="All Students" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Students</SelectItem>
                {students.map(student => (
                  <SelectItem key={student.id} value={String(student.id)}>
                    {student.user?.name || `Student ${student.id}`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filterClass} onValueChange={setFilterClass}>
              <SelectTrigger>
                <SelectValue placeholder="All Classes" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Classes</SelectItem>
                {classes.map(cls => (
                  <SelectItem key={cls.id} value={String(cls.id)}>{cls.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger>
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="present">Present</SelectItem>
                <SelectItem value="absent">Absent</SelectItem>
                <SelectItem value="late">Late</SelectItem>
                <SelectItem value="excused">Excused</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex gap-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="flex-1 justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateRange.from ? format(dateRange.from, "MMM dd") : <span>From</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={dateRange.from}
                    onSelect={(date) => setDateRange({ ...dateRange, from: date })}
                  />
                </PopoverContent>
              </Popover>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="flex-1 justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateRange.to ? format(dateRange.to, "MMM dd") : <span>To</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={dateRange.to}
                    onSelect={(date) => setDateRange({ ...dateRange, to: date })}
                    disabled={(date) => dateRange.from ? date < dateRange.from : false}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Attendance Table */}
      <Card>
        <CardHeader>
          <CardTitle>Attendance History</CardTitle>
          <CardDescription>
            Showing {attendanceRecords.length} of {allRecords.length} records
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Class</TableHead>
                  <TableHead>Student Name</TableHead>
                  <TableHead>Time</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Notes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {attendanceRecords.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                      No attendance records found
                    </TableCell>
                  </TableRow>
                ) : (
                  attendanceRecords.map((record) => (
                    <TableRow key={record.id}>
                      <TableCell className="font-medium">
                        {format(new Date(record.date), 'MMM dd, yyyy')}
                      </TableCell>
                      <TableCell>{record.className}</TableCell>
                      <TableCell>{record.studentName}</TableCell>
                      <TableCell>{record.time}</TableCell>
                      <TableCell>{getStatusBadge(record.status)}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {record.notes || '-'}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
