import { SYSTEM_MODULES } from './system-modules';

export type PackageType = 'Basic' | 'Standard' | 'Premium';

export const PACKAGE_FEATURES: Record<PackageType, Record<string, boolean>> = {
  'Basic': {
    'dashboard_access': true,
    'register_student': true,
    'teacher_management': true,
    'class_routine': true,
    'take_attendance': true,
    'teachers_attendance': true,
    'settings_access': true,
    'student_id_cards': true,
    'about_institution': true,
    'view_records': true, // Essential for student management
    // Explicitly Disabled for Basic
    'parent_portal': false,
    'exams_results': false,
    'published_results': false,
    'finance': false,
    'messaging': false,
    'meetings_management': false,
    'homework_management': false,
    'discipline_issues': false,
    'lesson_plans': false,
    'lesson_tracking': false,
    'hr_management': false,
    'leave_management': false,
    'inventory_assets': false,
    'transport_tracking': false,
    'student_report': false,
    'attendance_summary': false,
    'summary': false,
    'test_management': false,
    'preschool_activities': false,
    'teacher_reports': false,
    'chapter_performance': false,
    'calendar_events': false,
  },
  'Standard': {
    // All Basic
    'dashboard_access': true,
    'register_student': true,
    'teacher_management': true,
    'class_routine': true,
    'take_attendance': true,
    'teachers_attendance': true,
    'settings_access': true,
    'student_id_cards': true,
    'about_institution': true,
    'view_records': true,
    // Additional Standard Features
    'parent_portal': true,
    'exams_results': true,
    'published_results': true,
    'homework_management': true,
    'discipline_issues': true,
    'finance': true,
    'messaging': true,
    'meetings_management': true,
    'calendar_events': true,
    'student_report': true,
    'attendance_summary': true,
    'summary': true,
    'test_management': true,
    // Explicitly Disabled for Standard
    'inventory_assets': false,
    'transport_tracking': false,
    'hr_management': false,
    'leave_management': false,
    'lesson_plans': false,
    'lesson_tracking': false,
    'preschool_activities': false,
    'teacher_reports': false,
    'chapter_performance': false,
  },
  'Premium': {
    // Everything ON
    'dashboard_access': true,
    'register_student': true,
    'teacher_management': true,
    'class_routine': true,
    'take_attendance': true,
    'teachers_attendance': true,
    'settings_access': true,
    'student_id_cards': true,
    'parent_portal': true,
    'exams_results': true,
    'published_results': true,
    'homework_management': true,
    'discipline_issues': true,
    'finance': true,
    'messaging': true,
    'meetings_management': true,
    'calendar_events': true,
    'student_report': true,
    'attendance_summary': true,
    'summary': true,
    'view_records': true,
    'test_management': true,
    'leave_management': true,
    'lesson_plans': true,
    'lesson_tracking': true,
    'hr_management': true,
    'inventory_assets': true,
    'transport_tracking': true,
    'teacher_reports': true,
    'chapter_performance': true,
    'about_institution': true,
  }
};

export const getDynamicPackageHighlights = (packageType: PackageType): string[] => {
  const features = PACKAGE_FEATURES[packageType];
  const highlights: string[] = [];

  SYSTEM_MODULES.forEach(module => {
    const isEnabled = module.feature_mapping.some(feature => features[feature]);
    if (isEnabled && highlights.length < 8) {
      highlights.push(module.name);
    }
  });

  return highlights;
};

export const PACKAGE_HIGHLIGHTS: Record<PackageType, string[]> = {
  'Basic': [
    'Authentication & Authorization',
    'Role-based Dashboards',
    'Student Management',
    'Teacher Management',
    'Class & Subject Management',
    'Attendance (Student & Teacher)',
    'Settings & Customization',
    'Calendar Events & ID Cards'
  ],
  'Standard': [
    'Everything in Basic',
    'Parent Portal Access',
    'Exams & Results Management',
    'Homework & Assignments',
    'Discipline Tracking',
    'Finance & Fee Management',
    'Messaging & Video Meetings',
    'Advanced Reports & Summaries'
  ],
  'Premium': [
    'Everything in Standard',
    'Lesson Planning & Tracking (OCR)',
    'Inventory & Asset Management',
    'Transport & Vehicle Tracking',
    'HR & Leave Management',
    'Teacher Performance Reports',
    'Full ERP Access'
  ]
};
