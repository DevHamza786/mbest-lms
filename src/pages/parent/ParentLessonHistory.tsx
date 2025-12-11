import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';
import { useParentStore } from '@/lib/store/parentStore';
import { Search, FileText, Calendar, Clock, User, BookOpen, Eye, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { Session } from '@/lib/types/session';

// Mock lesson history data - filtered by active child
const getMockLessonHistory = (childId: string): Session[] => {
  const allLessons: Session[] = [
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
  ];

  // Filter lessons for the active child
  return allLessons.filter(lesson => 
    lesson.studentIds.includes(childId) || 
    lesson.studentNames.some(name => name.toLowerCase().includes(childId.toLowerCase()))
  );
};

export default function ParentLessonHistory() {
  const { activeChildId, getActiveChild } = useParentStore();
  const activeChild = getActiveChild();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('all');
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const lessonHistory = activeChildId ? getMockLessonHistory(activeChildId) : [];
  const allSubjects = Array.from(new Set(lessonHistory.map(s => s.subject))).sort();

  const filteredHistory = lessonHistory.filter(session => {
    const matchesSearch = 
      session.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      session.lessonNote?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      session.topicsTaught?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesSubject = selectedSubject === 'all' || session.subject === selectedSubject;

    return matchesSearch && matchesSubject;
  });

  const handleViewDetails = (session: Session) => {
    setSelectedSession(session);
    setIsDetailOpen(true);
  };

  // Get child-specific notes from the session
  const getChildNotes = (session: Session) => {
    if (!activeChildId) return null;
    return session.studentNotes?.find(note => 
      note.studentId === activeChildId || 
      note.studentName.toLowerCase().includes(activeChild?.name.toLowerCase() || '')
    );
  };

  if (!activeChild) {
    return (
      <div className="space-y-6 p-6">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Child Selected</h3>
            <p className="text-muted-foreground text-center">
              Please select a child to view their lesson history.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Lesson History</h1>
          <p className="text-muted-foreground mt-2">
            View lesson notes and feedback for {activeChild.name}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4 flex-wrap">
        <div className="flex-1 min-w-[200px]">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by subject or notes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
            />
          </div>
        </div>
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
            Click on any lesson to view detailed notes and feedback from the tutor
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Time</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead>Tutor</TableHead>
                  <TableHead>Topics Taught</TableHead>
                  <TableHead>Notes</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredHistory.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      No lesson history found for {activeChild.name}.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredHistory.map((session) => {
                    const childNotes = getChildNotes(session);
                    return (
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
                          <Badge variant="outline">{session.subject}</Badge>
                        </TableCell>
                        <TableCell className="text-sm">{session.teacherName}</TableCell>
                        <TableCell className="max-w-xs">
                          <div className="text-sm text-muted-foreground truncate">
                            {session.topicsTaught || '-'}
                          </div>
                        </TableCell>
                        <TableCell>
                          {session.lessonNote ? (
                            <Badge className="bg-green-500/10 text-green-700 dark:text-green-400">
                              <FileText className="mr-1 h-3 w-3" />
                              Available
                            </Badge>
                          ) : (
                            <Badge variant="outline">No Notes</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <button
                            onClick={() => handleViewDetails(session)}
                            className="text-primary hover:underline text-sm font-medium"
                          >
                            <Eye className="h-4 w-4 inline mr-1" />
                            View
                          </button>
                        </TableCell>
                      </TableRow>
                    );
                  })
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
                    <User className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">Tutor</p>
                      <p className="text-sm text-muted-foreground">{selectedSession.teacherName}</p>
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

                {/* Child-Specific Notes */}
                {(() => {
                  const childNotes = getChildNotes(selectedSession);
                  if (childNotes) {
                    return (
                      <>
                        <Separator />
                        <div>
                          <h3 className="text-sm font-semibold mb-3">Feedback for {activeChild.name}</h3>
                          <Card className="bg-primary/5 border-primary/20">
                            <CardContent className="pt-6 space-y-3">
                              <div>
                                <p className="text-sm font-medium mb-1">Homework Completion</p>
                                <Badge variant={childNotes.homeworkCompleted ? 'default' : 'destructive'}>
                                  {childNotes.homeworkCompleted ? 'Completed ✓' : 'Not Completed'}
                                </Badge>
                                {childNotes.homeworkNotes && (
                                  <p className="text-sm text-muted-foreground mt-2">{childNotes.homeworkNotes}</p>
                                )}
                              </div>
                              {childNotes.behaviorIssues && (
                                <div>
                                  <p className="text-sm font-medium mb-1 text-yellow-600">Behavior Notes</p>
                                  <p className="text-sm text-muted-foreground">{childNotes.behaviorIssues}</p>
                                </div>
                              )}
                              {childNotes.privateNotes && (
                                <div>
                                  <p className="text-sm font-medium mb-1">Tutor's Private Notes</p>
                                  <p className="text-sm text-muted-foreground">{childNotes.privateNotes}</p>
                                </div>
                              )}
                            </CardContent>
                          </Card>
                        </div>
                      </>
                    );
                  }
                  return null;
                })()}
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}

