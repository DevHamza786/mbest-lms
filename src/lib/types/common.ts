export interface Class {
  id: string;
  name: string;
  code: string;
  tutorId: string;
  tutorName: string;
  description: string;
  students: string[];
  schedule: {
    days: string[];
    time: string;
    room: string;
  };
  duration: string;
  capacity: number;
  enrolled: number;
  status: 'active' | 'inactive' | 'completed';
  startDate: string;
  endDate: string;
  category: string;
  level: 'Beginner' | 'Intermediate' | 'Advanced';
  credits: number;
}

export interface Assignment {
  id: string;
  title: string;
  description: string;
  instructions: string;
  classId: string;
  className: string;
  tutorId: string;
  tutorName: string;
  dueDate: string;
  maxPoints: number;
  submissionType: 'file' | 'text' | 'link';
  allowedFileTypes?: string[];
  status: 'draft' | 'published' | 'archived';
  createdAt: string;
  submissions: AssignmentSubmission[];
}

export interface AssignmentSubmission {
  studentId: string;
  studentName: string;
  submittedAt: string | null;
  fileUrl: string | null;
  status: 'pending' | 'submitted' | 'graded';
  grade: number | null;
  feedback: string | null;
}

export interface Message {
  id: string;
  threadId: string;
  senderId: string;
  senderName: string;
  senderRole: string;
  recipientId: string;
  recipientName: string;
  recipientRole: string;
  subject: string;
  body: string;
  timestamp: string;
  read: boolean;
  important: boolean;
  attachments: MessageAttachment[];
}

export interface MessageAttachment {
  name: string;
  size: string;
  type: string;
}

export interface Resource {
  id: string;
  title: string;
  description: string;
  type: 'document' | 'link' | 'pdf' | 'video';
  category: string;
  tags: string[];
  url: string;
  fileSize: string | null;
  uploadedBy: string;
  uploadedByName: string;
  classId: string | null;
  className: string | null;
  createdAt: string;
  downloads: number;
  public: boolean;
}

export interface Invoice {
  id: string;
  studentId?: string;
  studentName?: string;
  parentId?: string;
  parentName?: string;
  tutorId?: string;
  tutorName?: string;
  amount: number;
  currency: string;
  status: 'pending' | 'paid' | 'overdue' | 'cancelled';
  dueDate: string;
  paidDate: string | null;
  issueDate: string;
  description: string;
  items: InvoiceItem[];
  paymentMethod: string | null;
  transactionId: string | null;
  invoiceNumber?: string;
  periodStart?: string;
  periodEnd?: string;
  tutorAddress?: string;
  notes?: string;
}

export interface InvoiceItem {
  description: string;
  amount: number;
  credits: number | null;
}

export interface DashboardStats {
  totalStudents?: number;
  totalTutors?: number;
  totalClasses?: number;
  totalRevenue?: number;
  activeAssignments?: number;
  completedAssignments?: number;
  upcomingClasses?: number;
  unreadMessages?: number;
  pendingInvoices?: number;
  overallGrade?: number;
}