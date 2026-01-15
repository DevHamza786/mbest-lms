import { useState, useEffect } from 'react';
import { Calendar, TrendingUp, AlertCircle, CheckCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ChildSwitcher } from '@/components/parent/ChildSwitcher';
import { useActiveChild } from '@/lib/store/parentStore';
import { parentApi } from '@/lib/api';

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

export default function ParentAttendance() {
  const activeChild = useActiveChild();
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Load attendance records when active child changes
  useEffect(() => {
    if (!activeChild?.id) {
      setAttendanceRecords([]);
      return;
    }

    const loadAttendance = async () => {
      try {
        setIsLoading(true);
        const response = await parentApi.getChildAttendance(Number(activeChild.id));
        
        // Map API response to AttendanceRecord format
        const records = response.records || [];
        const mappedRecords: AttendanceRecord[] = records.map((r: any) => ({
          id: String(r.id),
          classId: r.class_id ? String(r.class_id) : '', 
          className: r.subject || r.class_name || 'Unknown',
          date: r.date,
          time: r.start_time && r.end_time ? `${r.start_time} - ${r.end_time}` : '',
          mode: 'offline', // Default, can be inferred from location if available
          status: (r.attendance_status || 'absent') as 'present' | 'absent' | 'late',
          markedBy: r.teacher?.user?.name || r.marked_by || 'Unknown',
        }));
        
        setAttendanceRecords(mappedRecords);
      } catch (error) {
        console.error('Failed to load attendance:', error);
        setAttendanceRecords([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadAttendance();
  }, [activeChild?.id]);

  // Calculate class stats from attendance records
  const classStats = attendanceRecords.reduce((acc, record) => {
    const existing = acc.find(stat => stat.className === record.className);
    if (existing) {
      existing.total += 1;
      if (record.status === 'present') existing.present += 1;
      else if (record.status === 'absent') existing.absent += 1;
      else if (record.status === 'late') existing.late += 1;
      existing.rate = existing.total > 0 ? Math.round((existing.present / existing.total) * 100) : 0;
    } else {
      acc.push({
        className: record.className,
        total: 1,
        present: record.status === 'present' ? 1 : 0,
        absent: record.status === 'absent' ? 1 : 0,
        late: record.status === 'late' ? 1 : 0,
        rate: record.status === 'present' ? 100 : 0
      });
    }
    return acc;
  }, [] as Array<{ className: string; total: number; present: number; absent: number; late: number; rate: number }>);

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

  // Format date to readable format
  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      // If parsing fails, try to extract just the date part
      return dateString.split('T')[0];
    }
  };

  // Format time to readable format (e.g., "1:00 PM - 3:00 PM")
  const formatTime = (timeString: string) => {
    if (!timeString) return '';
    try {
      // Handle time range format "HH:MM:SS - HH:MM:SS"
      if (timeString.includes(' - ')) {
        const [start, end] = timeString.split(' - ');
        const formatSingleTime = (t: string) => {
          const [hours, minutes] = t.split(':');
          const hour = parseInt(hours, 10);
          const ampm = hour >= 12 ? 'PM' : 'AM';
          const displayHour = hour % 12 || 12;
          return `${displayHour}:${minutes} ${ampm}`;
        };
        return `${formatSingleTime(start)} - ${formatSingleTime(end)}`;
      }
      // Handle single time
      const [hours, minutes] = timeString.split(':');
      const hour = parseInt(hours, 10);
      const ampm = hour >= 12 ? 'PM' : 'AM';
      const displayHour = hour % 12 || 12;
      return `${displayHour}:${minutes} ${ampm}`;
    } catch {
      return timeString;
    }
  };

  const overallRate = attendanceRecords.length > 0
    ? Math.round((attendanceRecords.filter(r => r.status === 'present').length / attendanceRecords.length) * 100)
    : 0;
  const totalPresent = attendanceRecords.filter(r => r.status === 'present').length;
  const totalAbsent = attendanceRecords.filter(r => r.status === 'absent').length;
  const totalLate = attendanceRecords.filter(r => r.status === 'late').length;

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Attendance Tracking</h1>
          <p className="text-muted-foreground mt-2">
            Monitor {activeChild?.name || 'your child'}'s class attendance in real-time
          </p>
        </div>
        <ChildSwitcher />
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
              <CardDescription>
                Complete attendance history for {activeChild?.name || 'your child'} across all classes
              </CardDescription>
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
                          <div className="font-medium">{formatDate(record.date)}</div>
                          <div className="text-muted-foreground">{formatTime(record.time)}</div>
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
