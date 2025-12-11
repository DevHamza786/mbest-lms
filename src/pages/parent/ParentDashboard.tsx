import { useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress"; 
import { BookOpen, Calendar, FileText, GraduationCap, Clock, MessageSquare, AlertCircle, Eye } from "lucide-react";
import { ChildSwitcher } from '@/components/parent/ChildSwitcher';
import { useParentContext, useParentStore } from '@/lib/store/parentStore';
import { parentService } from '@/lib/mocks/parent';
import { useNavigate } from 'react-router-dom';

const ParentDashboard = () => {
  const navigate = useNavigate();
  const {
    children,
    activeChild,
    stats,
    classes,
    grades,
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
    setAssignments,
    setLoading,
  } = useParentStore();

  // Load initial data
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const childrenData = await parentService.getChildren();
        setChildren(childrenData);
      } catch (error) {
        console.error('Failed to load children:', error);
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
        const [statsData, classesData, gradesData, assignmentsData] = await Promise.all([
          parentService.getStatsForChild(activeChild.id),
          parentService.getClassesForChild(activeChild.id),
          parentService.getGradesForChild(activeChild.id),
          parentService.getAssignmentsForChild(activeChild.id),
        ]);

        setStats(statsData);
        setClasses(classesData);
        setGrades(gradesData);
        setAssignments(assignmentsData);
      } catch (error) {
        console.error('Failed to load child data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadChildData();
  }, [activeChild?.id, setStats, setClasses, setGrades, setAssignments, setLoading]);

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

  // Get recent grades (last 3)
  const recentGrades = grades?.slice(0, 3).map(grade => ({
    id: grade.id,
    subject: grade.subject,
    assignment: grade.assessment,
    grade: grade.grade,
    maxGrade: grade.maxGrade,
    date: grade.date,
    status: getGradeStatus(grade.grade)
  })) || [];

  // Get today's classes (filter active classes, but don't allow joining)
  const todaysClasses = classes?.filter(cls => cls.status === 'active').slice(0, 2) || [];

  if (isLoading && !activeChild) {
    return (
      <div className="flex-1 space-y-6 p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-muted-foreground">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!activeChild) {
    return (
      <div className="flex-1 space-y-6 p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">No Child Selected</h2>
            <p className="text-muted-foreground">Please select a child to view their dashboard.</p>
          </div>
        </div>
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
                <span className="text-sm text-muted-foreground">{stats?.overallGrade || 0}%</span>
              </div>
              <Progress value={stats?.overallGrade || 0} className="h-2" />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm font-medium">Attendance Rate</span>
                <span className="text-sm text-muted-foreground">{stats?.attendanceRate || 0}%</span>
              </div>
              <Progress value={stats?.attendanceRate || 0} className="h-2" />
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
            <CardTitle className="text-sm font-medium">Active Assignments</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.activeAssignments || 0}</div>
            <p className="text-xs text-muted-foreground">Currently due</p>
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

      <div className="grid gap-6 md:grid-cols-2">
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

        {/* Today's Classes */}
        <Card>
          <CardHeader>
            <CardTitle>Today's Schedule</CardTitle>
            <CardDescription>Classes scheduled for today</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {todaysClasses.length > 0 ? (
              todaysClasses.map((classItem) => (
                <div key={classItem.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="space-y-1">
                    <h4 className="font-semibold">{classItem.name}</h4>
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Clock className="mr-1 h-3 w-3" />
                      {classItem.schedule}
                      <span className="mx-2">•</span>
                      <span>with {classItem.tutor}</span>
                    </div>
                    {classItem.room && (
                      <p className="text-xs text-muted-foreground">Room: {classItem.room}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {classItem.isLive && (
                      <Badge variant="destructive" className="animate-pulse">
                        Live
                      </Badge>
                    )}
                    <Button size="sm" variant="outline" disabled>
                      <Eye className="mr-2 h-4 w-4" />
                      View Only (Parent Access)
                    </Button>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No classes scheduled for today</p>
              </div>
            )}
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
    </div>
  );
};

export default ParentDashboard;