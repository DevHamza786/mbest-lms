import { useState } from 'react';
import { BookOpen, Clock, CheckCircle, AlertCircle, Calendar, TrendingUp, FileText, MessageSquare } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { JoinClassModal } from '@/components/modals/JoinClassModal';
import { QuickActionsModal } from '@/components/modals/QuickActionsModal';
import { useNavigate } from 'react-router-dom';

export default function StudentDashboard() {
  const navigate = useNavigate();
  const [joinClassModal, setJoinClassModal] = useState<{ isOpen: boolean; classDetails: any }>({
    isOpen: false,
    classDetails: null,
  });
  const [quickActionsModal, setQuickActionsModal] = useState(false);
  
  const handleJoinClass = (classItem: any) => {
    setJoinClassModal({
      isOpen: true,
      classDetails: {
        id: classItem.id,
        name: classItem.name,
        tutor: classItem.tutor,
        time: classItem.time,
        room: classItem.room,
        meetingLink: 'https://meet.google.com/abc-def-123',
        status: classItem.status,
      },
    });
  };
  const stats = [
    {
      title: 'Enrolled Classes',
      value: '3',
      description: 'Active courses',
      icon: BookOpen,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      title: 'Assignments Due',
      value: '2',
      description: 'This week',
      icon: Clock,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
    },
    {
      title: 'Completed',
      value: '18',
      description: 'Total assignments',
      icon: CheckCircle,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
    {
      title: 'Overall Grade',
      value: '92%',
      description: 'Average score',
      icon: TrendingUp,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
    },
  ];

  const upcomingClasses = [
    {
      id: 1,
      name: 'Advanced Web Development',
      time: '10:00 AM - 11:30 AM',
      room: 'Lab 301',
      tutor: 'Dr. Michael Rodriguez',
      status: 'today',
    },
    {
      id: 2,
      name: 'Data Structures & Algorithms',
      time: '2:00 PM - 3:30 PM',
      room: 'Room 305',
      tutor: 'Dr. Michael Rodriguez',
      status: 'today',
    },
    {
      id: 3,
      name: 'Advanced Web Development',
      time: '10:00 AM - 11:30 AM',
      room: 'Lab 301',
      tutor: 'Dr. Michael Rodriguez',
      status: 'tomorrow',
    },
  ];

  const recentAssignments = [
    {
      id: 1,
      title: 'React Component Architecture',
      course: 'Advanced Web Development',
      dueDate: '2024-03-15',
      status: 'submitted',
      grade: 92,
    },
    {
      id: 2,
      title: 'Binary Search Tree Implementation',
      course: 'Data Structures & Algorithms',
      dueDate: '2024-03-20',
      status: 'pending',
      grade: null,
    },
    {
      id: 3,
      title: 'Database Design Project',
      course: 'Advanced Web Development',
      dueDate: '2024-03-25',
      status: 'draft',
      grade: null,
    },
  ];

  const announcements = [
    {
      id: 1,
      title: 'Room Change Notice',
      message: 'Advanced Web Development class moved to Lab 301',
      time: '2 hours ago',
      important: true,
    },
    {
      id: 2,
      title: 'Assignment Feedback Available',
      message: 'Your React Component Architecture has been graded',
      time: '1 day ago',
      important: false,
    },
    {
      id: 3,
      title: 'Study Group Session',
      message: 'Optional study session this Friday at 3 PM',
      time: '2 days ago',
      important: false,
    },
  ];

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
        {stats.map((stat) => {
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
        })}
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