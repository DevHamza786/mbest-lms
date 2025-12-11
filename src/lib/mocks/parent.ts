import type {
  Child,
  ParentStats,
  ParentClass,
  ParentAssignment,
  ParentGrade,
  ParentResource,
  ParentInvoice,
  ParentMessage,
  ParentNotification,
} from '@/lib/store/parentStore';

// Mock children data
export const mockChildren: Child[] = [
  {
    id: 'child-1',
    name: 'Emma Johnson',
    grade: 'Grade 10',
    avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face',
  },
  {
    id: 'child-2',
    name: 'Alex Johnson',
    grade: 'Grade 8',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
  },
];

// Mock stats by child
export const mockStatsByChild: Record<string, ParentStats> = {
  'child-1': {
    overallGrade: 87,
    attendanceRate: 95,
    enrolledClasses: 6,
    activeAssignments: 4,
    completedAssignments: 12,
    upcomingTests: 2,
  },
  'child-2': {
    overallGrade: 92,
    attendanceRate: 98,
    enrolledClasses: 5,
    activeAssignments: 2,
    completedAssignments: 15,
    upcomingTests: 1,
  },
};

// Mock classes by child
export const mockClassesByChild: Record<string, ParentClass[]> = {
  'child-1': [
    {
      id: 'class-1',
      name: 'Advanced Mathematics',
      tutor: 'Mr. Smith',
      schedule: 'Mon, Wed, Fri - 10:00 AM',
      room: 'Room 301',
      meetingLink: 'https://meet.google.com/abc-def-123',
      status: 'active',
      isLive: false,
    },
    {
      id: 'class-2',
      name: 'Physics Fundamentals',
      tutor: 'Dr. Johnson',
      schedule: 'Tue, Thu - 2:00 PM',
      room: 'Lab 205',
      meetingLink: 'https://meet.google.com/ghi-jkl-456',
      status: 'active',
      isLive: true,
    },
    {
      id: 'class-3',
      name: 'English Literature',
      tutor: 'Ms. Davis',
      schedule: 'Mon, Wed - 11:00 AM',
      room: 'Room 102',
      meetingLink: 'https://meet.google.com/mno-pqr-789',
      status: 'active',
      isLive: false,
    },
    {
      id: 'class-4',
      name: 'Chemistry Lab',
      tutor: 'Dr. Wilson',
      schedule: 'Fri - 1:00 PM',
      room: 'Lab 301',
      meetingLink: 'https://meet.google.com/stu-vwx-012',
      status: 'active',
      isLive: false,
    },
    {
      id: 'class-5',
      name: 'World History',
      tutor: 'Mr. Brown',
      schedule: 'Tue, Thu - 9:00 AM',
      room: 'Room 204',
      meetingLink: 'https://meet.google.com/yza-bcd-345',
      status: 'active',
      isLive: false,
    },
    {
      id: 'class-6',
      name: 'Computer Science',
      tutor: 'Ms. Garcia',
      schedule: 'Mon, Wed, Fri - 3:00 PM',
      room: 'Computer Lab',
      meetingLink: 'https://meet.google.com/efg-hij-678',
      status: 'active',
      isLive: false,
    },
  ],
  'child-2': [
    {
      id: 'class-7',
      name: 'Algebra II',
      tutor: 'Mrs. Anderson',
      schedule: 'Mon, Wed, Fri - 9:00 AM',
      room: 'Room 201',
      meetingLink: 'https://meet.google.com/klm-nop-901',
      status: 'active',
      isLive: false,
    },
    {
      id: 'class-8',
      name: 'Earth Science',
      tutor: 'Mr. Taylor',
      schedule: 'Tue, Thu - 10:00 AM',
      room: 'Science Lab',
      meetingLink: 'https://meet.google.com/qrs-tuv-234',
      status: 'active',
      isLive: false,
    },
    {
      id: 'class-9',
      name: 'Creative Writing',
      tutor: 'Ms. Martinez',
      schedule: 'Mon, Wed - 1:00 PM',
      room: 'Room 105',
      meetingLink: 'https://meet.google.com/wxy-zab-567',
      status: 'active',
      isLive: false,
    },
    {
      id: 'class-10',
      name: 'Spanish I',
      tutor: 'Señora Lopez',
      schedule: 'Tue, Thu - 2:00 PM',
      room: 'Room 108',
      meetingLink: 'https://meet.google.com/cde-fgh-890',
      status: 'active',
      isLive: false,
    },
    {
      id: 'class-11',
      name: 'Art & Design',
      tutor: 'Mr. Chen',
      schedule: 'Fri - 11:00 AM',
      room: 'Art Studio',
      meetingLink: 'https://meet.google.com/ijk-lmn-123',
      status: 'active',
      isLive: false,
    },
  ],
};

// Mock assignments by child
export const mockAssignmentsByChild: Record<string, ParentAssignment[]> = {
  'child-1': [
    {
      id: 'assign-1',
      title: 'Calculus Problem Set #5',
      subject: 'Advanced Mathematics',
      dueDate: '2024-01-20',
      status: 'due',
      rubric: 'Focus on integration techniques and applications',
    },
    {
      id: 'assign-2',
      title: 'Physics Lab Report - Momentum',
      subject: 'Physics Fundamentals',
      dueDate: '2024-01-18',
      status: 'submitted',
      grade: 88,
      maxGrade: 100,
      feedback: 'Good analysis, but could improve on error calculations',
    },
    {
      id: 'assign-3',
      title: 'Shakespeare Essay Analysis',
      subject: 'English Literature',
      dueDate: '2024-01-25',
      status: 'due',
      rubric: 'Analyze themes in Hamlet with supporting evidence',
    },
    {
      id: 'assign-4',
      title: 'Chemical Reactions Worksheet',
      subject: 'Chemistry Lab',
      dueDate: '2024-01-15',
      status: 'graded',
      grade: 92,
      maxGrade: 100,
      feedback: 'Excellent understanding of reaction mechanisms',
    },
    {
      id: 'assign-5',
      title: 'World War II Research Project',
      subject: 'World History',
      dueDate: '2024-01-12',
      status: 'late',
      grade: 78,
      maxGrade: 100,
      feedback: 'Late submission affected grade. Good research but needs better organization',
    },
    {
      id: 'assign-6',
      title: 'Python Programming Project',
      subject: 'Computer Science',
      dueDate: '2024-01-22',
      status: 'due',
      rubric: 'Create a simple calculator with GUI interface',
    },
  ],
  'child-2': [
    {
      id: 'assign-7',
      title: 'Quadratic Equations Practice',
      subject: 'Algebra II',
      dueDate: '2024-01-19',
      status: 'submitted',
      grade: 95,
      maxGrade: 100,
      feedback: 'Excellent work! Shows clear understanding of concepts',
    },
    {
      id: 'assign-8',
      title: 'Rock Cycle Diagram',
      subject: 'Earth Science',
      dueDate: '2024-01-21',
      status: 'due',
      rubric: 'Create detailed diagram with explanations of each process',
    },
    {
      id: 'assign-9',
      title: 'Short Story Writing',
      subject: 'Creative Writing',
      dueDate: '2024-01-16',
      status: 'graded',
      grade: 90,
      maxGrade: 100,
      feedback: 'Creative and engaging story. Great character development',
    },
    {
      id: 'assign-10',
      title: 'Spanish Vocabulary Quiz',
      subject: 'Spanish I',
      dueDate: '2024-01-17',
      status: 'graded',
      grade: 87,
      maxGrade: 100,
      feedback: 'Good progress with pronunciation. Keep practicing!',
    },
  ],
};

// Mock grades by child
export const mockGradesByChild: Record<string, ParentGrade[]> = {
  'child-1': [
    {
      id: 'grade-1',
      subject: 'Advanced Mathematics',
      assessment: 'Calculus Quiz #2',
      grade: 92,
      maxGrade: 100,
      date: '2024-01-15',
      category: 'Quiz',
    },
    {
      id: 'grade-2',
      subject: 'Physics Fundamentals',
      assessment: 'Lab Report #3',
      grade: 85,
      maxGrade: 100,
      date: '2024-01-12',
      category: 'Lab',
    },
    {
      id: 'grade-3',
      subject: 'English Literature',
      assessment: 'Essay Analysis',
      grade: 88,
      maxGrade: 100,
      date: '2024-01-10',
      category: 'Essay',
    },
    {
      id: 'grade-4',
      subject: 'Chemistry Lab',
      assessment: 'Midterm Exam',
      grade: 94,
      maxGrade: 100,
      date: '2024-01-08',
      category: 'Exam',
    },
    {
      id: 'grade-5',
      subject: 'World History',
      assessment: 'Chapter 5 Test',
      grade: 82,
      maxGrade: 100,
      date: '2024-01-05',
      category: 'Test',
    },
    {
      id: 'grade-6',
      subject: 'Computer Science',
      assessment: 'Programming Assignment #2',
      grade: 96,
      maxGrade: 100,
      date: '2024-01-03',
      category: 'Assignment',
    },
  ],
  'child-2': [
    {
      id: 'grade-7',
      subject: 'Algebra II',
      assessment: 'Unit 3 Test',
      grade: 93,
      maxGrade: 100,
      date: '2024-01-14',
      category: 'Test',
    },
    {
      id: 'grade-8',
      subject: 'Earth Science',
      assessment: 'Lab Practical',
      grade: 89,
      maxGrade: 100,
      date: '2024-01-11',
      category: 'Lab',
    },
    {
      id: 'grade-9',
      subject: 'Creative Writing',
      assessment: 'Poetry Portfolio',
      grade: 95,
      maxGrade: 100,
      date: '2024-01-09',
      category: 'Portfolio',
    },
    {
      id: 'grade-10',
      subject: 'Spanish I',
      assessment: 'Oral Presentation',
      grade: 91,
      maxGrade: 100,
      date: '2024-01-07',
      category: 'Presentation',
    },
    {
      id: 'grade-11',
      subject: 'Art & Design',
      assessment: 'Digital Art Project',
      grade: 97,
      maxGrade: 100,
      date: '2024-01-04',
      category: 'Project',
    },
  ],
};

// Mock resources by child
export const mockResourcesByChild: Record<string, ParentResource[]> = {
  'child-1': [
    {
      id: 'resource-1',
      title: 'Calculus Reference Guide',
      type: 'document',
      subject: 'Advanced Mathematics',
      tags: ['calculus', 'reference', 'formulas'],
      url: '/resources/calculus-guide.pdf',
      uploadDate: '2024-01-01',
    },
    {
      id: 'resource-2',
      title: 'Physics Lab Safety Video',
      type: 'video',
      subject: 'Physics Fundamentals',
      tags: ['safety', 'lab', 'procedures'],
      url: '/resources/lab-safety.mp4',
      uploadDate: '2024-01-02',
    },
    {
      id: 'resource-3',
      title: 'Hamlet Study Guide',
      type: 'document',
      subject: 'English Literature',
      tags: ['shakespeare', 'hamlet', 'analysis'],
      url: '/resources/hamlet-guide.pdf',
      uploadDate: '2024-01-03',
    },
    {
      id: 'resource-4',
      title: 'Chemistry Lecture Recording - Week 3',
      type: 'recording',
      subject: 'Chemistry Lab',
      tags: ['lecture', 'reactions', 'recording'],
      url: '/resources/chem-week3.mp4',
      uploadDate: '2024-01-04',
    },
  ],
  'child-2': [
    {
      id: 'resource-5',
      title: 'Algebra Practice Problems',
      type: 'document',
      subject: 'Algebra II',
      tags: ['practice', 'quadratic', 'equations'],
      url: '/resources/algebra-practice.pdf',
      uploadDate: '2024-01-01',
    },
    {
      id: 'resource-6',
      title: 'Earth Science Documentary',
      type: 'video',
      subject: 'Earth Science',
      tags: ['documentary', 'geology', 'rocks'],
      url: '/resources/earth-science-doc.mp4',
      uploadDate: '2024-01-02',
    },
    {
      id: 'resource-7',
      title: 'Creative Writing Prompts',
      type: 'document',
      subject: 'Creative Writing',
      tags: ['prompts', 'writing', 'creativity'],
      url: '/resources/writing-prompts.pdf',
      uploadDate: '2024-01-03',
    },
  ],
};

// Mock invoices (shared across children)
export const mockInvoices: ParentInvoice[] = [
  {
    id: 'INV-2024-001',
    period: 'January 2024',
    amount: 1200,
    status: 'paid',
    issuedOn: '2024-01-01',
    dueDate: '2024-01-15',
    lineItems: [
      { description: 'Advanced Mathematics - Emma', amount: 300, childId: 'child-1' },
      { description: 'Physics Fundamentals - Emma', amount: 350, childId: 'child-1' },
      { description: 'English Literature - Emma', amount: 250, childId: 'child-1' },
      { description: 'Algebra II - Alex', amount: 300, childId: 'child-2' },
    ],
  },
  {
    id: 'INV-2024-002',
    period: 'February 2024',
    amount: 1350,
    status: 'due_soon',
    issuedOn: '2024-02-01',
    dueDate: '2024-02-15',
    lineItems: [
      { description: 'Advanced Mathematics - Emma', amount: 300, childId: 'child-1' },
      { description: 'Physics Fundamentals - Emma', amount: 350, childId: 'child-1' },
      { description: 'Chemistry Lab - Emma', amount: 400, childId: 'child-1' },
      { description: 'Algebra II - Alex', amount: 300, childId: 'child-2' },
    ],
  },
  {
    id: 'INV-2023-012',
    period: 'December 2023',
    amount: 800,
    status: 'overdue',
    issuedOn: '2023-12-01',
    dueDate: '2023-12-15',
    lineItems: [
      { description: 'Late fee', amount: 50, childId: 'child-1' },
      { description: 'World History - Emma', amount: 250, childId: 'child-1' },
      { description: 'Earth Science - Alex', amount: 250, childId: 'child-2' },
      { description: 'Spanish I - Alex', amount: 250, childId: 'child-2' },
    ],
  },
];

// Mock messages
export const mockMessages: ParentMessage[] = [
  {
    id: 'msg-1',
    threadId: 'thread-1',
    from: 'Mr. Smith',
    to: 'Parent',
    subject: 'Emma\'s Progress in Mathematics',
    content: 'I wanted to update you on Emma\'s excellent progress in Advanced Mathematics. She has shown great improvement in calculus concepts.',
    timestamp: '2024-01-15T10:30:00Z',
    isRead: false,
  },
  {
    id: 'msg-2',
    threadId: 'thread-2',
    from: 'Dr. Johnson',
    to: 'Parent',
    subject: 'Physics Lab Safety Reminder',
    content: 'Please remind Emma to bring her safety goggles to tomorrow\'s lab session. We\'ll be working with chemicals.',
    timestamp: '2024-01-14T14:20:00Z',
    isRead: true,
  },
  {
    id: 'msg-3',
    threadId: 'thread-3',
    from: 'Mrs. Anderson',
    to: 'Parent',
    subject: 'Alex\'s Outstanding Work',
    content: 'Alex has been doing exceptional work in Algebra II. His understanding of quadratic equations is impressive for his grade level.',
    timestamp: '2024-01-13T09:15:00Z',
    isRead: false,
  },
];

// Mock notifications
export const mockNotifications: ParentNotification[] = [
  {
    id: 'notif-1',
    title: 'Payment Due Soon',
    message: 'Invoice INV-2024-002 for February 2024 is due in 3 days',
    type: 'payment',
    timestamp: '2024-01-12T08:00:00Z',
    isRead: false,
    priority: 'high',
  },
  {
    id: 'notif-2',
    title: 'New Grade Posted',
    message: 'Emma received a grade for Calculus Quiz #2 in Advanced Mathematics',
    type: 'grade',
    timestamp: '2024-01-15T15:30:00Z',
    isRead: false,
    priority: 'medium',
  },
  {
    id: 'notif-3',
    title: 'Class Schedule Change',
    message: 'Physics Fundamentals class moved to Lab 205 starting next week',
    type: 'class',
    timestamp: '2024-01-14T12:00:00Z',
    isRead: true,
    priority: 'medium',
  },
  {
    id: 'notif-4',
    title: 'Assignment Due Tomorrow',
    message: 'Emma has Calculus Problem Set #5 due tomorrow in Advanced Mathematics',
    type: 'assignment',
    timestamp: '2024-01-19T18:00:00Z',
    isRead: false,
    priority: 'high',
  },
  {
    id: 'notif-5',
    title: 'Excellent Progress!',
    message: 'Alex has maintained a 92% average across all subjects this semester',
    type: 'general',
    timestamp: '2024-01-10T10:00:00Z',
    isRead: true,
    priority: 'low',
  },
];

// Service functions
export const parentService = {
  // Get all children for the parent
  getChildren: async (): Promise<Child[]> => {
    await new Promise(resolve => setTimeout(resolve, 500)); // Simulate API delay
    return mockChildren;
  },

  // Get stats for a specific child
  getStatsForChild: async (childId: string): Promise<ParentStats | null> => {
    await new Promise(resolve => setTimeout(resolve, 300));
    return mockStatsByChild[childId] || null;
  },

  // Get classes for a specific child
  getClassesForChild: async (childId: string): Promise<ParentClass[]> => {
    await new Promise(resolve => setTimeout(resolve, 400));
    return mockClassesByChild[childId] || [];
  },

  // Get assignments for a specific child
  getAssignmentsForChild: async (childId: string): Promise<ParentAssignment[]> => {
    await new Promise(resolve => setTimeout(resolve, 400));
    return mockAssignmentsByChild[childId] || [];
  },

  // Get grades for a specific child
  getGradesForChild: async (childId: string): Promise<ParentGrade[]> => {
    await new Promise(resolve => setTimeout(resolve, 400));
    return mockGradesByChild[childId] || [];
  },

  // Get resources for a specific child
  getResourcesForChild: async (childId: string): Promise<ParentResource[]> => {
    await new Promise(resolve => setTimeout(resolve, 400));
    return mockResourcesByChild[childId] || [];
  },

  // Get all invoices for the parent
  getInvoices: async (): Promise<ParentInvoice[]> => {
    await new Promise(resolve => setTimeout(resolve, 400));
    return mockInvoices;
  },

  // Get all messages for the parent
  getMessages: async (): Promise<ParentMessage[]> => {
    await new Promise(resolve => setTimeout(resolve, 400));
    return mockMessages;
  },

  // Get all notifications for the parent
  getNotifications: async (): Promise<ParentNotification[]> => {
    await new Promise(resolve => setTimeout(resolve, 400));
    return mockNotifications;
  },
};
