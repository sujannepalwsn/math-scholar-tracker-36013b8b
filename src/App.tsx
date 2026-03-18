import { Settings } from "lucide-react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HashRouter as BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

import ProtectedRoute from "./components/ProtectedRoute";
import CenterLayout from "./components/CenterLayout";
import AdminLayout from "./components/AdminLayout";
import ParentLayout from "./components/ParentLayout";
import TeacherLayout from "./components/TeacherLayout";
import DynamicRoleLayout from "./components/DynamicRoleLayout";
import BackButtonHandler from "./components/BackButtonHandler";

import Dashboard from "./pages/Dashboard";
import RegisterStudent from "./pages/RegisterStudent";
import TakeAttendance from "./pages/TakeAttendance";
import AttendanceSummary from "./pages/AttendanceSummary";
import LessonTracking from "./pages/LessonTracking";
import LessonPlans from "./pages/LessonPlans";
import HomeworkManagement from "./pages/HomeworkManagement";
import PreschoolActivities from "./pages/PreschoolActivities";
import DisciplineIssues from "./pages/DisciplineIssues";
import TeacherManagement from "./pages/TeacherManagement";
import TeacherAttendancePage from "./pages/TeacherAttendance";
import Tests from "./pages/Tests";
import StudentReport from "./pages/StudentReport";
import AIInsights from "./pages/AIInsights";
import ViewRecords from "./pages/ViewRecords";
import Summary from "./pages/Summary";

import ExamManagement from "./pages/ExamManagement";
import MarksEntry from "./pages/MarksEntry";
import ResultsDashboard from "./pages/ResultsDashboard";
import MarksheetView from "./pages/MarksheetView";
import StudentIdCard from "./pages/StudentIdCard";
import PublishedResults from "./pages/PublishedResults";
import Notifications from "./pages/Notifications";

import Login from "./pages/Login";
import AdminLogin from "./pages/AdminLogin";
import ParentLogin from "./pages/ParentLogin";
import TeacherLogin from "./pages/TeacherLogin";
import PublicAdmission from "./pages/PublicAdmission";

import AdminDashboard from "./pages/AdminDashboard";
import AdminFinance from "./pages/AdminFinance";

import ParentDashboard from "./pages/ParentDashboard";
import ParentFinanceDashboard from "./pages/ParentFinanceDashboard";
import ParentHomework from "./pages/ParentHomework";
import ParentActivities from "./pages/ParentActivities";
import ParentDiscipline from "./pages/ParentDiscipline";
import ParentMeetings from "./pages/ParentMeetings";
import ParentChapterRating from "./pages/ParentChapterRating";
import ParentLessonTracking from "./pages/ParentLessonTracking";
import ParentStudentReport from "./pages/ParentStudentReport";
import ParentMessaging from "./pages/ParentMessaging";

import TeacherDashboard from "./pages/TeacherDashboard";
import TeacherMeetings from "./pages/TeacherMeetings";
import TeacherMessaging from "./pages/TeacherMessaging";

import MeetingManagement from "./pages/MeetingManagement";
import Messaging from "./pages/Messaging";
import ClassRoutine from "./pages/ClassRoutine";
import CalendarEvents from "./pages/CalendarEvents";
import SchoolDays from "./pages/SchoolDays";

import InitAdmin from "./pages/InitAdmin";
import NotFound from "./pages/NotFound";

import AdminSettings from "./pages/admin/Settings";
import CenterSettings from "./pages/CenterSettings";
import GeneralSettings from "./pages/GeneralSettings";
import ChangePassword from "./pages/ChangePassword";

import ChapterPerformanceOverview from "./pages/ChapterPerformanceOverview";
import TeacherPerformanceReport from "./pages/TeacherPerformanceReport";
import LeaveApplications from "./pages/LeaveApplications";
import LeaveManagement from "./pages/LeaveManagement";
import LessonPlanManagement from "./pages/LessonPlanManagement";
import InventoryManagement from "./pages/InventoryManagement";
import HRManagement from "./pages/HRManagement";
import TransportManagementPage from "./pages/TransportManagement";
import AboutInstitution from "./pages/AboutInstitution";

const queryClient = new QueryClient();

const ActivityTracker = () => {
  const { user } = useAuth();

  useEffect(() => {
    if (!user?.id) return;

    const updateActivity = async () => {
      await supabase
        .from('users')
        .update({ last_active_at: new Date().toISOString() })
        .eq('id', user.id);
    };

    updateActivity();
    const interval = setInterval(updateActivity, 5 * 60 * 1000); // Every 5 mins
    return () => clearInterval(interval);
  }, [user?.id]);

  return null;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <ActivityTracker />
      <ThemeProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />

          <BrowserRouter>
            <BackButtonHandler />

            <Routes>

              {/* Authentication & Public */}
              <Route path="/init-admin" element={<InitAdmin />} />
              <Route path="/login" element={<Login />} />
              <Route path="/login-admin" element={<AdminLogin />} />
              <Route path="/login-parent" element={<ParentLogin />} />
              <Route path="/login-teacher" element={<TeacherLogin />} />
              <Route path="/apply" element={<PublicAdmission />} />
              <Route
                path="/change-password"
                element={
                  <ProtectedRoute>
                    <ChangePassword />
                  </ProtectedRoute>
                }
              />

              {/* Notifications (all roles) */}
              <Route path="/notifications" element={<ProtectedRoute><CenterLayout><Notifications /></CenterLayout></ProtectedRoute>} />

              {/* Parent */}
              <Route path="/parent-dashboard" element={<ProtectedRoute role="parent"><ParentLayout><ParentDashboard /></ParentLayout></ProtectedRoute>} />
              <Route path="/parent-finance" element={<ProtectedRoute role="parent"><ParentLayout><ParentFinanceDashboard /></ParentLayout></ProtectedRoute>} />
              <Route path="/parent-homework" element={<ProtectedRoute role="parent"><ParentLayout><ParentHomework /></ParentLayout></ProtectedRoute>} />
              <Route path="/parent-activities" element={<ProtectedRoute role="parent"><ParentLayout><ParentActivities /></ParentLayout></ProtectedRoute>} />
              <Route path="/parent-discipline" element={<ProtectedRoute role="parent"><ParentLayout><ParentDiscipline /></ParentLayout></ProtectedRoute>} />
              <Route path="/parent-meetings" element={<ProtectedRoute role="parent"><ParentLayout><ParentMeetings /></ParentLayout></ProtectedRoute>} />
              <Route path="/parent-messages" element={<ProtectedRoute role="parent"><ParentLayout><ParentMessaging /></ParentLayout></ProtectedRoute>} />
              <Route path="/parent-about-institution" element={<ProtectedRoute role="parent"><ParentLayout><AboutInstitution /></ParentLayout></ProtectedRoute>} />
              <Route path="/parent-chapter-rating" element={<ProtectedRoute role="parent"><ParentLayout><ParentChapterRating /></ParentLayout></ProtectedRoute>} />
              <Route path="/parent-lesson-tracking" element={<ProtectedRoute role="parent"><ParentLayout><ParentLessonTracking /></ParentLayout></ProtectedRoute>} />
              <Route path="/parent-student-report" element={<ProtectedRoute role="parent"><ParentLayout><ParentStudentReport /></ParentLayout></ProtectedRoute>} />
              <Route path="/parent-results" element={<ProtectedRoute role="parent"><ParentLayout><PublishedResults /></ParentLayout></ProtectedRoute>} />
              <Route path="/parent-calendar" element={<ProtectedRoute role="parent"><ParentLayout><CalendarEvents /></ParentLayout></ProtectedRoute>} />
              <Route path="/parent-leave" element={<ProtectedRoute role="parent"><ParentLayout><LeaveApplications /></ParentLayout></ProtectedRoute>} />
              <Route path="/parent-settings" element={<ProtectedRoute role="parent"><ParentLayout><GeneralSettings /></ParentLayout></ProtectedRoute>} />

              {/* Teacher Dashboard & Specifics */}
              <Route path="/teacher-dashboard" element={<ProtectedRoute role="teacher"><TeacherLayout><TeacherDashboard /></TeacherLayout></ProtectedRoute>} />
              <Route path="/teacher/take-attendance" element={<ProtectedRoute role="teacher"><TeacherLayout><TakeAttendance /></TeacherLayout></ProtectedRoute>} />
              <Route path="/teacher/attendance-summary" element={<ProtectedRoute role="teacher"><TeacherLayout><AttendanceSummary /></TeacherLayout></ProtectedRoute>} />
              <Route path="/teacher/lesson-plans" element={<ProtectedRoute role="teacher"><TeacherLayout><LessonPlans /></TeacherLayout></ProtectedRoute>} />
              <Route path="/teacher/lesson-tracking" element={<ProtectedRoute role="teacher"><TeacherLayout><LessonTracking /></TeacherLayout></ProtectedRoute>} />
              <Route path="/teacher/homework-management" element={<ProtectedRoute role="teacher"><TeacherLayout><HomeworkManagement /></TeacherLayout></ProtectedRoute>} />
              <Route path="/teacher/activities" element={<ProtectedRoute role="teacher"><TeacherLayout><PreschoolActivities /></TeacherLayout></ProtectedRoute>} />
              <Route path="/teacher/preschool-activities" element={<ProtectedRoute role="teacher"><TeacherLayout><PreschoolActivities /></TeacherLayout></ProtectedRoute>} />
              <Route path="/teacher/discipline-issues" element={<ProtectedRoute role="teacher"><TeacherLayout><DisciplineIssues /></TeacherLayout></ProtectedRoute>} />
              <Route path="/teacher/test-management" element={<ProtectedRoute role="teacher"><TeacherLayout><Tests /></TeacherLayout></ProtectedRoute>} />
              <Route path="/teacher/student-report" element={<ProtectedRoute role="teacher"><TeacherLayout><StudentReport /></TeacherLayout></ProtectedRoute>} />
              <Route path="/teacher/chapter-performance" element={<ProtectedRoute role="teacher"><TeacherLayout><ChapterPerformanceOverview /></TeacherLayout></ProtectedRoute>} />
              <Route path="/teacher/ai-insights" element={<ProtectedRoute role="teacher"><TeacherLayout><AIInsights /></TeacherLayout></ProtectedRoute>} />
              <Route path="/teacher/about-institution" element={<ProtectedRoute role="teacher"><TeacherLayout><AboutInstitution /></TeacherLayout></ProtectedRoute>} />
              <Route path="/teacher/view-records" element={<ProtectedRoute role="teacher"><TeacherLayout><ViewRecords /></TeacherLayout></ProtectedRoute>} />
              <Route path="/teacher/summary" element={<ProtectedRoute role="teacher"><TeacherLayout><Summary /></TeacherLayout></ProtectedRoute>} />
              <Route path="/teacher/finance" element={<ProtectedRoute role="teacher"><TeacherLayout><AdminFinance /></TeacherLayout></ProtectedRoute>} />
              <Route path="/teacher/my-attendance" element={<ProtectedRoute role="teacher"><TeacherLayout><TeacherAttendancePage /></TeacherLayout></ProtectedRoute>} />
              <Route path="/teacher-meetings" element={<ProtectedRoute role="teacher"><TeacherLayout><TeacherMeetings /></TeacherLayout></ProtectedRoute>} />
              <Route path="/teacher-messages" element={<ProtectedRoute role="teacher"><TeacherLayout><TeacherMessaging /></TeacherLayout></ProtectedRoute>} />
              <Route path="/teacher/class-routine" element={<ProtectedRoute role="teacher"><TeacherLayout><ClassRoutine /></TeacherLayout></ProtectedRoute>} />
              <Route path="/teacher/calendar" element={<ProtectedRoute role="teacher"><TeacherLayout><CalendarEvents /></TeacherLayout></ProtectedRoute>} />
              <Route path="/teacher/leave" element={<ProtectedRoute role="teacher"><TeacherLayout><LeaveApplications /></TeacherLayout></ProtectedRoute>} />
              <Route path="/teacher/settings" element={<ProtectedRoute role="teacher"><TeacherLayout><GeneralSettings /></TeacherLayout></ProtectedRoute>} />

              {/* Shared Administrative Modules (accessible by center and administrative teachers) */}
              <Route path="/register" element={<ProtectedRoute><DynamicRoleLayout><RegisterStudent /></DynamicRoleLayout></ProtectedRoute>} />
              <Route path="/teachers" element={<ProtectedRoute><DynamicRoleLayout><TeacherManagement /></DynamicRoleLayout></ProtectedRoute>} />
              <Route path="/teacher-attendance" element={<ProtectedRoute><DynamicRoleLayout><TeacherAttendancePage /></DynamicRoleLayout></ProtectedRoute>} />
              <Route path="/hr-management" element={<ProtectedRoute><DynamicRoleLayout><HRManagement /></DynamicRoleLayout></ProtectedRoute>} />
              <Route path="/leave-management" element={<ProtectedRoute><DynamicRoleLayout><LeaveManagement /></DynamicRoleLayout></ProtectedRoute>} />
              <Route path="/student-id-cards" element={<ProtectedRoute><DynamicRoleLayout><StudentIdCard /></DynamicRoleLayout></ProtectedRoute>} />
              <Route path="/inventory" element={<ProtectedRoute><DynamicRoleLayout><InventoryManagement /></DynamicRoleLayout></ProtectedRoute>} />
              <Route path="/transport" element={<ProtectedRoute><DynamicRoleLayout><TransportManagementPage /></DynamicRoleLayout></ProtectedRoute>} />
              <Route path="/school-days" element={<ProtectedRoute><DynamicRoleLayout><SchoolDays /></DynamicRoleLayout></ProtectedRoute>} />
              <Route path="/attendance" element={<ProtectedRoute><DynamicRoleLayout><TakeAttendance /></DynamicRoleLayout></ProtectedRoute>} />
              <Route path="/attendance-summary" element={<ProtectedRoute><DynamicRoleLayout><AttendanceSummary /></DynamicRoleLayout></ProtectedRoute>} />
              <Route path="/lesson-plans" element={<ProtectedRoute><DynamicRoleLayout><LessonPlans /></DynamicRoleLayout></ProtectedRoute>} />
              <Route path="/lesson-plan-management" element={<ProtectedRoute><DynamicRoleLayout><LessonPlanManagement /></DynamicRoleLayout></ProtectedRoute>} />
              <Route path="/lesson-tracking" element={<ProtectedRoute><DynamicRoleLayout><LessonTracking /></DynamicRoleLayout></ProtectedRoute>} />
              <Route path="/homework" element={<ProtectedRoute><DynamicRoleLayout><HomeworkManagement /></DynamicRoleLayout></ProtectedRoute>} />
              <Route path="/activities" element={<ProtectedRoute><DynamicRoleLayout><PreschoolActivities /></DynamicRoleLayout></ProtectedRoute>} />
              <Route path="/discipline" element={<ProtectedRoute><DynamicRoleLayout><DisciplineIssues /></DynamicRoleLayout></ProtectedRoute>} />
              <Route path="/tests" element={<ProtectedRoute><DynamicRoleLayout><Tests /></DynamicRoleLayout></ProtectedRoute>} />
              <Route path="/student-report" element={<ProtectedRoute><DynamicRoleLayout><StudentReport /></DynamicRoleLayout></ProtectedRoute>} />
              <Route path="/ai-insights" element={<ProtectedRoute><DynamicRoleLayout><AIInsights /></DynamicRoleLayout></ProtectedRoute>} />
              <Route path="/records" element={<ProtectedRoute><DynamicRoleLayout><ViewRecords /></DynamicRoleLayout></ProtectedRoute>} />
              <Route path="/summary" element={<ProtectedRoute><DynamicRoleLayout><Summary /></DynamicRoleLayout></ProtectedRoute>} />
              <Route path="/finance" element={<ProtectedRoute><DynamicRoleLayout><AdminFinance /></DynamicRoleLayout></ProtectedRoute>} />
              <Route path="/meetings" element={<ProtectedRoute><DynamicRoleLayout><MeetingManagement /></DynamicRoleLayout></ProtectedRoute>} />
              <Route path="/messages" element={<ProtectedRoute><DynamicRoleLayout><Messaging /></DynamicRoleLayout></ProtectedRoute>} />
              <Route path="/class-routine" element={<ProtectedRoute><DynamicRoleLayout><ClassRoutine /></DynamicRoleLayout></ProtectedRoute>} />
              <Route path="/calendar" element={<ProtectedRoute><DynamicRoleLayout><CalendarEvents /></DynamicRoleLayout></ProtectedRoute>} />
              <Route path="/about-institution" element={<ProtectedRoute><DynamicRoleLayout><AboutInstitution /></DynamicRoleLayout></ProtectedRoute>} />
              <Route path="/chapter-performance-overview" element={<ProtectedRoute><DynamicRoleLayout><ChapterPerformanceOverview /></DynamicRoleLayout></ProtectedRoute>} />
              <Route path="/settings" element={<ProtectedRoute role="center"><CenterLayout><CenterSettings /></CenterLayout></ProtectedRoute>} />
              <Route path="/teacher-performance" element={<ProtectedRoute role="center"><CenterLayout><TeacherPerformanceReport /></CenterLayout></ProtectedRoute>} />
              <Route path="/exams" element={<ProtectedRoute><DynamicRoleLayout><ExamManagement /></DynamicRoleLayout></ProtectedRoute>} />
              <Route path="/published-results" element={<ProtectedRoute><DynamicRoleLayout><PublishedResults /></DynamicRoleLayout></ProtectedRoute>} />
              <Route path="/marks-entry" element={<ProtectedRoute><DynamicRoleLayout><MarksEntry /></DynamicRoleLayout></ProtectedRoute>} />
              <Route path="/results-dashboard" element={<ProtectedRoute><DynamicRoleLayout><ResultsDashboard /></DynamicRoleLayout></ProtectedRoute>} />
              <Route path="/marksheet" element={<ProtectedRoute><DynamicRoleLayout><MarksheetView /></DynamicRoleLayout></ProtectedRoute>} />

              {/* Center Specific */}
              <Route path="/" element={<ProtectedRoute role="center"><CenterLayout><Dashboard /></CenterLayout></ProtectedRoute>} />

              {/* Teacher Result Routes */}
              <Route path="/teacher/exams" element={<ProtectedRoute role="teacher"><TeacherLayout><ExamManagement /></TeacherLayout></ProtectedRoute>} />
              <Route path="/teacher/marks-entry" element={<ProtectedRoute role="teacher"><TeacherLayout><MarksEntry /></TeacherLayout></ProtectedRoute>} />
              <Route path="/teacher/results-dashboard" element={<ProtectedRoute role="teacher"><TeacherLayout><ResultsDashboard /></TeacherLayout></ProtectedRoute>} />
              <Route path="/teacher/published-results" element={<ProtectedRoute role="teacher"><TeacherLayout><PublishedResults /></TeacherLayout></ProtectedRoute>} />
              <Route path="/teacher/marksheet" element={<ProtectedRoute role="teacher"><TeacherLayout><MarksheetView /></TeacherLayout></ProtectedRoute>} />

              {/* Notifications for all roles */}
              <Route path="/parent-notifications" element={<ProtectedRoute role="parent"><ParentLayout><Notifications /></ParentLayout></ProtectedRoute>} />
              <Route path="/teacher/notifications" element={<ProtectedRoute role="teacher"><TeacherLayout><Notifications /></TeacherLayout></ProtectedRoute>} />

              {/* Admin */}
              <Route path="/admin-dashboard" element={<ProtectedRoute role="admin"><AdminLayout><AdminDashboard /></AdminLayout></ProtectedRoute>} />
              <Route path="/admin/finance" element={<ProtectedRoute role="admin"><AdminLayout><AdminFinance /></AdminLayout></ProtectedRoute>} />
              <Route path="/admin/settings" element={<ProtectedRoute role="admin"><AdminLayout><AdminSettings /></AdminLayout></ProtectedRoute>} />

              <Route path="*" element={<NotFound />} />

            </Routes>
          </BrowserRouter>

        </TooltipProvider>
      </ThemeProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;