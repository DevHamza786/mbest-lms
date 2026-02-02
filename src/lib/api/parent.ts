/**
 * Parent API Service
 */
import { apiClient } from './client';

export interface Child {
  id: number;
  user_id: number;
  enrollment_id: string;
  grade: string;
  school?: string;
  user: {
    id: number;
    name: string;
    email: string;
    avatar?: string;
  };
}

export interface ParentStats {
  overall_grade: number;
  attendance_rate: number;
  enrolled_classes: number;
  active_assignments: number;
}

export interface ParentClass {
  id: number;
  name: string;
  code: string;
  description?: string;
  category: string;
  level: string;
  tutor: {
    id: number;
    user: {
      id: number;
      name: string;
      email: string;
    };
  };
  schedules: Array<{
    day_of_week: string;
    start_time: string;
    end_time: string;
    room?: string;
    meeting_link?: string;
  }>;
  status: string;
}

export interface ParentAssignment {
  id: number;
  title: string;
  description?: string;
  due_date: string;
  max_points: number;
  submission_type: string;
  status: string;
  class_id: number;
  class: {
    name: string;
    category: string;
  };
  submissions?: Array<{
    id: number;
    student_id: number;
    submitted_at?: string;
    status: string;
    grade?: number;
    feedback?: string;
  }>;
}

export interface ParentGrade {
  id: number;
  student_id: number;
  assignment_id?: number;
  class_id?: number;
  subject: string;
  assessment: string;
  grade: number;
  max_grade: number;
  category?: string;
  date: string;
  notes?: string;
}

export interface ParentInvoice {
  id: number;
  invoice_number: string;
  student_id: number;
  amount: number;
  currency: string;
  status: string;
  due_date: string;
  paid_date?: string;
  issue_date: string;
  period_start?: string;
  period_end?: string;
  description?: string;
  items: Array<{
    id: number;
    description: string;
    amount: number;
    credits?: number;
  }>;
}

export interface ParentSession {
  id: number;
  date: string;
  start_time: string;
  end_time: string;
  subject: string;
  year_level?: string;
  location: string;
  session_type: string;
  status: string;
  lesson_note?: string;
  topics_taught?: string;
  homework_resources?: string;
  teacher: {
    id: number;
    user: {
      id: number;
      name: string;
      email: string;
    };
  };
  student_notes?: Array<{
    id: number;
    student_id: number;
    homework_completed: boolean;
    private_notes?: string;
  }>;
}

export interface AttendanceRecord {
  id: number;
  date: string;
  start_time: string;
  end_time: string;
  subject: string;
  attendance_status: string;
  notes?: string;
  teacher: {
    user: {
      name: string;
    };
  };
}

export const parentApi = {
  async getChildren(): Promise<Child[]> {
    const response = await apiClient.get<{ data: Child[] }>('/parent/children');
    // Laravel returns: { success: true, data: [...] }
    // apiClient.get returns it as-is, so response.data is the array
    return (response.data as any) || [];
  },

  async getChildStats(childId: number): Promise<ParentStats> {
    const response = await apiClient.get<{ data: ParentStats }>(`/parent/children/${childId}/stats`);
    if (!response.data) throw new Error('Stats not found');
    return response.data.data;
  },

  async getChildClasses(childId: number, params?: { per_page?: number; page?: number }): Promise<ParentClass[]> {
    const response = await apiClient.get<{ data: ParentClass[] }>(`/parent/children/${childId}/classes`, params);
    return response.data?.data || [];
  },

  async getChildClass(childId: number, classId: number): Promise<any> {
    const response = await apiClient.get<any>(`/parent/children/${childId}/classes/${classId}`);
    // Laravel returns: { success: true, data: {...} }
    // apiClient.get returns it as-is: { success: true, data: {...} }
    // So response.data is the class object
    if (!response.data) throw new Error('Class not found');
    return response.data || {};
  },

  async getAvailableClasses(childId: number): Promise<ParentClass[]> {
    const response = await apiClient.get<ParentClass[]>(`/parent/children/${childId}/classes/available`);
    // Backend returns: { success: true, data: [...] }
    // apiClient.get returns: { success: true, data: [...] }
    if (Array.isArray(response.data)) {
      return response.data;
    }
    return [];
  },

  async enrollChildInClass(childId: number, classId: number): Promise<any> {
    const response = await apiClient.post<any>(`/parent/children/${childId}/classes/${classId}/enroll`);
    if (!response.data) throw new Error('Enrollment failed');
    return response.data;
  },

  async getChildAssignments(
    childId: number,
    params?: {
      status?: 'due' | 'submitted' | 'graded';
      class_id?: number;
      search?: string;
      per_page?: number;
      page?: number;
    }
  ): Promise<any> {
    const response = await apiClient.get<any>(`/parent/children/${childId}/assignments`, params);
    // Handle paginated response or direct array
    if (response.data && Array.isArray(response.data)) {
      return response.data;
    }
    if (response.data && response.data.data) {
      return response.data; // Return paginated object
    }
    return [];
  },

  async getChildAssignment(childId: number, assignmentId: number): Promise<ParentAssignment> {
    const response = await apiClient.get<{ data: ParentAssignment }>(
      `/parent/children/${childId}/assignments/${assignmentId}`
    );
    if (!response.data) throw new Error('Assignment not found');
    return response.data.data;
  },

  async getChildGrades(
    childId: number,
    params?: {
      class_id?: number;
      subject?: string;
      category?: string;
      per_page?: number;
      page?: number;
    }
  ): Promise<{ grades: ParentGrade[]; statistics: any }> {
    const response = await apiClient.get<any>(
      `/parent/children/${childId}/grades`,
      params
    );
    // Laravel returns: { success: true, data: { data: [...], current_page: ... }, stats: {...} }
    // apiClient.get returns it as-is: { success: true, data: { data: [...], ... }, stats: {...} }
    if (!response.data) throw new Error('Grades not found');
    
    // Handle paginated response (Laravel pagination)
    // response.data is the paginated object: { data: [...], current_page: ..., etc }
    // stats is at root level: response.stats
    const paginatedData = response.data;
    const gradesArray = paginatedData.data || (Array.isArray(paginatedData) ? paginatedData : []);
    // Stats are at root level, not inside data
    const stats = (response as any).stats || {};
    
    return {
      grades: gradesArray,
      statistics: stats,
    };
  },

  async getChildAttendance(
    childId: number,
    params?: {
      date_from?: string;
      date_to?: string;
      class_id?: number;
      attendance_status?: string;
      per_page?: number;
      page?: number;
    }
  ): Promise<{ records: AttendanceRecord[]; statistics: any }> {
    const response = await apiClient.get<any>(
      `/parent/children/${childId}/attendance`,
      params
    );
    // Laravel returns: { success: true, data: { data: [...], stats: {...} } } or { success: true, data: [...] }
    if (!response.data) throw new Error('Attendance records not found');
    
    // Handle paginated response
    if (response.data.data && Array.isArray(response.data.data)) {
      return {
        records: response.data.data,
        statistics: response.data.stats || response.stats || {},
      };
    }
    
    // Handle direct array response
    if (Array.isArray(response.data)) {
      return {
        records: response.data,
        statistics: {},
      };
    }
    
    // Handle object with records property
    if (response.data.records && Array.isArray(response.data.records)) {
      return {
        records: response.data.records,
        statistics: response.data.statistics || response.data.stats || {},
      };
    }
    
    return {
      records: [],
      statistics: {},
    };
  },

  async getChildSessions(
    childId: number,
    params?: {
      date_from?: string;
      date_to?: string;
      status?: string;
      subject?: string;
      tutor_id?: number;
      search?: string;
      per_page?: number;
      page?: number;
    }
  ): Promise<ParentSession[]> {
    const response = await apiClient.get<{ data: ParentSession[] }>(`/parent/children/${childId}/sessions`, params);
    return response.data?.data || [];
  },

  async getChildSession(childId: number, sessionId: number): Promise<ParentSession> {
    const response = await apiClient.get<{ data: ParentSession }>(`/parent/children/${childId}/sessions/${sessionId}`);
    if (!response.data) throw new Error('Session not found');
    return response.data.data;
  },

  async getInvoices(params?: {
    status?: string;
    date_from?: string;
    date_to?: string;
    per_page?: number;
    page?: number;
  }): Promise<ParentInvoice[]> {
    const response = await apiClient.get<{ data: ParentInvoice[] }>('/parent/billing/invoices', params);
    return response.data?.data || [];
  },

  async getInvoice(id: number): Promise<ParentInvoice> {
    const response = await apiClient.get<{ data: ParentInvoice }>(`/parent/billing/invoices/${id}`);
    if (!response.data) throw new Error('Invoice not found');
    return response.data.data;
  },

  async downloadInvoicePdf(id: number): Promise<Blob> {
    const token = apiClient.getToken();
    const baseURL = apiClient.getBaseURL();
    const response = await fetch(`${baseURL}/parent/billing/invoices/${id}/pdf`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    
    // If response is not OK, handle error
    if (!response.ok) {
      let errorMessage = 'PDF download is not available. Please contact support.';
      
      try {
        // Always try to parse as JSON first (most API errors are JSON)
        const text = await response.text();
        
        // Try to parse as JSON
        if (text.trim().startsWith('{') || text.trim().startsWith('[')) {
          try {
            const jsonData = JSON.parse(text);
            // Extract message from JSON response
            if (jsonData.message && typeof jsonData.message === 'string') {
              errorMessage = jsonData.message;
            }
          } catch (parseError) {
            // If JSON parsing fails, use text if it's reasonable length
            if (text.length > 0 && text.length < 500) {
              errorMessage = text;
            }
          }
        } else if (text && text.length < 500) {
          // Not JSON, use text directly if reasonable length
          errorMessage = text;
        }
      } catch (readError) {
        // If we can't read the response, use default message
        console.error('Error reading error response:', readError);
      }
      
      throw new Error(errorMessage);
    }
    
    // Check content type for successful responses
    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      // Response is OK but JSON - something unexpected
      const jsonData = await response.json();
      throw new Error(jsonData.message || 'PDF generation is not available. Please contact support.');
    }
    
    // If we get here, response should be a PDF
    return response.blob();
  },

  async getDashboard(): Promise<any> {
    const response = await apiClient.get<any>('/parent/dashboard');
    // Laravel returns: { success: true, data: { children: [], active_child: {}, stats: {} } }
    // apiClient.get returns: { success: true, data: { children: [], active_child: {}, stats: {} } }
    // So response.data is: { children: [], active_child: {}, stats: {} }
    // Check both possible structures
    if (response.data && typeof response.data === 'object' && 'children' in response.data) {
      return response.data;
    }
    if (response.data && response.data.data) {
      return response.data.data;
    }
    return response.data || {};
  },

  // Subscription & Payment APIs
  async getPackages(): Promise<Package[]> {
    const response = await apiClient.get<Package[]>('/parent/subscription/packages');
    // Backend returns: { success: true, data: [...] }
    // apiClient.get returns: { success: true, data: [...] }
    // So response.data is the array directly
    if (Array.isArray(response.data)) {
      return response.data;
    }
    // Handle case where data might be nested
    if (response.data && Array.isArray((response.data as any).data)) {
      return (response.data as any).data;
    }
    return [];
  },

  async getPackage(id: number): Promise<Package> {
    const response = await apiClient.get<{ data: Package }>(`/parent/subscription/packages/${id}`);
    if (!response.data) throw new Error('Package not found');
    return response.data.data;
  },

  async getMySubscription(): Promise<SubscriptionInfo> {
    const response = await apiClient.get<SubscriptionInfo>('/parent/subscription/my-subscription');
    // Backend returns: { success: true, data: { package: null, status: 'pending', ... } }
    // apiClient.get returns: { success: true, data: { package: null, status: 'pending', ... } }
    if (!response.data) {
      // Return default subscription info if none exists
      return {
        package: null,
        status: 'pending',
        current_student_count: 0,
        limits: null,
        pending_payment: null,
      };
    }
    return response.data;
  },

  async submitPayment(packageId: number, paymentSlip: File): Promise<Payment> {
    const formData = new FormData();
    formData.append('package_id', packageId.toString());
    formData.append('payment_slip', paymentSlip);
    
    const response = await apiClient.post<{ data: Payment }>(
      '/parent/subscription/payment',
      formData,
      true,
      true // isFormData
    );
    if (!response.data) throw new Error('Payment submission failed');
    return response.data.data;
  },

  async addStudent(studentData: AddStudentData): Promise<Child> {
    const response = await apiClient.post<{ data: Child }>('/parent/children', studentData);
    if (!response.data) throw new Error('Failed to add student');
    return response.data.data;
  },
};

export interface Package {
  id: number;
  name: string;
  price: number;
  description?: string;
  student_limit: number;
  allows_one_on_one: boolean;
  bank_details?: string;
  is_active: boolean;
  classes?: Array<{
    id: number;
    name: string;
    code: string;
  }>;
}

export interface Payment {
  id: number;
  parent_id: number;
  package_id: number;
  amount: number | string; // Can be string from API (e.g., "50.00")
  payment_slip_path?: string;
  payment_slip_url?: string;
  status: 'pending' | 'approved' | 'rejected';
  admin_notes?: string;
  approved_at?: string;
  created_at: string;
  package?: Package;
}

export interface SubscriptionInfo {
  package: Package | null;
  status: 'pending' | 'active' | 'expired' | 'cancelled';
  approved_at?: string;
  current_student_count: number;
  limits: {
    student_limit: number;
    allows_one_on_one: boolean;
    classes?: Array<{
      id: number;
      name: string;
      code: string;
    }>;
  } | null;
  pending_payment: Payment | null;
}

export interface AddStudentData {
  name: string;
  email: string;
  password: string;
  grade?: string;
  school?: string;
  phone?: string;
  date_of_birth?: string;
  address?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
}

