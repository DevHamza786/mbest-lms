import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress"; 
import { BookOpen, Calendar, FileText, GraduationCap, Clock, MessageSquare, AlertCircle, Eye } from "lucide-react";
import { ChildSwitcher } from '@/components/parent/ChildSwitcher';
import { useParentContext, useParentStore } from '@/lib/store/parentStore';
import { parentApi } from '@/lib/api';
import { useNavigate } from 'react-router-dom';
import { AddStudentModal } from '@/components/modals/AddStudentModal';
import { Plus } from 'lucide-react';

const ParentDashboard = () => {
  const navigate = useNavigate();
  const [isAddStudentModalOpen, setIsAddStudentModalOpen] = useState(false);
  const {
    children,
    activeChild,
    stats,
    classes,
    grades,
    upcomingSessions,
    assignments,
    isLoading,
    unreadMessages,
    overdueInvoices,
  } = useParentContext();

  const {
    setChildren,
    setStats,
    setClasses,
    setGrades,
    setUpcomingSessions,
    setAssignments,
    setLoading,
  } = useParentStore();

  // Load initial data from dashboard API
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const dashboardData = await parentApi.getDashboard();
        
        // Map API response to store format
        let mappedChildren: any[] = [];
        
        // Always try to load children - check dashboard first, then fallback to direct API
        if (dashboardData && dashboardData.children && Array.isArray(dashboardData.children) && dashboardData.children.length > 0) {
          mappedChildren = dashboardData.children.map((child: any) => ({
            id: String(child.id),
            name: child.user?.name || child.name || 'Unknown',
            grade: child.grade || 'N/A',
            avatar: child.user?.avatar || child.avatar || undefined,
          }));
        }
        
        // If no children from dashboard, try direct API call
        if (mappedChildren.length === 0) {
          try {
            const childrenData = await parentApi.getChildren();
            if (childrenData && Array.isArray(childrenData) && childrenData.length > 0) {
              mappedChildren = childrenData.map(child => ({
                id: String(child.id),
                name: child.user?.name || 'Unknown',
                grade: child.grade || 'N/A',
                avatar: child.user?.avatar || undefined,
              }));
            }
          } catch (err) {
            console.error('Failed to fetch children from API:', err);
          }
        }
        
        // Set children in store - this will automatically select first child if none selected
        if (mappedChildren.length > 0) {
          setChildren(mappedChildren);
        } else {
          setChildren([]);
        }
        
        // Ensure we have an active child - use dashboard's active_child or first child
        if (mappedChildren.length > 0) {
          const currentActiveId = useParentStore.getState().activeChildId;
          let activeChildId: string;
          
          // Use active_child from dashboard if available, otherwise use first child
          if (dashboardData.active_child && dashboardData.active_child.id) {
            activeChildId = String(dashboardData.active_child.id);
          } else {
            activeChildId = mappedChildren[0].id;
          }
          
          // Set active child if we don't have one or if it's different
          if (!currentActiveId || currentActiveId !== activeChildId) {
            useParentStore.getState().setActiveChild(activeChildId);
          }
        }
      } catch (error) {
        console.error('Failed to load dashboard:', error);
        // Try to load children directly if dashboard fails
        try {
          const childrenData = await parentApi.getChildren();
          if (childrenData && Array.isArray(childrenData) && childrenData.length > 0) {
            const mappedChildren = childrenData.map(child => ({
              id: String(child.id),
              name: child.user?.name || 'Unknown',
              grade: child.grade || 'N/A',
              avatar: child.user?.avatar,
            }));
            setChildren(mappedChildren);
          } else {
            setChildren([]);
          }
        } catch (err) {
          console.error('Failed to load children as fallback:', err);
          setChildren([]);
        }
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [setChildren, setLoading]);

  // Load child-specific data when active child changes
  useEffect(() => {
    if (!activeChild?.id) return;

    const loadChildData = async () => {
      try {
        setLoading(true);
        const childId = Number(activeChild.id);
        
        // Try to get stats from dashboard first, then fallback to individual API
        let statsData;
        try {
          const dashboardData = await parentApi.getDashboard();
          if (dashboardData.stats && dashboardData.active_child?.id === childId) {
            statsData = dashboardData.stats;
          } else {
            statsData = await parentApi.getChildStats(childId);
          }
        } catch {
          statsData = await parentApi.getChildStats(childId);
        }
        
        const [classesData, gradesResponse, assignmentsResponse] = await Promise.all([
          parentApi.getChildClasses(childId),
          parentApi.getChildGrades(childId).catch(err => {
            console.error('Failed to load grades:', err);
            return { grades: [], statistics: {} };
          }),
          parentApi.getChildAssignments(childId).catch(err => {
            console.error('Failed to load assignments:', err);
            return [];
          }),
        ]);

        // Extract grades from response (handle both possible structures)
        const gradesData = gradesResponse?.grades || gradesResponse?.data || [];

        // Handle assignments response - could be array or paginated object
        let assignmentsArray = [];
        if (Array.isArray(assignmentsResponse)) {
          assignmentsArray = assignmentsResponse;
        } else if (assignmentsResponse && assignmentsResponse.data && Array.isArray(assignmentsResponse.data)) {
          assignmentsArray = assignmentsResponse.data;
        } else if (assignmentsResponse && Array.isArray(assignmentsResponse)) {
          assignmentsArray = assignmentsResponse;
        }

        // Map API responses to store format
        setStats({
          overallGrade: parseFloat(statsData.overall_grade || 0),
          attendanceRate: parseFloat(statsData.attendance_rate || 0),
          enrolledClasses: statsData.enrolled_classes,
          activeAssignments: statsData.active_assignments,
          completedAssignments: assignmentsArray.filter((a: any) => {
            const submission = a.submissions?.[0];
            return submission && submission.status === 'submitted';
          }).length,
          upcomingTests: 0, // Can be calculated from assignments if needed
        });
        
        setClasses((classesData || []).map(cls => ({
          id: String(cls.id),
          name: cls.name,
          tutor: cls.tutor?.user?.name || 'Unknown',
          schedule: (cls.schedules || []).map(s => `${s.day_of_week} ${s.start_time}-${s.end_time}`).join(', '),
          scheduleCount: cls.schedules?.length || 0,
          scheduleData: cls.schedules,
          room: cls.schedules?.[0]?.room,
          meetingLink: cls.schedules?.[0]?.meeting_link,
          status: cls.status as any,
          isLive: false,
        })));
        
        setGrades((gradesData || []).map(g => ({
          id: String(g.id),
          subject: g.subject,
          assessment: g.assessment,
          grade: g.grade,
          maxGrade: g.max_grade,
          date: g.date,
          category: g.category || '',
        })));

        // Load upcoming sessions from dashboard
        try {
          const dashboardData = await parentApi.getDashboard();
          if (dashboardData.upcoming_sessions && Array.isArray(dashboardData.upcoming_sessions)) {
            setUpcomingSessions(dashboardData.upcoming_sessions.map((s: any) => ({
              id: String(s.id),
              class_id: String(s.class_id),
              class_name: s.class_name,
              class_code: s.class_code,
              date: s.date,
              day_name: s.day_name,
              start_time: s.start_time,
              end_time: s.end_time,
              location: s.location,
              subject: s.subject,
              teacher_name: s.teacher_name,
              view_url: s.view_url,
            })));
          }
        } catch (err) {
          console.error('Failed to load upcoming sessions:', err);
        }

        setAssignments(assignmentsArray.map((a: any) => {
          const submission = a.submissions?.[0];
          let status: 'due' | 'submitted' | 'late' | 'graded' = 'due';
          if (submission) {
            if (submission.status === 'graded') status = 'graded';
            else if (submission.status === 'submitted') status = 'submitted';
          }
          
          return {
            id: String(a.id),
            title: a.title,
            subject: (a.class && a.class.category) ? a.class.category : 'Unknown',
            dueDate: a.due_date,
            status,
            grade: submission?.grade,
            maxGrade: a.max_points,
            feedback: submission?.feedback,
          };
        }));
      } catch (error) {
        console.error('Failed to load child data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadChildData();
  }, [activeChild?.id, setStats, setClasses, setGrades, setUpcomingSessions, setAssignments, setLoading]);

  const getGradeColor = (grade: number) => {
    if (grade >= 90) return 'bg-green-500';
    if (grade >= 80) return 'bg-blue-500';
    if (grade >= 70) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getGradeStatus = (grade: number) => {
    if (grade >= 90) return 'excellent';
    if (grade >= 80) return 'good';
    if (grade >= 70) return 'average';
    return 'needs improvement';
  };

  // Format date to show only date part
  const formatDateOnly = (dateString: string) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      // If it's already in YYYY-MM-DD format, just return it
      return dateString.split('T')[0];
    }
  };

  // Get recent grades (last 3)
  const recentGrades = grades?.slice(0, 3).map(grade => ({
    id: grade.id,
    subject: grade.subject,
    assignment: grade.assessment,
    grade: grade.grade,
    maxGrade: grade.maxGrade,
    date: formatDateOnly(grade.date),
    status: getGradeStatus(grade.grade)
  })) || [];

  const normalizeDayOfWeekToIndex = (dayOfWeek: unknown): number | null => {
    if (!dayOfWeek) return null;
    const s = String(dayOfWeek).trim().toLowerCase();
    if (!s) return null;

    if (s.startsWith('sun')) return 0;
    if (s.startsWith('mon')) return 1;
    if (s.startsWith('tue')) return 2;
    if (s.startsWith('wed')) return 3;
    if (s.startsWith('thu')) return 4;
    if (s.startsWith('fri')) return 5;
    if (s.startsWith('sat')) return 6;

    return null;
  };

  const todayIdx = new Date().getDay();

  // Get today's classes - based on schedule day_of_week (more robust than string matching)
  const todaysClasses =
    classes
      ?.filter((cls) => {
        if (cls.status !== 'active') return false;
        const scheduleData = (cls as any).scheduleData as Array<any> | undefined;
        if (!scheduleData || !Array.isArray(scheduleData)) return false;
        return scheduleData.some(
          (s) => normalizeDayOfWeekToIndex(s?.day_of_week) === todayIdx
        );
      })
      .slice(0, 2) || [];

  if (isLoading && !activeChild) {
    return (
      <div className="flex-1 space-y-6 p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-muted-foreground">Loading dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  const handleStudentAdded = async () => {
    // Reload children after adding a student
    try {
      const childrenData = await parentApi.getChildren();
      if (childrenData && Array.isArray(childrenData) && childrenData.length > 0) {
        const mappedChildren = childrenData.map(child => ({
          id: String(child.id),
          name: child.user?.name || 'Unknown',
          grade: child.grade || 'N/A',
          avatar: child.user?.avatar || undefined,
        }));
        setChildren(mappedChildren);
        // Auto-select the newly added child
        if (mappedChildren.length > 0) {
          useParentStore.getState().setActiveChild(mappedChildren[0].id);
        }
      }
    } catch (error) {
      console.error('Failed to reload children:', error);
    }
  };

  if (!activeChild) {
    return (
      <div className="flex-1 space-y-6 p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center max-w-md">
            <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">No Child Selected</h2>
            <p className="text-muted-foreground mb-4">
              {children.length > 0 
                ? "Please select a child using the dropdown above to view their dashboard."
                : "You haven't added any students yet. Add your first student to get started."}
            </p>
            {children.length > 0 ? (
              <div className="mt-4">
                <ChildSwitcher />
              </div>
            ) : (
              <Button onClick={() => setIsAddStudentModalOpen(true)} className="mt-4">
                <Plus className="mr-2 h-4 w-4" />
                Add Your First Student
              </Button>
            )}
          </div>
        </div>
        <AddStudentModal
          isOpen={isAddStudentModalOpen}
          onClose={() => setIsAddStudentModalOpen(false)}
          onSuccess={handleStudentAdded}
        />
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Parent Dashboard</h1>
          <p className="text-muted-foreground">Monitoring {activeChild.name}'s academic progress</p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={() => setIsAddStudentModalOpen(true)}
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Student
          </Button>
          <ChildSwitcher />
          <Button onClick={() => navigate('/parent/messages')}>
            <MessageSquare className="mr-2 h-4 w-4" />
            Message Tutor
            {unreadMessages > 0 && (
              <Badge variant="destructive" className="ml-2 px-1 py-0 text-xs">
                {unreadMessages}
              </Badge>
            )}
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground text-lg">Loading dashboard data...</p>
            <p className="mt-2 text-sm text-muted-foreground">Please wait while we fetch your child's information</p>
          </div>
        </div>
      ) : (
        <>

      {/* Child Overview */}
      <Card className="border-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GraduationCap className="h-5 w-5" />
            {activeChild.name} - {activeChild.grade}
          </CardTitle>
          <CardDescription>Academic overview and performance metrics</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm font-medium">Overall Grade</span>
                <span className="text-sm text-muted-foreground">{parseFloat(String(stats?.overallGrade || 0)).toFixed(2)}%</span>
              </div>
              <Progress value={parseFloat(String(stats?.overallGrade || 0))} className="h-2" />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm font-medium">Attendance Rate</span>
                <span className="text-sm text-muted-foreground">{parseFloat(String(stats?.attendanceRate || 0)).toFixed(2)}%</span>
              </div>
              <Progress value={parseFloat(String(stats?.attendanceRate || 0))} className="h-2" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Enrolled Classes</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.enrolledClasses || 0}</div>
            <p className="text-xs text-muted-foreground">This semester</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unsubmitted Assignments</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.activeAssignments || 0}</div>
            <p className="text-xs text-muted-foreground">Pending submission</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed Work</CardTitle>
            <GraduationCap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.completedAssignments || 0}</div>
            <p className="text-xs text-muted-foreground">This month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Upcoming Tests</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.upcomingTests || 0}</div>
            <p className="text-xs text-muted-foreground">Next 2 weeks</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common tasks for parents</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 flex-wrap">
            <Button variant="outline" onClick={() => navigate('/parent/classes')}>
              <Calendar className="mr-2 h-4 w-4" />
              View Schedule
            </Button>
            <Button variant="outline" onClick={() => navigate('/parent/assignments')}>
              <FileText className="mr-2 h-4 w-4" />
              Assignment Progress
            </Button>
            <Button variant="outline" onClick={() => navigate('/parent/grades')}>
              <GraduationCap className="mr-2 h-4 w-4" />
              Grade Reports
            </Button>
            <Button variant="outline" onClick={() => navigate('/parent/messages')}>
              <MessageSquare className="mr-2 h-4 w-4" />
              Contact Teachers
            </Button>
            {overdueInvoices > 0 && (
              <Button variant="destructive" onClick={() => navigate('/parent/billing')}>
                <AlertCircle className="mr-2 h-4 w-4" />
                Pay Overdue Bills ({overdueInvoices})
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
      
      {/* Recent Grades */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Grades</CardTitle>
          <CardDescription>Latest assignment and test results</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {recentGrades.map((grade) => (
            <div key={grade.id} className="flex items-center justify-between p-4 border rounded-lg">
              <div className="space-y-1">
                <h4 className="font-semibold">{grade.assignment}</h4>
                <p className="text-sm text-muted-foreground">{grade.subject}</p>
                <p className="text-xs text-muted-foreground">Submitted: {grade.date}</p>
              </div>
              <div className="text-right space-y-1">
                <div className="text-2xl font-bold">{grade.grade}%</div>
                <Badge 
                  variant="outline" 
                  className={`${getGradeColor(grade.grade)} text-white border-0`}
                >
                  {grade.status.replace('-', ' ')}
                </Badge>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Upcoming Sessions */}
      <Card>
        <CardHeader>
          <CardTitle>Upcoming Sessions</CardTitle>
          <CardDescription>Next scheduled classes</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {upcomingSessions && upcomingSessions.length > 0 ? (
            upcomingSessions.map((session) => (
              <div key={session.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="space-y-1">
                  <h4 className="font-semibold">{session.class_name}</h4>
                  <p className="text-sm text-muted-foreground">{session.subject}</p>
                  <p className="text-xs text-muted-foreground">
                    {session.day_name}, {formatDateOnly(session.date)} | {session.start_time} - {session.end_time}
                  </p>
                  {session.teacher_name && (
                    <p className="text-xs text-muted-foreground">Teacher: {session.teacher_name}</p>
                  )}
                </div>
                <div className="text-right space-y-2">
                  {session.location && (
                    <Badge variant="outline">{session.location}</Badge>
                  )}
                  {session.view_url && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate(session.view_url)}
                    >
                      <Eye className="mr-2 h-4 w-4" />
                      View
                    </Button>
                  )}
                </div>
              </div>
            ))
          ) : (
            <p className="text-muted-foreground text-center py-4">No upcoming sessions found</p>
          )}
        </CardContent>
      </Card>

        </>
      )}
      <AddStudentModal
        isOpen={isAddStudentModalOpen}
        onClose={() => setIsAddStudentModalOpen(false)}
        onSuccess={handleStudentAdded}
      />
    </div>
  );
};

export default ParentDashboard;