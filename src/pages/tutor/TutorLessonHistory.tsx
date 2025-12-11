import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { Search, FileText, Calendar, Clock, User, Users, BookOpen, Eye } from 'lucide-react';
import { format } from 'date-fns';
import { Session } from '@/lib/types/session';

// Mock lesson history data with notes
const mockLessonHistory: Session[] = [
  {
    id: '1',
    date: '2025-11-22',
    startTime: '09:30',
    endTime: '10:30',
    teacherId: 'tutor-1',
    teacherName: 'Vu Dinh',
    studentIds: ['student-1'],
    studentNames: ['Xavier Dean'],
    subject: 'Mathematics',
    yearLevel: '10',
    location: 'home',
    sessionType: '1:1',
    status: 'completed',
    lessonNote: 'Covered quadratic equations and factorization. Student showed good understanding of basic concepts.',
    topicsTaught: 'Quadratic Equations, Factorization, Solving by completing the square',
    homeworkResources: 'Worksheet pages 12-15, Practice problems 1-10',
    studentNotes: [{
      studentId: 'student-1',
      studentName: 'Xavier Dean',
      behaviorIssues: '',
      homeworkCompleted: true,
      homeworkNotes: 'Completed all assigned problems',
      privateNotes: 'Student is progressing well. Continue with advanced problems next session.'
    }],
    attendanceMarked: true,
    readyForInvoicing: true,
    createdAt: '2025-11-20T10:00:00Z',
    updatedAt: '2025-11-22T10:30:00Z',
  },
  {
    id: '2',
    date: '2025-11-20',
    startTime: '04:00',
    endTime: '05:00',
    teacherId: 'tutor-1',
    teacherName: 'Vu Dinh',
    studentIds: ['student-2', 'student-3'],
    studentNames: ['Sampaguita Anoa', 'Rostov Percy'],
    subject: 'English',
    yearLevel: '11',
    location: 'centre',
    sessionType: 'group',
    status: 'completed',
    lessonNote: 'Group discussion on essay writing techniques. All students participated actively.',
    topicsTaught: 'Essay Structure, Thesis Statements, Paragraph Development',
    homeworkResources: 'Essay writing template, Reading assignment pages 45-50',
    studentNotes: [
      {
        studentId: 'student-2',
        studentName: 'Sampaguita Anoa',
        behaviorIssues: '',
        homeworkCompleted: true,
        homeworkNotes: 'Submitted essay draft on time',
        privateNotes: 'Excellent participation. Strong analytical skills.'
      },
      {
        studentId: 'student-3',
        studentName: 'Rostov Percy',
        behaviorIssues: 'Did not complete homework from previous session',
        homeworkCompleted: false,
        homeworkNotes: 'Missing essay draft. Needs to catch up.',
        privateNotes: 'Student needs encouragement. Please follow up at home.'
      }
    ],
    attendanceMarked: true,
    readyForInvoicing: true,
    createdAt: '2025-11-18T10:00:00Z',
    updatedAt: '2025-11-20T17:00:00Z',
  },
  {
    id: '3',
    date: '2025-11-18',
    startTime: '06:30',
    endTime: '07:30',
    teacherId: 'tutor-1',
    teacherName: 'Vu Dinh',
    studentIds: ['student-4'],
    studentNames: ['Ethan Sutton'],
    subject: 'Physics',
    yearLevel: '12',
    location: 'online',
    sessionType: '1:1',
    status: 'completed',
    lessonNote: 'Reviewed kinematics and dynamics. Student struggled with acceleration concepts.',
    topicsTaught: 'Kinematics, Velocity, Acceleration, Force and Motion',
    homeworkResources: 'Chapter 5 exercises, Online simulation practice',
    studentNotes: [{
      studentId: 'student-4',
      studentName: 'Ethan Sutton',
      behaviorIssues: '',
      homeworkCompleted: true,
      homeworkNotes: 'Completed exercises but needs more practice',
      privateNotes: 'Student needs additional support with acceleration problems. Recommend extra practice.'
    }],
    attendanceMarked: true,
    readyForInvoicing: true,
    createdAt: '2025-11-16T10:00:00Z',
    updatedAt: '2025-11-18T19:30:00Z',
  },
];

export default function TutorLessonHistory() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStudent, setSelectedStudent] = useState('all');
  const [selectedSubject, setSelectedSubject] = useState('all');
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const allStudents = Array.from(new Set(mockLessonHistory.flatMap(s => s.studentNames))).sort();
  const allSubjects = Array.from(new Set(mockLessonHistory.map(s => s.subject))).sort();

  const filteredHistory = mockLessonHistory.filter(session => {
    const matchesSearch = 
      session.studentNames.some(name => name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      session.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      session.lessonNote?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStudent = selectedStudent === 'all' || session.studentNames.includes(selectedStudent);
    const matchesSubject = selectedSubject === 'all' || session.subject === selectedSubject;

    return matchesSearch && matchesStudent && matchesSubject;
  });

  const handleViewDetails = (session: Session) => {
    setSelectedSession(session);
    setIsDetailOpen(true);
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Lesson History</h1>
          <p className="text-muted-foreground mt-2">
            View past lesson notes and student feedback
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4 flex-wrap">
        <div className="flex-1 min-w-[200px]">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by student, subject, or notes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
            />
          </div>
        </div>
        <Select value={selectedStudent} onValueChange={setSelectedStudent}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="All Students" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Students</SelectItem>
            {allStudents.map(student => (
              <SelectItem key={student} value={student}>{student}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={selectedSubject} onValueChange={setSelectedSubject}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="All Subjects" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Subjects</SelectItem>
            {allSubjects.map(subject => (
              <SelectItem key={subject} value={subject}>{subject}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Lesson History Table */}
      <Card>
        <CardHeader>
          <CardTitle>Completed Lessons ({filteredHistory.length})</CardTitle>
          <CardDescription>
            Click on any lesson to view detailed notes and feedback
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Time</TableHead>
                  <TableHead>Students</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Topics Taught</TableHead>
                  <TableHead>Notes</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredHistory.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      No lesson history found matching your filters.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredHistory.map((session) => (
                    <TableRow key={session.id}>
                      <TableCell className="font-medium">
                        {format(new Date(session.date), 'MMM d, yyyy')}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm">
                          <Clock className="h-3 w-3" />
                          {session.startTime} - {session.endTime}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          {session.studentNames.map((name, idx) => (
                            <div key={idx} className="text-sm">{name}</div>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{session.subject}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={session.sessionType === 'group' ? 'default' : 'secondary'}>
                          {session.sessionType}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-xs">
                        <div className="text-sm text-muted-foreground truncate">
                          {session.topicsTaught || '-'}
                        </div>
                      </TableCell>
                      <TableCell>
                        {session.lessonNote ? (
                          <Badge className="bg-green-500/10 text-green-700 dark:text-green-400">
                            <FileText className="mr-1 h-3 w-3" />
                            Notes Added
                          </Badge>
                        ) : (
                          <Badge variant="outline">No Notes</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewDetails(session)}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Lesson Details Sheet */}
      <Sheet open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
          {selectedSession && (
            <>
              <SheetHeader>
                <SheetTitle>Lesson Details & Notes</SheetTitle>
                <SheetDescription>
                  {format(new Date(selectedSession.date), 'EEEE, MMMM d, yyyy')} • {selectedSession.startTime} - {selectedSession.endTime}
                </SheetDescription>
              </SheetHeader>

              <div className="space-y-6 mt-6">
                {/* Basic Info */}
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">Date & Time</p>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(selectedSession.date), 'EEEE, MMMM d, yyyy')} • {selectedSession.startTime} - {selectedSession.endTime}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Users className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">Students</p>
                      <div className="space-y-1">
                        {selectedSession.studentNames.map((name, idx) => (
                          <p key={idx} className="text-sm text-muted-foreground">• {name}</p>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <BookOpen className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">Subject & Year</p>
                      <p className="text-sm text-muted-foreground">
                        {selectedSession.subject} - Year {selectedSession.yearLevel}
                      </p>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* General Lesson Notes */}
                {selectedSession.topicsTaught && (
                  <div>
                    <h3 className="text-sm font-semibold mb-2">Topics Taught</h3>
                    <p className="text-sm text-muted-foreground bg-muted p-3 rounded-lg">
                      {selectedSession.topicsTaught}
                    </p>
                  </div>
                )}

                {selectedSession.homeworkResources && (
                  <div>
                    <h3 className="text-sm font-semibold mb-2">Homework Resources</h3>
                    <p className="text-sm text-muted-foreground bg-muted p-3 rounded-lg">
                      {selectedSession.homeworkResources}
                    </p>
                  </div>
                )}

                {selectedSession.lessonNote && (
                  <div>
                    <h3 className="text-sm font-semibold mb-2">General Lesson Notes</h3>
                    <p className="text-sm text-muted-foreground bg-muted p-3 rounded-lg">
                      {selectedSession.lessonNote}
                    </p>
                  </div>
                )}

                {/* Individual Student Notes */}
                {selectedSession.studentNotes && selectedSession.studentNotes.length > 0 && (
                  <>
                    <Separator />
                    <div>
                      <h3 className="text-sm font-semibold mb-3">Individual Student Notes</h3>
                      <div className="space-y-4">
                        {selectedSession.studentNotes.map((note, idx) => (
                          <Card key={idx} className="bg-muted/50">
                            <CardHeader className="pb-3">
                              <CardTitle className="text-sm flex items-center gap-2">
                                <User className="h-4 w-4" />
                                {note.studentName}
                                <Badge variant="outline" className="ml-auto text-xs">Private</Badge>
                              </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3 text-sm">
                              <div>
                                <p className="font-medium mb-1">Homework Completion</p>
                                <Badge variant={note.homeworkCompleted ? 'default' : 'destructive'}>
                                  {note.homeworkCompleted ? 'Completed' : 'Not Completed'}
                                </Badge>
                                {note.homeworkNotes && (
                                  <p className="text-muted-foreground mt-2">{note.homeworkNotes}</p>
                                )}
                              </div>
                              {note.behaviorIssues && (
                                <div>
                                  <p className="font-medium mb-1 text-yellow-600">Behavior Issues</p>
                                  <p className="text-muted-foreground">{note.behaviorIssues}</p>
                                </div>
                              )}
                              {note.privateNotes && (
                                <div>
                                  <p className="font-medium mb-1">Private Notes</p>
                                  <p className="text-muted-foreground">{note.privateNotes}</p>
                                </div>
                              )}
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}

