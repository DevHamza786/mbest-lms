import { useState, useEffect } from 'react';
import { Calendar, TrendingUp, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { studentApi } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

export default function StudentAttendance() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [attendanceRecords, setAttendanceRecords] = useState<any[]>([]);
  const [statistics, setStatistics] = useState<any>({
    total_sessions: 0,
    present: 0,
    absent: 0,
    late: 0,
    attendance_rate: 0,
  });

  useEffect(() => {
    const loadAttendance = async () => {
      try {
        setIsLoading(true);
        const response = await studentApi.getAttendance({ per_page: 100 });
        setAttendanceRecords(response.records || []);
        setStatistics(response.statistics || statistics);
      } catch (error) {
        console.error('Failed to load attendance:', error);
        toast({
          title: 'Error',
          description: 'Failed to load attendance records',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadAttendance();
  }, [toast]);
  // Group attendance by class
  const classStats = attendanceRecords.reduce((acc: any, record: any) => {
    const className = record.classModel?.name || record.subject || 'Unknown Class';
    if (!acc[className]) {
      acc[className] = {
        className,
        total: 0,
        present: 0,
        absent: 0,
        late: 0,
      };
    }
    acc[className].total++;
    const status = record.attendance_status || 'absent';
    if (status === 'present') acc[className].present++;
    else if (status === 'absent') acc[className].absent++;
    else if (status === 'late') acc[className].late++;
    return acc;
  }, {});

  const classStatsArray = Object.values(classStats).map((stat: any) => ({
    ...stat,
    rate: stat.total > 0 ? Math.round((stat.present / stat.total) * 100) : 0,
  }));

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

  const overallRate = statistics.attendance_rate || 0;
  const totalPresent = statistics.present || 0;
  const totalAbsent = statistics.absent || 0;
  const totalLate = statistics.late || 0;

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">My Attendance</h1>
        <p className="text-muted-foreground mt-2">
          Track your class attendance and participation
        </p>
      </div>

      {/* Stats Cards */}
      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="py-8">
                <div className="h-8 w-24 bg-muted animate-pulse rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
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
      )}

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
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : attendanceRecords.length === 0 ? (
                <p className="text-center text-muted-foreground py-12">No attendance records available.</p>
              ) : (
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
                    {attendanceRecords.map((record) => {
                      const mode = record.location === 'online' ? 'online' : 'offline';
                      const status = record.attendance_status || 'absent';
                      return (
                        <TableRow key={record.id}>
                          <TableCell className="font-medium">
                            {record.classModel?.name || record.subject || 'Unknown'}
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              <div>{new Date(record.date).toLocaleDateString()}</div>
                              <div className="text-muted-foreground">
                                {record.start_time} - {record.end_time}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className={getModeColor(mode)}>
                              {mode}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge className={getStatusColor(status)}>
                              {status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {record.teacher?.user?.name || 'N/A'}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="by-class" className="space-y-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : classStatsArray.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">No attendance records by class.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {classStatsArray.map((stat, index) => (
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
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
