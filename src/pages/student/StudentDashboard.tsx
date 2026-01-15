import { useState, useEffect } from 'react';
import { BookOpen, Clock, CheckCircle, AlertCircle, Calendar, TrendingUp, FileText, MessageSquare, Loader2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { JoinClassModal } from '@/components/modals/JoinClassModal';
import { QuickActionsModal } from '@/components/modals/QuickActionsModal';
import { useNavigate } from 'react-router-dom';
import { studentApi } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

export default function StudentDashboard() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState({
    enrolled_classes: 0,
    assignments_due: 0,
    completed_assignments: 0,
    overall_grade: 0,
    upcoming_classes: [] as any[],
    recent_grades: [] as any[],
    recent_announcements: [] as any[],
  });

  const [joinClassModal, setJoinClassModal] = useState<{ isOpen: boolean; classDetails: any }>({
    isOpen: false,
    classDetails: null,
  });
  const [quickActionsModal, setQuickActionsModal] = useState(false);
  
  useEffect(() => {
    const loadDashboard = async () => {
      try {
        setIsLoading(true);
        const data = await studentApi.getDashboard();
        setDashboardData(data);
      } catch (error) {
        console.error('Failed to load dashboard:', error);
        toast({
          title: 'Error',
          description: 'Failed to load dashboard data',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadDashboard();
  }, [toast]);
  
  const handleJoinClass = (classItem: any) => {
    setJoinClassModal({
      isOpen: true,
      classDetails: {
        id: classItem.id,
        name: classItem.subject || classItem.name,
        tutor: classItem.teacher?.user?.name || 'Tutor',
        time: `${classItem.start_time} - ${classItem.end_time}`,
        room: classItem.location === 'centre' ? 'Room TBD' : classItem.location,
        meetingLink: classItem.location === 'online' ? 'https://meet.google.com/abc-def-123' : undefined,
        status: classItem.status,
      },
    });
  };

  const stats = [
    {
      title: 'Enrolled Classes',
      value: (dashboardData.enrolled_classes ?? 0).toString(),
      description: 'Active courses',
      icon: BookOpen,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      title: 'Assignments Due',
      value: (dashboardData.assignments_due ?? 0).toString(),
      description: 'This week',
      icon: Clock,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
    },
    {
      title: 'Completed',
      value: (dashboardData.completed_assignments ?? 0).toString(),
      description: 'Total assignments',
      icon: CheckCircle,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
    {
      title: 'Overall Grade',
      value: `${Math.round(parseFloat(dashboardData.overall_grade) || 0)}%`,
      description: 'Average score',
      icon: TrendingUp,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
    },
  ];

  const upcomingClasses = (dashboardData.upcoming_classes || []).map((session, index) => {
    const sessionDate = new Date(session.date);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    let status = 'upcoming';
    if (sessionDate.toDateString() === today.toDateString()) {
      status = 'today';
    } else if (sessionDate.toDateString() === tomorrow.toDateString()) {
      status = 'tomorrow';
    }

    return {
      id: session.id,
      name: session.subject,
      time: `${session.start_time} - ${session.end_time}`,
      room: session.location === 'centre' ? 'Room TBD' : session.location,
      tutor: session.teacher?.user?.name || 'Tutor',
      status,
    };
  });

  const recentAssignments = (dashboardData.recent_grades || []).map((grade) => ({
    id: grade.id,
    title: grade.assessment,
    course: grade.subject,
    dueDate: grade.date,
    status: 'submitted' as const,
    grade: grade.grade && grade.max_grade ? Math.round((parseFloat(grade.grade) / parseFloat(grade.max_grade)) * 100) : 0,
  }));

  const announcements = (dashboardData.recent_announcements || []).map((announcement) => ({
    id: announcement.id,
    title: announcement.title,
    message: announcement.message,
    time: announcement.time_ago || 'Recently',
    important: announcement.important || announcement.priority === 'high',
  }));

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">My Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back, Emma! Here's your learning progress overview.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => navigate('/student/classes')}>
            <Calendar className="mr-2 h-4 w-4" />
            View Schedule
          </Button>
          <Button size="sm" onClick={() => navigate('/student/assignments')}>
            <FileText className="mr-2 h-4 w-4" />
            My Assignments
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  <div className="h-4 w-24 bg-muted animate-pulse rounded" />
                </CardTitle>
                <div className="h-8 w-8 bg-muted animate-pulse rounded-full" />
              </CardHeader>
              <CardContent>
                <div className="h-8 w-20 bg-muted animate-pulse rounded mb-2" />
                <div className="h-3 w-32 bg-muted animate-pulse rounded" />
              </CardContent>
            </Card>
          ))
        ) : (
          stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <Card key={stat.title}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    {stat.title}
                  </CardTitle>
                  <div className={`rounded-full p-2 ${stat.bgColor}`}>
                    <Icon className={`h-4 w-4 ${stat.color}`} />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stat.value}</div>
                  <p className="text-xs text-muted-foreground">
                    {stat.description}
                  </p>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        {/* Upcoming Classes */}
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Upcoming Classes</CardTitle>
            <CardDescription>
              Your schedule for today and tomorrow
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="h-24 bg-muted animate-pulse rounded-lg" />
                ))}
              </div>
            ) : upcomingClasses.length > 0 ? (
              <div className="space-y-4">
                {upcomingClasses.map((classItem) => (
                  <div key={classItem.id} className="flex items-center gap-4 rounded-lg border p-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                      <BookOpen className="h-6 w-6 text-primary" />
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium">{classItem.name}</h4>
                        <Badge variant={classItem.status === 'today' ? 'default' : 'secondary'}>
                          {classItem.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {classItem.time} • {classItem.room}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        with {classItem.tutor}
                      </p>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => handleJoinClass(classItem)}>
                      Join Class
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">No upcoming classes</p>
            )}
          </CardContent>
        </Card>

        {/* Progress & Quick Actions */}
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Learning Progress</CardTitle>
            <CardDescription>
              Your academic performance this semester
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Course Progress */}
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Advanced Web Development</span>
                  <span>85%</span>
                </div>
                <Progress value={85} className="h-2" />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Data Structures & Algorithms</span>
                  <span>78%</span>
                </div>
                <Progress value={78} className="h-2" />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Digital Marketing</span>
                  <span>92%</span>
                </div>
                <Progress value={92} className="h-2" />
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="text-sm font-medium">Quick Actions</h4>
              <div className="grid grid-cols-1 gap-2">
                <Button variant="outline" size="sm" className="justify-start" onClick={() => navigate('/student/assignments')}>
                  Submit Assignment
                </Button>
                <Button variant="outline" size="sm" className="justify-start" onClick={() => navigate('/student/grades')}>
                  View Grades
                </Button>
                <Button variant="outline" size="sm" className="justify-start" onClick={() => navigate('/student/resources')}>
                  Access Resources
                </Button>
                <Button variant="outline" size="sm" className="justify-start" onClick={() => navigate('/student/messaging')}>
                  Message Tutor
                </Button>
                <Button variant="outline" size="sm" className="justify-start" onClick={() => setQuickActionsModal(true)}>
                  More Actions
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Recent Assignments */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Assignments</CardTitle>
            <CardDescription>
              Your latest assignment submissions and grades
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="h-20 bg-muted animate-pulse rounded-lg" />
                ))}
              </div>
            ) : recentAssignments.length > 0 ? (
              <div className="space-y-4">
                {recentAssignments.map((assignment) => (
                  <div key={assignment.id} className="flex items-center justify-between rounded-lg border p-4">
                    <div className="space-y-1">
                      <h4 className="font-medium text-sm">{assignment.title}</h4>
                      <p className="text-xs text-muted-foreground">{assignment.course}</p>
                      <p className="text-xs text-muted-foreground">Due: {assignment.dueDate}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {assignment.grade && (
                        <Badge variant="default">{assignment.grade}%</Badge>
                      )}
                      <Badge variant={
                        assignment.status === 'submitted' ? 'default' :
                        assignment.status === 'pending' ? 'secondary' :
                        'destructive'
                      }>
                        {assignment.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">No recent assignments</p>
            )}
          </CardContent>
        </Card>

        {/* Announcements */}
        <Card>
          <CardHeader>
            <CardTitle>Announcements</CardTitle>
            <CardDescription>
              Important updates and notifications
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="h-20 bg-muted animate-pulse rounded-lg" />
                ))}
              </div>
            ) : announcements.length > 0 ? (
              <div className="space-y-4">
                {announcements.map((announcement) => (
                  <div key={announcement.id} className="flex items-start gap-3 rounded-lg border p-4">
                    <div className={`mt-0.5 h-2 w-2 rounded-full ${
                      announcement.important ? 'bg-red-500' : 'bg-blue-500'
                    }`} />
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium text-sm">{announcement.title}</h4>
                        {announcement.important && (
                          <AlertCircle className="h-3 w-3 text-red-500" />
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {announcement.message}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {announcement.time}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">No announcements</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Modals */}
      <JoinClassModal
        isOpen={joinClassModal.isOpen}
        onClose={() => setJoinClassModal({ isOpen: false, classDetails: null })}
        classDetails={joinClassModal.classDetails}
      />
      
      <QuickActionsModal
        isOpen={quickActionsModal}
        onClose={() => setQuickActionsModal(false)}
      />
    </div>
  );
}