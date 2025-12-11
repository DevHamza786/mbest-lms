import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { ChevronLeft, ChevronRight, Plus, Clock, MapPin, Video, Users, ChevronDown, FileText, List, Calendar as CalendarIcon, MapPin as MapPinIcon, XCircle, X, AlertCircle, CheckCircle2, BookOpen, User, DollarSign, Edit, Download } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths } from 'date-fns';
import { LessonNoteModal } from '@/components/modals/LessonNoteModal';
import { InvoicePreviewModal } from '@/components/modals/InvoicePreviewModal';
import { Checkbox } from '@/components/ui/checkbox';
import { generateTutorInvoicePDF } from '@/lib/utils/invoicePdf';

interface LessonEvent {
  id: string;
  studentNames: string[]; // Changed to array for multiple students
  lessonTitle?: string; // Lesson title/subject name
  time: string;
  duration: number;
  mode: 'online' | 'offline';
  status: 'scheduled' | 'completed' | 'cancelled' | 'unavailable';
  color: string;
  cancellationReason?: string;
  lessonNote?: string;
  topicsTaught?: string;
  homeworkResources?: string;
  studentNotes?: any[]; // Individual student notes
  tutorName?: string;
  location?: string;
  subject?: string;
  wage?: number;
  invoiceGenerated?: boolean; // Track if invoice has been generated
}

export default function TutorCalendar() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [isAddLessonOpen, setIsAddLessonOpen] = useState(false);
  const [isCancelLessonOpen, setIsCancelLessonOpen] = useState(false);
  const [isUnavailableOpen, setIsUnavailableOpen] = useState(false);
  const [isLessonNoteOpen, setIsLessonNoteOpen] = useState(false);
  const [isInvoicePreviewOpen, setIsInvoicePreviewOpen] = useState(false);
  const [isInvoiceViewOpen, setIsInvoiceViewOpen] = useState(false);
  const [isEditLessonOpen, setIsEditLessonOpen] = useState(false);
  const [selectedLesson, setSelectedLesson] = useState<LessonEvent | null>(null);
  const [editingLesson, setEditingLesson] = useState<LessonEvent | null>(null);
  const [cancellationReason, setCancellationReason] = useState('');
  const [unavailableReason, setUnavailableReason] = useState('');
  const [generatedInvoices, setGeneratedInvoices] = useState<Record<string, any>>({});
  const [lessons, setLessons] = useState<Record<string, LessonEvent[]>>({
    '2025-01-15': [
      { id: '1', studentNames: ['Sampoorna Arora'], lessonTitle: 'Alcatraz', time: '04:00 PM', duration: 1, mode: 'online', status: 'scheduled', color: '#2563eb', tutorName: 'Vu Dinh', location: 'Online', subject: 'Mathematics', wage: 45.00 },
      { id: '2', studentNames: ['Xavier Dean'], lessonTitle: 'Mathematics', time: '04:30 PM', duration: 1.5, mode: 'online', status: 'scheduled', color: '#2563eb', tutorName: 'Vu Dinh', location: 'Online', subject: 'Mathematics', wage: 67.50 },
      { id: '3', studentNames: ['Ethan Sutton'], lessonTitle: 'Physics', time: '06:00 PM', duration: 1, mode: 'offline', status: 'scheduled', color: '#2563eb', tutorName: 'Vu Dinh', location: 'Student\'s Home', subject: 'Physics', wage: 45.00 },
      { id: '4', studentNames: ['Natasha Askary'], lessonTitle: 'English', time: '06:30 PM', duration: 1, mode: 'online', status: 'scheduled', color: '#2563eb', tutorName: 'Vu Dinh', location: 'Online', subject: 'English', wage: 45.00 },
    ],
    '2025-01-16': [
      { id: '5', studentNames: ['Rhianna Georgiou'], lessonTitle: 'Chemistry', time: '04:30 PM', duration: 1, mode: 'offline', status: 'scheduled', color: '#2563eb', tutorName: 'Vu Dinh', location: 'Student\'s Home', subject: 'Chemistry', wage: 45.00 },
      { id: '6', studentNames: ['Sophia Song'], lessonTitle: 'Mathematics', time: '06:00 PM', duration: 1, mode: 'online', status: 'scheduled', color: '#2563eb', tutorName: 'Vu Dinh', location: 'Online', subject: 'Mathematics', wage: 45.00 },
    ],
    '2025-01-17': [
      { id: '7', studentNames: ['Xavier Dean'], lessonTitle: 'Mathematics', time: '09:30 AM', duration: 1.5, mode: 'online', status: 'scheduled', color: '#2563eb', tutorName: 'Vu Dinh', location: 'Online', subject: 'Mathematics', wage: 67.50 },
    ],
  });

  const [newLesson, setNewLesson] = useState({
    students: [] as string[], // Changed to array
    lessonTitle: '',
    date: '',
    time: '',
    duration: '1',
    mode: 'online' as 'online' | 'offline',
  });

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  useEffect(() => {
    const stored = typeof window !== 'undefined' ? window.localStorage.getItem('tutor-lessons') : null;
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as Record<string, LessonEvent[]>;
        setLessons(prev => ({ ...prev, ...parsed }));
      } catch {
        // ignore parse errors
      }
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem('tutor-lessons', JSON.stringify(lessons));
  }, [lessons]);

  const getDayLessons = (day: Date) => {
    const dateKey = format(day, 'yyyy-MM-dd');
    return lessons[dateKey] || [];
  };

  const handlePrevMonth = () => setCurrentDate(subMonths(currentDate, 1));
  const handleNextMonth = () => setCurrentDate(addMonths(currentDate, 1));

  const getStudentDisplayName = (value: string) => {
    switch (value) {
      case 'sampoorna':
        return 'Sampoorna Arora';
      case 'xavier':
        return 'Xavier Dean';
      case 'ethan':
        return 'Ethan Sutton';
      case 'natasha':
        return 'Natasha Askary';
      case 'sophia':
        return 'Sophia Song';
      default:
        return value;
    }
  };

  const getLessonColor = (lesson: LessonEvent | { status: string; time?: string }) => {
    if (lesson.status === 'cancelled') {
      return '#dc2626'; // Red for cancelled
    }
    if (lesson.status === 'unavailable') {
      return '#eab308'; // Yellow for unavailable
    }
    if (lesson.status === 'completed') {
      return '#16a34a'; // Green for completed
    }
    // Default scheduled color
    return '#2563eb'; // Blue for scheduled
  };

  const handleCancelLesson = (lesson: LessonEvent) => {
    setSelectedLesson(lesson);
    setIsCancelLessonOpen(true);
  };

  const confirmCancelLesson = () => {
    if (!selectedLesson || !cancellationReason.trim()) {
      toast({
        title: "Reason Required",
        description: "Please provide a reason for cancellation.",
        variant: "destructive",
      });
      return;
    }

    const dateKey = Object.keys(lessons).find(key => 
      lessons[key].some(l => l.id === selectedLesson.id)
    );

    if (dateKey) {
      setLessons(prev => ({
        ...prev,
        [dateKey]: prev[dateKey].map(l =>
          l.id === selectedLesson.id
            ? { ...l, status: 'cancelled' as const, cancellationReason, color: '#dc2626' }
            : l
        ),
      }));

      toast({
        title: "Lesson Cancelled",
        description: "Lesson has been cancelled successfully.",
      });
    }

    setCancellationReason('');
    setIsCancelLessonOpen(false);
    setSelectedLesson(null);
  };

  const handleMarkUnavailable = (lesson: LessonEvent) => {
    setSelectedLesson(lesson);
    setIsUnavailableOpen(true);
  };

  const confirmUnavailable = () => {
    if (!selectedLesson || !unavailableReason.trim()) {
      toast({
        title: "Reason Required",
        description: "Please provide a reason for unavailability.",
        variant: "destructive",
      });
      return;
    }

    const dateKey = Object.keys(lessons).find(key => 
      lessons[key].some(l => l.id === selectedLesson.id)
    );

    if (dateKey) {
      setLessons(prev => ({
        ...prev,
        [dateKey]: prev[dateKey].map(l =>
          l.id === selectedLesson.id
            ? { ...l, status: 'unavailable' as const, cancellationReason: unavailableReason, color: '#eab308' }
            : l
        ),
      }));

      toast({
        title: "Marked as Unavailable",
        description: "Lesson has been marked as unavailable.",
      });
    }

    setUnavailableReason('');
    setIsUnavailableOpen(false);
    setSelectedLesson(null);
  };

  const handleCompleteLesson = (lesson: LessonEvent) => {
    setSelectedLesson(lesson);
    setIsLessonNoteOpen(true);
  };

  const handleSaveLessonNote = (sessionId: string, lessonNote: string, topicsTaught: string, homeworkResources: string, studentNotes: any[]) => {
    if (!selectedLesson) return;

    const dateKey = Object.keys(lessons).find(key => 
      lessons[key].some(l => l.id === selectedLesson.id)
    );

    if (dateKey) {
      setLessons(prev => ({
        ...prev,
        [dateKey]: prev[dateKey].map(l =>
          l.id === selectedLesson.id
            ? { 
                ...l, 
                status: 'completed' as const, 
                lessonNote,
                topicsTaught,
                homeworkResources,
                studentNotes,
                color: '#16a34a'
              }
            : l
        ),
      }));

      toast({
        title: "Lesson Completed",
        description: "Lesson notes have been saved successfully.",
      });
    }

    setIsLessonNoteOpen(false);
    setSelectedLesson(null);
  };

  const handleGenerateInvoice = (lesson: LessonEvent) => {
    setSelectedLesson(lesson);
    setIsInvoicePreviewOpen(true);
  };

  const handleConfirmInvoiceGeneration = (invoiceData: any) => {
    if (!selectedLesson) return;

    const dateKey = Object.keys(lessons).find(key => 
      lessons[key].some(l => l.id === selectedLesson.id)
    );

    if (dateKey) {
      setLessons(prev => ({
        ...prev,
        [dateKey]: prev[dateKey].map(l =>
          l.id === selectedLesson.id
            ? { ...l, invoiceGenerated: true }
            : l
        ),
      }));

      // Store invoice data
      setGeneratedInvoices(prev => ({
        ...prev,
        [selectedLesson.id]: invoiceData,
      }));

      toast({
        title: "Invoice Generated",
        description: "Invoice has been generated and will be visible to admin only.",
      });
    }

    setIsInvoicePreviewOpen(false);
    setSelectedLesson(null);
  };

  const handleViewInvoice = (lesson: LessonEvent) => {
    setSelectedLesson(lesson);
    setIsInvoiceViewOpen(true);
  };

  const handleDownloadInvoice = (lesson: LessonEvent) => {
    const invoiceData = generatedInvoices[lesson.id];
    
    // If no invoice data exists, create a basic invoice from lesson data
    const lessonDate = new Date();
    const invoiceNumber = invoiceData?.invoiceNumber || `TINV-${Date.now().toString().slice(-6)}`;
    
    try {
      generateTutorInvoicePDF({
        id: lesson.id,
        invoiceNumber: invoiceNumber,
        date: invoiceData?.date || lessonDate.toISOString().split('T')[0],
        periodStart: invoiceData?.periodStart || lessonDate.toISOString().split('T')[0],
        periodEnd: invoiceData?.periodEnd || lessonDate.toISOString().split('T')[0],
        status: 'Paid',
        amount: invoiceData?.totalAmount || lesson.wage || 0,
        tutorName: lesson.tutorName || 'Vu Dinh',
        tutorAddress: invoiceData?.tutorAddress || 'Vo One\n16 Tonnyeen St Wetherill Park\nSydney NSW 2164\nAustralia',
        items: invoiceData?.items || [{
          description: `${lesson.lessonTitle || 'Lesson'} - ${lesson.studentNames.join(', ')}`,
          quantity: lesson.duration,
          rate: (lesson.wage || 0) / lesson.duration,
          amount: lesson.wage || 0,
        }],
        notes: invoiceData?.notes || '',
      });
      toast({
        title: "Download Started",
        description: `Invoice ${invoiceNumber} is being downloaded...`,
      });
    } catch (error) {
      toast({
        title: "Download Failed",
        description: "Failed to generate PDF. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleEditLesson = (lesson: LessonEvent) => {
    setEditingLesson({ ...lesson });
    setIsEditLessonOpen(true);
  };

  const handleSaveEditedLesson = () => {
    if (!editingLesson) return;

    const dateKey = Object.keys(lessons).find(key => 
      lessons[key].some(l => l.id === editingLesson.id)
    );

    if (dateKey) {
      setLessons(prev => ({
        ...prev,
        [dateKey]: prev[dateKey].map(l =>
          l.id === editingLesson.id
            ? editingLesson
            : l
        ),
      }));

      toast({
        title: "Lesson Updated",
        description: "Lesson has been updated successfully.",
      });
    }

    setIsEditLessonOpen(false);
    setEditingLesson(null);
  };

  const handleAddLesson = () => {
    if (newLesson.students.length === 0 || !newLesson.date || !newLesson.time) {
      toast({
        title: "Missing Information",
        description: "Please select at least one student and fill in date and time.",
        variant: "destructive",
      });
      return;
    }
    const dateKey = newLesson.date;
    const studentNames = newLesson.students.map(s => getStudentDisplayName(s));
    const lessonTitle = newLesson.lessonTitle || (studentNames.length === 1 ? studentNames[0] : `${studentNames.length} Students`);
    
    const lesson: LessonEvent = {
      id: `${Date.now()}`,
      studentNames,
      lessonTitle,
      time: newLesson.time,
      duration: parseFloat(newLesson.duration),
      mode: newLesson.mode,
      status: 'scheduled',
      color: getLessonColor({ id: '', studentNames: [], time: newLesson.time, duration: parseFloat(newLesson.duration), mode: newLesson.mode, status: 'scheduled', color: '' }),
      tutorName: 'Vu Dinh',
      location: newLesson.mode === 'online' ? 'Online' : 'Student\'s Home',
      subject: 'Mathematics',
      wage: 45.00 * studentNames.length, // Wage per student
    };

    setLessons(prev => ({
      ...prev,
      [dateKey]: prev[dateKey] ? [...prev[dateKey], lesson] : [lesson],
    }));

    toast({
      title: "Lesson Added",
      description: `Lesson scheduled for ${studentNames.length} student(s) successfully.`,
    });
    setNewLesson({ students: [], lessonTitle: '', date: '', time: '', duration: '1', mode: 'online' });
    setIsAddLessonOpen(false);
  };

  const toggleStudent = (studentValue: string) => {
    setNewLesson(prev => ({
      ...prev,
      students: prev.students.includes(studentValue)
        ? prev.students.filter(s => s !== studentValue)
        : [...prev.students, studentValue]
    }));
  };

  const selectedDayLessons = selectedDate ? getDayLessons(selectedDate) : [];

  return (
    <TooltipProvider>
    <div className="space-y-4 md:space-y-6 p-4 md:p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Calendar</h1>
          <p className="text-muted-foreground mt-2">
            View and manage your lesson schedule
          </p>
        </div>
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                <CalendarIcon className="mr-2 h-4 w-4" />
                Calendar
                <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem onClick={() => navigate('/tutor/calendar')}>
                <CalendarIcon className="mr-2 h-4 w-4" />
                Calendar
              </DropdownMenuItem>
              <DropdownMenuItem>
                <MapPinIcon className="mr-2 h-4 w-4" />
                Location Calendar
              </DropdownMenuItem>
              <DropdownMenuItem>
                <List className="mr-2 h-4 w-4" />
                Calendar List View
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setIsAddLessonOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Add Lesson
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Plus className="mr-2 h-4 w-4" />
                Add Other Events
              </DropdownMenuItem>
              <DropdownMenuItem>
                <XCircle className="mr-2 h-4 w-4" />
                Add Unavailability
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <FileText className="mr-2 h-4 w-4" />
                Lesson Requests
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate('/tutor/lesson-history')}>
                <FileText className="mr-2 h-4 w-4" />
                Lesson History
              </DropdownMenuItem>
              <DropdownMenuItem>
                <FileText className="mr-2 h-4 w-4" />
                Lesson History by Student
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Dialog open={isAddLessonOpen} onOpenChange={setIsAddLessonOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Lesson
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Schedule New Lesson</DialogTitle>
                <DialogDescription>
                  Add a new lesson to your calendar
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
              <div>
                <Label htmlFor="lesson-title">Lesson Title (Optional)</Label>
                <Input
                  id="lesson-title"
                  placeholder="e.g., Mathematics Group Class, Alcatraz"
                  value={newLesson.lessonTitle}
                  onChange={(e) => setNewLesson({ ...newLesson, lessonTitle: e.target.value })}
                />
              </div>
              <div>
                <Label>Students * (Select one or more)</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start mt-2"
                    >
                      <Users className="mr-2 h-4 w-4" />
                      {newLesson.students.length === 0
                        ? 'Select students...'
                        : `${newLesson.students.length} student${newLesson.students.length !== 1 ? 's' : ''} selected`}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-80" align="start">
                    <div className="space-y-2">
                      <Label className="text-sm font-semibold">Select Students</Label>
                      <div className="space-y-2 max-h-[300px] overflow-y-auto">
                        {['sampoorna', 'xavier', 'ethan', 'natasha', 'sophia'].map(studentValue => (
                          <div key={studentValue} className="flex items-center space-x-2">
                            <Checkbox
                              id={`student-${studentValue}`}
                              checked={newLesson.students.includes(studentValue)}
                              onCheckedChange={() => toggleStudent(studentValue)}
                            />
                            <Label htmlFor={`student-${studentValue}`} className="cursor-pointer text-sm flex-1">
                              {getStudentDisplayName(studentValue)}
                            </Label>
                          </div>
                        ))}
                      </div>
                      {newLesson.students.length > 0 && (
                        <div className="pt-2 border-t">
                          <div className="flex flex-wrap gap-1">
                            {newLesson.students.map(student => (
                              <Badge
                                key={student}
                                variant="default"
                                className="cursor-pointer"
                                onClick={() => toggleStudent(student)}
                              >
                                {getStudentDisplayName(student)}
                                <X className="ml-1 h-3 w-3" />
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
              <div>
                <Label htmlFor="date">Date</Label>
                <Input
                  id="date"
                  type="date"
                  value={newLesson.date}
                  onChange={(e) => setNewLesson({ ...newLesson, date: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="time">Time</Label>
                <Input
                  id="time"
                  type="time"
                  value={newLesson.time}
                  onChange={(e) => setNewLesson({ ...newLesson, time: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="duration">Duration (hours)</Label>
                <Select value={newLesson.duration} onValueChange={(value) => setNewLesson({ ...newLesson, duration: value })}>
                  <SelectTrigger id="duration">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0.5">30 minutes</SelectItem>
                    <SelectItem value="1">1 hour</SelectItem>
                    <SelectItem value="1.5">1.5 hours</SelectItem>
                    <SelectItem value="2">2 hours</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="mode">Mode</Label>
                <Select value={newLesson.mode} onValueChange={(value: 'online' | 'offline') => setNewLesson({ ...newLesson, mode: value })}>
                  <SelectTrigger id="mode">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="online">Online</SelectItem>
                    <SelectItem value="offline">In-Person</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddLessonOpen(false)}>Cancel</Button>
                <Button onClick={handleAddLesson}>Add Lesson</Button>
              </DialogFooter>
            </DialogContent>
        </Dialog>
      </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
        {/* Calendar View */}
        <Card className="lg:col-span-2 order-2 lg:order-1">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl md:text-2xl">
                {format(currentDate, 'MMMM yyyy')}
              </CardTitle>
              <div className="flex gap-2">
                <Button variant="outline" size="icon" onClick={handlePrevMonth}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="icon" onClick={handleNextMonth}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-7 gap-1 md:gap-2">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div key={day} className="text-center text-sm font-medium text-muted-foreground py-2">
                  {day}
                </div>
              ))}
              
              {daysInMonth.map((day, idx) => {
                const dayLessons = getDayLessons(day);
                const isSelected = selectedDate && isSameDay(day, selectedDate);
                const isCurrentMonth = isSameMonth(day, currentDate);
                
                return (
                  <button
                    key={idx}
                    onClick={() => setSelectedDate(day)}
                    className={`
                      min-h-[60px] md:min-h-[80px] p-1 md:p-2 rounded-lg border transition-all duration-200
                      ${isSelected ? 'border-primary bg-primary/5 shadow-sm ring-2 ring-primary/20' : 'border-border hover:border-primary/50 hover:shadow-sm'}
                      ${!isCurrentMonth ? 'opacity-40' : 'hover:bg-muted/30'}
                    `}
                  >
                    <div className="text-xs md:text-sm font-medium mb-1">{format(day, 'd')}</div>
                    <div className="space-y-0.5 md:space-y-1">
                      {dayLessons.slice(0, 2).map(lesson => (
                        <Popover key={lesson.id}>
                          <PopoverTrigger asChild>
                            <div
                              className="text-[8px] md:text-[10px] rounded px-1 md:px-1.5 py-0.5 md:py-1 truncate text-white cursor-pointer hover:opacity-90 hover:scale-[1.02] transition-all duration-200 font-medium shadow-sm"
                              style={{ backgroundColor: getLessonColor(lesson) }}
                            >
                              {lesson.time} {lesson.lessonTitle || (lesson.studentNames.length === 1 ? lesson.studentNames[0].split(' ')[0] : `${lesson.studentNames.length}`)}
                            </div>
                          </PopoverTrigger>
                          <PopoverContent className="w-[calc(100vw-2rem)] max-w-md md:w-96 p-0" side="right" align="start">
                            <div className="space-y-4 p-5 md:p-6">
                              <div className="space-y-2 pb-3 border-b">
                                <div className="flex items-start justify-between gap-2">
                                  <div className="flex-1 min-w-0">
                                    <h4 className="font-semibold text-base md:text-lg text-foreground leading-tight">
                                      {lesson.lessonTitle || (lesson.studentNames.length === 1 ? lesson.studentNames[0] : 'Group Lesson')}
                                    </h4>
                                    <div className="flex items-center gap-2 mt-1.5">
                                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                        <Clock className="h-3 w-3" />
                                        <span>{lesson.time} - {lesson.duration}h</span>
                                      </div>
                                    </div>
                                    <p className="text-xs text-muted-foreground mt-1.5 font-medium">
                                      {lesson.studentNames.length} student{lesson.studentNames.length !== 1 ? 's' : ''}
                                    </p>
                                  </div>
                                  <div className="flex gap-1.5 flex-shrink-0">
                                    <Badge variant={lesson.mode === 'online' ? 'default' : 'secondary'} className="text-[10px] px-1.5 py-0.5">
                                      {lesson.mode === 'online' ? 'Online' : 'In-Person'}
                                    </Badge>
                                    <Badge variant={
                                      lesson.status === 'cancelled' ? 'destructive' :
                                      lesson.status === 'completed' ? 'default' :
                                      lesson.status === 'unavailable' ? 'secondary' :
                                      'outline'
                                    } className="text-[10px] px-1.5 py-0.5">
                                      {lesson.status}
                                    </Badge>
                                  </div>
                                </div>
                              </div>
                              <div className="space-y-3 text-sm">
                                <div>
                                  <p className="font-medium mb-2 text-xs text-muted-foreground uppercase tracking-wide">Students</p>
                                  <div className="flex flex-wrap gap-1.5">
                                    {lesson.studentNames.map((name, idx) => (
                                      <Badge key={idx} variant="outline" className="text-xs px-2 py-1 bg-muted/50">
                                        {name}
                                      </Badge>
                                    ))}
                                  </div>
                                </div>
                                <div className="grid grid-cols-1 gap-2.5 pt-2 border-t">
                                  {lesson.tutorName && (
                                    <div className="flex items-center gap-2.5">
                                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                                        <User className="h-3.5 w-3.5 text-primary" />
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <p className="text-xs text-muted-foreground">Tutor</p>
                                        <p className="text-sm font-medium truncate">{lesson.tutorName}</p>
                                      </div>
                                    </div>
                                  )}
                                  {lesson.subject && (
                                    <div className="flex items-center gap-2.5">
                                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center">
                                        <BookOpen className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <p className="text-xs text-muted-foreground">Subject</p>
                                        <p className="text-sm font-medium truncate">{lesson.subject}</p>
                                      </div>
                                    </div>
                                  )}
                                  {lesson.location && (
                                    <div className="flex items-center gap-2.5">
                                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-green-500/10 flex items-center justify-center">
                                        <MapPin className="h-3.5 w-3.5 text-green-600 dark:text-green-400" />
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <p className="text-xs text-muted-foreground">Location</p>
                                        <p className="text-sm font-medium truncate">{lesson.location}</p>
                                      </div>
                                    </div>
                                  )}
                                  {lesson.wage && (
                                    <div className="flex items-center gap-2.5">
                                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-amber-500/10 flex items-center justify-center">
                                        <DollarSign className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <p className="text-xs text-muted-foreground">Wage</p>
                                        <p className="text-sm font-medium">${lesson.wage.toFixed(2)}</p>
                                      </div>
                                    </div>
                                  )}
                                </div>
                                {lesson.cancellationReason && (
                                  <div className="p-3 bg-red-50 dark:bg-red-950/30 rounded-lg border border-red-200 dark:border-red-900">
                                    <p className="font-semibold text-xs text-red-700 dark:text-red-300 mb-1">Cancellation Reason</p>
                                    <p className="text-xs text-red-600 dark:text-red-400 leading-relaxed">{lesson.cancellationReason}</p>
                                  </div>
                                )}
                                {lesson.lessonNote && (
                                  <div className="p-3 bg-green-50 dark:bg-green-950/30 rounded-lg border border-green-200 dark:border-green-900">
                                    <p className="font-semibold text-xs text-green-700 dark:text-green-300 mb-1">Lesson Notes</p>
                                    <p className="text-xs text-green-600 dark:text-green-400 line-clamp-2 leading-relaxed">{lesson.lessonNote}</p>
                                  </div>
                                )}
                              </div>
                              <div className="space-y-2 pt-3 border-t">
                                {lesson.status === 'scheduled' && (
                                  <>
                                    <div className="flex flex-col gap-2.5">
                                      <Button
                                        size="default"
                                        variant="outline"
                                        onClick={() => handleEditLesson(lesson)}
                                        className="w-full px-4 py-2.5 text-sm hover:bg-primary/5 hover:border-primary/50 transition-colors justify-start"
                                      >
                                        <Edit className="h-4 w-4 mr-2 flex-shrink-0" />
                                        <span>Edit</span>
                                      </Button>
                                      <Button
                                        size="default"
                                        variant="outline"
                                        onClick={() => handleCompleteLesson(lesson)}
                                        className="w-full px-4 py-2.5 text-sm hover:bg-green-50 dark:hover:bg-green-950/30 hover:border-green-300 dark:hover:border-green-800 transition-colors justify-start"
                                      >
                                        <CheckCircle2 className="h-4 w-4 mr-2 flex-shrink-0" />
                                        <span>Complete & Add Notes</span>
                                      </Button>
                                      <div className="flex gap-2.5">
                                        <Button
                                          size="default"
                                          variant="destructive"
                                          onClick={() => handleCancelLesson(lesson)}
                                          className="flex-1 px-4 py-2.5 text-sm hover:bg-destructive/90 transition-colors"
                                        >
                                          <X className="h-4 w-4 mr-2" />
                                          <span>Cancel</span>
                                        </Button>
                                        <Button
                                          size="default"
                                          variant="secondary"
                                          onClick={() => handleMarkUnavailable(lesson)}
                                          className="flex-1 px-4 py-2.5 text-sm hover:bg-orange-50 dark:hover:bg-orange-950/30 hover:border-orange-300 dark:hover:border-orange-800 transition-colors"
                                        >
                                          <AlertCircle className="h-4 w-4 mr-2" />
                                          <span>Unavailable</span>
                                        </Button>
                                      </div>
                                    </div>
                                  </>
                                )}
                                {lesson.status === 'completed' && !lesson.invoiceGenerated && (
                                  <div className="pt-2 border-t">
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => handleGenerateInvoice(lesson)}
                                      className="w-full hover:bg-primary/5 hover:border-primary/50 transition-colors"
                                    >
                                      <DollarSign className="h-3.5 w-3.5 mr-1.5" />
                                      <span className="hidden sm:inline">Generate Invoice (Admin Only)</span>
                                      <span className="sm:hidden">Generate Invoice</span>
                                    </Button>
                                  </div>
                                )}
                                {lesson.invoiceGenerated && (
                                  <div className="pt-2 border-t">
                                    <div className="flex flex-wrap gap-2">
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => handleViewInvoice(lesson)}
                                        className="flex-1 min-w-[calc(50%-0.25rem)] bg-green-500/10 text-green-700 dark:text-green-400 hover:bg-green-500/20 border-green-300 dark:border-green-800 transition-colors"
                                      >
                                        <DollarSign className="h-3.5 w-3.5 mr-1.5" />
                                        <span className="hidden sm:inline">View Invoice</span>
                                        <span className="sm:hidden">View</span>
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => handleDownloadInvoice(lesson)}
                                        className="flex-1 min-w-[calc(50%-0.25rem)] hover:bg-primary/5 hover:border-primary/50 transition-colors"
                                      >
                                        <Download className="h-3.5 w-3.5 mr-1.5" />
                                        <span className="hidden sm:inline">Download</span>
                                        <span className="sm:hidden">DL</span>
                                      </Button>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          </PopoverContent>
                        </Popover>
                      ))}
                      {dayLessons.length > 2 && (
                        <div className="text-[10px] text-muted-foreground">
                          +{dayLessons.length - 2} more
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Selected Day Details */}
        <Card className="order-1 lg:order-2">
          <CardHeader>
            <CardTitle className="text-lg md:text-xl">
              {selectedDate ? format(selectedDate, 'EEEE, MMMM d') : 'Select a date'}
            </CardTitle>
            <CardDescription>
              {selectedDayLessons.length} lesson{selectedDayLessons.length !== 1 ? 's' : ''} scheduled
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {selectedDayLessons.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No lessons scheduled for this day
                </p>
              ) : (
                selectedDayLessons.map(lesson => (
                  <div key={lesson.id} className="group space-y-3 p-4 rounded-xl border bg-card hover:border-primary/50 transition-all duration-200 shadow-sm hover:shadow-md">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        <div
                          className="w-3 h-3 rounded-full flex-shrink-0 mt-1.5 ring-2 ring-offset-2 ring-offset-background"
                          style={{ backgroundColor: getLessonColor(lesson) }}
                        />
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-base leading-tight mb-1">
                            {lesson.lessonTitle || (lesson.studentNames.length === 1 ? lesson.studentNames[0] : 'Group Lesson')}
                          </h3>
                          <div className="flex items-center gap-2 flex-wrap mt-1.5">
                            <span className="text-xs font-medium text-muted-foreground">
                              {lesson.studentNames.length} student{lesson.studentNames.length !== 1 ? 's' : ''}
                            </span>
                            <Badge variant={lesson.mode === 'online' ? 'default' : 'secondary'} className="text-[10px] px-2 py-0.5">
                              {lesson.mode}
                            </Badge>
                            <Badge variant={
                              lesson.status === 'cancelled' ? 'destructive' :
                              lesson.status === 'completed' ? 'default' :
                              lesson.status === 'unavailable' ? 'secondary' :
                              'outline'
                            } className="text-[10px] px-2 py-0.5">
                              {lesson.status}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex flex-wrap gap-1.5">
                        {lesson.studentNames.map((name, idx) => (
                          <Badge key={idx} variant="outline" className="text-xs px-2 py-1 bg-muted/50 font-normal">
                            {name}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-sm">
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <Clock className="h-3.5 w-3.5" />
                        <span className="font-medium">{lesson.time}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <Users className="h-3.5 w-3.5" />
                        <span className="font-medium">{lesson.duration}h</span>
                      </div>
                      {lesson.mode === 'online' && (
                        <div className="flex items-center gap-1.5 text-primary ml-auto">
                          <Video className="h-3.5 w-3.5" />
                          <span className="text-xs font-medium">Online Session</span>
                        </div>
                      )}
                    </div>
                    {lesson.cancellationReason && (
                      <div className="p-3 bg-red-50 dark:bg-red-950/30 rounded-lg border border-red-200 dark:border-red-900">
                        <p className="font-semibold text-xs text-red-700 dark:text-red-300 mb-1">Cancellation Reason</p>
                        <p className="text-xs text-red-600 dark:text-red-400 leading-relaxed">{lesson.cancellationReason}</p>
                      </div>
                    )}
                    {lesson.lessonNote && (
                      <div className="p-3 bg-green-50 dark:bg-green-950/30 rounded-lg border border-green-200 dark:border-green-900">
                        <p className="font-semibold text-xs text-green-700 dark:text-green-300 mb-1">Lesson Notes</p>
                        <p className="text-xs text-green-600 dark:text-green-400 line-clamp-2 leading-relaxed">{lesson.lessonNote}</p>
                      </div>
                    )}
                    {lesson.mode === 'offline' && (
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <MapPin className="h-3.5 w-3.5" />
                        <span className="font-medium">In-Person Session</span>
                      </div>
                    )}
                    {lesson.status === 'scheduled' && (
                      <div className="flex flex-col gap-2.5 pt-3 border-t">
                        <Button
                          size="default"
                          variant="outline"
                          onClick={() => handleEditLesson(lesson)}
                          className="w-full px-4 py-2.5 text-sm hover:bg-primary/5 hover:border-primary/50 transition-colors justify-start"
                        >
                          <Edit className="h-4 w-4 mr-2 flex-shrink-0" />
                          <span>Edit</span>
                        </Button>
                        <Button
                          size="default"
                          variant="outline"
                          onClick={() => handleCompleteLesson(lesson)}
                          className="w-full px-4 py-2.5 text-sm hover:bg-green-50 dark:hover:bg-green-950/30 hover:border-green-300 dark:hover:border-green-800 transition-colors justify-start"
                        >
                          <CheckCircle2 className="h-4 w-4 mr-2 flex-shrink-0" />
                          <span>Complete & Add Notes</span>
                        </Button>
                        <div className="flex gap-2.5">
                          <Button
                            size="default"
                            variant="destructive"
                            onClick={() => handleCancelLesson(lesson)}
                            className="flex-1 px-4 py-2.5 text-sm hover:bg-destructive/90 transition-colors"
                          >
                            <X className="h-4 w-4 mr-2" />
                            <span>Cancel</span>
                          </Button>
                          <Button
                            size="default"
                            variant="secondary"
                            onClick={() => handleMarkUnavailable(lesson)}
                            className="flex-1 px-4 py-2.5 text-sm hover:bg-orange-50 dark:hover:bg-orange-950/30 hover:border-orange-300 dark:hover:border-orange-800 transition-colors"
                          >
                            <AlertCircle className="h-4 w-4 mr-2" />
                            <span>Unavailable</span>
                          </Button>
                        </div>
                      </div>
                    )}
                    {lesson.status === 'completed' && !lesson.invoiceGenerated && (
                      <div className="pt-3 border-t">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleGenerateInvoice(lesson)}
                          className="w-full hover:bg-primary/5 hover:border-primary/50 transition-colors"
                        >
                          <DollarSign className="h-3.5 w-3.5 mr-1.5" />
                          <span className="hidden sm:inline">Generate Invoice (Admin Only)</span>
                          <span className="sm:hidden">Generate Invoice</span>
                        </Button>
                      </div>
                    )}
                    {lesson.invoiceGenerated && (
                      <div className="pt-3 border-t">
                        <div className="flex flex-wrap gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleViewInvoice(lesson)}
                            className="flex-1 min-w-[calc(50%-0.25rem)] bg-green-500/10 text-green-700 dark:text-green-400 hover:bg-green-500/20 border-green-300 dark:border-green-800 transition-colors"
                          >
                            <DollarSign className="h-3.5 w-3.5 mr-1.5" />
                            View Invoice
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDownloadInvoice(lesson)}
                            className="flex-1 min-w-[calc(50%-0.25rem)] hover:bg-primary/5 hover:border-primary/50 transition-colors"
                          >
                            <Download className="h-3.5 w-3.5 mr-1.5" />
                            Download
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Cancel Lesson Dialog */}
      <Dialog open={isCancelLessonOpen} onOpenChange={setIsCancelLessonOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel Lesson</DialogTitle>
            <DialogDescription>
              Please provide a reason for cancelling this lesson
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {selectedLesson && (
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-sm font-medium">
                  {selectedLesson.lessonTitle || (selectedLesson.studentNames.length === 1 ? selectedLesson.studentNames[0] : 'Group Lesson')}
                </p>
                <p className="text-xs text-muted-foreground">
                  {selectedLesson.studentNames.length} student{selectedLesson.studentNames.length !== 1 ? 's' : ''} • {selectedLesson.time} • {selectedLesson.duration}h
                </p>
              </div>
            )}
            <div>
              <Label htmlFor="reason">Cancellation Reason *</Label>
              <Textarea
                id="reason"
                placeholder="e.g., Student requested reschedule, Emergency, Illness..."
                value={cancellationReason}
                onChange={(e) => setCancellationReason(e.target.value)}
                rows={4}
                className="mt-2"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setIsCancelLessonOpen(false);
              setCancellationReason('');
              setSelectedLesson(null);
            }}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmCancelLesson}>
              Confirm Cancellation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Mark Unavailable Dialog */}
      <Dialog open={isUnavailableOpen} onOpenChange={setIsUnavailableOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mark as Unavailable</DialogTitle>
            <DialogDescription>
              Please provide a reason for being unavailable
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {selectedLesson && (
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-sm font-medium">
                  {selectedLesson.lessonTitle || (selectedLesson.studentNames.length === 1 ? selectedLesson.studentNames[0] : 'Group Lesson')}
                </p>
                <p className="text-xs text-muted-foreground">
                  {selectedLesson.studentNames.length} student{selectedLesson.studentNames.length !== 1 ? 's' : ''} • {selectedLesson.time} • {selectedLesson.duration}h
                </p>
              </div>
            )}
            <div>
              <Label htmlFor="unavailable-reason">Reason for Unavailability *</Label>
              <Textarea
                id="unavailable-reason"
                placeholder="e.g., Personal emergency, Illness, Family matter..."
                value={unavailableReason}
                onChange={(e) => setUnavailableReason(e.target.value)}
                rows={4}
                className="mt-2"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setIsUnavailableOpen(false);
              setUnavailableReason('');
              setSelectedLesson(null);
            }}>
              Cancel
            </Button>
            <Button variant="secondary" onClick={confirmUnavailable}>
              Mark as Unavailable
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Lesson Note Modal */}
            {selectedLesson && selectedDate && (() => {
        // Parse time - handle formats like "04:00 PM" or "13:49"
        const parseTime = (timeStr: string): string => {
          if (timeStr.includes('PM') || timeStr.includes('AM')) {
            // Format: "04:00 PM" -> convert to 24h
            const [time, period] = timeStr.split(' ');
            const [hours, minutes] = time.split(':');
            let hour24 = parseInt(hours);
            if (period === 'PM' && hour24 !== 12) hour24 += 12;
            if (period === 'AM' && hour24 === 12) hour24 = 0;
            return `${hour24.toString().padStart(2, '0')}:${minutes}`;
          }
          // Already in 24h format
          return timeStr.split(' ')[0] || '09:00';
        };

        const startTime = parseTime(selectedLesson.time);
        const [startHour, startMin] = startTime.split(':').map(Number);
        const endHour = startHour + Math.floor(selectedLesson.duration);
        const endMin = startMin + ((selectedLesson.duration % 1) * 60);
        const endTime = `${endHour.toString().padStart(2, '0')}:${Math.floor(endMin).toString().padStart(2, '0')}`;

        // Generate student IDs based on student names
        const studentIds = selectedLesson.studentNames.map((_, idx) => `student-${idx + 1}`);

        return (
          <LessonNoteModal
            open={isLessonNoteOpen}
            onOpenChange={setIsLessonNoteOpen}
            session={{
              id: selectedLesson.id,
              date: format(selectedDate, 'yyyy-MM-dd'),
              startTime,
              endTime,
              teacherId: 'tutor-1',
              teacherName: selectedLesson.tutorName || 'Vu Dinh',
              studentIds,
              studentNames: selectedLesson.studentNames,
              subject: selectedLesson.subject || 'Mathematics',
              yearLevel: '10',
              location: selectedLesson.mode === 'online' ? 'online' : 'home',
              sessionType: selectedLesson.studentNames.length > 1 ? 'group' : '1:1',
              status: 'completed',
              lessonNote: selectedLesson.lessonNote,
              topicsTaught: selectedLesson.topicsTaught,
              homeworkResources: selectedLesson.homeworkResources,
              studentNotes: selectedLesson.studentNotes,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            }}
            onSave={handleSaveLessonNote}
          />
        );
      })()}

      {/* Invoice Preview Modal */}
      {selectedLesson && (
        <InvoicePreviewModal
          open={isInvoicePreviewOpen}
          onOpenChange={setIsInvoicePreviewOpen}
          lesson={{
            id: selectedLesson.id,
            lessonTitle: selectedLesson.lessonTitle,
            studentNames: selectedLesson.studentNames,
            date: Object.keys(lessons).find(key => 
              lessons[key].some(l => l.id === selectedLesson.id)
            ) || new Date().toISOString().split('T')[0],
            time: selectedLesson.time,
            duration: selectedLesson.duration,
            wage: selectedLesson.wage,
            tutorName: selectedLesson.tutorName,
            subject: selectedLesson.subject,
          }}
          onGenerate={handleConfirmInvoiceGeneration}
        />
      )}

      {/* Invoice View Modal */}
      {selectedLesson && generatedInvoices[selectedLesson.id] && (
        <InvoicePreviewModal
          open={isInvoiceViewOpen}
          onOpenChange={setIsInvoiceViewOpen}
          lesson={{
            id: selectedLesson.id,
            lessonTitle: selectedLesson.lessonTitle,
            studentNames: selectedLesson.studentNames,
            date: Object.keys(lessons).find(key => 
              lessons[key].some(l => l.id === selectedLesson.id)
            ) || new Date().toISOString().split('T')[0],
            time: selectedLesson.time,
            duration: selectedLesson.duration,
            wage: selectedLesson.wage,
            tutorName: selectedLesson.tutorName,
            subject: selectedLesson.subject,
          }}
          onGenerate={() => {}}
          viewOnly={true}
          invoiceData={generatedInvoices[selectedLesson.id]}
        />
      )}

      {/* Edit Lesson Dialog */}
      <Dialog open={isEditLessonOpen} onOpenChange={setIsEditLessonOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Lesson</DialogTitle>
            <DialogDescription>
              Update lesson details before completing or cancelling
            </DialogDescription>
          </DialogHeader>
          {editingLesson && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-lesson-title">Lesson Title</Label>
                <Input
                  id="edit-lesson-title"
                  placeholder="e.g., Mathematics Group Class"
                  value={editingLesson.lessonTitle || ''}
                  onChange={(e) => setEditingLesson({ ...editingLesson, lessonTitle: e.target.value })}
                />
              </div>
              <div>
                <Label>Students</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start"
                    >
                      <Users className="mr-2 h-4 w-4" />
                      {editingLesson.studentNames.length} student{editingLesson.studentNames.length !== 1 ? 's' : ''} selected
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-80" align="start">
                    <div className="space-y-2">
                      <Label className="text-sm font-semibold">Select Students</Label>
                      <div className="space-y-2 max-h-[300px] overflow-y-auto">
                        {['sampoorna', 'xavier', 'ethan', 'natasha', 'sophia'].map(studentValue => {
                          const studentName = getStudentDisplayName(studentValue);
                          const isSelected = editingLesson.studentNames.includes(studentName);
                          return (
                            <div key={studentValue} className="flex items-center space-x-2">
                              <Checkbox
                                id={`edit-student-${studentValue}`}
                                checked={isSelected}
                                onCheckedChange={() => {
                                  if (isSelected) {
                                    setEditingLesson({
                                      ...editingLesson,
                                      studentNames: editingLesson.studentNames.filter(n => n !== studentName),
                                    });
                                  } else {
                                    setEditingLesson({
                                      ...editingLesson,
                                      studentNames: [...editingLesson.studentNames, studentName],
                                    });
                                  }
                                }}
                              />
                              <Label htmlFor={`edit-student-${studentValue}`} className="cursor-pointer text-sm flex-1">
                                {studentName}
                              </Label>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
              <div>
                <Label htmlFor="edit-time">Time</Label>
                <Input
                  id="edit-time"
                  type="time"
                  value={editingLesson.time.includes(':') && !editingLesson.time.includes('PM') && !editingLesson.time.includes('AM') 
                    ? editingLesson.time.split(' ')[0] 
                    : ''}
                  onChange={(e) => {
                    const timeValue = e.target.value;
                    const [hours, minutes] = timeValue.split(':');
                    const hour12 = parseInt(hours) % 12 || 12;
                    const period = parseInt(hours) >= 12 ? 'PM' : 'AM';
                    setEditingLesson({ ...editingLesson, time: `${hour12}:${minutes} ${period}` });
                  }}
                />
              </div>
              <div>
                <Label htmlFor="edit-duration">Duration (hours)</Label>
                <Select 
                  value={editingLesson.duration.toString()} 
                  onValueChange={(value) => setEditingLesson({ ...editingLesson, duration: parseFloat(value) })}
                >
                  <SelectTrigger id="edit-duration">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0.5">0.5 hour</SelectItem>
                    <SelectItem value="1">1 hour</SelectItem>
                    <SelectItem value="1.5">1.5 hours</SelectItem>
                    <SelectItem value="2">2 hours</SelectItem>
                    <SelectItem value="2.5">2.5 hours</SelectItem>
                    <SelectItem value="3">3 hours</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="edit-mode">Mode</Label>
                <Select 
                  value={editingLesson.mode} 
                  onValueChange={(value: 'online' | 'offline') => setEditingLesson({ ...editingLesson, mode: value })}
                >
                  <SelectTrigger id="edit-mode">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="online">Online</SelectItem>
                    <SelectItem value="offline">In-Person</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setIsEditLessonOpen(false);
              setEditingLesson(null);
            }}>
              Cancel
            </Button>
            <Button onClick={handleSaveEditedLesson}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
    </TooltipProvider>
  );
}
