
export const PERMISSION_MAPPING: Record<string, string> = {
  'register_student': 'students_registration',
  'student_report_access': 'student_report',
  'student_report': 'student_report_access',
  'homework': 'homework_management',
  'lesson_plan_management': 'lesson_plans',
  'attendance': 'take_attendance',
  'teachers': 'teacher_management',
  'discipline': 'discipline_issues',
  'activities': 'preschool_activities',
  'exams': 'exams_results',
  'records': 'view_records',
  'finance': 'finance',
  'messages': 'messaging',
  'meetings': 'meetings_management',
  'calendar': 'calendar_events',
  'attendance-summary': 'attendance_summary',
  'summary': 'summary',
  'teacher-performance': 'teacher_reports',
  'chapter-performance-overview': 'chapter_performance',
  'leave-management': 'leave_management',
  'student-id-cards': 'student_id_cards',
  'inventory': 'inventory_assets',
  'transport': 'transport_tracking',
  'school-days': 'school_days',
  'settings': 'settings_access',
  'about-institution': 'about_institution'
};

/**
 * Checks if a user has permission for a specific feature.
 * Features are enabled by default (null/undefined = true) unless explicitly set to false.
 * Center-level permissions act as a global override for teachers.
 */
export const hasPermission = (user: any, featureName: string): boolean => {
  if (!user) return false;

  // Super Admin bypass
  if (user.role === 'admin' && !user.center_id) return true;

  const centerPerms = user.centerPermissions;
  const teacherPerms = user.teacherPermissions;

  // 1. Check Global Center Override
  // If the center has explicitly disabled the feature, NO ONE (center admin or teacher) can see it.
  if (centerPerms && centerPerms[featureName] === false) {
    return false;
  }

  // 2. Role-based check
  if (user.role === 'center' || user.role === 'admin') {
    return true; // If not globally disabled by center perms, center admins have access
  }

  if (user.role === 'teacher') {
    // A teacher must pass the center override (checked above)
    // AND must have permission in their specific teacher-level toggles.

    if (!teacherPerms) return true; // Default to true if no teacher-specific record exists

    const mappedName = PERMISSION_MAPPING[featureName];

    // Check direct name
    if (teacherPerms[featureName] === false) return false;

    // Check mapped name
    if (mappedName && teacherPerms[mappedName] === false) return false;

    return true; // Default to true if not explicitly disabled
  }

  // Parents and other roles - for now, we follow the same global override
  if (centerPerms && centerPerms[featureName] === false) return false;

  return true;
};
