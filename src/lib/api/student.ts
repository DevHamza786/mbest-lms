/**
 * Student API Service
 */
import { apiClient } from './client';

export interface StudentClass {
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
  enrolled: number;
  capacity: number;
}

export interface StudentAssignment {
  id: number;
  title: string;
  description?: string;
  instructions?: string;
  due_date: string;
  max_points: number;
  submission_type: string;
  allowed_file_types?: string[];
  status: string;
  class_id: number;
  class: {
    name: string;
    category: string;
  };
  tutor: {
    user: {
      name: string;
    };
  };
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
}

export interface StudentGrade {
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

export const studentApi = {
  async getDashboard(): Promise<any> {
    const response = await apiClient.get<any>('/student/dashboard');
    return response.data || {};
  },

  async getClasses(params?: { per_page?: number; page?: number }): Promise<StudentClass[]> {
    const response = await apiClient.get<any>('/student/classes', params);
    // Handle paginated response
    if (response.data && 'data' in response.data && Array.isArray(response.data.data)) {
      return response.data.data;
    }
    // Handle direct array
    return Array.isArray(response.data) ? response.data : [];
  },

  async getClass(id: number): Promise<StudentClass> {
    const response = await apiClient.get<any>(`/student/classes/${id}`);
    // Handle nested response structure
    if (response.data && 'data' in response.data) {
      return response.data.data;
    }
    // Handle direct response
    return response.data;
  },

  async enrollInClass(id: number): Promise<void> {
    await apiClient.post(`/student/classes/${id}/enroll`);
  },

  async unenrollFromClass(id: number): Promise<void> {
    await apiClient.post(`/student/classes/${id}/unenroll`);
  },

  async getAssignments(params?: {
    class_id?: number;
    status?: string;
    per_page?: number;
    page?: number;
  }): Promise<StudentAssignment[]> {
    const response = await apiClient.get<any>('/student/assignments', params);
    // Handle paginated response
    if (response.data && 'data' in response.data && Array.isArray(response.data.data)) {
      return response.data.data;
    }
    // Handle direct array
    return Array.isArray(response.data) ? response.data : [];
  },

  async getAssignment(id: number): Promise<StudentAssignment> {
    const response = await apiClient.get<any>(`/student/assignments/${id}`);
    // Handle nested response structure
    if (response.data && 'data' in response.data) {
    return response.data.data;
    }
    // Handle direct response
    return response.data;
  },

  async submitAssignment(id: number, data: {
    file?: File;
    text_submission?: string;
    link_submission?: string;
  }, submissionId?: number): Promise<AssignmentSubmission> {
    const formData = new FormData();
    if (data.file) formData.append('file', data.file);
    if (data.text_submission) formData.append('text_submission', data.text_submission);
    if (data.link_submission) formData.append('link_submission', data.link_submission);

    // If submissionId is provided, update existing submission
    if (submissionId) {
      formData.append('_method', 'PUT');
      const response = await apiClient.post<{ data: AssignmentSubmission }>(
        `/student/assignments/${id}/submit/${submissionId}`,
        formData,
        true,
        true
      );
      if (!response.data) throw new Error('Failed to update submission');
      return response.data.data;
    }

    // Otherwise, create new submission
    const response = await apiClient.post<{ data: AssignmentSubmission }>(
      `/student/assignments/${id}/submit`,
      formData,
      true,
      true
    );
    if (!response.data) throw new Error('Failed to submit assignment');
    return response.data.data;
  },

  async getSubmission(assignmentId: number): Promise<AssignmentSubmission> {
    const response = await apiClient.get<{ data: AssignmentSubmission }>(
      `/student/assignments/${assignmentId}/submission`
    );
    if (!response.data) throw new Error('Submission not found');
    return response.data.data;
  },

  async getGrades(params?: {
    class_id?: number;
    subject?: string;
    per_page?: number;
    page?: number;
  }): Promise<any> {
    const response = await apiClient.get<any>('/student/grades', params);
    // Handle nested response structure: response.data.data.data contains the grades array
    // response.data.data.overall_average contains the average
    if (response.data && response.data.data) {
      const gradesData = response.data.data;
      return {
        data: gradesData.data || [],
        overall_average: response.data.overall_average || 0,
        pagination: {
          current_page: gradesData.current_page || 1,
          last_page: gradesData.last_page || 1,
          per_page: gradesData.per_page || 10,
          total: gradesData.total || 0,
        },
      };
    }
    return { data: [], overall_average: 0, pagination: { current_page: 1, last_page: 1, per_page: 10, total: 0 } };
  },

  async getGrade(id: number): Promise<StudentGrade> {
    const response = await apiClient.get<{ data: StudentGrade }>(`/student/grades/${id}`);
    if (!response.data) throw new Error('Grade not found');
    return response.data.data;
  },

  async getAttendance(params?: {
    date_from?: string;
    date_to?: string;
    class_id?: number;
    attendance_status?: string;
    per_page?: number;
    page?: number;
  }): Promise<{ records: AttendanceRecord[]; statistics: any }> {
    const response = await apiClient.get<any>('/student/attendance', params);
    // Handle paginated response
    if (response.data && 'data' in response.data && Array.isArray(response.data.data)) {
      return {
        records: response.data.data,
        statistics: response.data.stats || response.stats || {},
      };
    }
    // Handle direct response
    if (response.data && 'stats' in response.data) {
      return {
        records: Array.isArray(response.data.data) ? response.data.data : [],
        statistics: response.data.stats || {},
      };
    }
    return {
      records: Array.isArray(response.data) ? response.data : [],
      statistics: response.stats || {},
    };
  },

  async getQuestions(params?: {
    status?: string;
    assignment_id?: number;
    per_page?: number;
    page?: number;
  }): Promise<any> {
    const response = await apiClient.get<any>('/student/questions', params);
    // Handle paginated response
    if (response.data && 'data' in response.data && Array.isArray(response.data.data)) {
      return response.data;
    }
    return { data: [], current_page: 1, total: 0 };
  },

  async getQuestion(id: number): Promise<any> {
    const response = await apiClient.get<any>(`/student/questions/${id}`);
    if (response.data && 'data' in response.data) {
      return response.data.data;
    }
    return response.data;
  },

  async askQuestion(formData: FormData): Promise<any> {
    const response = await apiClient.post<any>('/student/questions', formData, true, true);
    if (response.data && 'data' in response.data) {
    return response.data.data;
    }
    return response.data;
  },

  async getClassLessons(classId: number, params?: {
    date_from?: string;
    date_to?: string;
    per_page?: number;
    page?: number;
  }): Promise<{ data: any[]; pagination: any }> {
    const response = await apiClient.get<any>('/student/attendance', {
      ...params,
      class_id: classId,
    });
    // Handle paginated response
    if (response.data && 'data' in response.data && Array.isArray(response.data.data)) {
      return {
        data: response.data.data,
        pagination: {
          current_page: response.data.current_page || 1,
          last_page: response.data.last_page || 1,
          per_page: response.data.per_page || 10,
          total: response.data.total || 0,
        },
      };
    }
    // Handle direct array (fallback)
    const data = Array.isArray(response.data) ? response.data : [];
    return {
      data,
      pagination: {
        current_page: 1,
        last_page: 1,
        per_page: data.length,
        total: data.length,
      },
    };
  },
};

