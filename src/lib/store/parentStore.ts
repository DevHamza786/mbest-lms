import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Child {
  id: string;
  name: string;
  grade: string;
  avatar?: string;
}

export interface ParentStats {
  overallGrade: number;
  attendanceRate: number;
  enrolledClasses: number;
  activeAssignments: number;
  completedAssignments: number;
  upcomingTests: number;
}

export interface ParentClass {
  id: string;
  name: string;
  tutor: string;
  schedule: string;
  scheduleData?: any; // Original schedule data for detailed view
  room?: string;
  meetingLink?: string;
  status: 'active' | 'upcoming' | 'completed';
  isLive?: boolean;
}

export interface ParentAssignment {
  id: string;
  title: string;
  subject: string;
  dueDate: string;
  status: 'due' | 'submitted' | 'late' | 'graded';
  grade?: number;
  maxGrade?: number;
  feedback?: string;
  rubric?: string;
}

export interface ParentGrade {
  id: string;
  subject: string;
  assessment: string;
  grade: number;
  maxGrade: number;
  date: string;
  category: string;
}

export interface ParentResource {
  id: string;
  title: string;
  type: 'document' | 'video' | 'recording' | 'link';
  subject: string;
  tags: string[];
  url: string;
  uploadDate: string;
}

export interface ParentInvoice {
  id: string;
  period: string;
  amount: number;
  status: 'paid' | 'overdue' | 'due_soon' | 'pending';
  issuedOn: string;
  dueDate: string;
  lineItems: Array<{
    description: string;
    amount: number;
    childId: string;
  }>;
}

export interface ParentMessage {
  id: string;
  threadId: string;
  from: string;
  to: string;
  subject: string;
  content: string;
  timestamp: string;
  isRead: boolean;
  attachments?: Array<{
    name: string;
    url: string;
  }>;
}

export interface ParentNotification {
  id: string;
  title: string;
  message: string;
  type: 'payment' | 'class' | 'grade' | 'assignment' | 'general';
  timestamp: string;
  isRead: boolean;
  priority: 'low' | 'medium' | 'high';
}

interface ParentStore {
  // Current state
  children: Child[];
  activeChildId: string | null;
  
  // Data for active child
  stats: ParentStats | null;
  classes: ParentClass[];
  assignments: ParentAssignment[];
  grades: ParentGrade[];
  resources: ParentResource[];
  invoices: ParentInvoice[];
  messages: ParentMessage[];
  notifications: ParentNotification[];
  
  // Loading states
  isLoading: boolean;
  
  // Actions
  setChildren: (children: Child[]) => void;
  setActiveChild: (childId: string) => void;
  setStats: (stats: ParentStats) => void;
  setClasses: (classes: ParentClass[]) => void;
  setAssignments: (assignments: ParentAssignment[]) => void;
  setGrades: (grades: ParentGrade[]) => void;
  setResources: (resources: ParentResource[]) => void;
  setInvoices: (invoices: ParentInvoice[]) => void;
  setMessages: (messages: ParentMessage[]) => void;
  setNotifications: (notifications: ParentNotification[]) => void;
  setLoading: (loading: boolean) => void;
  markNotificationAsRead: (notificationId: string) => void;
  markMessageAsRead: (messageId: string) => void;
  
  // Computed getters
  getActiveChild: () => Child | null;
  getUnreadNotificationsCount: () => number;
  getUnreadMessagesCount: () => number;
  getOverdueInvoicesCount: () => number;
}

export const useParentStore = create<ParentStore>()(
  persist(
    (set, get) => ({
      // Initial state
      children: [],
      activeChildId: null,
      stats: null,
      classes: [],
      assignments: [],
      grades: [],
      resources: [],
      invoices: [],
      messages: [],
      notifications: [],
      isLoading: false,
      
      // Actions
      setChildren: (children) => {
        set({ children });
        const currentActiveId = get().activeChildId;
        
        // Validate that the current activeChildId exists in the new children list
        const activeChildExists = currentActiveId && children.some(child => child.id === currentActiveId);
        
        // Set first child as active if none selected or if current active child doesn't exist
        if ((!currentActiveId || !activeChildExists) && children.length > 0) {
          set({ activeChildId: children[0].id });
        }
      },
      
      setActiveChild: (childId) => {
        set({ activeChildId: childId });
        // Clear data when switching children
        set({
          stats: null,
          classes: [],
          assignments: [],
          grades: [],
          resources: [],
          isLoading: true
        });
      },
      
      setStats: (stats) => set({ stats }),
      setClasses: (classes) => set({ classes }),
      setAssignments: (assignments) => set({ assignments }),
      setGrades: (grades) => set({ grades }),
      setResources: (resources) => set({ resources }),
      setInvoices: (invoices) => set({ invoices }),
      setMessages: (messages) => set({ messages }),
      setNotifications: (notifications) => set({ notifications }),
      setLoading: (loading) => set({ isLoading: loading }),
      
      markNotificationAsRead: (notificationId) => {
        set((state) => ({
          notifications: state.notifications.map((notification) =>
            notification.id === notificationId
              ? { ...notification, isRead: true }
              : notification
          ),
        }));
      },
      
      markMessageAsRead: (messageId) => {
        set((state) => ({
          messages: state.messages.map((message) =>
            message.id === messageId
              ? { ...message, isRead: true }
              : message
          ),
        }));
      },
      
      // Computed getters
      getActiveChild: () => {
        const { children, activeChildId } = get();
        return children.find((child) => child.id === activeChildId) || null;
      },
      
      getUnreadNotificationsCount: () => {
        return get().notifications.filter((notification) => !notification.isRead).length;
      },
      
      getUnreadMessagesCount: () => {
        return get().messages.filter((message) => !message.isRead).length;
      },
      
      getOverdueInvoicesCount: () => {
        return get().invoices.filter((invoice) => invoice.status === 'overdue').length;
      },
    }),
    {
      name: 'parent-store',
      partialize: (state) => ({
        children: state.children,
        activeChildId: state.activeChildId,
      }),
    }
  )
);

// Hook for getting active child
export const useActiveChild = () => {
  const activeChild = useParentStore((state) => state.getActiveChild());
  return activeChild;
};

// Hook for parent context
export const useParentContext = () => {
  const store = useParentStore();
  return {
    children: store.children,
    activeChildId: store.activeChildId,
    activeChild: store.getActiveChild(),
    stats: store.stats,
    classes: store.classes,
    assignments: store.assignments,
    grades: store.grades,
    resources: store.resources,
    invoices: store.invoices,
    messages: store.messages,
    notifications: store.notifications,
    isLoading: store.isLoading,
    unreadNotifications: store.getUnreadNotificationsCount(),
    unreadMessages: store.getUnreadMessagesCount(),
    overdueInvoices: store.getOverdueInvoicesCount(),
    setActiveChild: store.setActiveChild,
    markNotificationAsRead: store.markNotificationAsRead,
    markMessageAsRead: store.markMessageAsRead,
  };
};
