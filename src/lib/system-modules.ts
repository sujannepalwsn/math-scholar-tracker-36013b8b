export interface SystemModule {
  id: number;
  name: string;
  description: string;
  key_functionalities: string[];
  completeness: 'Fully implemented' | 'In Progress';
  feature_mapping: string[];
}

export const SYSTEM_MODULES: SystemModule[] = [
  {
    id: 1,
    name: "Authentication & Authorization",
    description: "Manages user login, registration, and role-based access control across the system.",
    key_functionalities: ["User registration", "Secure login", "Role-based access control (RBAC)", "Password management"],
    completeness: "Fully implemented",
    feature_mapping: ["dashboard_access"]
  },
  {
    id: 2,
    name: "Dashboard",
    description: "Provides an overview and quick access to key information and functionalities relevant to each user role.",
    key_functionalities: ["Role-specific data summaries", "Quick links", "Notifications display"],
    completeness: "Fully implemented",
    feature_mapping: ["dashboard_access"]
  },
  {
    id: 3,
    name: "Student Management",
    description: "Handles the registration, record-keeping, and general management of student information.",
    key_functionalities: ["Student registration", "Record management", "Student ID cards", "Parent linking"],
    completeness: "Fully implemented",
    feature_mapping: ["register_student", "student_id_cards", "view_records"]
  },
  {
    id: 4,
    name: "Teacher Management",
    description: "Manages teacher profiles, assignments, and performance tracking.",
    key_functionalities: ["Teacher onboarding", "Profile management", "Performance tracking", "Leave management"],
    completeness: "Fully implemented",
    feature_mapping: ["teacher_management", "hr_management"]
  },
  {
    id: 5,
    name: "Class & Subject Management",
    description: "Organizes academic classes, subjects, and their associated routines.",
    key_functionalities: ["Class management", "Subject assignments", "Routines/Timetables", "Academic year config"],
    completeness: "Fully implemented",
    feature_mapping: ["class_routine"]
  },
  {
    id: 6,
    name: "Attendance Management",
    description: "Facilitates the recording and tracking of student and teacher attendance.",
    key_functionalities: ["Student roll-call", "Attendance summaries", "Teacher attendance tracking"],
    completeness: "Fully implemented",
    feature_mapping: ["take_attendance", "teachers_attendance", "attendance_summary"]
  },
  {
    id: 7,
    name: "Exam & Results Management",
    description: "Manages the entire examination process, from scheduling to result publication.",
    key_functionalities: ["Exam scheduling", "Marks entry", "Result publication", "Marksheets"],
    completeness: "Fully implemented",
    feature_mapping: ["exams_results", "published_results"]
  },
  {
    id: 8,
    name: "Lesson Plan & Tracking",
    description: "Allows teachers to create and manage lesson plans and track student progress.",
    key_functionalities: ["Plan creation", "Progress tracking", "OCR capabilities"],
    completeness: "Fully implemented",
    feature_mapping: ["lesson_plans", "lesson_tracking"]
  },
  {
    id: 9,
    name: "Homework Management",
    description: "Enables teachers to assign and manage homework for students.",
    key_functionalities: ["Assigning homework", "Submission tracking"],
    completeness: "Fully implemented",
    feature_mapping: ["homework_management"]
  },
  {
    id: 10,
    name: "Discipline Management",
    description: "Records and manages student discipline issues.",
    key_functionalities: ["Incident logging", "Discipline records"],
    completeness: "Fully implemented",
    feature_mapping: ["discipline_issues"]
  },
  {
    id: 11,
    name: "Finance Management",
    description: "Handles fee collection, invoicing, and financial reporting.",
    key_functionalities: ["Fee structures", "Invoice generation", "Payment tracking", "Late fees"],
    completeness: "Fully implemented",
    feature_mapping: ["finance"]
  },
  {
    id: 12,
    name: "HR Management",
    description: "Manages human resources aspects, specifically teacher leave applications and staff documents.",
    key_functionalities: ["Leave approval workflow", "Staff documents"],
    completeness: "Fully implemented",
    feature_mapping: ["hr_management", "leave_management"]
  },
  {
    id: 13,
    name: "Inventory Management",
    description: "Manages school inventory and assets.",
    key_functionalities: ["Inventory tracking", "Asset management"],
    completeness: "Fully implemented",
    feature_mapping: ["inventory_assets"]
  },
  {
    id: 14,
    name: "Transport Management",
    description: "Manages school transportation logistics.",
    key_functionalities: ["Vehicle management", "Route planning", "Transport assignments"],
    completeness: "Fully implemented",
    feature_mapping: ["transport_tracking"]
  },
  {
    id: 15,
    name: "Messaging & Meetings",
    description: "Provides internal communication tools for users, including messaging and meeting scheduling.",
    key_functionalities: ["Internal chat", "Video meetings", "Broadcast messages"],
    completeness: "Fully implemented",
    feature_mapping: ["messaging", "meetings_management"]
  },
  {
    id: 16,
    name: "Notifications",
    description: "Delivers important alerts and updates to users.",
    key_functionalities: ["Real-time alerts", "Notification history"],
    completeness: "Fully implemented",
    feature_mapping: ["messaging"]
  },
  {
    id: 17,
    name: "Calendar Events",
    description: "Displays school-wide events and personal schedules.",
    key_functionalities: ["Event display", "Schedule integration"],
    completeness: "Fully implemented",
    feature_mapping: ["calendar_events"]
  },
  {
    id: 18,
    name: "Settings & Customization",
    description: "Allows administrators to configure system parameters and customize school profiles.",
    key_functionalities: ["System settings", "Login page customization", "Branding"],
    completeness: "Fully implemented",
    feature_mapping: ["settings_access", "about_institution"]
  },
  {
    id: 19,
    name: "AI Insights",
    description: "Provides data-driven insights and analytics using AI.",
    key_functionalities: ["Predictive analytics", "AI recommendations"],
    completeness: "Fully implemented",
    feature_mapping: ["ai_insights"]
  },
  {
    id: 20,
    name: "Error Tracking",
    description: "Monitors and logs system errors for debugging.",
    key_functionalities: ["Error logging", "Admin dashboard"],
    completeness: "Fully implemented",
    feature_mapping: ["settings_access"]
  },
  {
    id: 21,
    name: "Public Admission",
    description: "Allows external users to register students for admission.",
    key_functionalities: ["Public registration form", "Application tracking"],
    completeness: "Fully implemented",
    feature_mapping: ["register_student"]
  },
  {
    id: 22,
    name: "School Days Management",
    description: "Manages the school's academic calendar and working days.",
    key_functionalities: ["Defining school days", "Holiday management"],
    completeness: "Fully implemented",
    feature_mapping: ["school_days"]
  },
  {
    id: 23,
    name: "Preschool Activities",
    description: "Manages activities specifically for preschool students.",
    key_functionalities: ["Activity scheduling", "Parent view"],
    completeness: "Fully implemented",
    feature_mapping: ["preschool_activities"]
  },
  {
    id: 24,
    name: "Chapter Performance Overview",
    description: "Provides an overview of student performance at a chapter level.",
    key_functionalities: ["Chapter-wise reports", "Parent feedback"],
    completeness: "Fully implemented",
    feature_mapping: ["chapter_performance"]
  },
  {
    id: 25,
    name: "View Records",
    description: "A general module for viewing various records within the system.",
    key_functionalities: ["Audit records", "Consolidated views"],
    completeness: "Fully implemented",
    feature_mapping: ["view_records"]
  },
  {
    id: 26,
    name: "Summary",
    description: "Provides summarized information across different modules.",
    key_functionalities: ["Consolidated reports", "Key metrics"],
    completeness: "Fully implemented",
    feature_mapping: ["summary"]
  },
  {
    id: 27,
    name: "About Institution",
    description: "Displays information about the educational institution.",
    key_functionalities: ["School profile", "Contact info"],
    completeness: "Fully implemented",
    feature_mapping: ["about_institution"]
  },
  {
    id: 28,
    name: "Student Report",
    description: "Generates comprehensive reports for individual students.",
    key_functionalities: ["Academic reports", "Attendance metrics"],
    completeness: "Fully implemented",
    feature_mapping: ["student_report"]
  },
  {
    id: 29,
    name: "User Preferences",
    description: "Allows users to customize their application settings.",
    key_functionalities: ["Theme selection", "Notification preferences"],
    completeness: "Fully implemented",
    feature_mapping: ["settings_access"]
  },
  {
    id: 30,
    name: "Audit Logs",
    description: "Records system activities and changes for security and compliance.",
    key_functionalities: ["User action tracking", "Data modifications"],
    completeness: "Fully implemented",
    feature_mapping: ["settings_access"]
  }
];
