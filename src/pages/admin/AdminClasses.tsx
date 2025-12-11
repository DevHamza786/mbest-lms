import { useState } from 'react';
import { Search, Filter, Plus, Users, Calendar, MapPin, MoreVertical } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Sheet, 
  SheetContent, 
  SheetDescription, 
  SheetHeader, 
  SheetTitle, 
  SheetTrigger 
} from '@/components/ui/sheet';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import classesData from '@/data/classes.json';
import type { Class } from '@/lib/types/common';

export default function AdminClasses() {
  const { toast } = useToast();
  const [classes] = useState<Class[]>(classesData as Class[]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedClass, setSelectedClass] = useState<Class | null>(null);
  const [sessionNotes, setSessionNotes] = useState('');

  const filteredClasses = classes.filter(cls => {
    const matchesSearch = cls.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         cls.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         cls.tutorName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || cls.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'default';
      case 'inactive': return 'secondary';
      case 'completed': return 'outline';
      default: return 'secondary';
    }
  };

  const handleScheduleSession = (classId: string) => {
    toast({
      title: "Session Scheduled",
      description: "New session has been scheduled successfully.",
    });
  };

  const handleSaveNotes = () => {
    toast({
      title: "Notes Saved",
      description: "Session notes have been saved successfully.",
    });
    setSessionNotes('');
  };

  const upcomingSessions = [
    {
      id: '1',
      classId: 'class-1',
      className: 'Advanced Web Development',
      date: '2024-02-20',
      time: '10:00 AM',
      room: 'Lab 204',
      status: 'scheduled'
    },
    {
      id: '2',
      classId: 'class-2',
      className: 'Data Structures & Algorithms',
      date: '2024-02-21',
      time: '2:00 PM',
      room: 'Room 305',
      status: 'scheduled'
    },
  ];

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Class Management</h1>
          <p className="text-muted-foreground">
            Manage classes, sessions, and course schedules
          </p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Add Class
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search classes, codes, or tutors..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Classes</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline">
          <Filter className="mr-2 h-4 w-4" />
          More Filters
        </Button>
      </div>

      {/* Classes Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filteredClasses.map((cls) => (
          <Card key={cls.id} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-lg">{cls.name}</CardTitle>
                  <CardDescription>{cls.code}</CardDescription>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handleScheduleSession(cls.id)}>
                      Schedule Session
                    </DropdownMenuItem>
                    <DropdownMenuItem>Edit Class</DropdownMenuItem>
                    <DropdownMenuItem>View Students</DropdownMenuItem>
                    <DropdownMenuItem className="text-destructive">
                      Archive Class
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Badge variant={getStatusColor(cls.status)}>
                  {cls.status.charAt(0).toUpperCase() + cls.status.slice(1)}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  {cls.credits} credits
                </span>
              </div>

              <div className="space-y-2">
                <div className="flex items-center text-sm text-muted-foreground">
                  <Users className="mr-2 h-4 w-4" />
                  {cls.enrolled}/{cls.capacity} students
                </div>
                <div className="flex items-center text-sm text-muted-foreground">
                  <Calendar className="mr-2 h-4 w-4" />
                  {cls.schedule.days.join(', ')} • {cls.schedule.time}
                </div>
                <div className="flex items-center text-sm text-muted-foreground">
                  <MapPin className="mr-2 h-4 w-4" />
                  {cls.schedule.room}
                </div>
              </div>

              <div className="pt-2">
                <p className="text-sm font-medium text-foreground">
                  {cls.tutorName}
                </p>
                <p className="text-xs text-muted-foreground">
                  {cls.category} • {cls.level}
                </p>
              </div>

              <Sheet>
                <SheetTrigger asChild>
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => setSelectedClass(cls)}
                  >
                    View Details
                  </Button>
                </SheetTrigger>
                <SheetContent className="w-[500px] sm:w-[540px]">
                  <SheetHeader>
                    <SheetTitle>{selectedClass?.name}</SheetTitle>
                    <SheetDescription>
                      {selectedClass?.code} • {selectedClass?.tutorName}
                    </SheetDescription>
                  </SheetHeader>
                  
                  {selectedClass && (
                    <div className="space-y-6 mt-6">
                      {/* Class Info */}
                      <div className="space-y-4">
                        <h3 className="font-semibold">Class Information</h3>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-muted-foreground">Duration:</span>
                            <p className="font-medium">{selectedClass.duration}</p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Capacity:</span>
                            <p className="font-medium">{selectedClass.enrolled}/{selectedClass.capacity}</p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Start Date:</span>
                            <p className="font-medium">
                              {new Date(selectedClass.startDate).toLocaleDateString()}
                            </p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">End Date:</span>
                            <p className="font-medium">
                              {new Date(selectedClass.endDate).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Description:</span>
                          <p className="mt-1 text-sm">{selectedClass.description}</p>
                        </div>
                      </div>

                      {/* Upcoming Sessions */}
                      <div className="space-y-4">
                        <h3 className="font-semibold">Upcoming Sessions</h3>
                        <div className="space-y-2">
                          {upcomingSessions
                            .filter(session => session.classId === selectedClass.id)
                            .map(session => (
                            <div key={session.id} className="flex items-center justify-between p-3 border rounded-lg">
                              <div>
                                <p className="font-medium">{new Date(session.date).toLocaleDateString()}</p>
                                <p className="text-sm text-muted-foreground">
                                  {session.time} • {session.room}
                                </p>
                              </div>
                              <Badge variant="outline">{session.status}</Badge>
                            </div>
                          ))}
                        </div>
                        <Button 
                          variant="outline" 
                          className="w-full"
                          onClick={() => handleScheduleSession(selectedClass.id)}
                        >
                          <Plus className="mr-2 h-4 w-4" />
                          Schedule New Session
                        </Button>
                      </div>

                      {/* Session Notes */}
                      <div className="space-y-4">
                        <h3 className="font-semibold">Session Notes</h3>
                        <Textarea
                          placeholder="Add notes for upcoming sessions..."
                          value={sessionNotes}
                          onChange={(e) => setSessionNotes(e.target.value)}
                          className="min-h-[100px]"
                        />
                        <Button onClick={handleSaveNotes} disabled={!sessionNotes.trim()}>
                          Save Notes
                        </Button>
                      </div>
                    </div>
                  )}
                </SheetContent>
              </Sheet>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredClasses.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No classes found matching your criteria.</p>
        </div>
      )}
    </div>
  );
}