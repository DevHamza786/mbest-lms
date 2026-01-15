/**
 * Common API Services (Messages, Notifications, Resources, Profile)
 */
import { apiClient } from './client';

export interface Message {
  id: number;
  thread_id: string;
  sender_id: number;
  recipient_id: number;
  subject: string;
  body: string;
  is_read: boolean;
  read_at?: string | null;
  created_at: string;
  updated_at: string;
  sender?: {
    id: number;
    name: string;
    email: string;
    avatar?: string;
  };
  recipient?: {
    id: number;
    name: string;
    email: string;
    avatar?: string;
  };
  attachments?: MessageAttachment[];
}

export interface MessageAttachment {
  id: number;
  message_id: number;
  name?: string;
  file_name?: string;
  file_path: string;
  file_size?: number;
  mime_type?: string;
}

export interface Notification {
  id: number;
  user_id: number;
  type: string;
  title: string;
  message: string;
  data?: any;
  is_read: boolean;
  created_at: string;
  updated_at: string;
}

export interface Resource {
  id: number;
  title: string;
  description?: string;
  type: 'document' | 'link' | 'pdf' | 'video';
  category?: string;
  tags?: string[];
  url: string;
  file_path?: string;
  file_size?: number;
  uploaded_by: number;
  class_id?: number;
  is_public: boolean;
  downloads: number;
  created_at: string;
  updated_at: string;
}

export interface UserProfile {
  id: number;
  name: string;
  email: string;
  role: string;
  avatar?: string | null;
  phone?: string | null;
  date_of_birth?: string | null;
  address?: string | null;
  is_active: boolean;
  student?: any;
  tutor?: any;
  parent_model?: any;
}

export interface ResourceRequest {
  id: number;
  title: string;
  description: string;
  category: string;
  type: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'pending' | 'approved' | 'rejected' | 'fulfilled';
  requested_by: number;
  reviewed_by?: number | null;
  review_notes?: string | null;
  reviewed_at?: string | null;
  created_at: string;
  updated_at: string;
  requestedBy?: {
    id: number;
    name: string;
    email: string;
  };
  reviewedBy?: {
    id: number;
    name: string;
    email: string;
  } | null;
}

export const commonApi = {
  messages: {
    async list(params?: { per_page?: number; page?: number; thread_id?: string; unread_only?: boolean }): Promise<Message[]> {
      const response = await apiClient.get<{ data: Message[] }>('/messages', params);
      // Handle paginated response
      if (response.data && 'data' in response.data && Array.isArray(response.data.data)) {
        return response.data.data;
      }
      // Handle non-paginated response
      return Array.isArray(response.data) ? response.data : [];
    },

    async get(id: number): Promise<Message> {
      const response = await apiClient.get<{ data: Message }>(`/messages/${id}`);
      if (!response.data) throw new Error('Message not found');
      return response.data.data;
    },

    async create(data: {
      recipient_id: number;
      subject: string;
      body: string;
      thread_id?: string;
      is_important?: boolean;
      attachments?: File[];
    }): Promise<Message> {
      // Use FormData only if there are attachments, otherwise use JSON
      const hasAttachments = data.attachments && data.attachments.length > 0;
      
      if (hasAttachments) {
        const formData = new FormData();
        formData.append('recipient_id', String(data.recipient_id));
        formData.append('subject', data.subject);
        formData.append('body', data.body);
        if (data.thread_id) {
          formData.append('thread_id', data.thread_id);
        }
        if (data.is_important !== undefined) {
          // Convert boolean to "1" or "0" for Laravel validation
          formData.append('is_important', data.is_important ? '1' : '0');
        }
        if (data.attachments) {
          data.attachments.forEach((file) => {
            formData.append('attachments[]', file);
          });
        }
        
        const response = await apiClient.post<Message>('/messages', formData, true, true);
        if (!response || !response.data) {
          console.error('Invalid API response:', response);
          throw new Error('Failed to create message: Invalid response from server');
        }
        return response.data;
      } else {
        // Use JSON when no attachments
        const jsonData: any = {
          recipient_id: data.recipient_id,
          subject: data.subject,
          body: data.body,
        };
        if (data.thread_id) {
          jsonData.thread_id = data.thread_id;
        }
        if (data.is_important !== undefined) {
          jsonData.is_important = data.is_important;
        }
        
        const response = await apiClient.post<Message>('/messages', jsonData);
        if (!response || !response.data) {
          console.error('Invalid API response:', response);
          throw new Error('Failed to create message: Invalid response from server');
        }
        return response.data;
      }
    },

    async markAsRead(id: number): Promise<void> {
      await apiClient.put(`/messages/${id}/read`);
    },

    async delete(id: number): Promise<void> {
      await apiClient.delete(`/messages/${id}`);
    },

    async getThreads(): Promise<any[]> {
      const response = await apiClient.get<any[]>('/messages/threads');
      // Backend returns { success: true, data: [...] }
      // apiClient.get returns the same structure: { success: true, data: [...] }
      // So response.data is the array directly
      const threads = response.data;
      if (Array.isArray(threads)) {
        return threads;
      }
      // Handle case where response.data might be wrapped
      if (threads && Array.isArray(threads.data)) {
        return threads.data;
      }
      return [];
    },
  },

  notifications: {
    async list(params?: { per_page?: number; page?: number; is_read?: boolean }): Promise<Notification[]> {
      const response = await apiClient.get<any>('/notifications', params);
      // Backend returns: { success: true, data: { data: [...paginated notifications...], unread_count: ... } }
      // The paginated data has structure: { data: [...], current_page: ..., etc. }
      if (response.data && 'data' in response.data) {
        const responseData = response.data.data;
        // Check if it's paginated (has 'data' property with array)
        if (responseData && 'data' in responseData && Array.isArray(responseData.data)) {
          return responseData.data;
        }
        // Handle direct array
        if (Array.isArray(responseData)) {
          return responseData;
        }
      }
      return [];
    },

    async get(id: number): Promise<Notification> {
      const response = await apiClient.get<{ data: Notification }>(`/notifications/${id}`);
      if (!response.data) throw new Error('Notification not found');
      return response.data.data;
    },

    async markAsRead(id: number): Promise<void> {
      await apiClient.put(`/notifications/${id}/read`);
    },

    async markAllAsRead(): Promise<void> {
      await apiClient.put('/notifications/read-all');
    },

    async getUnreadCount(): Promise<number> {
      const response = await apiClient.get<{ data: { unread_count: number } }>('/notifications/unread-count');
      return response.data?.data?.unread_count || 0;
    },

    async delete(id: number): Promise<void> {
      await apiClient.delete(`/notifications/${id}`);
    },
  },

  resources: {
    async list(params?: {
      class_id?: number;
      type?: string;
      category?: string;
      search?: string;
      per_page?: number;
      page?: number;
    }): Promise<Resource[]> {
      const response = await apiClient.get<any>('/resources', params);
      // Handle paginated response
      if (response.data && 'data' in response.data && Array.isArray(response.data.data)) {
        return response.data.data;
      }
      // Handle direct array
      return Array.isArray(response.data) ? response.data : [];
    },

    async get(id: number): Promise<Resource> {
      const response = await apiClient.get<{ data: Resource }>(`/resources/${id}`);
      if (!response.data) throw new Error('Resource not found');
      return response.data.data;
    },

    async create(data: {
      title: string;
      description?: string;
      class_id?: number;
      type: string;
      category?: string;
      url?: string;
      file?: File;
      is_public?: boolean;
    }): Promise<Resource> {
      const formData = new FormData();
      formData.append('title', data.title);
      if (data.description) formData.append('description', data.description);
      if (data.class_id) formData.append('class_id', String(data.class_id));
      formData.append('type', data.type);
      if (data.category) formData.append('category', data.category);
      if (data.url) formData.append('url', data.url);
      if (data.file) formData.append('file', data.file);
      if (data.is_public !== undefined) formData.append('is_public', String(data.is_public));

      const response = await apiClient.post<{ data: Resource }>('/resources', formData, true, true);
      if (!response.data) throw new Error('Failed to create resource');
      return response.data.data;
    },

    async update(id: number, data: Partial<Resource>): Promise<Resource> {
      const response = await apiClient.put<{ data: Resource }>(`/resources/${id}`, data);
      if (!response.data) throw new Error('Failed to update resource');
      return response.data.data;
    },

    async delete(id: number): Promise<void> {
      await apiClient.delete(`/resources/${id}`);
    },

    async download(id: number): Promise<Blob> {
      const token = apiClient.getToken();
      const baseURL = apiClient.getBaseURL();
      const response = await fetch(`${baseURL}/resources/${id}/download`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) throw new Error('Download failed');
      return response.blob();
    },
  },

  resourceRequests: {
    async list(params?: {
      status?: string;
      priority?: string;
      per_page?: number;
      page?: number;
    }): Promise<ResourceRequest[]> {
      const response = await apiClient.get<any>('/resource-requests', params);
      // Handle Laravel paginated response: { data: [...], current_page: ..., etc. }
      if (response.data && 'data' in response.data && Array.isArray(response.data.data)) {
        return response.data.data;
      }
      // Handle direct array
      if (Array.isArray(response.data)) {
        return response.data;
      }
      return [];
    },

    async get(id: number): Promise<ResourceRequest> {
      const response = await apiClient.get<{ data: ResourceRequest }>(`/resource-requests/${id}`);
      if (!response.data) throw new Error('Resource request not found');
      return response.data.data;
    },

    async create(data: {
      title: string;
      description: string;
      category: string;
      type: string;
      priority?: 'low' | 'medium' | 'high' | 'urgent';
    }): Promise<ResourceRequest> {
      const response = await apiClient.post<{ data: ResourceRequest }>('/resource-requests', data);
      if (!response.data) throw new Error('Failed to create resource request');
      return response.data.data;
    },

    async update(id: number, data: {
      status: 'pending' | 'approved' | 'rejected' | 'fulfilled';
      review_notes?: string;
    }): Promise<ResourceRequest> {
      const response = await apiClient.put<{ data: ResourceRequest }>(`/resource-requests/${id}`, data);
      if (!response.data) throw new Error('Failed to update resource request');
      return response.data.data;
    },

    async delete(id: number): Promise<void> {
      await apiClient.delete(`/resource-requests/${id}`);
    },
  },

  profile: {
    async get(): Promise<UserProfile> {
      const response = await apiClient.get<any>('/profile');
      if (!response.data) throw new Error('Profile not found');
      
      // Handle nested structure: response.data.data contains the profile
      let profileData: any;
      if (response.data.data && response.data.data.id) {
        profileData = response.data.data;
      } else if (response.data.id) {
        profileData = response.data;
      } else {
        throw new Error('Profile data structure is invalid');
      }

      // Return profile with nested student/tutor data preserved
      return {
        id: profileData.id,
        name: profileData.name || '',
        email: profileData.email || '',
        role: profileData.role || '',
        avatar: profileData.avatar || null,
        phone: profileData.phone || null,
        date_of_birth: profileData.date_of_birth || null,
        address: profileData.address || null,
        is_active: profileData.is_active !== undefined ? profileData.is_active : true,
        // Preserve nested objects for access
        student: profileData.student,
        tutor: profileData.tutor,
        parent_model: profileData.parent_model,
      } as any;
    },

    async update(data: Partial<UserProfile>): Promise<UserProfile> {
      const response = await apiClient.put<any>('/profile', data);
      if (!response.data) throw new Error('Failed to update profile');
      
      // Handle nested structure
      const profileData = response.data.data || response.data;
      return {
        id: profileData.id,
        name: profileData.name || '',
        email: profileData.email || '',
        role: profileData.role || '',
        avatar: profileData.avatar || null,
        phone: profileData.phone || null,
        date_of_birth: profileData.date_of_birth || null,
        address: profileData.address || null,
        is_active: profileData.is_active !== undefined ? profileData.is_active : true,
        student: profileData.student,
        tutor: profileData.tutor,
        parent_model: profileData.parent_model,
      } as any;
    },

    async uploadAvatar(file: File): Promise<UserProfile> {
      const formData = new FormData();
      formData.append('avatar', file);
      const response = await apiClient.post<{ data: UserProfile }>('/profile/avatar', formData, true, true);
      if (!response.data) throw new Error('Failed to upload avatar');
      return response.data.data;
    },

    async changePassword(data: { current_password: string; password: string; password_confirmation: string }): Promise<void> {
      await apiClient.put('/profile/password', data);
    },
  },
};

