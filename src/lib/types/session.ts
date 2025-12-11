// Session Management Types

export type SessionStatus = 'planned' | 'completed' | 'cancelled' | 'no-show' | 'rescheduled';
export type SessionType = '1:1' | 'group';
export type SessionLocation = 'online' | 'centre' | 'home';

export interface StudentNote {
  studentId: string;
  studentName: string;
  behaviorIssues?: string;
  homeworkCompleted?: boolean;
  homeworkNotes?: string;
  privateNotes?: string; // Notes only visible to this student's parent
}

export interface Session {
  id: string;
  date: string; // ISO date string
  startTime: string; // HH:mm format
  endTime: string; // HH:mm format
  teacherId: string;
  teacherName: string;
  studentIds: string[];
  studentNames: string[];
  subject: string;
  yearLevel: string;
  location: SessionLocation;
  sessionType: SessionType;
  status: SessionStatus;
  color?: string; // For visual distinction
  lessonNote?: string; // General lesson notes (shared with all parents)
  topicsTaught?: string; // Topics covered in the lesson
  homeworkResources?: string; // Homework resources provided
  studentNotes?: StudentNote[]; // Individual student notes (private to each parent)
  attendanceMarked?: boolean;
  readyForInvoicing?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SessionFormData {
  date: string;
  startTime: string;
  endTime: string;
  teacherId: string;
  studentIds: string[];
  subject: string;
  yearLevel: string;
  location: SessionLocation;
  sessionType: SessionType;
  status: SessionStatus;
}

export interface SessionFilter {
  teacherId?: string;
  studentId?: string;
  subject?: string;
  location?: SessionLocation;
  sessionType?: SessionType;
  status?: SessionStatus;
  dateFrom?: string;
  dateTo?: string;
}

export interface SessionConflict {
  sessionId: string;
  conflictType: 'teacher-double-booked' | 'student-double-booked' | 'location-unavailable';
  message: string;
  conflictingSessions: Session[];
}
