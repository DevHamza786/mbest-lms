import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { ChevronLeft, ChevronRight, Plus, Clock, MapPin, Video, Users, ChevronDown, FileText, List, Calendar as CalendarIcon, MapPin as MapPinIcon, XCircle, X, AlertCircle, CheckCircle2, BookOpen, User, DollarSign, Edit, Download, Loader2 } from "lucide-react";
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
import { useSession } from '@/lib/store/authStore';
import { generateTutorInvoicePDF } from '@/lib/utils/invoicePdf';
import { tutorApi } from '@/lib/api';

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
  const session = useSession();
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
  const [lessons, setLessons] = useState<Record<string, LessonEvent[]>>({});
  const [isLoadingSessions, setIsLoadingSessions] = useState(false);
  const [availableStudents, setAvailableStudents] = useState<any[]>([]);

  const [newLesson, setNewLesson] = useState({
    studentIds: [] as number[], // Student IDs from API
    subject: '',
    date: '',
    startTime: '',
    endTime: '',
    duration: '1',
    location: 'online' as 'online' | 'home' | 'centre',
    yearLevel: '',
    classId: null as number | null,
  });

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Convert API session to LessonEvent
  const mapSessionToLesson = (session: any): LessonEvent => {
    const startTime = new Date(`2000-01-01T${session.start_time}`);
    const endTime = new Date(`2000-01-01T${session.end_time}`);
    const duration = (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60); // Convert to hours
    
    // Format time as HH:MM AM/PM
    const hours = startTime.getHours();
    const minutes = startTime.getMinutes();
    const period = hours >= 12 ? 'PM' : 'AM';
    const hour12 = hours % 12 || 12;
    const formattedTime = `${hour12}:${minutes.toString().padStart(2, '0')} ${period}`;
    
    // Get student names
    const studentNames = session.students?.map((s: any) => s.user?.name || `Student ${s.id}`) || [];
    
    // Map status
    let status: 'scheduled' | 'completed' | 'cancelled' | 'unavailable' = 'scheduled';
    if (session.status === 'completed') status = 'completed';
    else if (session.status === 'cancelled') status = 'cancelled';
    else if (session.status === 'unavailable') status = 'unavailable';
    
    // Determine mode from location
    const mode: 'online' | 'offline' = session.location === 'online' ? 'online' : 'offline';
    
    return {
      id: String(session.id),
      studentNames,
      lessonTitle: session.subject,
      time: formattedTime,
      duration,
      mode,
      status,
      color: session.color || getLessonColor({ status, time: formattedTime }),
      location: session.location === 'online' ? 'Online' : session.location === 'home' ? 'Student\'s Home' : session.location === 'centre' ? 'Centre' : session.location,
      subject: session.subject,
      lessonNote: session.lesson_note,
      topicsTaught: session.topics_taught,
      homeworkResources: session.homework_resources,
      tutorName: session?.name || 'Current Tutor',
      invoiceGenerated: session.ready_for_invoicing || false, // Check if invoice has been generated
    };
  };

  // Load sessions for the current month
  useEffect(() => {
    const loadSessions = async () => {
      try {
        setIsLoadingSessions(true);
        const monthStart = startOfMonth(currentDate);
        const monthEnd = endOfMonth(currentDate);
        
        const sessions = await tutorApi.getSessions({
          date_from: format(monthStart, 'yyyy-MM-dd'),
          date_to: format(monthEnd, 'yyyy-MM-dd'),
        });
        
        // Group sessions by date
        const lessonsByDate: Record<string, LessonEvent[]> = {};
        sessions.forEach(session => {
          const dateKey = format(new Date(session.date), 'yyyy-MM-dd');
          if (!lessonsByDate[dateKey]) {
            lessonsByDate[dateKey] = [];
          }
          lessonsByDate[dateKey].push(mapSessionToLesson(session));
        });
        
        setLessons(lessonsByDate);
      } catch (error) {
        console.error('Failed to load sessions:', error);
        toast({
          title: 'Error',
          description: 'Failed to load calendar sessions',
          variant: 'destructive',
        });
      } finally {
        setIsLoadingSessions(false);
      }
    };

    loadSessions();
  }, [currentDate, toast]);

  // Load available students for the "Add Lesson" dialog
  useEffect(() => {
    const loadStudents = async () => {
      try {
        const students = await tutorApi.getStudents();
        setAvailableStudents(students);
      } catch (error) {
        console.error('Failed to load students:', error);
      }
    };

    loadStudents();
  }, []);

  const getDayLessons = (day: Date) => {
    const dateKey = format(day, 'yyyy-MM-dd');
    return lessons[dateKey] || [];
  };

  const handlePrevMonth = () => setCurrentDate(subMonths(currentDate, 1));
  const handleNextMonth = () => setCurrentDate(addMonths(currentDate, 1));


  const getLessonColor = (lesson: LessonEvent | { status: string; time?: string }) => {
    if (lesson.status === 'cancelled') {
      return 'hsl(0, 84%, 60%)'; // Destructive red for cancelled
    }
    if (lesson.status === 'unavailable') {
      return 'hsl(45, 93%, 47%)'; // Warning yellow for unavailable
    }
    if (lesson.status === 'completed') {
      return 'hsl(142, 70%, 50%)'; // Vibrant green (secondary) for completed
    }
    // Default scheduled color - Dark deep blue (primary)
    return 'hsl(220, 80%, 30%)'; // Primary dark deep blue for scheduled
  };

  const handleCancelLesson = (lesson: LessonEvent) => {
    setSelectedLesson(lesson);
    setIsCancelLessonOpen(true);
  };

  const confirmCancelLesson = async () => {
    if (!selectedLesson || !cancellationReason.trim()) {
      toast({
        title: "Reason Required",
        description: "Please provide a reason for cancellation.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Update session status to cancelled via API
      await tutorApi.updateSession(Number(selectedLesson.id), {
        status: 'cancelled',
      });

      // Reload sessions
      const monthStart = startOfMonth(currentDate);
      const monthEnd = endOfMonth(currentDate);
      const sessions = await tutorApi.getSessions({
        date_from: format(monthStart, 'yyyy-MM-dd'),
        date_to: format(monthEnd, 'yyyy-MM-dd'),
      });

      const lessonsByDate: Record<string, LessonEvent[]> = {};
      sessions.forEach(session => {
        const dateKey = format(new Date(session.date), 'yyyy-MM-dd');
        if (!lessonsByDate[dateKey]) {
          lessonsByDate[dateKey] = [];
        }
        lessonsByDate[dateKey].push(mapSessionToLesson(session));
      });
      setLessons(lessonsByDate);

      toast({
        title: "Lesson Cancelled",
        description: "Lesson has been cancelled successfully.",
      });
    } catch (error) {
      console.error('Failed to cancel lesson:', error);
      toast({
        title: "Error",
        description: "Failed to cancel lesson. Please try again.",
        variant: "destructive",
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

  const confirmUnavailable = async () => {
    if (!selectedLesson || !unavailableReason.trim()) {
      toast({
        title: "Reason Required",
        description: "Please provide a reason for unavailability.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Update session status to unavailable via API
      await tutorApi.updateSession(Number(selectedLesson.id), {
        status: 'unavailable',
      });

      // Reload sessions
      const monthStart = startOfMonth(currentDate);
      const monthEnd = endOfMonth(currentDate);
      const sessions = await tutorApi.getSessions({
        date_from: format(monthStart, 'yyyy-MM-dd'),
        date_to: format(monthEnd, 'yyyy-MM-dd'),
      });

      const lessonsByDate: Record<string, LessonEvent[]> = {};
      sessions.forEach(session => {
        const dateKey = format(new Date(session.date), 'yyyy-MM-dd');
        if (!lessonsByDate[dateKey]) {
          lessonsByDate[dateKey] = [];
        }
        lessonsByDate[dateKey].push(mapSessionToLesson(session));
      });
      setLessons(lessonsByDate);

      toast({
        title: "Marked as Unavailable",
        description: "Lesson has been marked as unavailable.",
      });
    } catch (error) {
      console.error('Failed to mark lesson as unavailable:', error);
      toast({
        title: "Error",
        description: "Failed to mark lesson as unavailable. Please try again.",
        variant: "destructive",
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

  const handleSaveLessonNote = async (sessionId: string, lessonNote: string, topicsTaught: string, homeworkResources: string, studentNotes: any[]) => {
    if (!selectedLesson) return;

    try {
      // Add notes and mark as completed via API
      await tutorApi.addSessionNotes(Number(selectedLesson.id), {
        lesson_note: lessonNote,
        topics_taught: topicsTaught,
        homework_resources: homeworkResources,
      });

      // Update status to completed
      await tutorApi.updateSession(Number(selectedLesson.id), {
        status: 'completed',
      });

      // Reload sessions
      const monthStart = startOfMonth(currentDate);
      const monthEnd = endOfMonth(currentDate);
      const sessions = await tutorApi.getSessions({
        date_from: format(monthStart, 'yyyy-MM-dd'),
        date_to: format(monthEnd, 'yyyy-MM-dd'),
      });

      const lessonsByDate: Record<string, LessonEvent[]> = {};
      sessions.forEach(session => {
        const dateKey = format(new Date(session.date), 'yyyy-MM-dd');
        if (!lessonsByDate[dateKey]) {
          lessonsByDate[dateKey] = [];
        }
        lessonsByDate[dateKey].push(mapSessionToLesson(session));
      });
      setLessons(lessonsByDate);

      toast({
        title: "Lesson Completed",
        description: "Lesson notes have been saved successfully.",
      });
    } catch (error) {
      console.error('Failed to save lesson notes:', error);
      toast({
        title: "Error",
        description: "Failed to save lesson notes. Please try again.",
        variant: "destructive",
      });
    }

    setIsLessonNoteOpen(false);
    setSelectedLesson(null);
  };

  const handleGenerateInvoice = (lesson: LessonEvent) => {
    setSelectedLesson(lesson);
    setIsInvoicePreviewOpen(true);
  };

  const handleConfirmInvoiceGeneration = async (invoiceData: any) => {
    if (!selectedLesson) return;

    try {
      // Save invoice to database
      await tutorApi.createInvoice({
        session_id: Number(selectedLesson.id),
        invoice_number: invoiceData.invoiceNumber,
        issue_date: invoiceData.date,
        period_start: invoiceData.periodStart,
        period_end: invoiceData.periodEnd,
        tutor_address: invoiceData.tutorAddress,
        items: invoiceData.items.map((item: any) => ({
          description: item.description,
          quantity: item.quantity,
          rate: item.rate,
          amount: item.amount,
        })),
        total_amount: invoiceData.totalAmount,
        notes: invoiceData.notes || '',
      });

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
      }

      toast({
        title: "Invoice Generated",
        description: "Invoice has been generated and saved successfully.",
      });

      setIsInvoicePreviewOpen(false);
      setSelectedLesson(null);
    } catch (error) {
      console.error('Failed to generate invoice:', error);
      toast({
        title: "Error",
        description: "Failed to generate invoice. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleViewInvoice = async (lesson: LessonEvent) => {
    setSelectedLesson(lesson);
    
    try {
      // Fetch invoice from API using session_id
      const invoicesResponse = await tutorApi.getInvoices({
        session_id: lesson.id,
      });
      
      // Check if invoices.data exists (array) or if invoices is already an array
      const invoices = Array.isArray(invoicesResponse) ? invoicesResponse : (invoicesResponse?.data || []);
      
      // Find invoice that matches this session (should be only one with session_id filter)
      const invoice = invoices.find((inv: any) => inv.session_id === Number(lesson.id));
      
      if (invoice) {
        // Convert API invoice to InvoiceData format
        const invoiceData = {
          lessonId: lesson.id,
          invoiceNumber: invoice.invoice_number,
          date: invoice.issue_date,
          periodStart: invoice.period_start,
          periodEnd: invoice.period_end,
          tutorName: session?.name || 'Tutor',
          tutorAddress: invoice.tutor_address || '',
          students: lesson.studentNames,
          items: invoice.items?.map((item: any) => ({
            description: item.description,
            quantity: parseFloat(item.credits) || 0,
            rate: parseFloat(item.amount) / (parseFloat(item.credits) || 1),
            amount: parseFloat(item.amount),
          })) || [],
          totalAmount: parseFloat(invoice.amount) || 0,
          notes: invoice.notes || '',
        };
        
        // Store in generatedInvoices for the modal
        setGeneratedInvoices(prev => ({
          ...prev,
          [lesson.id]: invoiceData,
        }));
      }
    } catch (error) {
      console.error('Failed to fetch invoice:', error);
      // Continue to show modal even if fetch fails - it will use generatedInvoices or show default
    }
    
    setIsInvoiceViewOpen(true);
  };

  const handleDownloadInvoice = async (lesson: LessonEvent) => {
    try {
      // Fetch invoice from API using session_id
      const invoicesResponse = await tutorApi.getInvoices({
        session_id: lesson.id,
      });
      
      // Check if invoices.data exists (array) or if invoices is already an array
      const invoices = Array.isArray(invoicesResponse) ? invoicesResponse : (invoicesResponse?.data || []);
      
      // Find invoice that matches this session (should be only one with session_id filter)
      let invoice = invoices.find((inv: any) => inv.session_id === Number(lesson.id));
      
      // If invoice found, use it; otherwise use stored data or create from lesson
      const invoiceData = generatedInvoices[lesson.id];
      const lessonDate = new Date();
      
      if (invoice) {
        // Use invoice data from database
        await generateTutorInvoicePDF({
          id: String(invoice.id),
          invoiceNumber: invoice.invoice_number,
          date: invoice.issue_date,
          periodStart: invoice.period_start,
          periodEnd: invoice.period_end,
          status: invoice.status === 'paid' ? 'Paid' : invoice.status === 'pending' ? 'Pending' : 'Overdue',
          amount: parseFloat(invoice.amount),
          tutorName: session?.name || 'Tutor',
          tutorAddress: invoice.tutor_address || '',
          items: invoice.items?.map((item: any) => ({
            description: item.description,
            quantity: parseFloat(item.credits) || 0,
            rate: parseFloat(item.amount) / (parseFloat(item.credits) || 1),
            amount: parseFloat(item.amount),
          })) || [],
          notes: invoice.notes || '',
          due_date: invoice.due_date,
          currency: invoice.currency,
          paid_date: invoice.paid_date,
          payment_method: invoice.payment_method,
          transaction_id: invoice.transaction_id,
        });
      } else if (invoiceData) {
        // Use stored invoice data
        await generateTutorInvoicePDF({
          id: lesson.id,
          invoiceNumber: invoiceData.invoiceNumber,
          date: invoiceData.date,
          periodStart: invoiceData.periodStart,
          periodEnd: invoiceData.periodEnd,
          status: 'Pending',
          amount: invoiceData.totalAmount,
          tutorName: lesson.tutorName || session?.name || 'Tutor',
          tutorAddress: invoiceData.tutorAddress || '',
          items: invoiceData.items || [],
          notes: invoiceData.notes || '',
        });
      } else {
        // Fallback to lesson data
        await generateTutorInvoicePDF({
          id: lesson.id,
          invoiceNumber: `TINV-${Date.now().toString().slice(-6)}`,
          date: lessonDate.toISOString().split('T')[0],
          periodStart: lessonDate.toISOString().split('T')[0],
          periodEnd: lessonDate.toISOString().split('T')[0],
          status: 'Pending',
          amount: lesson.wage || 0,
          tutorName: lesson.tutorName || session?.name || 'Tutor',
          tutorAddress: '',
          items: [{
            description: `${lesson.subject || lesson.lessonTitle || 'Lesson'} - ${lesson.studentNames.join(', ')}`,
            quantity: lesson.duration,
            rate: (lesson.wage || 0) / lesson.duration,
            amount: lesson.wage || 0,
          }],
          notes: '',
        });
      }
      
      toast({
        title: "Download Started",
        description: `Invoice is being downloaded...`,
      });
    } catch (error) {
      console.error('Failed to download invoice:', error);
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

  const handleSaveEditedLesson = async () => {
    if (!editingLesson) return;

    try {
      // Parse time back to 24h format for API (H:i format without seconds)
      const parseTimeTo24h = (timeStr: string): string => {
        if (timeStr.includes('PM') || timeStr.includes('AM')) {
          const [time, period] = timeStr.split(' ');
          const [hours, minutes] = time.split(':');
          let hour24 = parseInt(hours);
          if (period === 'PM' && hour24 !== 12) hour24 += 12;
          if (period === 'AM' && hour24 === 12) hour24 = 0;
          return `${hour24.toString().padStart(2, '0')}:${minutes}`;
        }
        // Remove seconds if present, return HH:MM format
        return timeStr.split(' ')[0].split(':').slice(0, 2).join(':');
      };

      const startTime = parseTimeTo24h(editingLesson.time);
      const [startHour, startMin] = startTime.split(':').map(Number);
      const endHour = startHour + Math.floor(editingLesson.duration);
      const endMin = startMin + ((editingLesson.duration % 1) * 60);
      // Format as H:i (HH:MM) without seconds
      const endTime = `${endHour.toString().padStart(2, '0')}:${Math.floor(endMin).toString().padStart(2, '0')}`;

      // Get the original session to find the date
      const originalSession = await tutorApi.getSession(Number(editingLesson.id));

      // Update session via API
      await tutorApi.updateSession(Number(editingLesson.id), {
        start_time: startTime,
        end_time: endTime,
        subject: editingLesson.subject || originalSession.subject,
        location: editingLesson.mode === 'online' ? 'online' : editingLesson.mode === 'offline' ? 'home' : 'centre',
      });

      // Reload sessions
      const monthStart = startOfMonth(currentDate);
      const monthEnd = endOfMonth(currentDate);
      const sessions = await tutorApi.getSessions({
        date_from: format(monthStart, 'yyyy-MM-dd'),
        date_to: format(monthEnd, 'yyyy-MM-dd'),
      });

      const lessonsByDate: Record<string, LessonEvent[]> = {};
      sessions.forEach(session => {
        const dateKey = format(new Date(session.date), 'yyyy-MM-dd');
        if (!lessonsByDate[dateKey]) {
          lessonsByDate[dateKey] = [];
        }
        lessonsByDate[dateKey].push(mapSessionToLesson(session));
      });
      setLessons(lessonsByDate);

      toast({
        title: "Lesson Updated",
        description: "Lesson has been updated successfully.",
      });
    } catch (error) {
      console.error('Failed to update lesson:', error);
      toast({
        title: "Error",
        description: "Failed to update lesson. Please try again.",
        variant: "destructive",
      });
    }

    setIsEditLessonOpen(false);
    setEditingLesson(null);
  };

  const handleAddLesson = async () => {
    if (newLesson.studentIds.length === 0 || !newLesson.date || !newLesson.startTime || !newLesson.subject) {
      toast({
        title: "Missing Information",
        description: "Please select at least one student, fill in date, time, and subject.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Calculate end time based on duration
      const [startHour, startMin] = newLesson.startTime.split(':').map(Number);
      const durationHours = parseFloat(newLesson.duration);
      const endHour = startHour + Math.floor(durationHours);
      const endMin = startMin + ((durationHours % 1) * 60);
      // Format as H:i (HH:MM) without seconds
      const endTime = `${endHour.toString().padStart(2, '0')}:${Math.floor(endMin).toString().padStart(2, '0')}`;

      // Create session via API
      // API expects H:i format (HH:MM) without seconds
      await tutorApi.createSession({
        date: newLesson.date,
        start_time: newLesson.startTime, // Already in HH:MM format from time input
        end_time: endTime,
        subject: newLesson.subject,
        year_level: newLesson.yearLevel || undefined,
        location: newLesson.location,
        session_type: newLesson.studentIds.length > 1 ? 'group' : '1:1',
        student_ids: newLesson.studentIds,
        class_id: newLesson.classId || undefined,
      });

      // Reload sessions
      const monthStart = startOfMonth(currentDate);
      const monthEnd = endOfMonth(currentDate);
      const sessions = await tutorApi.getSessions({
        date_from: format(monthStart, 'yyyy-MM-dd'),
        date_to: format(monthEnd, 'yyyy-MM-dd'),
      });

      const lessonsByDate: Record<string, LessonEvent[]> = {};
      sessions.forEach(session => {
        const dateKey = format(new Date(session.date), 'yyyy-MM-dd');
        if (!lessonsByDate[dateKey]) {
          lessonsByDate[dateKey] = [];
        }
        lessonsByDate[dateKey].push(mapSessionToLesson(session));
      });
      setLessons(lessonsByDate);

      toast({
        title: "Lesson Added",
        description: `Lesson scheduled for ${newLesson.studentIds.length} student(s) successfully.`,
      });
      setNewLesson({ studentIds: [], subject: '', date: '', startTime: '', endTime: '', duration: '1', location: 'online', yearLevel: '', classId: null });
      setIsAddLessonOpen(false);
    } catch (error) {
      console.error('Failed to create lesson:', error);
      toast({
        title: "Error",
        description: "Failed to create lesson. Please try again.",
        variant: "destructive",
      });
    }
  };

  const toggleStudent = (studentId: number) => {
    setNewLesson(prev => ({
      ...prev,
      studentIds: prev.studentIds.includes(studentId)
        ? prev.studentIds.filter(id => id !== studentId)
        : [...prev.studentIds, studentId]
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
                <Label htmlFor="subject">Subject *</Label>
                <Input
                  id="subject"
                  placeholder="e.g., Mathematics, Physics, English"
                  value={newLesson.subject}
                  onChange={(e) => setNewLesson({ ...newLesson, subject: e.target.value })}
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
                      {newLesson.studentIds.length === 0
                        ? 'Select students...'
                        : `${newLesson.studentIds.length} student${newLesson.studentIds.length !== 1 ? 's' : ''} selected`}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-80" align="start">
                    <div className="space-y-2">
                      <Label className="text-sm font-semibold">Select Students</Label>
                      <div className="space-y-2 max-h-[300px] overflow-y-auto">
                        {availableStudents.map(student => (
                          <div key={student.id} className="flex items-center space-x-2">
                            <Checkbox
                              id={`student-${student.id}`}
                              checked={newLesson.studentIds.includes(student.id)}
                              onCheckedChange={() => toggleStudent(student.id)}
                            />
                            <Label htmlFor={`student-${student.id}`} className="cursor-pointer text-sm flex-1">
                              {student.user?.name || `Student ${student.id}`}
                            </Label>
                          </div>
                        ))}
                      </div>
                      {newLesson.studentIds.length > 0 && (
                        <div className="pt-2 border-t">
                          <div className="flex flex-wrap gap-1">
                            {newLesson.studentIds.map(studentId => {
                              const student = availableStudents.find(s => s.id === studentId);
                              return (
                                <Badge
                                  key={studentId}
                                  variant="default"
                                  className="cursor-pointer"
                                  onClick={() => toggleStudent(studentId)}
                                >
                                  {student?.user?.name || `Student ${studentId}`}
                                  <X className="ml-1 h-3 w-3" />
                                </Badge>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
              <div>
                <Label htmlFor="date">Date *</Label>
                <Input
                  id="date"
                  type="date"
                  value={newLesson.date}
                  onChange={(e) => setNewLesson({ ...newLesson, date: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="startTime">Start Time *</Label>
                <Input
                  id="startTime"
                  type="time"
                  value={newLesson.startTime}
                  onChange={(e) => setNewLesson({ ...newLesson, startTime: e.target.value })}
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
                <Label htmlFor="location">Location</Label>
                <Select value={newLesson.location} onValueChange={(value: 'online' | 'home' | 'centre') => setNewLesson({ ...newLesson, location: value })}>
                  <SelectTrigger id="location">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="online">Online</SelectItem>
                    <SelectItem value="home">Student's Home</SelectItem>
                    <SelectItem value="centre">Centre</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="yearLevel">Year Level (Optional)</Label>
                <Input
                  id="yearLevel"
                  placeholder="e.g., Year 10, Year 11"
                  value={newLesson.yearLevel}
                  onChange={(e) => setNewLesson({ ...newLesson, yearLevel: e.target.value })}
                />
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
            {isLoadingSessions ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : (
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
                                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                                        <BookOpen className="h-3.5 w-3.5 text-primary dark:text-primary-light" />
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <p className="text-xs text-muted-foreground">Subject</p>
                                        <p className="text-sm font-medium truncate">{lesson.subject}</p>
                                      </div>
                                    </div>
                                  )}
                                  {lesson.location && (
                                    <div className="flex items-center gap-2.5">
                                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-secondary/10 flex items-center justify-center">
                                        <MapPin className="h-3.5 w-3.5 text-secondary dark:text-secondary-light" />
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
                                  <div className="p-3 bg-secondary/10 dark:bg-secondary/20 rounded-lg border border-secondary/30 dark:border-secondary/40">
                                    <p className="font-semibold text-xs text-secondary dark:text-secondary-light mb-1">Lesson Notes</p>
                                    <p className="text-xs text-secondary dark:text-secondary-light line-clamp-2 leading-relaxed">{lesson.lessonNote}</p>
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
                                        className="w-full px-4 py-2.5 text-sm hover:bg-primary hover:text-white hover:border-primary transition-colors justify-start group"
                                      >
                                        <Edit className="h-4 w-4 mr-2 flex-shrink-0 group-hover:text-white" />
                                        <span>Edit</span>
                                      </Button>
                                      <Button
                                        size="default"
                                        variant="outline"
                                        onClick={() => handleCompleteLesson(lesson)}
                                        className="w-full px-4 py-2.5 text-sm hover:bg-secondary hover:text-white hover:border-secondary transition-colors justify-start group"
                                      >
                                        <CheckCircle2 className="h-4 w-4 mr-2 flex-shrink-0 group-hover:text-white" />
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
                                          className="flex-1 px-4 py-2.5 text-sm hover:bg-orange-50 dark:hover:bg-orange-950/30 hover:border-orange-300 dark:hover:border-orange-800 hover:!text-white dark:hover:!text-white transition-colors group"
                                        >
                                          <AlertCircle className="h-4 w-4 mr-2 group-hover:text-white" />
                                          <span className="group-hover:text-white">Unavailable</span>
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
                                      className="w-full hover:bg-primary hover:text-white hover:border-primary transition-colors group"
                                    >
                                      <DollarSign className="h-3.5 w-3.5 mr-1.5 group-hover:text-white" />
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
                                        className="group flex-1 min-w-[calc(50%-0.25rem)] bg-secondary/10 text-secondary dark:text-secondary-light hover:bg-secondary hover:text-white border-secondary/30 dark:border-secondary/40 transition-colors"
                                      >
                                        <DollarSign className="h-3.5 w-3.5 mr-1.5" />
                                        <span className="hidden sm:inline">View Invoice</span>
                                        <span className="sm:hidden">View</span>
                                      </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDownloadInvoice(lesson)}
                            className="group flex-1 min-w-[calc(50%-0.25rem)] hover:bg-primary hover:text-white hover:border-primary/50 transition-colors"
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
            )}
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
                      <div className="p-3 bg-secondary/10 dark:bg-secondary/20 rounded-lg border border-secondary/30 dark:border-secondary/40">
                        <p className="font-semibold text-xs text-secondary dark:text-secondary-light mb-1">Lesson Notes</p>
                        <p className="text-xs text-secondary dark:text-secondary-light line-clamp-2 leading-relaxed">{lesson.lessonNote}</p>
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
                          className="w-full px-4 py-2.5 text-sm hover:bg-primary hover:text-white hover:border-primary transition-colors justify-start group"
                        >
                          <Edit className="h-4 w-4 mr-2 flex-shrink-0 group-hover:text-white" />
                          <span>Edit</span>
                        </Button>
                        <Button
                          size="default"
                          variant="outline"
                          onClick={() => handleCompleteLesson(lesson)}
                          className="w-full px-4 py-2.5 text-sm hover:bg-secondary hover:text-white hover:border-secondary transition-colors justify-start group"
                        >
                          <CheckCircle2 className="h-4 w-4 mr-2 flex-shrink-0 group-hover:text-white" />
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
                            className="flex-1 px-4 py-2.5 text-sm hover:bg-orange-50 dark:hover:bg-orange-950/30 hover:border-orange-300 dark:hover:border-orange-800 hover:!text-white dark:hover:!text-white transition-colors group"
                          >
                            <AlertCircle className="h-4 w-4 mr-2 group-hover:text-white" />
                            <span className="group-hover:text-white">Unavailable</span>
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
                          className="w-full hover:bg-primary hover:text-white hover:border-primary transition-colors group"
                        >
                          <DollarSign className="h-3.5 w-3.5 mr-1.5 group-hover:text-white" />
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
                            className="group flex-1 min-w-[calc(50%-0.25rem)] bg-secondary/10 text-secondary dark:text-secondary-light hover:bg-secondary hover:text-white border-secondary/30 dark:border-secondary/40 transition-colors"
                          >
                            <DollarSign className="h-3.5 w-3.5 mr-1.5" />
                            <span>View Invoice</span>
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDownloadInvoice(lesson)}
                            className="group flex-1 min-w-[calc(50%-0.25rem)] hover:bg-primary hover:text-white hover:border-primary/50 transition-colors"
                          >
                            <Download className="h-3.5 w-3.5 mr-1.5" />
                            <span>Download</span>
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
      {selectedLesson && (
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
          invoiceData={generatedInvoices[selectedLesson.id] || null}
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
          {editingLesson && (() => {
            // Parse time from "04:00 PM" format to "HH:MM" for input
            const parseTimeForInput = (timeStr: string): string => {
              if (timeStr.includes('PM') || timeStr.includes('AM')) {
                const [time, period] = timeStr.split(' ');
                const [hours, minutes] = time.split(':');
                let hour24 = parseInt(hours);
                if (period === 'PM' && hour24 !== 12) hour24 += 12;
                if (period === 'AM' && hour24 === 12) hour24 = 0;
                return `${hour24.toString().padStart(2, '0')}:${minutes}`;
              }
              return timeStr.split(' ')[0] || '';
            };

            return (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="edit-subject">Subject</Label>
                  <Input
                    id="edit-subject"
                    placeholder="e.g., Mathematics, Physics"
                    value={editingLesson.subject || ''}
                    onChange={(e) => setEditingLesson({ ...editingLesson, subject: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Students (Read-only)</Label>
                  <div className="mt-2 p-3 bg-muted rounded-lg">
                    <div className="flex flex-wrap gap-1">
                      {editingLesson.studentNames.map((name, idx) => (
                        <Badge key={idx} variant="outline">{name}</Badge>
                      ))}
                    </div>
                  </div>
                </div>
                <div>
                  <Label htmlFor="edit-time">Start Time</Label>
                  <Input
                    id="edit-time"
                    type="time"
                    value={parseTimeForInput(editingLesson.time)}
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
                  <Label htmlFor="edit-mode">Location</Label>
                  <Select 
                    value={editingLesson.mode === 'online' ? 'online' : editingLesson.location?.includes('Home') ? 'home' : 'centre'} 
                    onValueChange={(value: 'online' | 'home' | 'centre') => {
                      setEditingLesson({ 
                        ...editingLesson, 
                        mode: value === 'online' ? 'online' : 'offline',
                        location: value === 'online' ? 'Online' : value === 'home' ? 'Student\'s Home' : 'Centre'
                      });
                    }}
                  >
                    <SelectTrigger id="edit-mode">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="online">Online</SelectItem>
                      <SelectItem value="home">Student's Home</SelectItem>
                      <SelectItem value="centre">Centre</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            );
          })()}
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
