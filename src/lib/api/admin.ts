/**
 * Admin API Service
 */
import { apiClient, PaginatedResponse } from './client';

export interface AdminUser {
  id: number;
  name: string;
  email: string;
  role: string;
  avatar?: string;
  phone?: string;
  date_of_birth?: string;
  address?: string;
  is_active: boolean;
  created_at: string;
  tutor?: {
    id: number;
    department?: string;
    specialization?: string[];
    hourly_rate?: number;
    qualifications?: string;
    experience_years?: number;
    bio?: string;
  };
  student?: {
    id: number;
    grade?: string;
    enrollment_id?: string;
  };
  parent_model?: {
    id: number;
    relationship?: string;
  };
  parents_data?: Array<{
    id: number;
    name: string;
    email: string;
    avatar?: string;
    phone?: string;
  }>;
}

export interface AdminClass {
  id: number;
  name: string;
  code: string;
  description?: string;
  category?: string;
  level?: string;
  capacity?: number;
  enrolled?: number;
  credits?: number;
  duration?: string;
  status: string;
  start_date?: string;
  end_date?: string;
  tutor_id: number;
  tutor?: {
    id: number;
    user: {
      id: number;
      name: string;
      email: string;
    };
  };
  students?: Array<{
    id: number;
    user_id: number;
    enrollment_id?: string;
    grade?: string;
    user: {
      id: number;
      name: string;
      email: string;
      avatar?: string;
    };
  }>;
  schedules?: Array<{
    id: number;
    class_id: number;
    day_of_week: string;
    start_time: string;
    end_time: string;
    room?: string;
    meeting_link?: string;
  }>;
  assignments?: Array<{
    id: number;
    title: string;
    description?: string;
    due_date: string;
    max_points?: number;
    status: string;
    submission_type?: string;
    submissions_count?: number;
    graded_count?: number;
    submissions?: Array<{
      id: number;
      student_id: number;
      grade?: number;
      submitted_at?: string;
      status?: string;
      student?: {
        id: number;
        user: {
          id: number;
          name: string;
          email: string;
        };
      };
    }>;
  }>;
  packages?: Array<{
    id: number;
    name: string;
    price: number;
  }>;
  resources?: Array<{
    id: number;
    title: string;
    description?: string;
    type: string;
    category?: string;
    url?: string;
    file_path?: string;
  }>;
  schedules?: Array<{
    id: number;
    day_of_week: string;
    start_time: string;
    end_time: string;
    room?: string;
  }>;
}

export interface AdminInvoice {
  id: number;
  invoice_number: string;
  student_id?: number;
  parent_id?: number;
  tutor_id?: number;
  amount: number;
  currency: string;
  status: string;
  due_date: string;
  paid_date?: string;
  issue_date: string;
  period_start?: string;
  period_end?: string;
  description?: string;
  payment_method?: string;
  transaction_id?: string;
  student?: {
    id: number;
    user: {
      id: number;
      name: string;
      email: string;
    };
  };
  parent?: {
    id: number;
    name: string;
    email: string;
  };
  tutor?: {
    id: number;
    user: {
      id: number;
      name: string;
      email: string;
    };
  };
  items: Array<{
    id: number;
    description: string;
    amount: number;
    credits?: number;
  }>;
}

export interface AdminSession {
  id: number;
  date: string;
  start_time: string;
  end_time: string;
  subject: string;
  year_level?: string;
  location: string;
  session_type: string;
  status: string;
  teacher: {
    id: number;
    user: {
      id: number;
      name: string;
      email: string;
    };
  };
  students?: Array<{
    id: number;
    user: {
      id: number;
      name: string;
    };
  }>;
}

export const adminApi = {
  async getDashboard(): Promise<any> {
    // API returns: { success: true, data: { total_students: 10, total_tutors: 5, ... } }
    const response = await apiClient.get<any>('/admin/dashboard');
    
    // response structure: { success: true, data: { total_students: 10, ... } }
    if (response.success && response.data) {
      return response.data; // This is the stats object
    }
    
    return {
      total_students: 0,
      total_tutors: 0,
      total_classes: 0,
      monthly_revenue: 0,
    };
  },

  async getUsers(params?: {
    role?: string;
    search?: string;
    is_active?: boolean;
    per_page?: number;
    page?: number;
  }): Promise<{ users: AdminUser[]; total: number; current_page: number; last_page: number }> {
    const response = await apiClient.get<PaginatedResponse<AdminUser>>('/admin/users', params);
    // Laravel paginated response structure: { success: true, data: { data: [...], total: X, current_page: Y, ... } }
    if (response.success && response.data) {
      return {
        users: response.data.data || [],
        total: response.data.total || 0,
        current_page: response.data.current_page || 1,
        last_page: response.data.last_page || 1,
      };
    }
    return { users: [], total: 0, current_page: 1, last_page: 1 };
  },

  async getUser(id: number): Promise<AdminUser> {
    const response = await apiClient.get<{ data: AdminUser }>(`/admin/users/${id}`);
    if (!response.data) throw new Error('User not found');
    return response.data.data;
  },

  async createUser(data: {
    name: string;
    email: string;
    password: string;
    role: string;
    phone?: string;
    date_of_birth?: string;
    address?: string;
    is_active?: boolean;
  }): Promise<AdminUser> {
    const response = await apiClient.post<{ data: AdminUser }>('/admin/users', data);
    if (!response.data) throw new Error('Failed to create user');
    return response.data.data;
  },

  async updateUser(id: number, data: Partial<AdminUser>): Promise<AdminUser> {
    const response = await apiClient.put<{ data: AdminUser }>(`/admin/users/${id}`, data);
    if (!response.data) throw new Error('Failed to update user');
    return response.data.data;
  },

  async deleteUser(id: number): Promise<void> {
    await apiClient.delete(`/admin/users/${id}`);
  },

  async resetUserPassword(id: number, password: string): Promise<void> {
    await apiClient.put(`/admin/users/${id}`, { password });
  },

  async getUserStats(): Promise<{ total: number; students: number; tutors: number; parents: number }> {
    const response = await apiClient.get<{ total: number; students: number; tutors: number; parents: number }>('/admin/users/stats');
    if (response.success && response.data) {
      return response.data;
    }
    return { total: 0, students: 0, tutors: 0, parents: 0 };
  },

  async getClasses(params?: {
    status?: string;
    category?: string;
    tutor_id?: number;
    search?: string;
    per_page?: number;
    page?: number;
  }): Promise<{ classes: AdminClass[]; total: number; current_page: number; last_page: number }> {
    const response = await apiClient.get<PaginatedResponse<AdminClass>>('/admin/classes', params);
    if (response.success && response.data) {
      return {
        classes: response.data.data || [],
        total: response.data.total || 0,
        current_page: response.data.current_page || 1,
        last_page: response.data.last_page || 1,
      };
    }
    return { classes: [], total: 0, current_page: 1, last_page: 1 };
  },

  async getClass(id: number): Promise<AdminClass> {
    const response = await apiClient.get<any>(`/admin/classes/${id}`);
    console.log('getClass API response:', response);
    
    // Backend returns: { success: true, data: {...} }
    // apiClient.get returns: { success: true, data: {...} }
    if (!response.success || !response.data) {
      throw new Error('Class not found');
    }
    
    const classData = response.data;
    console.log('Extracted class data:', classData);
    return classData;
  },

  async createClass(data: {
    name: string;
    code: string;
    description?: string;
    category: string;
    level: string;
    capacity: number;
    credits: number;
    duration: string;
    status: string;
    start_date?: string;
    end_date?: string;
    tutor_id: number;
  }): Promise<AdminClass> {
    const response = await apiClient.post<{ data: AdminClass }>('/admin/classes', data);
    if (!response.data) throw new Error('Failed to create class');
    return response.data.data;
  },

  async updateClass(id: number, data: Partial<AdminClass>): Promise<AdminClass> {
    const response = await apiClient.put<{ data: AdminClass }>(`/admin/classes/${id}`, data);
    if (!response.data) throw new Error('Failed to update class');
    return response.data.data;
  },

  async deleteClass(id: number): Promise<void> {
    await apiClient.delete(`/admin/classes/${id}`);
  },

  async getInvoices(params?: {
    status?: string;
    student_id?: number;
    parent_id?: number;
    tutor_id?: number;
    date_from?: string;
    date_to?: string;
    per_page?: number;
    page?: number;
    search?: string;
  }): Promise<{ invoices: AdminInvoice[]; total: number; current_page: number; last_page: number }> {
    const response = await apiClient.get<PaginatedResponse<AdminInvoice>>('/admin/billing/invoices', params);
    if (response.success && response.data) {
      return {
        invoices: response.data.data || [],
        total: response.data.total || 0,
        current_page: response.data.current_page || 1,
        last_page: response.data.last_page || 1,
      };
    }
    return { invoices: [], total: 0, current_page: 1, last_page: 1 };
  },

  async getInvoice(id: number): Promise<AdminInvoice> {
    const response = await apiClient.get<any>(`/admin/billing/invoices/${id}`);
    if (!response.success || !response.data) throw new Error('Invoice not found');
    return response.data;
  },

  async createInvoice(data: {
    invoice_number?: string;
    student_id?: number;
    parent_id?: number;
    tutor_id?: number;
    amount: number;
    currency?: string;
    due_date: string;
    issue_date: string;
    period_start?: string;
    period_end?: string;
    description?: string;
    items: Array<{
      description: string;
      amount: number;
      credits?: number;
    }>;
  }): Promise<AdminInvoice> {
    const response = await apiClient.post<any>('/admin/billing/invoices', data);
    if (!response.success || !response.data) throw new Error('Failed to create invoice');
    return response.data;
  },

  async updateInvoice(id: number, data: {
    status?: string;
    paid_date?: string;
    payment_method?: string;
    transaction_id?: string;
  }): Promise<AdminInvoice> {
    const response = await apiClient.put<any>(`/admin/billing/invoices/${id}`, data);
    if (!response.success || !response.data) throw new Error('Failed to update invoice');
    return response.data;
  },

  async getBillingStats(): Promise<{
    total_revenue: number;
    pending_amount: number;
    overdue_amount: number;
    active_students: number;
  }> {
    // Calculate stats from invoices
    const invoices = await this.getInvoices({ per_page: 1000 });
    const totalRevenue = invoices.invoices
      .filter(inv => inv.status === 'paid')
      .reduce((sum, inv) => sum + parseFloat(String(inv.amount)), 0);
    const pendingAmount = invoices.invoices
      .filter(inv => inv.status === 'pending')
      .reduce((sum, inv) => sum + parseFloat(String(inv.amount)), 0);
    const overdueAmount = invoices.invoices
      .filter(inv => inv.status === 'overdue')
      .reduce((sum, inv) => sum + parseFloat(String(inv.amount)), 0);
    
    // Get active students count
    const userStats = await this.getUserStats();
    
    return {
      total_revenue: totalRevenue,
      pending_amount: pendingAmount,
      overdue_amount: overdueAmount,
      active_students: userStats.students,
    };
  },

  async getAnalytics(params?: { date_from?: string; date_to?: string }): Promise<any> {
    const response = await apiClient.get<any>('/admin/analytics', params);
    // API returns: { success: true, data: { overview: {...}, revenue: {...}, ... } }
    if (response.success && response.data) {
      return response.data;
    }
    return {};
  },

  async createSession(data: {
    date: string;
    start_time: string;
    end_time: string;
    teacher_id: number;
    class_id?: number;
    subject: string;
    year_level?: string;
    location: string;
    session_type: '1:1' | 'group';
    status?: string;
    student_ids?: number[];
  }): Promise<AdminSession> {
    const response = await apiClient.post<{ data: AdminSession }>('/admin/calendar/sessions', data);
    if (!response.data) throw new Error('Failed to create session');
    return response.data.data;
  },

  async getSessions(params?: {
    date_from?: string;
    date_to?: string;
    status?: string;
    tutor_id?: number;
    subject?: string;
    location?: string;
    class_id?: number;
    per_page?: number;
    page?: number;
  }): Promise<AdminSession[]> {
    const response = await apiClient.get<any>('/admin/calendar/sessions', params);
    console.log('Raw API response:', response);
    
    // Handle paginated response from Laravel
    // Response structure: { success: true, data: { data: [...], current_page: 1, ... } }
    if (response.success && response.data) {
      // If data is an object with a data property (paginated Laravel response)
      if (response.data.data && Array.isArray(response.data.data)) {
        console.log('Found paginated sessions:', response.data.data);
        return response.data.data;
      }
      // If data is directly an array (unlikely but possible)
      if (Array.isArray(response.data)) {
        console.log('Found direct array sessions:', response.data);
        return response.data;
      }
    }
    console.warn('No sessions found in response:', response);
    return [];
  },

  async getSession(id: number): Promise<AdminSession> {
    const response = await apiClient.get<{ data: AdminSession }>(`/admin/calendar/sessions/${id}`);
    if (!response.data) throw new Error('Session not found');
    return response.data.data;
  },

  async updateSession(id: number, data: {
    date?: string;
    start_time?: string;
    end_time?: string;
    subject?: string;
    year_level?: string;
    location?: string;
    session_type?: string;
    status?: string;
    teacher_id?: number;
    student_ids?: number[];
  }): Promise<AdminSession> {
    const response = await apiClient.put<{ data: AdminSession }>(`/admin/calendar/sessions/${id}`, data);
    if (!response.data) throw new Error('Failed to update session');
    return response.data.data;
  },

  async addSessionNotes(id: number, data: {
    lesson_note?: string;
    topics_taught?: string;
    homework_resources?: string;
    student_notes?: Array<{
      student_id: number;
      behavior_issues?: string;
      homework_completed?: boolean;
      homework_notes?: string;
      private_notes?: string;
    }>;
  }): Promise<AdminSession> {
    const response = await apiClient.post<{ data: AdminSession }>(`/admin/calendar/sessions/${id}/notes`, data);
    if (!response.data) throw new Error('Failed to add notes');
    return response.data.data;
  },

  async markSessionAttendance(id: number, attendance: Array<{
    student_id: number;
    status: 'present' | 'absent' | 'late' | 'excused';
  }>): Promise<AdminSession> {
    const response = await apiClient.post<{ data: AdminSession }>(`/admin/calendar/sessions/${id}/attendance`, { attendance });
    if (!response.data) throw new Error('Failed to mark attendance');
    return response.data.data;
  },

  async markSessionReadyForInvoicing(id: number): Promise<AdminSession> {
    const response = await apiClient.post<{ data: AdminSession }>(`/admin/calendar/sessions/${id}/mark-ready-invoice`, {});
    if (!response.data) throw new Error('Failed to mark ready for invoicing');
    return response.data.data;
  },

  async getCalendarFilterOptions(): Promise<{
    teachers: Array<{ id: string; name: string }>;
    students: Array<{ id: string; name: string }>;
    subjects: string[];
    locations: string[];
    session_types: string[];
    statuses: string[];
  }> {
    const response = await apiClient.get<any>('/admin/calendar/filter-options');
    console.log('Filter options API response:', response);
    
    // Handle response structure: { success: true, data: { teachers: [...], ... } }
    if (response.success && response.data) {
      const filterData = response.data;
      console.log('Filter data extracted:', filterData);
      return {
        teachers: filterData.teachers || [],
        students: filterData.students || [],
        subjects: filterData.subjects || [],
        locations: filterData.locations || [],
        session_types: filterData.session_types || [],
        statuses: filterData.statuses || [],
      };
    }
    
    console.warn('No filter data found in response');
    return {
      teachers: [],
      students: [],
      subjects: [],
      locations: [],
      session_types: [],
      statuses: [],
    };
  },

  async getAttendance(params?: {
    date_from?: string;
    date_to?: string;
    tutor_id?: number;
    class_id?: number;
    per_page?: number;
    page?: number;
  }): Promise<any[]> {
    const response = await apiClient.get<{ data: any[] }>('/admin/attendance', params);
    return response.data?.data || [];
  },

  async getStudentAttendance(params?: {
    search?: string;
    date_from?: string;
    date_to?: string;
    class_id?: number;
    tutor_id?: number;
    attendance_status?: string;
    per_page?: number;
    page?: number;
  }): Promise<{ records: any[]; total: number; current_page: number; last_page: number }> {
    const response = await apiClient.get<any>('/admin/attendance/students', params);
    if (response.success && response.data) {
      if (response.data.data && Array.isArray(response.data.data)) {
        return {
          records: response.data.data,
          total: response.data.total || 0,
          current_page: response.data.current_page || 1,
          last_page: response.data.last_page || 1,
        };
      }
    }
    return { records: [], total: 0, current_page: 1, last_page: 1 };
  },

  async getAttendanceDetails(id: number): Promise<any> {
    const response = await apiClient.get<any>(`/admin/attendance/${id}`);
    console.log('getAttendanceDetails raw response:', response);
    if (!response.success || !response.data) {
      throw new Error('Attendance not found');
    }
    // Response structure: { success: true, data: {...} }
    return response.data;
  },

  async updateAttendance(id: number, data: {
    attendance: Array<{
      student_id: number;
      status: 'present' | 'absent' | 'late' | 'excused';
      notes?: string;
    }>;
  }): Promise<any> {
    const response = await apiClient.put<{ data: any }>(`/admin/attendance/${id}`, data);
    if (!response.data) throw new Error('Failed to update attendance');
    return response.data.data;
  },

  async approveTimesheet(tutorId: number, weekEnding: string): Promise<{
    invoice_id: number;
    invoice_number: string;
    status: string;
    total_hours: number;
    amount: number;
  }> {
    const response = await apiClient.post<{
      invoice_id: number;
      invoice_number: string;
      status: string;
      total_hours: number;
      amount: number;
    }>('/admin/attendance/timesheets/approve', {
      tutor_id: tutorId,
      week_ending: weekEnding,
    });
    if (!response.success || !response.data) {
      throw new Error('Failed to approve timesheet');
    }
    return response.data;
  },

  // Package Management
  async getPackages(params?: { is_active?: boolean }): Promise<Package[]> {
    const response = await apiClient.get<Package[]>('/admin/packages', params);
    // API returns {success: true, data: Package[]}
    // apiClient.get returns ApiResponse<T> which is {success: boolean, data?: T}
    if (response.success && response.data) {
      const packages = Array.isArray(response.data) ? response.data : [];
      console.log('getPackages returning:', packages);
      return packages;
    }
    console.warn('getPackages: No data in response', response);
    return [];
  },

  async getAllClasses(): Promise<AdminClass[]> {
    const response = await apiClient.get<PaginatedResponse<AdminClass>>('/admin/classes', { per_page: 1000 });
    return response.data?.data || [];
  },

  async getPackage(id: number): Promise<Package> {
    const response = await apiClient.get<{ data: Package }>(`/admin/packages/${id}`);
    if (!response.data) throw new Error('Package not found');
    return response.data.data;
  },

  async createPackage(data: CreatePackageData): Promise<Package> {
    const response = await apiClient.post<{ data: Package }>('/admin/packages', data);
    if (!response.data) throw new Error('Failed to create package');
    return response.data.data;
  },

  async updatePackage(id: number, data: UpdatePackageData): Promise<Package> {
    const response = await apiClient.put<{ data: Package }>(`/admin/packages/${id}`, data);
    if (!response.data) throw new Error('Failed to update package');
    return response.data.data;
  },

  async deletePackage(id: number): Promise<void> {
    // Packages should not be deleted - use deactivation instead
    throw new Error('Packages cannot be deleted. Please deactivate them instead to maintain subscription history.');
  },

  // Payment Management
  async getPayments(params?: { status?: string; pending_only?: boolean; per_page?: number; page?: number }): Promise<PaginatedResponse<Payment>> {
    const response = await apiClient.get<PaginatedResponse<Payment>>('/admin/payments', params);
    return response.data || { data: [], current_page: 1, last_page: 1, per_page: 15, total: 0, from: 0, to: 0 };
  },

  async getPayment(id: number): Promise<Payment> {
    const response = await apiClient.get<Payment>(`/admin/payments/${id}`);
    // Backend returns: { success: true, data: {...} }
    // apiClient.get returns: { success: true, data: {...} }
    // So response.data is the payment object directly
    if (!response.data) throw new Error('Payment not found');
    
    // Handle both nested and direct data structures
    if (typeof response.data === 'object' && 'id' in response.data) {
      return response.data as Payment;
    }
    // Fallback for nested structure
    if ((response.data as any).data) {
      return (response.data as any).data as Payment;
    }
    
    throw new Error('Payment not found');
  },

  async approvePayment(id: number, adminNotes?: string): Promise<Payment> {
    const response = await apiClient.post<{ data: Payment }>(`/admin/payments/${id}/approve`, { admin_notes: adminNotes });
    if (!response.data) throw new Error('Failed to approve payment');
    return response.data.data;
  },

  async rejectPayment(id: number, adminNotes: string): Promise<Payment> {
    const response = await apiClient.post<{ data: Payment }>(`/admin/payments/${id}/reject`, { admin_notes: adminNotes });
    if (!response.data) throw new Error('Failed to reject payment');
    return response.data.data;
  },
};

export interface Package {
  id: number;
  name: string;
  price: number | string; // Can be string from API (decimal) or number
  description?: string;
  student_limit: number;
  allows_one_on_one: boolean;
  bank_details?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  classes?: Array<{
    id: number;
    name: string;
    code: string;
  }>;
}

export interface CreatePackageData {
  name: string;
  price: number;
  description?: string;
  student_limit: number;
  class_ids?: number[];
  allows_one_on_one?: boolean;
  bank_details?: string;
  is_active?: boolean;
}

export interface UpdatePackageData extends Partial<CreatePackageData> {}

export interface Payment {
  id: number;
  parent_id: number;
  package_id: number;
  amount: number | string; // Can be string from API (e.g., "50.00")
  payment_slip_path?: string;
  payment_slip_url?: string;
  status: 'pending' | 'approved' | 'rejected';
  admin_notes?: string;
  approved_by?: number;
  approved_at?: string;
  created_at: string;
  updated_at: string;
  parent?: {
    id: number;
    name: string;
    email: string;
  };
  package?: Package;
  approver?: {
    id: number;
    name: string;
    email: string;
  };
}

