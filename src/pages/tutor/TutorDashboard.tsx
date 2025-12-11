import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Users, FileText, Clock, BookOpen, MessageSquare, Plus, Mail, Video, ExternalLink, Palette, BookMarked, Library } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import classesData from '@/data/classes.json';

const TutorDashboard = () => {
  const { toast } = useToast();
  const [isScheduleOpen, setIsScheduleOpen] = useState(false);
  const [isCreateAssignmentOpen, setIsCreateAssignmentOpen] = useState(false);
  const [isMessageOpen, setIsMessageOpen] = useState(false);
  
  const [newSession, setNewSession] = useState({
    title: '',
    date: '',
    time: '',
    class: '',
  });

  const [newAssignment, setNewAssignment] = useState({
    title: '',
    class: '',
    dueDate: '',
    description: '',
  });

  const [newMessage, setNewMessage] = useState({
    recipient: '',
    subject: '',
    message: '',
  });

  const myClasses = classesData.filter(cls => cls.tutorId === 'tutor-1');

  const handleScheduleClass = () => {
    if (!newSession.title || !newSession.date || !newSession.time || !newSession.class) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Class Scheduled",
      description: `${newSession.title} has been scheduled successfully.`,
    });
    setNewSession({ title: '', date: '', time: '', class: '' });
    setIsScheduleOpen(false);
  };

  const handleCreateAssignment = () => {
    if (!newAssignment.title || !newAssignment.class || !newAssignment.dueDate) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Assignment Created",
      description: `${newAssignment.title} has been created successfully.`,
    });
    setNewAssignment({ title: '', class: '', dueDate: '', description: '' });
    setIsCreateAssignmentOpen(false);
  };

  const handleSendMessage = () => {
    if (!newMessage.recipient || !newMessage.subject || !newMessage.message) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Message Sent",
      description: `Message sent to ${newMessage.recipient} successfully.`,
    });
    setNewMessage({ recipient: '', subject: '', message: '' });
    setIsMessageOpen(false);
  };

  const handleViewStudents = () => {
    toast({
      title: "Redirecting",
      description: "Opening student management page.",
    });
  };

  const handleScheduleMeeting = () => {
    toast({
      title: "Meeting Scheduler",
      description: "Opening meeting scheduler.",
    });
  };
  const stats = {
    totalStudents: 28,
    activeClasses: 4,
    pendingAssignments: 6,
    todaysClasses: 2,
  };

  const quickTools = [
    { 
      name: 'MS Teams', 
      icon: Video, 
      url: 'https://teams.microsoft.com', 
      color: 'text-blue-600',
      bgColor: 'bg-blue-100 dark:bg-blue-950'
    },
    { 
      name: 'Email', 
      icon: Mail, 
      url: 'mailto:', 
      color: 'text-green-600',
      bgColor: 'bg-green-100 dark:bg-green-950'
    },
    { 
      name: 'Canva', 
      icon: Palette, 
      url: 'https://www.canva.com', 
      color: 'text-purple-600',
      bgColor: 'bg-purple-100 dark:bg-purple-950'
    },
    { 
      name: 'Library Resources', 
      icon: BookMarked, 
      url: '/tutor/resources', 
      color: 'text-orange-600',
      bgColor: 'bg-orange-100 dark:bg-orange-950'
    },
  ];

  const upcomingClasses = [
    {
      id: "1",
      name: "Advanced Mathematics",
      time: "10:00 AM",
      students: 8,
      room: "Room A-101",
      meetingLink: "https://meet.google.com/abc-xyz-123"
    },
    {
      id: "2", 
      name: "Physics Fundamentals",
      time: "2:00 PM",
      students: 6,
      room: "Room B-203",
      meetingLink: "https://meet.google.com/def-uvw-456"
    }
  ];

  const recentAssignments = [
    {
      id: "1",
      title: "Calculus Problem Set #3",
      class: "Advanced Mathematics",
      dueDate: "2024-01-20",
      submissions: 6,
      totalStudents: 8,
      status: "active"
    },
    {
      id: "2",
      title: "Physics Lab Report",
      class: "Physics Fundamentals",
      dueDate: "2024-01-22",
      submissions: 4,
      totalStudents: 6,
      status: "active"
    }
  ];

  return (
    <div className="flex-1 space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Tutor Dashboard</h1>
        <Dialog open={isScheduleOpen} onOpenChange={setIsScheduleOpen}>
          <DialogTrigger asChild>
            <Button>
              <Calendar className="mr-2 h-4 w-4" />
              Schedule Class
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Schedule New Class</DialogTitle>
              <DialogDescription>
                Schedule a new class session for your students
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="title">Session Title</Label>
                <Input
                  id="title"
                  value={newSession.title}
                  onChange={(e) => setNewSession(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="e.g., Advanced React Patterns"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="class">Class</Label>
                <Select value={newSession.class} onValueChange={(value) => setNewSession(prev => ({ ...prev, class: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a class" />
                  </SelectTrigger>
                  <SelectContent>
                    {myClasses.map(cls => (
                      <SelectItem key={cls.id} value={cls.id}>{cls.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="date">Date</Label>
                  <Input
                    id="date"
                    type="date"
                    value={newSession.date}
                    onChange={(e) => setNewSession(prev => ({ ...prev, date: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="time">Time</Label>
                  <Input
                    id="time"
                    type="time"
                    value={newSession.time}
                    onChange={(e) => setNewSession(prev => ({ ...prev, time: e.target.value }))}
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleScheduleClass}>Schedule Class</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
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
      </div>

      {/* Quick Tools Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Library className="h-5 w-5" />
            Quick Tools
          </CardTitle>
          <CardDescription>Access frequently used tools and resources</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
            {quickTools.map((tool) => {
              const Icon = tool.icon;
              return (
                <a
                  key={tool.name}
                  href={tool.url}
                  target={tool.url.startsWith('http') ? '_blank' : '_self'}
                  rel={tool.url.startsWith('http') ? 'noopener noreferrer' : ''}
                  className="flex items-center gap-3 p-4 rounded-lg border hover:bg-accent transition-colors group"
                >
                  <div className={`p-2 rounded-lg ${tool.bgColor} group-hover:scale-110 transition-transform`}>
                    <Icon className={`h-5 w-5 ${tool.color}`} />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-sm">{tool.name}</p>
                  </div>
                  <ExternalLink className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                </a>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Upcoming Classes */}
        <Card>
          <CardHeader>
            <CardTitle>Today's Classes</CardTitle>
            <CardDescription>Your scheduled classes for today</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {upcomingClasses.map((classItem) => (
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
                  <p className="text-sm text-muted-foreground">{classItem.room}</p>
                </div>
                <Button size="sm" asChild>
                  <a href={classItem.meetingLink} target="_blank" rel="noopener noreferrer">
                    Join Meeting
                  </a>
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Recent Assignments */}
        <Card>
          <CardHeader>
            <CardTitle>Assignment Overview</CardTitle>
            <CardDescription>Track student submissions and grading</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {recentAssignments.map((assignment) => (
              <div key={assignment.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="space-y-1">
                  <h4 className="font-semibold">{assignment.title}</h4>
                  <p className="text-sm text-muted-foreground">{assignment.class}</p>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">
                      {assignment.submissions}/{assignment.totalStudents} submitted
                    </Badge>
                    <Badge variant={assignment.status === 'active' ? 'default' : 'secondary'}>
                      {assignment.status}
                    </Badge>
                  </div>
                </div>
                <Button variant="outline" size="sm">
                  Review
                </Button>
              </div>
            ))}
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
            <Dialog open={isCreateAssignmentOpen} onOpenChange={setIsCreateAssignmentOpen}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <FileText className="mr-2 h-4 w-4" />
                  Create Assignment
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[525px]">
                <DialogHeader>
                  <DialogTitle>Create New Assignment</DialogTitle>
                  <DialogDescription>
                    Create a new assignment for your students
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="assignment-title">Assignment Title</Label>
                    <Input
                      id="assignment-title"
                      value={newAssignment.title}
                      onChange={(e) => setNewAssignment(prev => ({ ...prev, title: e.target.value }))}
                      placeholder="e.g., React Component Architecture"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="assignment-class">Class</Label>
                    <Select value={newAssignment.class} onValueChange={(value) => setNewAssignment(prev => ({ ...prev, class: value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a class" />
                      </SelectTrigger>
                      <SelectContent>
                        {myClasses.map(cls => (
                          <SelectItem key={cls.id} value={cls.id}>{cls.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="due-date">Due Date</Label>
                    <Input
                      id="due-date"
                      type="date"
                      value={newAssignment.dueDate}
                      onChange={(e) => setNewAssignment(prev => ({ ...prev, dueDate: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="assignment-description">Description</Label>
                    <Textarea
                      id="assignment-description"
                      value={newAssignment.description}
                      onChange={(e) => setNewAssignment(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Assignment instructions and requirements..."
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button onClick={handleCreateAssignment}>Create Assignment</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Button variant="outline" onClick={handleViewStudents}>
              <Users className="mr-2 h-4 w-4" />
              View All Students
            </Button>

            <Dialog open={isMessageOpen} onOpenChange={setIsMessageOpen}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <MessageSquare className="mr-2 h-4 w-4" />
                  Send Message
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Send Message</DialogTitle>
                  <DialogDescription>
                    Send a message to students or parents
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="recipient">Recipient</Label>
                    <Select value={newMessage.recipient} onValueChange={(value) => setNewMessage(prev => ({ ...prev, recipient: value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select recipient" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Emma Thompson">Emma Thompson (Student)</SelectItem>
                        <SelectItem value="James Rodriguez">James Rodriguez (Student)</SelectItem>
                        <SelectItem value="Robert Thompson">Robert Thompson (Parent)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="message-subject">Subject</Label>
                    <Input
                      id="message-subject"
                      value={newMessage.subject}
                      onChange={(e) => setNewMessage(prev => ({ ...prev, subject: e.target.value }))}
                      placeholder="Message subject"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="message-body">Message</Label>
                    <Textarea
                      id="message-body"
                      value={newMessage.message}
                      onChange={(e) => setNewMessage(prev => ({ ...prev, message: e.target.value }))}
                      placeholder="Type your message here..."
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button onClick={handleSendMessage}>Send Message</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Button variant="outline" onClick={handleScheduleMeeting}>
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