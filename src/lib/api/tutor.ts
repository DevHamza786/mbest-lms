/**
 * Tutor API Service
 */
import { apiClient } from './client';

export interface TutorClass {
  id: number;
  name: string;
  code: string;
  description?: string;
  category: string;
  level: string;
  status: string;
  enrolled: number;
  capacity: number;
  students?: Array<{
    id: number;
    user: {
      id: number;
      name: string;
      email: string;
    };
  }>;
}

export interface StudentNote {
  id: number;
  session_id: number;
  student_id: number;
  behavior_issues?: string;
  homework_completed: boolean;
  homework_notes?: string;
  private_notes?: string;
  student?: {
    id: number;
    user: {
      id: number;
      name: string;
      email: string;
    };
  };
}

export interface TutoringSession {
  id: number;
  date: string;
  start_time: string;
  end_time: string;
  teacher_id: number;
  subject: string;
  year_level?: string;
  location: string;
  session_type: string;
  status: string;
  lesson_note?: string;
  topics_taught?: string;
  homework_resources?: string;
  attendance_marked: boolean;
  ready_for_invoicing: boolean;
  color?: string;
  students?: Array<{
    id: number;
    user: {
      id: number;
      name: string;
      email?: string;
    };
  }>;
  studentNotes?: StudentNote[];
  // API might return student_notes in snake_case
  student_notes?: StudentNote[];
}

export interface TutorAssignment {
  id: number;
  title: string;
  description?: string;
  instructions?: string;
  class_id: number;
  tutor_id: number;
  due_date: string;
  max_points: number;
  submission_type: string;
  allowed_file_types?: string[];
  status: string;
}

export interface AssignmentSubmission {
  id: number;
  assignment_id: number;
  student_id: number;
  submitted_at?: string;
  file_url?: string;
  text_submission?: string;
  link_submission?: string;
  status: string;
  grade?: number;
  feedback?: string;
  graded_at?: string;
  student: {
    id: number;
    user: {
      id: number;
      name: string;
      email: string;
    };
  };
}

export interface TutorAvailability {
  id: number;
  tutor_id: number;
  day_of_week: string;
  start_time: string;
  end_time: string;
  is_available: boolean;
}

export interface TutorStudent {
  id: number;
  user_id: number;
  enrollment_id: string;
  grade: string;
  user: {
    id: number;
    name: string;
    email: string;
    avatar?: string;
  };
  overall_grade?: number;
  total_assignments?: number;
  completed_assignments?: number;
}

export const tutorApi = {
  async getDashboard(): Promise<any> {
    const response = await apiClient.get<any>('/tutor/dashboard');
    return response.data || {};
  },

  async getClasses(params?: { per_page?: number; page?: number }): Promise<TutorClass[]> {
    const response = await apiClient.get<any>('/tutor/classes', params);
    // Handle paginated response
    if (response.data?.data && Array.isArray(response.data.data)) {
      return response.data.data;
    }
    // Handle non-paginated array response
    if (Array.isArray(response.data)) {
      return response.data;
    }
    return [];
  },

  async getClass(id: number): Promise<TutorClass> {
    const response = await apiClient.get<{ data: TutorClass }>(`/tutor/classes/${id}`);
    if (!response.data) throw new Error('Class not found');
    return response.data.data;
  },

  async getClassStudents(id: number): Promise<any[]> {
    const response = await apiClient.get<any>(`/tutor/classes/${id}/students`);
    // API returns { success: true, data: [...] }
    // So response.data is already the array
    return Array.isArray(response.data) ? response.data : [];
  },

  async getStudents(params?: {
    class_id?: number;
    search?: string;
    per_page?: number;
    page?: number;
  }): Promise<TutorStudent[]> {
    const response = await apiClient.get<{ data: TutorStudent[] }>('/tutor/students', params);
    return response.data?.data || [];
  },

  async getRecipients(): Promise<Array<{
    id: number;
    name: string;
    email: string;
    role: 'student' | 'parent';
    avatar?: string;
  }>> {
    const response = await apiClient.get<any>('/tutor/students/recipients');
    // Backend returns { success: true, data: [...] }
    // apiClient.get returns the same structure: { success: true, data: [...] }
    // So response.data is the array directly
    const recipients = response.data;
    if (Array.isArray(recipients)) {
      return recipients;
    }
    // Handle case where response.data might be wrapped
    if (recipients && Array.isArray(recipients.data)) {
      return recipients.data;
    }
    return [];
  },

  async getStudent(id: number): Promise<TutorStudent> {
    const response = await apiClient.get<{ data: TutorStudent }>(`/tutor/students/${id}`);
    if (!response.data) throw new Error('Student not found');
    return response.data.data;
  },

  async getStudentGrades(studentId: number, params?: {
    class_id?: number;
    subject?: string;
    per_page?: number;
    page?: number;
  }): Promise<{ data: any[]; stats: any }> {
    const response = await apiClient.get<any>(
      `/tutor/students/${studentId}/grades`,
      params
    );
    
    // API returns: { success: true, data: { current_page: 1, data: [...], ... }, stats: {...} }
    // The apiClient.get returns ApiResponse<T>, but Laravel response has stats at top level
    // So response structure is: { success: true, data: {...}, stats: {...} }
    const responseData = response as any;
    
    // Get grades from paginated response
    const gradesData = responseData.data;
    const gradesArray = gradesData?.data || (Array.isArray(gradesData) ? gradesData : []);
    
    // Stats are at the top level of the response (same level as 'data' and 'success')
    const stats = responseData.stats || {};
    
    console.log('getStudentGrades - Full response:', responseData);
    console.log('getStudentGrades - Stats:', stats);
    console.log('getStudentGrades - Grades array:', gradesArray);
    
    return {
      data: gradesArray,
      stats: stats
    };
  },
  
  async getStudentAssignments(studentId: number): Promise<any[]> {
    try {
      const response = await apiClient.get<any>(`/tutor/students/${studentId}/assignments`);
      
      // API returns: { success: true, data: [...] }
      // apiClient.get returns ApiResponse, so response.data contains the actual response
      const responseData = response as any;
      const assignments = responseData.data || [];
      
      console.log('getStudentAssignments - Full response:', response);
      console.log('getStudentAssignments - Response data:', responseData);
      console.log('getStudentAssignments - Assignments:', assignments);
      
      return Array.isArray(assignments) ? assignments : [];
    } catch (error) {
      console.error('Error fetching student assignments:', error);
      return [];
    }
  },
  
  async removeStudentFromClass(studentId: number, classId: number): Promise<void> {
    await apiClient.delete(`/tutor/classes/${classId}/students/${studentId}`);
  },

  async getSessions(params?: {
    date_from?: string;
    date_to?: string;
    status?: string;
    subject?: string;
    student_id?: number;
    class_id?: number;
    per_page?: number;
    page?: number;
  }): Promise<TutoringSession[]> {
    const response = await apiClient.get<any>('/tutor/sessions', params);
    // Handle both paginated and non-paginated responses
    if (Array.isArray(response.data)) {
      return response.data;
    }
    // If paginated, extract the data array
    return response.data?.data || [];
  },

  async getSession(id: number): Promise<TutoringSession> {
    const response = await apiClient.get<TutoringSession>(`/tutor/sessions/${id}`);
    // API returns { success: true, data: {...} }
    // So response.data is already the session object
    if (!response.data) throw new Error('Session not found');
    return response.data;
  },

  async createSession(data: {
    date: string;
    start_time: string;
    end_time: string;
    subject: string;
    year_level?: string;
    location: string;
    session_type: string;
    student_ids: number[];
    class_id?: number;
    color?: string;
  }): Promise<TutoringSession> {
    const response = await apiClient.post<{ data: TutoringSession }>('/tutor/sessions', data);
    if (!response.data) throw new Error('Failed to create session');
    return response.data.data;
  },

  async updateSession(id: number, data: Partial<TutoringSession>): Promise<TutoringSession> {
    const response = await apiClient.put<{ data: TutoringSession }>(`/tutor/sessions/${id}`, data);
    if (!response.data) throw new Error('Failed to update session');
    return response.data.data;
  },

  async deleteSession(id: number): Promise<void> {
    await apiClient.delete(`/tutor/sessions/${id}`);
  },

  async addSessionNotes(id: number, data: {
    lesson_note?: string;
    topics_taught?: string;
    homework_resources?: string;
  }): Promise<TutoringSession> {
    const response = await apiClient.post<{ data: TutoringSession }>(`/tutor/sessions/${id}/notes`, data);
    if (!response.data) throw new Error('Failed to add notes');
    return response.data.data;
  },

  async markAttendance(id: number, data: {
    attendance: Array<{
      student_id: number;
      status: 'present' | 'absent' | 'late' | 'excused';
      notes?: string;
    }>;
  }): Promise<TutoringSession> {
    const response = await apiClient.post<{ data: TutoringSession }>(`/tutor/sessions/${id}/attendance`, data);
    if (!response.data) throw new Error('Failed to mark attendance');
    return response.data.data;
  },

  async getAssignments(params?: {
    class_id?: number;
    status?: string;
    search?: string;
    needs_grading?: boolean;
    per_page?: number;
    page?: number;
  }): Promise<{
    assignments: TutorAssignment[];
    statistics?: {
      total: number;
      published: number;
      drafts: number;
      pending_grading: number;
    };
    pagination?: {
      current_page: number;
      last_page: number;
      per_page: number;
      total: number;
    };
  }> {
    const queryParams: any = { ...params };
    if (queryParams.needs_grading) {
      queryParams.needs_grading = 'true';
    }
    
    const response = await apiClient.get<any>('/tutor/assignments', queryParams);
    
    // Handle paginated response with statistics
    // Backend returns: { success: true, data: { data: [...], statistics: {...}, current_page: ..., ... } }
    if (response.data) {
      const responseData = response.data;
      
      // Check if it's the new structure with statistics (Laravel paginator format)
      if (responseData.data && Array.isArray(responseData.data)) {
        // New paginated structure with statistics
        return {
          assignments: responseData.data,
          statistics: responseData.statistics || undefined,
          pagination: {
            current_page: responseData.current_page || 1,
            last_page: responseData.last_page || 1,
            per_page: responseData.per_page || 15,
            total: responseData.total || 0,
          },
        };
      } else if (Array.isArray(responseData)) {
        // Simple array structure (old format)
        return { assignments: responseData };
      }
    }
    
    return { assignments: [] };
  },

  async getAssignment(id: number): Promise<any> {
    const response = await apiClient.get<{ data: any }>(`/tutor/assignments/${id}`);
    if (!response.data) throw new Error('Assignment not found');
    // API returns { success: true, data: {...} }
    // So response.data is the assignment object
    return response.data.data || response.data;
  },

  async createAssignment(data: {
    title: string;
    description?: string;
    instructions?: string;
    class_id: number;
    due_date: string;
    max_points: number;
    submission_type: string;
    allowed_file_types?: string[];
    status?: string;
  }): Promise<TutorAssignment> {
    const response = await apiClient.post<{ data: TutorAssignment }>('/tutor/assignments', data);
    if (!response.data) throw new Error('Failed to create assignment');
    return response.data.data;
  },

  async updateAssignment(id: number, data: Partial<TutorAssignment>): Promise<TutorAssignment> {
    const response = await apiClient.put<{ data: TutorAssignment }>(`/tutor/assignments/${id}`, data);
    if (!response.data) throw new Error('Failed to update assignment');
    return response.data.data;
  },

  async deleteAssignment(id: number): Promise<void> {
    await apiClient.delete(`/tutor/assignments/${id}`);
  },

  async getSubmissions(assignmentId: number): Promise<AssignmentSubmission[]> {
    const response = await apiClient.get<{ data: AssignmentSubmission[] }>(
      `/tutor/assignments/${assignmentId}/submissions`
    );
    return response.data?.data || [];
  },

  async gradeSubmission(submissionId: number, data: {
    grade: number;
    feedback?: string;
  }): Promise<AssignmentSubmission> {
    const response = await apiClient.put<{ data: AssignmentSubmission }>(
      `/tutor/submissions/${submissionId}/grade`,
      data
    );
    if (!response.data) throw new Error('Failed to grade submission');
    return response.data.data;
  },

  async getAvailability(): Promise<TutorAvailability[]> {
    const response = await apiClient.get<TutorAvailability[]>('/tutor/availability');
    // Backend returns: { success: true, data: [...] }
    // apiClient.get returns ApiResponse<T>, so response.data is the array directly
    return Array.isArray(response.data) ? response.data : [];
  },

  async setAvailability(availability: Array<{
    day_of_week: string;
    start_time: string;
    end_time: string;
    is_available?: boolean;
  }>): Promise<TutorAvailability[]> {
    const response = await apiClient.post<{ data: TutorAvailability[] }>('/tutor/availability', {
      availability
    });
    if (!response.data) throw new Error('Failed to set availability');
    return response.data.data || [];
  },

  async updateAvailability(id: number, data: Partial<TutorAvailability>): Promise<TutorAvailability> {
    const response = await apiClient.put<{ data: TutorAvailability }>(`/tutor/availability/${id}`, data);
    if (!response.data) throw new Error('Failed to update availability');
    return response.data.data;
  },

  async deleteAvailability(id: number): Promise<void> {
    await apiClient.delete(`/tutor/availability/${id}`);
  },

  // Lesson Requests
  async getLessonRequests(params?: {
    status?: string;
    per_page?: number;
    page?: number;
  }): Promise<any[]> {
    const response = await apiClient.get<any>('/tutor/lesson-requests', params);
    // Handle both paginated and non-paginated responses
    if (Array.isArray(response.data)) {
      return response.data;
    }
    if (response.data && 'data' in response.data && Array.isArray(response.data.data)) {
      return response.data.data;
    }
    return [];
  },

  async approveLessonRequest(requestId: number, data?: {
    date?: string;
    start_time?: string;
    end_time?: string;
  }): Promise<void> {
    // Approve lesson request - might create a session
    await apiClient.post(`/tutor/lesson-requests/${requestId}/approve`, data || {});
  },

  async declineLessonRequest(requestId: number, reason?: string): Promise<void> {
    // Decline lesson request
    await apiClient.post(`/tutor/lesson-requests/${requestId}/decline`, { reason });
  },

  async getAttendance(params?: {
    date_from?: string;
    date_to?: string;
    class_id?: number;
    per_page?: number;
    page?: number;
  }): Promise<any[]> {
    const response = await apiClient.get<{ data: any[] }>('/tutor/attendance', params);
    return response.data?.data || [];
  },

  async getAttendanceRecords(params?: {
    student_id?: number;
    date_from?: string;
    date_to?: string;
    attendance_status?: string;
    class_id?: number;
    per_page?: number;
    page?: number;
  }): Promise<any[]> {
    const response = await apiClient.get<{ data: any }>('/tutor/attendance-records', params);
    // Response structure: { success: true, data: paginated_records }
    // paginated_records = { data: [...records], current_page, last_page, ... }
    const paginatedData = response.data || {};
    return Array.isArray(paginatedData) ? paginatedData : (paginatedData.data || []);
  },

  async getHoursWorked(params?: {
    date_from?: string;
    date_to?: string;
  }): Promise<any> {
    const response = await apiClient.get<{ data: any; summary?: any }>('/tutor/hours', params);
    // Backend returns: { success: true, data: paginated_sessions, summary: {...} }
    // apiClient returns: { success: true, data: paginated_sessions, summary: {...} }
    // So we return the whole response to preserve both data and summary
    return response as any;
  },

  async getInvoices(params?: {
    session_id?: string | number;
    status?: string;
    date_from?: string;
    date_to?: string;
    per_page?: number;
    page?: number;
  }): Promise<any> {
    const response = await apiClient.get<{ data: any }>('/tutor/invoices', params);
    // Backend returns: { success: true, data: paginated_invoices }
    // apiClient returns: { success: true, data: paginated_invoices }
    return response.data || {};
  },

  async createInvoice(data: {
    session_id: number;
    invoice_number: string;
    issue_date: string;
    period_start: string;
    period_end: string;
    tutor_address: string;
    items: Array<{
      description: string;
      quantity: number;
      rate: number;
      amount: number;
    }>;
    total_amount: number;
    notes?: string;
  }): Promise<any> {
    const response = await apiClient.post<{ data: any }>('/tutor/invoices', data);
    if (!response.data) throw new Error('Failed to create invoice');
    return response.data.data;
  },

  async getInvoiceBySessionId(sessionId: number): Promise<any> {
    const response = await apiClient.get<{ data: any }>(`/tutor/invoices?session_id=${sessionId}`);
    // The API might return paginated data, so we need to find the invoice for this session
    const invoices = response.data?.data?.data || response.data?.data || [];
    // Find invoice that matches the session (we'll need to check the backend response structure)
    return Array.isArray(invoices) ? invoices.find((inv: any) => inv.session_id === sessionId) || null : null;
  },

  async getLessonHistory(params?: {
    date_from?: string;
    date_to?: string;
    status?: string;
    subject?: string;
    student_id?: number;
    search?: string;
    per_page?: number;
    page?: number;
  }): Promise<TutoringSession[]> {
    const response = await apiClient.get<{ data: TutoringSession[] }>('/tutor/lesson-history', params);
    return response.data?.data || [];
  },

  // Questions
  async getQuestions(params?: {
    status?: string;
    assignment_id?: number;
    per_page?: number;
    page?: number;
  }): Promise<any> {
    const response = await apiClient.get<any>('/tutor/questions', params);
    // Handle paginated response
    if (response.data && 'data' in response.data && Array.isArray(response.data.data)) {
      return response.data;
    }
    return { data: [], current_page: 1, total: 0 };
  },

  async getQuestion(id: number): Promise<any> {
    const response = await apiClient.get<any>(`/tutor/questions/${id}`);
    if (response.data && 'data' in response.data) {
      return response.data.data;
    }
    return response.data;
  },

  async replyToQuestion(id: number, answer: string): Promise<any> {
    const response = await apiClient.post<any>(`/tutor/questions/${id}/reply`, { answer });
    if (response.data && 'data' in response.data) {
      return response.data.data;
    }
    return response.data;
  },

  async updateQuestionStatus(id: number, status: 'pending' | 'answered' | 'closed'): Promise<any> {
    const response = await apiClient.put<any>(`/tutor/questions/${id}/status`, { status });
    if (response.data && 'data' in response.data) {
      return response.data.data;
    }
    return response.data;
  },
};

