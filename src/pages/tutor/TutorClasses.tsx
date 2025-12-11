import { useState } from 'react';
import { Calendar, Users, Clock, MapPin, Plus, Settings, Video, FileText } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import classesData from '@/data/classes.json';

interface Session {
  id: string;
  title: string;
  date: string;
  time: string;
  duration: string;
  room: string;
  meetingLink: string;
  attendees: number;
  maxAttendees: number;
  status: 'scheduled' | 'live' | 'completed';
}

export default function TutorClasses() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreateSessionOpen, setIsCreateSessionOpen] = useState(false);
  const [newSession, setNewSession] = useState({
    title: '',
    date: '',
    time: '',
    duration: '60',
    room: '',
    description: '',
    classId: '',
  });

  // Mock sessions data
  const [sessions, setSessions] = useState<Session[]>([
    {
      id: '1',
      title: 'Advanced React Patterns',
      date: '2024-01-20',
      time: '10:00 AM',
      duration: '90 min',
      room: 'Lab 204',
      meetingLink: 'https://meet.google.com/abc-def-ghi',
      attendees: 8,
      maxAttendees: 20,
      status: 'scheduled'
    },
    {
      id: '2',
      title: 'Data Structures Review',
      date: '2024-01-20',
      time: '2:00 PM',
      duration: '60 min',
      room: 'Room 305',
      meetingLink: 'https://meet.google.com/def-ghi-jkl',
      attendees: 15,
      maxAttendees: 25,
      status: 'live'
    },
    {
      id: '3',
      title: 'Algorithm Analysis',
      date: '2024-01-19',
      time: '11:00 AM',
      duration: '75 min',
      room: 'Room 305',
      meetingLink: 'https://meet.google.com/ghi-jkl-mno',
      attendees: 22,
      maxAttendees: 25,
      status: 'completed'
    }
  ]);

  const myClasses = classesData.filter(cls => cls.tutorId === 'tutor-1');

  const handleCreateSession = () => {
    if (!newSession.title || !newSession.date || !newSession.time || !newSession.classId) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    const session: Session = {
      id: Date.now().toString(),
      title: newSession.title,
      date: newSession.date,
      time: newSession.time,
      duration: newSession.duration + ' min',
      room: newSession.room || 'Online',
      meetingLink: `https://meet.google.com/${Math.random().toString(36).substr(2, 9)}`,
      attendees: 0,
      maxAttendees: 25,
      status: 'scheduled'
    };

    setSessions(prev => [...prev, session]);
    setNewSession({
      title: '',
      date: '',
      time: '',
      duration: '60',
      room: '',
      description: '',
      classId: '',
    });
    setIsCreateSessionOpen(false);

    toast({
      title: "Session Created",
      description: "Your session has been scheduled successfully.",
    });
  };

  const getStatusColor = (status: Session['status']) => {
    switch (status) {
      case 'scheduled': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'live': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'completed': return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  const filteredSessions = sessions.filter(session =>
    session.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex-1 space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Classes</h1>
          <p className="text-muted-foreground">
            Manage your classes and create sessions for your students
          </p>
        </div>
        <Dialog open={isCreateSessionOpen} onOpenChange={setIsCreateSessionOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create Session
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[525px]">
            <DialogHeader>
              <DialogTitle>Create New Session</DialogTitle>
              <DialogDescription>
                Schedule a new session for your students
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
                <Select value={newSession.classId} onValueChange={(value) => setNewSession(prev => ({ ...prev, classId: value }))}>
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

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="duration">Duration (minutes)</Label>
                  <Select value={newSession.duration} onValueChange={(value) => setNewSession(prev => ({ ...prev, duration: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="30">30 minutes</SelectItem>
                      <SelectItem value="45">45 minutes</SelectItem>
                      <SelectItem value="60">60 minutes</SelectItem>
                      <SelectItem value="90">90 minutes</SelectItem>
                      <SelectItem value="120">120 minutes</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="room">Room (Optional)</Label>
                  <Input
                    id="room"
                    value={newSession.room}
                    onChange={(e) => setNewSession(prev => ({ ...prev, room: e.target.value }))}
                    placeholder="e.g., Lab 204"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description (Optional)</Label>
                <Textarea
                  id="description"
                  value={newSession.description}
                  onChange={(e) => setNewSession(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Add session notes or agenda..."
                />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleCreateSession}>Create Session</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="sessions" className="space-y-4">
        <TabsList>
          <TabsTrigger value="sessions">Sessions</TabsTrigger>
          <TabsTrigger value="classes">Classes Overview</TabsTrigger>
        </TabsList>

        <TabsContent value="sessions" className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search sessions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-sm"
              />
            </div>
          </div>

          <div className="grid gap-4">
            {filteredSessions.map((session) => (
              <Card key={session.id}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-lg">{session.title}</h3>
                        <Badge className={getStatusColor(session.status)}>
                          {session.status}
                        </Badge>
                      </div>
                      
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {session.date}
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          {session.time} ({session.duration})
                        </div>
                        <div className="flex items-center gap-1">
                          <MapPin className="h-4 w-4" />
                          {session.room}
                        </div>
                        <div className="flex items-center gap-1">
                          <Users className="h-4 w-4" />
                          {session.attendees}/{session.maxAttendees} attendees
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {session.status === 'live' && (
                        <Button size="sm" asChild>
                          <a href={session.meetingLink} target="_blank" rel="noopener noreferrer">
                            <Video className="mr-2 h-4 w-4" />
                            Join Live
                          </a>
                        </Button>
                      )}
                      {session.status === 'scheduled' && (
                        <>
                          <Button size="sm" variant="outline" asChild>
                            <a href={session.meetingLink} target="_blank" rel="noopener noreferrer">
                              <Video className="mr-2 h-4 w-4" />
                              Meeting Link
                            </a>
                          </Button>
                          <Button size="sm" variant="outline">
                            <Settings className="mr-2 h-4 w-4" />
                            Edit
                          </Button>
                        </>
                      )}
                      {session.status === 'completed' && (
                        <Button size="sm" variant="outline">
                          <FileText className="mr-2 h-4 w-4" />
                          View Summary
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="classes" className="space-y-4">
          <div className="grid gap-6 md:grid-cols-2">
            {myClasses.map((classItem) => (
              <Card key={classItem.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle>{classItem.name}</CardTitle>
                      <CardDescription className="mt-1">
                        {classItem.code} • {classItem.level}
                      </CardDescription>
                    </div>
                    <Badge variant="secondary">{classItem.status}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">{classItem.description}</p>
                  
                  <div className="space-y-2">
                    <div className="flex items-center text-sm">
                      <Users className="mr-2 h-4 w-4" />
                      {classItem.enrolled}/{classItem.capacity} students enrolled
                    </div>
                    <div className="flex items-center text-sm">
                      <Calendar className="mr-2 h-4 w-4" />
                      {classItem.schedule.days.join(', ')} • {classItem.schedule.time}
                    </div>
                    <div className="flex items-center text-sm">
                      <MapPin className="mr-2 h-4 w-4" />
                      {classItem.schedule.room}
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <Button size="sm" variant="outline">View Students</Button>
                    <Button size="sm" variant="outline">Manage</Button>
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