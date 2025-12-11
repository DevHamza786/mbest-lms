import { useState } from 'react';
import { Calendar, TrendingUp, AlertCircle, CheckCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface AttendanceRecord {
  id: string;
  classId: string;
  className: string;
  date: string;
  time: string;
  mode: 'online' | 'offline';
  status: 'present' | 'absent' | 'late';
  markedBy: string;
}

export default function StudentAttendance() {
  const [attendanceRecords] = useState<AttendanceRecord[]>([
    {
      id: 'att-1',
      classId: 'class-1',
      className: 'Advanced Mathematics Grade 12',
      date: '2024-01-15',
      time: '09:00 AM',
      mode: 'online',
      status: 'present',
      markedBy: 'Dr. Sarah Johnson'
    },
    {
      id: 'att-2',
      classId: 'class-2',
      className: 'Physics Grade 11',
      date: '2024-01-15',
      time: '02:00 PM',
      mode: 'offline',
      status: 'present',
      markedBy: 'Prof. Michael Chen'
    },
    {
      id: 'att-3',
      classId: 'class-1',
      className: 'Advanced Mathematics Grade 12',
      date: '2024-01-14',
      time: '09:00 AM',
      mode: 'online',
      status: 'late',
      markedBy: 'Dr. Sarah Johnson'
    },
    {
      id: 'att-4',
      classId: 'class-3',
      className: 'English Literature',
      date: '2024-01-13',
      time: '11:00 AM',
      mode: 'offline',
      status: 'absent',
      markedBy: 'Mrs. Emily Davis'
    },
    {
      id: 'att-5',
      classId: 'class-2',
      className: 'Physics Grade 11',
      date: '2024-01-12',
      time: '02:00 PM',
      mode: 'offline',
      status: 'present',
      markedBy: 'Prof. Michael Chen'
    }
  ]);

  const classStats = [
    {
      className: 'Advanced Mathematics Grade 12',
      total: 20,
      present: 18,
      absent: 1,
      late: 1,
      rate: 90
    },
    {
      className: 'Physics Grade 11',
      total: 15,
      present: 14,
      absent: 0,
      late: 1,
      rate: 93
    },
    {
      className: 'English Literature',
      total: 18,
      present: 16,
      absent: 2,
      late: 0,
      rate: 89
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'present':
        return 'bg-green-500/10 text-green-700 dark:text-green-400';
      case 'absent':
        return 'bg-red-500/10 text-red-700 dark:text-red-400';
      case 'late':
        return 'bg-orange-500/10 text-orange-700 dark:text-orange-400';
      default:
        return 'bg-gray-500/10 text-gray-700 dark:text-gray-400';
    }
  };

  const getModeColor = (mode: string) => {
    return mode === 'online'
      ? 'bg-purple-500/10 text-purple-700 dark:text-purple-400'
      : 'bg-blue-500/10 text-blue-700 dark:text-blue-400';
  };

  const overallRate = Math.round(
    (attendanceRecords.filter(r => r.status === 'present').length / attendanceRecords.length) * 100
  );
  const totalPresent = attendanceRecords.filter(r => r.status === 'present').length;
  const totalAbsent = attendanceRecords.filter(r => r.status === 'absent').length;
  const totalLate = attendanceRecords.filter(r => r.status === 'late').length;

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">My Attendance</h1>
        <p className="text-muted-foreground mt-2">
          Track your class attendance and participation
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overall Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overallRate}%</div>
            <Progress value={overallRate} className="mt-2" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Present</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">{totalPresent}</div>
            <p className="text-xs text-muted-foreground">Classes attended</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Absent</CardTitle>
            <AlertCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600 dark:text-red-400">{totalAbsent}</div>
            <p className="text-xs text-muted-foreground">Classes missed</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Late Arrivals</CardTitle>
            <Calendar className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">{totalLate}</div>
            <p className="text-xs text-muted-foreground">Times late</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="history" className="space-y-4">
        <TabsList>
          <TabsTrigger value="history">Attendance History</TabsTrigger>
          <TabsTrigger value="by-class">By Class</TabsTrigger>
        </TabsList>

        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Attendance Records</CardTitle>
              <CardDescription>Your complete attendance history across all classes</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Class</TableHead>
                    <TableHead>Date & Time</TableHead>
                    <TableHead>Mode</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Marked By</TableHead>
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
                        <Badge className={getStatusColor(record.status)}>
                          {record.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {record.markedBy}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="by-class" className="space-y-4">
          <div className="grid gap-4">
            {classStats.map((stat, index) => (
              <Card key={index}>
                <CardHeader>
                  <CardTitle className="text-lg">{stat.className}</CardTitle>
                  <CardDescription>
                    {stat.total} total sessions • {stat.rate}% attendance rate
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Progress value={stat.rate} className="h-3" />
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center p-3 rounded-lg bg-green-500/10">
                      <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                        {stat.present}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">Present</div>
                    </div>
                    <div className="text-center p-3 rounded-lg bg-red-500/10">
                      <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                        {stat.absent}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">Absent</div>
                    </div>
                    <div className="text-center p-3 rounded-lg bg-orange-500/10">
                      <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                        {stat.late}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">Late</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
