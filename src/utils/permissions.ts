
/**
 * PERMISSION_MAPPING aligns navigation/feature names with database column names.
 * The keys are the 'featureName' used in navigation items or UI checks.
 * The values are the corresponding column names in 'center_feature_permissions' and 'teacher_feature_permissions'.
 */
export const PERMISSION_MAPPING: Record<string, string> = {
  // Navigation / UI Key -> Database Column Name
  'dashboard': 'dashboard_access',
  'dashboard_access': 'dashboard_access',
  'register_student': 'register_student',
  'students_registration': 'register_student', // Support both names
  'student_report': 'student_report',
  'student_report_access': 'student_report', // Support both names
  'homework_management': 'homework_management',
  'homework': 'homework_management',
  'lesson_plans': 'lesson_plans',
  'lesson_plan_management': 'lesson_plans',
  'lesson_tracking': 'lesson_tracking',
  'take_attendance': 'take_attendance',
  'attendance': 'take_attendance',
  'teacher_management': 'teacher_management',
  'teachers': 'teacher_management',
  'teachers_attendance': 'teachers_attendance',
  'discipline_issues': 'discipline_issues',
  'discipline': 'discipline_issues',
  'preschool_activities': 'preschool_activities',
  'activities': 'preschool_activities',
  'exams_results': 'exams_results',
  'exams': 'exams_results',
  'view_records': 'view_records',
  'records': 'view_records',
  'finance': 'finance',
  'messaging': 'messaging',
  'messages': 'messaging',
  'meetings_management': 'meetings_management',
  'meetings': 'meetings_management',
  'calendar_events': 'calendar_events',
  'calendar': 'calendar_events',
  'attendance_summary': 'attendance_summary',
  'attendance-summary': 'attendance_summary',
  'summary': 'summary',
  'teacher_reports': 'teacher_reports',
  'teacher-performance': 'teacher_reports',
  'chapter_performance': 'chapter_performance',
  'chapter-performance-overview': 'chapter_performance',
  'leave_management': 'leave_management',
  'hr_management': 'hr_management',
  'student_id_cards': 'student_id_cards',
  'student-id-cards': 'student_id_cards',
  'inventory_assets': 'inventory_assets',
  'inventory': 'inventory_assets',
  'transport_tracking': 'transport_tracking',
  'transport': 'transport_tracking',
  'school_days': 'school_days',
  'settings_access': 'settings_access',
  'settings': 'settings_access',
  'about_institution': 'about_institution',
  'about-institution': 'about_institution',
  'ai_insights': 'ai_insights',
  'class_routine': 'class_routine',
};

/**
 * Checks if a user has permission for a specific feature.
 * 1. Super Admin (admin role without center_id) always has permission.
 * 2. Center-level permission is the GLOBAL OVERRIDE. If it's explicitly 'false', NO ONE has access.
 * 3. If center-level permission is 'true' or 'null' (enabled by default):
 *    - Center role users have access.
 *    - Teacher role users have access UNLESS their specific teacherPermission is explicitly 'false'.
 */
export const hasPermission = (user: any, featureKey: string): boolean => {
  if (!user) return false;

  // Super Admin bypass
  if (user.role === 'admin' && !user.center_id) return true;

  const dbColumnName = PERMISSION_MAPPING[featureKey] || featureKey;
  const centerPerms = user.centerPermissions || {};
  const teacherPerms = user.teacherPermissions || {};

  // 1. Check Global Center Override (Default to TRUE if undefined/null)
  if (centerPerms[dbColumnName] === false) {
    return false;
  }

  // 2. Role-based logic
  if (user.role === 'center' || user.role === 'admin') {
    return true;
  }

  if (user.role === 'teacher') {
    // If center perms allow it, check teacher perms (Default to TRUE if undefined/null)
    if (teacherPerms[dbColumnName] === false) {
      return false;
    }
    return true;
  }

  // Parents follow center global override
  return true;
};
