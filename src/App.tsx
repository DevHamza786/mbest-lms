import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "@/components/theme/ThemeProvider";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { MainLayout } from "@/components/common/MainLayout";
import { ScrollManager } from "@/components/common/ScrollManager";
import { ParentProvider } from "./components/parent/ParentProvider";

// Public pages
import PublicHome from "./pages/public/PublicHome";
import About from "./pages/public/About";
import Services from "./pages/public/Services";
import Appointments from "./pages/public/Appointments";
import Resources from "./pages/public/Resources";
import Contact from "./pages/public/Contact";
import Index from "./pages/Index";

// Auth pages
import SignIn from "./pages/auth/SignIn";
import SignUp from "./pages/auth/SignUp";

// Admin pages
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminAnalytics from "./pages/admin/AdminAnalytics";
import AdminClasses from "./pages/admin/AdminClasses";
import AdminResources from "./pages/admin/AdminResources";
import AdminBilling from "./pages/admin/AdminBilling";
import AdminNotifications from "./pages/admin/AdminNotifications";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminAttendance from "./pages/admin/AdminAttendance";
import AdminCalendar from "./pages/admin/AdminCalendar";

// Student pages
import StudentDashboard from "./pages/student/StudentDashboard";
import StudentClasses from "./pages/student/StudentClasses";
import StudentAssignments from "./pages/student/StudentAssignments";
import StudentQuestions from "./pages/student/StudentQuestions";
import StudentGrades from "./pages/student/StudentGrades";
import StudentResources from "./pages/student/StudentResources";
import StudentMessaging from "./pages/student/StudentMessaging";
import StudentAttendance from "./pages/student/StudentAttendance";

// Tutor pages
import TutorDashboard from "./pages/tutor/TutorDashboard";
import TutorClasses from "./pages/tutor/TutorClasses";
import TutorStudents from "./pages/tutor/TutorStudents";
import TutorAssignments from "./pages/tutor/TutorAssignments";
import TutorAssignmentDetail from "./pages/tutor/TutorAssignmentDetail";
import TutorResources from "./pages/tutor/TutorResources";
import TutorMessaging from "./pages/tutor/TutorMessaging";
import TutorAttendance from "./pages/tutor/TutorAttendance";
import TutorAttendanceRecords from "./pages/tutor/TutorAttendanceRecords";
import TutorCalendar from "./pages/tutor/TutorCalendar";
import TutorHours from "./pages/tutor/TutorHours";
import TutorAvailability from "./pages/tutor/TutorAvailability";
import TutorLessonRequests from "./pages/tutor/TutorLessonRequests";
import TutorLessonHistory from "./pages/tutor/TutorLessonHistory";
import TutorProfile from "./pages/tutor/TutorProfile";

// Parent pages
import ParentDashboard from "./pages/parent/ParentDashboard";
import ParentClasses from "./pages/parent/ParentClasses";
import ParentAssignments from "./pages/parent/ParentAssignments";
import ParentGrades from "./pages/parent/ParentGrades";
import ParentResources from "./pages/parent/ParentResources";
import ParentBilling from "./pages/parent/ParentBilling";
import ParentMessages from "./pages/parent/ParentMessages";
import ParentNotifications from "./pages/parent/ParentNotifications";
import ParentProfile from "./pages/parent/ParentProfile";
import ParentAttendance from "./pages/parent/ParentAttendance";
import ParentLessonHistory from "./pages/parent/ParentLessonHistory";

// Profile pages
import ProfileSettings from "./pages/profile/ProfileSettings";
import AdminProfile from "./pages/admin/AdminProfile";
import StudentProfile from "./pages/student/StudentProfile";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider defaultTheme="system" storageKey="lms-ui-theme">
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <ScrollManager />
          <Routes>
            {/* Public Website */}
            <Route path="/" element={<PublicHome />} />
            <Route path="/about" element={<About />} />
            <Route path="/services" element={<Services />} />
            <Route path="/appointments" element={<Appointments />} />
            <Route path="/resources" element={<Resources />} />
            <Route path="/contact" element={<Contact />} />
            
            {/* Portal Access - Redirect to Sign Up */}
            <Route path="/portal" element={<Navigate to="/auth/signup" replace />} />
            
            {/* Auth Routes */}
            <Route path="/auth/signin" element={<SignIn />} />
            <Route path="/auth/signup" element={<SignUp />} />
            
            {/* Protected Routes with MainLayout */}
            <Route path="/admin/*" element={
              <AuthGuard>
                <MainLayout>
                  <Routes>
                    <Route index element={
                      <ProtectedRoute allowedRoles={['admin']}>
                        <AdminDashboard />
                      </ProtectedRoute>
                    } />
                    <Route path="analytics" element={
                      <ProtectedRoute allowedRoles={['admin']}>
                        <AdminAnalytics />
                      </ProtectedRoute>
                    } />
                    <Route path="calendar" element={
                      <ProtectedRoute allowedRoles={['admin']}>
                        <AdminCalendar />
                      </ProtectedRoute>
                    } />
                    <Route path="classes" element={
                      <ProtectedRoute allowedRoles={['admin']}>
                        <AdminClasses />
                      </ProtectedRoute>
                    } />
                    <Route path="resources" element={
                      <ProtectedRoute allowedRoles={['admin']}>
                        <AdminResources />
                      </ProtectedRoute>
                    } />
                    <Route path="billing" element={
                      <ProtectedRoute allowedRoles={['admin']}>
                        <AdminBilling />
                      </ProtectedRoute>
                    } />
                    <Route path="notifications" element={
                      <ProtectedRoute allowedRoles={['admin']}>
                        <AdminNotifications />
                      </ProtectedRoute>
                    } />
                    <Route path="users" element={
                      <ProtectedRoute allowedRoles={['admin']}>
                        <AdminUsers />
                      </ProtectedRoute>
                    } />
                    <Route path="attendance" element={
                      <ProtectedRoute allowedRoles={['admin']}>
                        <AdminAttendance />
                      </ProtectedRoute>
                    } />
                    <Route path="profile" element={
                      <ProtectedRoute allowedRoles={['admin']}>
                        <AdminProfile />
                      </ProtectedRoute>
                    } />
                  </Routes>
                </MainLayout>
              </AuthGuard>
            } />
            
            <Route path="/student/*" element={
              <AuthGuard>
                <MainLayout>
                  <Routes>
                    <Route index element={
                      <ProtectedRoute allowedRoles={['student']}>
                        <StudentDashboard />
                      </ProtectedRoute>
                    } />
                    <Route path="classes" element={
                      <ProtectedRoute allowedRoles={['student']}>
                        <StudentClasses />
                      </ProtectedRoute>
                    } />
                    <Route path="assignments" element={
                      <ProtectedRoute allowedRoles={['student']}>
                        <StudentAssignments />
                      </ProtectedRoute>
                    } />
                    <Route path="questions" element={
                      <ProtectedRoute allowedRoles={['student']}>
                        <StudentQuestions />
                      </ProtectedRoute>
                    } />
                    <Route path="grades" element={
                      <ProtectedRoute allowedRoles={['student']}>
                        <StudentGrades />
                      </ProtectedRoute>
                    } />
                    <Route path="resources" element={
                      <ProtectedRoute allowedRoles={['student']}>
                        <StudentResources />
                      </ProtectedRoute>
                    } />
                    <Route path="messaging" element={
                      <ProtectedRoute allowedRoles={['student']}>
                        <StudentMessaging />
                      </ProtectedRoute>
                    } />
                    <Route path="attendance" element={
                      <ProtectedRoute allowedRoles={['student']}>
                        <StudentAttendance />
                      </ProtectedRoute>
                    } />
                    <Route path="profile" element={
                      <ProtectedRoute allowedRoles={['student']}>
                        <StudentProfile />
                      </ProtectedRoute>
                    } />
                  </Routes>
                </MainLayout>
              </AuthGuard>
            } />
            
            <Route path="/tutor/*" element={
              <AuthGuard>
                <MainLayout>
                  <Routes>
                    <Route index element={
                      <ProtectedRoute allowedRoles={['tutor']}>
                        <TutorDashboard />
                      </ProtectedRoute>
                    } />
                    <Route path="calendar" element={
                      <ProtectedRoute allowedRoles={['tutor']}>
                        <TutorCalendar />
                      </ProtectedRoute>
                    } />
                    <Route path="attendance" element={
                      <ProtectedRoute allowedRoles={['tutor']}>
                        <TutorAttendance />
                      </ProtectedRoute>
                    } />
                    <Route path="attendance-records" element={
                      <ProtectedRoute allowedRoles={['tutor']}>
                        <TutorAttendanceRecords />
                      </ProtectedRoute>
                    } />
                    <Route path="classes" element={
                      <ProtectedRoute allowedRoles={['tutor']}>
                        <TutorClasses />
                      </ProtectedRoute>
                    } />
                    <Route path="students" element={
                      <ProtectedRoute allowedRoles={['tutor']}>
                        <TutorStudents />
                      </ProtectedRoute>
                    } />
                    <Route path="assignments" element={
                      <ProtectedRoute allowedRoles={['tutor']}>
                        <TutorAssignments />
                      </ProtectedRoute>
                    } />
                    <Route path="assignments/:id" element={
                      <ProtectedRoute allowedRoles={['tutor']}>
                        <TutorAssignmentDetail />
                      </ProtectedRoute>
                    } />
                    <Route path="lesson-requests" element={
                      <ProtectedRoute allowedRoles={['tutor']}>
                        <TutorLessonRequests />
                      </ProtectedRoute>
                    } />
                    <Route path="lesson-history" element={
                      <ProtectedRoute allowedRoles={['tutor']}>
                        <TutorLessonHistory />
                      </ProtectedRoute>
                    } />
                    <Route path="resources" element={
                      <ProtectedRoute allowedRoles={['tutor']}>
                        <TutorResources />
                      </ProtectedRoute>
                    } />
                    <Route path="messaging" element={
                      <ProtectedRoute allowedRoles={['tutor']}>
                        <TutorMessaging />
                      </ProtectedRoute>
                    } />
                    <Route path="attendance" element={
                      <ProtectedRoute allowedRoles={['tutor']}>
                        <TutorAttendance />
                      </ProtectedRoute>
                    } />
                    <Route path="hours" element={
                      <ProtectedRoute allowedRoles={['tutor']}>
                        <TutorHours />
                      </ProtectedRoute>
                    } />
                    <Route path="availability" element={
                      <ProtectedRoute allowedRoles={['tutor']}>
                        <TutorAvailability />
                      </ProtectedRoute>
                    } />
                    <Route path="profile" element={
                      <ProtectedRoute allowedRoles={['tutor']}>
                        <TutorProfile />
                      </ProtectedRoute>
                    } />
                  </Routes>
                </MainLayout>
              </AuthGuard>
            } />
            
            <Route path="/parent/*" element={
              <AuthGuard>
                <MainLayout>
                  <ParentProvider>
                    <Routes>
                      <Route index element={
                        <ProtectedRoute allowedRoles={['parent']}>
                          <ParentDashboard />
                        </ProtectedRoute>
                      } />
                      <Route path="classes" element={
                        <ProtectedRoute allowedRoles={['parent']}>
                          <ParentClasses />
                        </ProtectedRoute>
                      } />
                      <Route path="assignments" element={
                        <ProtectedRoute allowedRoles={['parent']}>
                          <ParentAssignments />
                        </ProtectedRoute>
                      } />
                      <Route path="grades" element={
                        <ProtectedRoute allowedRoles={['parent']}>
                          <ParentGrades />
                        </ProtectedRoute>
                      } />
                      <Route path="resources" element={
                        <ProtectedRoute allowedRoles={['parent']}>
                          <ParentResources />
                        </ProtectedRoute>
                      } />
                      <Route path="billing" element={
                        <ProtectedRoute allowedRoles={['parent']}>
                          <ParentBilling />
                        </ProtectedRoute>
                      } />
                      <Route path="messages" element={
                        <ProtectedRoute allowedRoles={['parent']}>
                          <ParentMessages />
                        </ProtectedRoute>
                      } />
                      <Route path="notifications" element={
                        <ProtectedRoute allowedRoles={['parent']}>
                          <ParentNotifications />
                        </ProtectedRoute>
                      } />
                      <Route path="attendance" element={
                        <ProtectedRoute allowedRoles={['parent']}>
                          <ParentAttendance />
                        </ProtectedRoute>
                      } />
                      <Route path="lesson-history" element={
                        <ProtectedRoute allowedRoles={['parent']}>
                          <ParentLessonHistory />
                        </ProtectedRoute>
                      } />
                      <Route path="profile" element={
                        <ProtectedRoute allowedRoles={['parent']}>
                          <ParentProfile />
                        </ProtectedRoute>
                      } />
                    </Routes>
                  </ParentProvider>
                </MainLayout>
              </AuthGuard>
            } />
            
            <Route path="/profile/*" element={
              <AuthGuard>
                <MainLayout>
                  <Routes>
                    <Route path="settings" element={
                      <ProtectedRoute allowedRoles={['student', 'tutor', 'parent', 'admin']}>
                        <ProfileSettings />
                      </ProtectedRoute>
                    } />
                  </Routes>
                </MainLayout>
              </AuthGuard>
            } />
            
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;