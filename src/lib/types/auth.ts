export type UserRole = 'admin' | 'tutor' | 'student' | 'parent';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  department?: string;
  specialization?: string[];
  grade?: string;
  enrollmentId?: string;
  parentId?: string;
  children?: string[];
  relationship?: string;
  createdAt: string;
}

export interface StoredUser extends User {
  password: string;
}

export interface Session {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  department?: string;
  specialization?: string[];
  grade?: string;
  enrollmentId?: string;
  parentId?: string;
  children?: string[];
  relationship?: string;
}

export interface AuthState {
  session: Session | null;
  isLoading: boolean;
  error: string | null;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface SignupData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  role: UserRole;
}