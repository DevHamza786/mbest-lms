/**
 * API Client Configuration
 * Base configuration for all API requests
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: Record<string, string[]>;
}

export interface PaginatedResponse<T> {
  data: T[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  from: number;
  to: number;
}

class ApiClient {
  private baseURL: string;
  private token: string | null = null;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
    this.loadToken();
  }

  private loadToken(): void {
    if (typeof window !== 'undefined') {
      const session = localStorage.getItem('lms.session');
      if (session) {
        try {
          const parsed = JSON.parse(session);
          this.token = parsed.token || null;
        } catch (error) {
          console.error('Error loading token:', error);
        }
      }
    }
  }

  setToken(token: string | null): void {
    this.token = token;
    if (typeof window !== 'undefined') {
      if (token) {
        // If token is provided, update or create session in localStorage
        const session = localStorage.getItem('lms.session');
        if (session) {
          try {
            const parsed = JSON.parse(session);
            parsed.token = token;
            localStorage.setItem('lms.session', JSON.stringify(parsed));
          } catch (error) {
            console.error('Error saving token:', error);
          }
        }
      } else {
        // If token is null, clear it from session if session exists
        const session = localStorage.getItem('lms.session');
        if (session) {
          try {
            const parsed = JSON.parse(session);
            delete parsed.token;
            localStorage.setItem('lms.session', JSON.stringify(parsed));
          } catch (error) {
            console.error('Error clearing token:', error);
          }
        }
      }
    }
  }

  private getHeaders(includeAuth: boolean = true): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };

    if (includeAuth && this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    return headers;
  }

  private async handleResponse<T>(response: Response): Promise<ApiResponse<T>> {
    const contentType = response.headers.get('content-type');
    const isJson = contentType?.includes('application/json');

    if (!response.ok) {
      if (response.status === 401) {
        this.setToken(null);
        if (typeof window !== 'undefined') {
          localStorage.removeItem('lms.session');
          window.location.href = '/sign-in';
        }
        throw new Error('Unauthorized. Please login again.');
      }

      if (isJson) {
        const error = await response.json();
        throw new Error(error.message || `API Error: ${response.statusText}`);
      }

      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    if (isJson) {
      return await response.json();
    }

    return { success: true } as ApiResponse<T>;
  }

  async get<T>(
    endpoint: string,
    params?: Record<string, any>,
    includeAuth: boolean = true
  ): Promise<ApiResponse<T>> {
    this.loadToken();
    
    let url = `${this.baseURL}${endpoint}`;
    
    if (params) {
      const searchParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== null && value !== undefined) {
          searchParams.append(key, String(value));
        }
      });
      url += `?${searchParams.toString()}`;
    }

    const response = await fetch(url, {
      method: 'GET',
      headers: this.getHeaders(includeAuth),
    });

    return this.handleResponse<T>(response);
  }

  async post<T>(
    endpoint: string,
    data?: any,
    includeAuth: boolean = true,
    isFormData: boolean = false
  ): Promise<ApiResponse<T>> {
    this.loadToken();
    
    const headers: HeadersInit = { ...this.getHeaders(includeAuth) };
    
    if (isFormData) {
      delete headers['Content-Type'];
    }

    const response = await fetch(`${this.baseURL}${endpoint}`, {
      method: 'POST',
      headers,
      body: isFormData ? data : (data ? JSON.stringify(data) : undefined),
    });

    return this.handleResponse<T>(response);
  }

  async put<T>(
    endpoint: string,
    data?: any,
    includeAuth: boolean = true,
    isFormData: boolean = false
  ): Promise<ApiResponse<T>> {
    this.loadToken();
    
    const headers: HeadersInit = { ...this.getHeaders(includeAuth) };
    
    if (isFormData) {
      delete headers['Content-Type'];
    }

    const response = await fetch(`${this.baseURL}${endpoint}`, {
      method: 'PUT',
      headers,
      body: isFormData ? data : (data ? JSON.stringify(data) : undefined),
    });

    return this.handleResponse<T>(response);
  }

  async delete<T>(
    endpoint: string,
    includeAuth: boolean = true
  ): Promise<ApiResponse<T>> {
    this.loadToken();
    
    const response = await fetch(`${this.baseURL}${endpoint}`, {
      method: 'DELETE',
      headers: this.getHeaders(includeAuth),
    });

    return this.handleResponse<T>(response);
  }

  async upload<T>(
    endpoint: string,
    file: File | FormData,
    includeAuth: boolean = true
  ): Promise<ApiResponse<T>> {
    this.loadToken();
    
    const formData = file instanceof FormData ? file : (() => {
      const fd = new FormData();
      fd.append('file', file);
      return fd;
    })();

    const headers: HeadersInit = {};
    if (includeAuth && this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const response = await fetch(`${this.baseURL}${endpoint}`, {
      method: 'POST',
      headers,
      body: formData,
    });

    return this.handleResponse<T>(response);
  }

  getBaseURL(): string {
    return this.baseURL;
  }

  getToken(): string | null {
    return this.token;
  }
}

export const apiClient = new ApiClient(API_BASE_URL);

