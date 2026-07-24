import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Users, FileText, Clock, BookOpen, MessageSquare, Plus, Loader2 } from "lucide-react";
import { useToast } from '@/hooks/use-toast';
import { tutorApi } from '@/lib/api';
import { sessionIsOnline } from '@/lib/sessionLocation';

const TutorDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingAssignments, setIsLoadingAssignments] = useState(false);

  const [dashboardData, setDashboardData] = useState({
    total_students: 0,
    total_classes: 0,
    pending_assignments: 0,
    unread_messages: 0,
    upcoming_sessions: [] as any[],
    tutor: null as any,
  });

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        setIsLoading(true);
        const dashboard = await tutorApi.getDashboard();
        setDashboardData({
          total_students: dashboard.total_students || 0,
          total_classes: dashboard.total_classes || 0,
          pending_assignments: dashboard.pending_assignments || 0,
          unread_messages: dashboard.unread_messages || 0,
          upcoming_sessions: dashboard.upcoming_sessions || [],
          tutor: dashboard.tutor || null,
        });
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

  const stats = {
    totalStudents: dashboardData.total_students,
    activeClasses: dashboardData.total_classes,
    pendingAssignments: dashboardData.pending_assignments,
    todaysClasses: (dashboardData.upcoming_sessions || []).filter(s => {
      const sessionDate = new Date(s.date);
      const today = new Date();
      return sessionDate.toDateString() === today.toDateString();
    }).length,
  };


  const upcomingClasses = (dashboardData.upcoming_sessions || []).slice(0, 2).map(session => {
    const detail = (session as any).location_detail?.trim?.() as string | undefined;
    const online = sessionIsOnline(session as any);
    return {
      id: String(session.id),
      name: session.subject,
      time: `${session.start_time} - ${session.end_time}`,
      students: session.students?.length || 0,
      room: online ? (detail && !/^https?:\/\//i.test(detail) ? detail : 'Online') : (detail || 'Onsite'),
      meetingLink: online
        ? (detail && /^https?:\/\//i.test(detail) ? detail : 'https://meet.google.com/abc-xyz-123')
        : undefined,
    };
  });

  // Load recent assignments
  const [recentAssignments, setRecentAssignments] = useState<any[]>([]);

  useEffect(() => {
    const loadAssignments = async () => {
      try {
        setIsLoadingAssignments(true);
        // Use the paginated API endpoint directly with per_page=5
        const assignmentsResponse = await tutorApi.getAssignments({ per_page: 5 });
        
        // Extract assignments from the response
        const assignments = assignmentsResponse?.assignments || [];
        
        // Transform assignments using data already included in the API response
        const transformedAssignments = assignments.map((assignment: any) => {
          // The API already includes submissions_count, total_students, and class_model
          const submissionsCount = assignment.submissions_count || 0;
          const totalStudents = assignment.total_students || (assignment.class_model?.enrolled || 0);
          const className = assignment.class_model?.name || 'Class';
          
          return {
            id: String(assignment.id),
            title: assignment.title,
            class: className,
            dueDate: assignment.due_date,
            submissions: submissionsCount,
            totalStudents: totalStudents,
            status: assignment.status,
          };
        });
        
        setRecentAssignments(transformedAssignments);
      } catch (error) {
        console.error('Failed to load assignments:', error);
        setRecentAssignments([]);
      } finally {
        setIsLoadingAssignments(false);
      }
    };

    if (!isLoading) {
      loadAssignments();
    }
  }, [isLoading]);

  return (
    <div className="flex-1 space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Tutor Dashboard</h1>
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
          <>
            <Card className="border-primary/20 shadow-sm hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Students</CardTitle>
                <Users className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalStudents}</div>
                <p className="text-xs text-muted-foreground">Across all classes</p>
              </CardContent>
            </Card>
            
            <Card className="border-success/20 shadow-sm hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Classes</CardTitle>
                <BookOpen className="h-4 w-4 text-success" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.activeClasses}</div>
                <p className="text-xs text-muted-foreground">This semester</p>
              </CardContent>
            </Card>
            
            <Card className="border-warning/20 shadow-sm hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pending Assignments</CardTitle>
                <FileText className="h-4 w-4 text-warning" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.pendingAssignments}</div>
                <p className="text-xs text-muted-foreground">To review</p>
              </CardContent>
            </Card>
            
            <Card className="border-secondary/20 shadow-sm hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Today's Classes</CardTitle>
                <Calendar className="h-4 w-4 text-secondary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.todaysClasses}</div>
                <p className="text-xs text-muted-foreground">Scheduled</p>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Upcoming Classes */}
        <Card>
          <CardHeader>
            <CardTitle>Today's Classes</CardTitle>
            <CardDescription>Your scheduled classes for today</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {isLoading ? (
              <div className="flex items-center justify-center p-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : upcomingClasses.length > 0 ? (
              upcomingClasses.map((classItem) => (
                <div key={classItem.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="space-y-1">
                    <h4 className="font-semibold">{classItem.name}</h4>
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Clock className="mr-1 h-3 w-3" />
                      {classItem.time}
                      <span className="mx-2">•</span>
                      <Users className="mr-1 h-3 w-3" />
                      {classItem.students} students
                    </div>
                    {classItem.room && <p className="text-sm text-muted-foreground">{classItem.room}</p>}
                  </div>
                  {classItem.meetingLink && (
                    <Button size="sm" asChild>
                      <a href={classItem.meetingLink} target="_blank" rel="noopener noreferrer">
                        Join Meeting
                      </a>
                    </Button>
                  )}
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">No upcoming classes today</p>
            )}
          </CardContent>
        </Card>

        {/* Recent Assignments */}
        <Card>
          <CardHeader>
            <CardTitle>Assignment Overview</CardTitle>
            <CardDescription>Track student submissions and grading</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {isLoadingAssignments ? (
              <div className="flex items-center justify-center p-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : recentAssignments.length > 0 ? (
              recentAssignments.map((assignment) => (
                <div key={assignment.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="space-y-1">
                    <h4 className="font-semibold">{assignment.title}</h4>
                    <p className="text-sm text-muted-foreground">{assignment.class}</p>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">
                        {assignment.submissions}/{assignment.totalStudents} submitted
                      </Badge>
                      <Badge variant={assignment.status === 'published' ? 'default' : 'secondary'}>
                        {assignment.status}
                      </Badge>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => navigate(`/tutor/assignments/${assignment.id}`)}>
                    Review
                  </Button>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">No recent assignments</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common tasks for tutors</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 flex-wrap">
            <Button variant="outline" onClick={() => navigate('/tutor/assignments')}>
              <FileText className="mr-2 h-4 w-4" />
              Create Assignment
            </Button>

            <Button variant="outline" onClick={() => navigate('/tutor/students')}>
              <Users className="mr-2 h-4 w-4" />
              View All Students
            </Button>

            <Button variant="outline" onClick={() => navigate('/tutor/messaging')}>
              <MessageSquare className="mr-2 h-4 w-4" />
              Send Message
            </Button>

            <Button variant="outline" onClick={() => navigate('/tutor/classes')}>
              <Calendar className="mr-2 h-4 w-4" />
              Schedule Meeting
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TutorDashboard;