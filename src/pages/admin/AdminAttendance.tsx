import { useState } from 'react';
import { Calendar, Users, TrendingUp, Download, Filter } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from '@/hooks/use-toast';

interface AttendanceOverview {
  id: string;
  className: string;
  tutor: string;
  date: string;
  time: string;
  mode: 'online' | 'offline';
  totalStudents: number;
  present: number;
  absent: number;
  late: number;
  rate: number;
  status: 'completed' | 'pending';
}

interface TimesheetOverview {
  id: string;
  tutorName: string;
  weekEnding: string;
  totalHours: number;
  onlineHours: number;
  offlineHours: number;
  status: 'pending' | 'approved' | 'paid';
  amount: number;
}

interface StudentAttendanceRecord {
  id: string;
  studentName: string;
  className: string;
  tutor: string;
  date: string;
  time: string;
  mode: 'online' | 'offline';
  status: 'present' | 'absent' | 'late';
}

export default function AdminAttendance() {
  const [searchTerm, setSearchTerm] = useState('');
  const [classFilter, setClassFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  const [attendanceData] = useState<AttendanceOverview[]>([
    {
      id: 'att-1',
      className: 'Advanced Mathematics Grade 12',
      tutor: 'Dr. Sarah Johnson',
      date: '2024-01-15',
      time: '09:00 AM',
      mode: 'online',
      totalStudents: 25,
      present: 23,
      absent: 1,
      late: 1,
      rate: 92,
      status: 'completed'
    },
    {
      id: 'att-2',
      className: 'Physics Grade 11',
      tutor: 'Prof. Michael Chen',
      date: '2024-01-15',
      time: '02:00 PM',
      mode: 'offline',
      totalStudents: 20,
      present: 19,
      absent: 1,
      late: 0,
      rate: 95,
      status: 'completed'
    },
    {
      id: 'att-3',
      className: 'English Literature',
      tutor: 'Mrs. Emily Davis',
      date: '2024-01-16',
      time: '10:00 AM',
      mode: 'online',
      totalStudents: 22,
      present: 0,
      absent: 0,
      late: 0,
      rate: 0,
      status: 'pending'
    }
  ]);

  const [timesheetData] = useState<TimesheetOverview[]>([
    {
      id: 'ts-1',
      tutorName: 'Dr. Sarah Johnson',
      weekEnding: '2024-01-19',
      totalHours: 24,
      onlineHours: 16,
      offlineHours: 8,
      status: 'pending',
      amount: 2400
    },
    {
      id: 'ts-2',
      tutorName: 'Prof. Michael Chen',
      weekEnding: '2024-01-19',
      totalHours: 20,
      onlineHours: 10,
      offlineHours: 10,
      status: 'approved',
      amount: 2000
    },
    {
      id: 'ts-3',
      tutorName: 'Mrs. Emily Davis',
      weekEnding: '2024-01-12',
      totalHours: 18,
      onlineHours: 12,
      offlineHours: 6,
      status: 'paid',
      amount: 1800
    }
  ]);

  const [studentAttendanceData] = useState<StudentAttendanceRecord[]>([
    {
      id: 'sa-1',
      studentName: 'Ahmed Hassan',
      className: 'Advanced Mathematics Grade 12',
      tutor: 'Dr. Sarah Johnson',
      date: '2024-01-15',
      time: '09:00 AM',
      mode: 'online',
      status: 'present'
    },
    {
      id: 'sa-2',
      studentName: 'Fatima Ali',
      className: 'Advanced Mathematics Grade 12',
      tutor: 'Dr. Sarah Johnson',
      date: '2024-01-15',
      time: '09:00 AM',
      mode: 'online',
      status: 'present'
    },
    {
      id: 'sa-3',
      studentName: 'Omar Khalid',
      className: 'Advanced Mathematics Grade 12',
      tutor: 'Dr. Sarah Johnson',
      date: '2024-01-15',
      time: '09:00 AM',
      mode: 'online',
      status: 'late'
    },
    {
      id: 'sa-4',
      studentName: 'Aisha Mohammed',
      className: 'Physics Grade 11',
      tutor: 'Prof. Michael Chen',
      date: '2024-01-15',
      time: '02:00 PM',
      mode: 'offline',
      status: 'present'
    },
    {
      id: 'sa-5',
      studentName: 'Hassan Ibrahim',
      className: 'Physics Grade 11',
      tutor: 'Prof. Michael Chen',
      date: '2024-01-15',
      time: '02:00 PM',
      mode: 'offline',
      status: 'absent'
    },
    {
      id: 'sa-6',
      studentName: 'Layla Ahmed',
      className: 'Physics Grade 11',
      tutor: 'Prof. Michael Chen',
      date: '2024-01-15',
      time: '02:00 PM',
      mode: 'offline',
      status: 'present'
    }
  ]);

  const filteredAttendance = attendanceData.filter(record => {
    const matchesSearch = record.className.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         record.tutor.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || record.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const filteredStudentAttendance = studentAttendanceData.filter(record => {
    const matchesSearch = record.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         record.className.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         record.tutor.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

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

  const getModeColor = (mode: string) => {
    return mode === 'online'
      ? 'bg-purple-500/10 text-purple-700 dark:text-purple-400'
      : 'bg-blue-500/10 text-blue-700 dark:text-blue-400';
  };

  const handleExportAttendance = () => {
    toast({
      title: "Export Started",
      description: "Attendance data is being prepared for download.",
    });
  };

  const handleApproveTimesheet = (id: string) => {
    toast({
      title: "Timesheet Approved",
      description: "The timesheet has been approved for payment.",
    });
  };

  const totalClasses = attendanceData.length;
  const completedClasses = attendanceData.filter(r => r.status === 'completed').length;
  const avgAttendanceRate = Math.round(
    attendanceData.reduce((sum, r) => sum + r.rate, 0) / attendanceData.length
  );
  const totalTutorHours = timesheetData.reduce((sum, t) => sum + t.totalHours, 0);

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
            <div className="text-2xl font-bold">{totalClasses}</div>
            <p className="text-xs text-muted-foreground">{completedClasses} completed</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Attendance</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgAttendanceRate}%</div>
            <p className="text-xs text-muted-foreground">Across all classes</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tutor Hours</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalTutorHours}h</div>
            <p className="text-xs text-muted-foreground">This week</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Filter className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {timesheetData.filter(t => t.status === 'pending').length}
            </div>
            <p className="text-xs text-muted-foreground">Timesheets to review</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="attendance" className="space-y-4">
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
                <Input
                  placeholder="Search by class or tutor..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="max-w-sm"
                />
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
                  {filteredAttendance.map((record) => (
                    <TableRow key={record.id}>
                      <TableCell className="font-medium">{record.className}</TableCell>
                      <TableCell>{record.tutor}</TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div>{record.date}</div>
                          <div className="text-muted-foreground">{record.time}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getModeColor(record.mode)}>
                          {record.mode}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {record.status === 'completed' ? (
                          <div className="text-sm">
                            <div className="text-green-600 dark:text-green-400">
                              ✓ {record.present} Present
                            </div>
                            <div className="text-red-600 dark:text-red-400">
                              ✗ {record.absent} Absent
                            </div>
                            {record.late > 0 && (
                              <div className="text-orange-600 dark:text-orange-400">
                                ⚠ {record.late} Late
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-sm">Not marked</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="font-semibold">
                          {record.status === 'completed' ? `${record.rate}%` : '-'}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(record.status)}>
                          {record.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button size="sm" variant="ghost">
                          View Details
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
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
                <Input
                  placeholder="Search by student, class, or tutor..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="max-w-sm"
                />
              </div>

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
                  {filteredStudentAttendance.map((record) => (
                    <TableRow key={record.id}>
                      <TableCell className="font-medium">{record.studentName}</TableCell>
                      <TableCell>{record.className}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {record.tutor}
                      </TableCell>
                      <TableCell>{record.date}</TableCell>
                      <TableCell>{record.time}</TableCell>
                      <TableCell>
                        <Badge variant={record.mode === 'online' ? 'default' : 'secondary'}>
                          {record.mode}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          className={
                            record.status === 'present'
                              ? 'bg-green-500/10 text-green-700 dark:text-green-400'
                              : record.status === 'late'
                              ? 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-400'
                              : 'bg-red-500/10 text-red-700 dark:text-red-400'
                          }
                        >
                          {record.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
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
                  {timesheetData.map((timesheet) => (
                    <TableRow key={timesheet.id}>
                      <TableCell className="font-medium">{timesheet.tutorName}</TableCell>
                      <TableCell>{timesheet.weekEnding}</TableCell>
                      <TableCell className="font-semibold">{timesheet.totalHours}h</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {timesheet.onlineHours}h
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {timesheet.offlineHours}h
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
                            onClick={() => handleApproveTimesheet(timesheet.id)}
                          >
                            Approve
                          </Button>
                        )}
                        {timesheet.status === 'approved' && (
                          <Button size="sm" variant="outline">
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
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
