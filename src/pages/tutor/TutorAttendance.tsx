import { useState } from 'react';
import { Calendar, Clock, Users, Download, FileText, CheckCircle, UserCheck } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/hooks/use-toast';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface AttendanceRecord {
  id: string;
  classId: string;
  className: string;
  date: string;
  time: string;
  mode: 'online' | 'offline';
  totalStudents: number;
  present: number;
  absent: number;
  late: number;
  status: 'pending' | 'completed';
}

interface TimesheetEntry {
  id: string;
  date: string;
  classId: string;
  className: string;
  startTime: string;
  endTime: string;
  totalHours: number;
  mode: 'online' | 'offline';
  notes?: string;
  status: 'pending' | 'approved' | 'submitted';
}

interface Student {
  id: string;
  name: string;
  status: 'present' | 'absent' | 'late';
}

export default function TutorAttendance() {
  const [attendanceRecords] = useState<AttendanceRecord[]>([
    {
      id: 'att-1',
      classId: 'class-1',
      className: 'Advanced Mathematics Grade 12',
      date: '2024-01-15',
      time: '09:00 AM',
      mode: 'online',
      totalStudents: 25,
      present: 23,
      absent: 1,
      late: 1,
      status: 'completed'
    },
    {
      id: 'att-2',
      classId: 'class-2',
      className: 'Physics Grade 11',
      date: '2024-01-15',
      time: '02:00 PM',
      mode: 'offline',
      totalStudents: 20,
      present: 19,
      absent: 1,
      late: 0,
      status: 'completed'
    },
    {
      id: 'att-3',
      classId: 'class-1',
      className: 'Advanced Mathematics Grade 12',
      date: '2024-01-16',
      time: '09:00 AM',
      mode: 'online',
      totalStudents: 25,
      present: 0,
      absent: 0,
      late: 0,
      status: 'pending'
    }
  ]);

  const [timesheetEntries] = useState<TimesheetEntry[]>([
    {
      id: 'ts-1',
      date: '2024-01-15',
      classId: 'class-1',
      className: 'Advanced Mathematics Grade 12',
      startTime: '09:00',
      endTime: '11:00',
      totalHours: 2,
      mode: 'online',
      notes: 'Regular lecture, covered chapter 5',
      status: 'submitted'
    },
    {
      id: 'ts-2',
      date: '2024-01-15',
      classId: 'class-2',
      className: 'Physics Grade 11',
      startTime: '14:00',
      endTime: '15:30',
      totalHours: 1.5,
      mode: 'offline',
      notes: 'Lab session on thermodynamics',
      status: 'approved'
    }
  ]);

  const [markAttendanceOpen, setMarkAttendanceOpen] = useState(false);
  const [addTimesheetOpen, setAddTimesheetOpen] = useState(false);
  
  // Sample student list - in real app, this would come from the selected class
  const [students, setStudents] = useState<Student[]>([
    { id: '1', name: 'Ahmed Hassan', status: 'present' },
    { id: '2', name: 'Fatima Ali', status: 'present' },
    { id: '3', name: 'Omar Khalid', status: 'present' },
    { id: '4', name: 'Aisha Mohammed', status: 'present' },
    { id: '5', name: 'Youssef Ibrahim', status: 'present' },
  ]);

  const updateStudentStatus = (studentId: string, status: 'present' | 'absent' | 'late') => {
    setStudents(students.map(s => s.id === studentId ? { ...s, status } : s));
  };

  const handleMarkAttendance = () => {
    toast({
      title: "Attendance Marked",
      description: "Student attendance has been recorded successfully.",
    });
    setMarkAttendanceOpen(false);
  };

  const handleAddTimesheet = () => {
    toast({
      title: "Timesheet Entry Added",
      description: "Your work hours have been logged successfully.",
    });
    setAddTimesheetOpen(false);
  };

  const handleExportTimesheet = () => {
    toast({
      title: "Export Started",
      description: "Your timesheet is being prepared for download.",
    });
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

  const getModeColor = (mode: string) => {
    return mode === 'online'
      ? 'bg-purple-500/10 text-purple-700 dark:text-purple-400'
      : 'bg-orange-500/10 text-orange-700 dark:text-orange-400';
  };

  const totalHoursThisWeek = timesheetEntries.reduce((sum, entry) => sum + entry.totalHours, 0);
  const pendingAttendance = attendanceRecords.filter(r => r.status === 'pending').length;

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
            <div className="text-2xl font-bold">{pendingAttendance}</div>
            <p className="text-xs text-muted-foreground">Attendance to be marked</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Week</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalHoursThisWeek}h</div>
            <p className="text-xs text-muted-foreground">Total work hours</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Classes Today</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">3</div>
            <p className="text-xs text-muted-foreground">Scheduled sessions</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Attendance Rate</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">94%</div>
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
                <Dialog open={markAttendanceOpen} onOpenChange={setMarkAttendanceOpen}>
                  <DialogTrigger asChild>
                    <Button>
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
                      <div className="grid gap-4">
                        <div className="space-y-2">
                          <Label>Select Class</Label>
                          <Select>
                            <SelectTrigger>
                              <SelectValue placeholder="Choose a class" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="class-1">Advanced Mathematics Grade 12</SelectItem>
                              <SelectItem value="class-2">Physics Grade 11</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Date</Label>
                            <Input type="date" />
                          </div>
                          <div className="space-y-2">
                            <Label>Time</Label>
                            <Input type="time" />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label>Class Mode</Label>
                          <Select>
                            <SelectTrigger>
                              <SelectValue placeholder="Select mode" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="online">Online</SelectItem>
                              <SelectItem value="offline">Offline</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      {/* Student Attendance List */}
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <Label className="text-base font-semibold">Student Attendance</Label>
                          <div className="flex gap-2 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <div className="w-3 h-3 rounded-full bg-green-500"></div>
                              Present: {students.filter(s => s.status === 'present').length}
                            </span>
                            <span className="flex items-center gap-1">
                              <div className="w-3 h-3 rounded-full bg-red-500"></div>
                              Absent: {students.filter(s => s.status === 'absent').length}
                            </span>
                            <span className="flex items-center gap-1">
                              <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                              Late: {students.filter(s => s.status === 'late').length}
                            </span>
                          </div>
                        </div>
                        <div className="border rounded-lg divide-y max-h-[300px] overflow-y-auto">
                          {students.map((student) => (
                            <div key={student.id} className="p-3 flex items-center justify-between hover:bg-muted/50 transition-colors">
                              <div className="flex items-center gap-3">
                                <UserCheck className="h-4 w-4 text-muted-foreground" />
                                <span className="font-medium">{student.name}</span>
                              </div>
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  variant={student.status === 'present' ? 'default' : 'outline'}
                                  className={student.status === 'present' ? 'bg-green-600 hover:bg-green-700' : ''}
                                  onClick={() => updateStudentStatus(student.id, 'present')}
                                >
                                  Present
                                </Button>
                                <Button
                                  size="sm"
                                  variant={student.status === 'late' ? 'default' : 'outline'}
                                  className={student.status === 'late' ? 'bg-orange-600 hover:bg-orange-700' : ''}
                                  onClick={() => updateStudentStatus(student.id, 'late')}
                                >
                                  Late
                                </Button>
                                <Button
                                  size="sm"
                                  variant={student.status === 'absent' ? 'default' : 'outline'}
                                  className={student.status === 'absent' ? 'bg-red-600 hover:bg-red-700' : ''}
                                  onClick={() => updateStudentStatus(student.id, 'absent')}
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
                          <Textarea placeholder="Add any additional notes about the class..." />
                        </div>
                      </div>

                      <div className="flex justify-end gap-2 pt-4 border-t">
                        <Button variant="outline" onClick={() => setMarkAttendanceOpen(false)}>
                          Cancel
                        </Button>
                        <Button onClick={handleMarkAttendance}>Save Attendance</Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
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
                  {attendanceRecords.map((record) => (
                    <TableRow key={record.id}>
                      <TableCell className="font-medium">{record.className}</TableCell>
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
                        <Badge className={getStatusColor(record.status)}>
                          {record.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {record.status === 'pending' ? (
                          <Button size="sm" variant="outline" onClick={() => setMarkAttendanceOpen(true)}>
                            Mark
                          </Button>
                        ) : (
                          <Button size="sm" variant="ghost">
                            View
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

        <TabsContent value="timesheet" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Work Hours & Timesheet</CardTitle>
                  <CardDescription>Track your teaching hours for billing</CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={handleExportTimesheet}>
                    <Download className="mr-2 h-4 w-4" />
                    Export
                  </Button>
                  <Dialog open={addTimesheetOpen} onOpenChange={setAddTimesheetOpen}>
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
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label>Select Class</Label>
                          <Select>
                            <SelectTrigger>
                              <SelectValue placeholder="Choose a class" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="class-1">Advanced Mathematics Grade 12</SelectItem>
                              <SelectItem value="class-2">Physics Grade 11</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Date</Label>
                          <Input type="date" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Start Time</Label>
                            <Input type="time" />
                          </div>
                          <div className="space-y-2">
                            <Label>End Time</Label>
                            <Input type="time" />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label>Class Mode</Label>
                          <Select>
                            <SelectTrigger>
                              <SelectValue placeholder="Select mode" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="online">Online</SelectItem>
                              <SelectItem value="offline">Offline</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Notes (Optional)</Label>
                          <Textarea placeholder="Describe the work done..." />
                        </div>
                        <div className="flex justify-end gap-2">
                          <Button variant="outline" onClick={() => setAddTimesheetOpen(false)}>
                            Cancel
                          </Button>
                          <Button onClick={handleAddTimesheet}>Add Entry</Button>
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
                  {timesheetEntries.map((entry) => (
                    <TableRow key={entry.id}>
                      <TableCell>{entry.date}</TableCell>
                      <TableCell className="font-medium">{entry.className}</TableCell>
                      <TableCell className="text-sm">
                        {entry.startTime} - {entry.endTime}
                      </TableCell>
                      <TableCell>
                        <Badge className={getModeColor(entry.mode)}>
                          {entry.mode}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-semibold">{entry.totalHours}h</TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(entry.status)}>
                          {entry.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-xs truncate text-sm text-muted-foreground">
                        {entry.notes || '-'}
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
