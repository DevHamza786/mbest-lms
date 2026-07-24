import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Session, SessionFormData, SessionLocationMode, SessionType, SessionStatus } from '@/lib/types/session';
import { detectSessionConflicts, calculateDuration } from '@/lib/utils/sessionUtils';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, CheckCircle2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface SessionFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  session?: Session | null;
  allSessions: Session[];
  onSave: (sessionData: SessionFormData) => void;
  mode: 'create' | 'edit';
  filterOptions?: {
    teachers: Array<{ id: string; name: string }>;
    students: Array<{ id: string; name: string }>;
    subjects: string[];
    locations: string[];
    session_types: string[];
    statuses: string[];
  } | null;
}

const defaultSubjects = ['Mathematics', 'Physics', 'Chemistry', 'Biology', 'English', 'Computer Science'];
const yearLevels = ['7', '8', '9', '10', '11', '12'];

export function SessionFormModal({ open, onOpenChange, session, allSessions, onSave, mode, filterOptions }: SessionFormModalProps) {
  const teachers = filterOptions?.teachers?.length ? filterOptions.teachers : [];
  const students = filterOptions?.students?.length ? filterOptions.students : [];
  const subjects = (filterOptions?.subjects?.length ? filterOptions.subjects : defaultSubjects).slice().sort();
  const { toast } = useToast();
  const [formData, setFormData] = useState<SessionFormData>({
    date: '',
    startTime: '',
    endTime: '',
    teacherId: '',
    studentIds: [],
    subject: '',
    yearLevel: '', // kept for now but no longer required
    locationType: 'online',
    locationDetail: '',
    sessionType: '1:1',
    status: 'planned',
    occurrences: 1,
  });
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [conflicts, setConflicts] = useState<any[]>([]);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  // Initialize form with session data if editing
  useEffect(() => {
    if (session && mode === 'edit') {
      setFormData({
        date: session.date,
        startTime: session.startTime,
        endTime: session.endTime,
        teacherId: session.teacherId,
        studentIds: session.studentIds,
        subject: session.subject,
        yearLevel: session.yearLevel,
        locationType: session.locationType,
        locationDetail: session.locationDetail,
        sessionType: session.sessionType,
        status: session.status,
        occurrences: 1,
      });
      setSelectedStudents(session.studentIds);
    } else if (mode === 'create') {
      // Reset for new session
      setFormData({
        date: '',
        startTime: '',
        endTime: '',
        teacherId: '',
        studentIds: [],
        subject: '',
        yearLevel: '',
        locationType: 'online',
        locationDetail: '',
        sessionType: '1:1',
        status: 'planned',
        occurrences: 1,
      });
      setSelectedStudents([]);
    }
  }, [session, mode, open]);

  // Check for conflicts when relevant fields change
  useEffect(() => {
    if (formData.date && formData.startTime && formData.endTime && formData.teacherId) {
      const sessionToCheck: Partial<Session> = {
        id: session?.id,
        ...formData,
      };
      const detectedConflicts = detectSessionConflicts(sessionToCheck as Session, allSessions);
      setConflicts(detectedConflicts);
    } else {
      setConflicts([]);
    }
  }, [formData.date, formData.startTime, formData.endTime, formData.teacherId, formData.studentIds, session?.id, allSessions]);

  const validateForm = (): boolean => {
    const errors: string[] = [];

    if (!formData.date) errors.push('Date is required');
    if (!formData.startTime) errors.push('Start time is required');
    if (!formData.endTime) errors.push('End time is required');
    if (!formData.teacherId) errors.push('Teacher is required');
    if (formData.studentIds.length === 0) errors.push('At least one student is required');
    if (!formData.subject) errors.push('Subject is required');
    if (!formData.locationDetail?.trim()) {
      errors.push('Add a meeting link or onsite address (location detail)');
    }
    if ((formData.repeatDays || []).length > 0 && !formData.repeatUntil) {
      errors.push('Pick a "Repeat until" date for the selected weekdays');
    }

    // Validate time range
    if (formData.startTime && formData.endTime) {
      const duration = calculateDuration(formData.startTime, formData.endTime);
      if (duration <= 0) {
        errors.push('End time must be after start time');
      }
    }

    setValidationErrors(errors);
    return errors.length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      toast({
        title: 'Validation Error',
        description: 'Please fill in all required fields correctly.',
        variant: 'destructive',
      });
      return;
    }

    if (conflicts.length > 0) {
      toast({
        title: 'Scheduling Conflict',
        description: 'There are time conflicts with this session. Please resolve them before saving.',
        variant: 'destructive',
      });
      return;
    }

    try {
      await onSave(formData);
      onOpenChange(false);
      toast({
        title: mode === 'create' ? 'Session Created' : 'Session Updated',
        description: `Session has been ${mode === 'create' ? 'scheduled' : 'updated'} successfully.`,
      });
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err?.message || 'Failed to save session',
        variant: 'destructive',
      });
    }
  };

  const toggleStudent = (studentId: string) => {
    const newSelection = selectedStudents.includes(studentId)
      ? selectedStudents.filter(id => id !== studentId)
      : [...selectedStudents, studentId];
    
    setSelectedStudents(newSelection);
    setFormData({ ...formData, studentIds: newSelection });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{mode === 'create' ? 'Schedule New Session' : 'Edit Session'}</DialogTitle>
          <DialogDescription>
            {mode === 'create' ? 'Create a new tutoring session' : 'Update session details'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Validation Errors */}
          {validationErrors.length > 0 && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <ul className="list-disc list-inside space-y-1">
                  {validationErrors.map((error, idx) => (
                    <li key={idx}>{error}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          {/* Conflicts Warning */}
          {conflicts.length > 0 && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-1">
                  <p className="font-medium">Scheduling Conflicts Detected:</p>
                  {conflicts.map((conflict, idx) => (
                    <p key={idx}>• {conflict.message}</p>
                  ))}
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* Date and Time */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label htmlFor="date">Date *</Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="startTime">Start Time *</Label>
              <Input
                id="startTime"
                type="time"
                value={formData.startTime}
                onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="endTime">End Time *</Label>
              <Input
                id="endTime"
                type="time"
                value={formData.endTime}
                onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
              />
            </div>
          </div>

          {/* Teacher */}
          <div>
            <Label htmlFor="teacher">Teacher *</Label>
            <Select value={formData.teacherId} onValueChange={(value) => setFormData({ ...formData, teacherId: value })}>
              <SelectTrigger id="teacher">
                <SelectValue placeholder="Select teacher" />
              </SelectTrigger>
              <SelectContent>
                {teachers.map(teacher => (
                  <SelectItem key={teacher.id} value={teacher.id}>{teacher.name}</SelectItem>
                ))}
                {teachers.length === 0 && (
                  <SelectItem value="_none" disabled>No teachers found</SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Students */}
          <div>
            <Label>Students * (Select one or more)</Label>
            <div className="flex flex-wrap gap-2 mt-2">
              {students.map(student => (
                <Badge
                  key={student.id}
                  variant={selectedStudents.includes(student.id) ? 'default' : 'outline'}
                  className="cursor-pointer"
                  onClick={() => toggleStudent(student.id)}
                >
                  {student.name}{student.grade ? ` – ${student.grade}` : ''}
                  {selectedStudents.includes(student.id) && <CheckCircle2 className="ml-1 h-3 w-3" />}
                </Badge>
              ))}
              {students.length === 0 && (
                <p className="text-sm text-muted-foreground">No students found. Add students first.</p>
              )}
            </div>
          </div>

          {/* Session Title / Subject */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="subject">Subject *</Label>
              <Select value={formData.subject} onValueChange={(value) => setFormData({ ...formData, subject: value })}>
                <SelectTrigger id="subject">
                  <SelectValue placeholder="Select subject" />
                </SelectTrigger>
                <SelectContent>
                  {subjects.map(subject => (
                    <SelectItem key={subject} value={subject}>{subject}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="title">Session Title (optional)</Label>
              <Input
                id="title"
                value={formData.title || ''}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g., Algebra Review"
              />
            </div>
            {/* Year level now inherited from class, so we omit it here */}
          </div>

          {/* Where */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="locationType">Where *</Label>
              <Select
                value={formData.locationType}
                onValueChange={(value: SessionLocationMode) => setFormData({ ...formData, locationType: value })}
              >
                <SelectTrigger id="locationType">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="online">Online</SelectItem>
                  <SelectItem value="onsite">Onsite</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="sessionType">Session Type *</Label>
              <Select value={formData.sessionType} onValueChange={(value: SessionType) => setFormData({ ...formData, sessionType: value })}>
                <SelectTrigger id="sessionType">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1:1">1:1</SelectItem>
                  <SelectItem value="group">Group</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {mode === 'create' && (
            <div>
              <Label>Repeat weekly on (optional)</Label>
              <div className="flex flex-wrap gap-3 mt-2">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((label, dayIndex) => {
                  const checked = (formData.repeatDays || []).includes(dayIndex);
                  return (
                    <label key={dayIndex} className="flex items-center gap-1.5 text-sm cursor-pointer">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={(e) => {
                          const current = formData.repeatDays || [];
                          const repeatDays = e.target.checked
                            ? [...current, dayIndex]
                            : current.filter((d) => d !== dayIndex);
                          setFormData({ ...formData, repeatDays });
                        }}
                      />
                      {label}
                    </label>
                  );
                })}
              </div>
              {(formData.repeatDays || []).length > 0 && (
                <div className="mt-2 max-w-[220px]">
                  <Label htmlFor="repeatUntil" className="text-xs text-muted-foreground">Repeat until</Label>
                  <Input
                    id="repeatUntil"
                    type="date"
                    value={formData.repeatUntil || ''}
                    min={formData.date}
                    onChange={(e) => setFormData({ ...formData, repeatUntil: e.target.value })}
                  />
                </div>
              )}
              <p className="text-xs text-muted-foreground mt-1">
                Select one or more days to create a session on each matching day through the end date. Leave unchecked to create a single session.
              </p>
            </div>
          )}

          {mode === 'create' && (
            <div>
              <Label htmlFor="materials">Materials (optional)</Label>
              <Input
                id="materials"
                type="file"
                multiple
                onChange={(e) => setFormData({ ...formData, materials: e.target.files ? Array.from(e.target.files) : [] })}
              />
              {(formData.materials || []).length > 0 && (
                <p className="text-xs text-muted-foreground mt-1">
                  {formData.materials!.length} file{formData.materials!.length === 1 ? '' : 's'} selected
                </p>
              )}
            </div>
          )}
          <div>
            <Label htmlFor="locationDetail">
              {formData.locationType === 'online' ? 'Meeting link *' : 'Room, address, or Maps link *'}
            </Label>
            <Input
              id="locationDetail"
              placeholder={
                formData.locationType === 'online'
                  ? 'https://meet.google.com/...'
                  : 'e.g. Room 201 or Google Maps URL'
              }
              value={formData.locationDetail}
              onChange={(e) => setFormData({ ...formData, locationDetail: e.target.value })}
            />
          </div>

          {/* Status */}
          <div>
            <Label htmlFor="status">Status</Label>
            <Select value={formData.status} onValueChange={(value: SessionStatus) => setFormData({ ...formData, status: value })}>
              <SelectTrigger id="status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="planned">Planned</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
                <SelectItem value="no-show">No-show</SelectItem>
                <SelectItem value="rescheduled">Rescheduled</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave} disabled={conflicts.length > 0}>
            {mode === 'create' ? 'Create Session' : 'Update Session'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
