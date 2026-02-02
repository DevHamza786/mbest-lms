/**
 * API Services Index
 * Export all API services from a single entry point
 */

export { apiClient } from './client';
export type { ApiResponse, PaginatedResponse } from './client';

export { authApi } from './auth';
export type { LoginResponse, RegisterResponse } from './auth';

export { commonApi } from './common';
export type { Message, MessageAttachment, Notification, Resource, ResourceRequest, UserProfile } from './common';

export { parentApi } from './parent';
export type {
  Child,
  ParentStats,
  ParentClass,
  ParentAssignment,
  ParentGrade,
  ParentInvoice,
  ParentSession,
  AttendanceRecord,
  Package,
  Payment,
  SubscriptionInfo,
  AddStudentData,
} from './parent';

export { studentApi } from './student';
export type {
  StudentClass,
  StudentAssignment,
  AssignmentSubmission,
  StudentGrade,
} from './student';

export { tutorApi } from './tutor';
export type {
  TutorClass,
  TutoringSession,
  TutorAssignment,
  TutorAvailability,
  TutorStudent,
} from './tutor';

export { adminApi } from './admin';
export type { AdminUser, AdminClass, AdminInvoice, AdminSession, Package, Payment, CreatePackageData, UpdatePackageData } from './admin';

