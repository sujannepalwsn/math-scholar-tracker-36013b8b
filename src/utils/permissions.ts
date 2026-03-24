
/**
 * PERMISSION_MAPPING aligns navigation/feature names or routes with database column names.
 * The keys are the 'featureName' or 'route' used in navigation items or UI checks.
 * The values are the corresponding column names in 'center_feature_permissions' and 'teacher_feature_permissions'.
 */
export const PERMISSION_MAPPING: Record<string, string> = {
  // Navigation / UI Key -> Database Column Name
  'dashboard': 'dashboard_access',
  'dashboard_access': 'dashboard_access',
  'register_student': 'register_student',
  'students_registration': 'register_student',
  'student_report': 'student_report',
  'student_report_access': 'student_report',
  'homework_management': 'homework_management',
  'homework': 'homework_management',
  'lesson_plans': 'lesson_plans',
  'lesson_plan_management': 'lesson_plans',
  'lesson_tracking': 'lesson_tracking',
  'take_attendance': 'take_attendance',
  'attendance': 'take_attendance',
  'teacher_management': 'teacher_management',
  'teachers': 'teacher_management',
  'teachers_registration': 'teacher_management',
  'teachers_attendance': 'teachers_attendance',
  'discipline_issues': 'discipline_issues',
  'discipline': 'discipline_issues',
  'preschool_activities': 'preschool_activities',
  'activities': 'preschool_activities',
  'exams_results': 'exams_results',
  'exams': 'exams_results',
  'published_results': 'published_results',
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
  'teacher_performance': 'teacher_reports',
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

  // Route Fallbacks (to handle items with null feature_name in DB)
  '/register': 'register_student',
  '/teachers': 'teacher_management',
  '/teacher-attendance': 'teachers_attendance',
  '/hr-management': 'hr_management',
  '/leave-management': 'leave_management',
  '/student-id-cards': 'student_id_cards',
  '/inventory': 'inventory_assets',
  '/transport': 'transport_tracking',
  '/school-days': 'school_days',
  '/settings': 'settings_access',
  '/finance': 'finance',
  '/about-institution': 'about_institution',
  '/teacher/about-institution': 'about_institution',
  '/exams': 'exams_results',
  '/teacher/exams': 'exams_results',
  '/published-results': 'published_results',
  '/teacher/published-results': 'published_results',
  '/student-report': 'student_report',
  '/teacher/student-report': 'student_report',
  '/teacher-performance': 'teacher_reports',
  '/chapter-performance-overview': 'chapter_performance',
  '/teacher/chapter-performance': 'chapter_performance',
  '/teacher/settings': 'settings_access',
};

export const ADMIN_MODULES = [
  'register_student', 'teacher_management', 'finance', 'settings_access',
  'hr_management', 'inventory_assets', 'transport_tracking', 'school_days',
  'teachers_attendance', 'about_institution', 'exams_results', 'published_results',
  'student_report', 'teacher_reports', 'chapter_performance', 'leave_management',
  'student_id_cards'
];

/**
 * Checks if a user has permission for a specific feature.
 * A module is accessible only if it's enabled and the user can view it.
 */
export const hasPermission = (user: any, featureKey: string, route?: string): boolean => {
  if (!user) return false;

  // Super Admin bypass
  if (user.role === 'admin' && !user.center_id) return true;

  // 1. Normalize the feature key
  let dbColumnName = PERMISSION_MAPPING[featureKey] || featureKey;

  // 2. If it's still not a known column, and we have a route, try route mapping
  if (route && !PERMISSION_MAPPING[featureKey]) {
    dbColumnName = PERMISSION_MAPPING[route] || dbColumnName;
  }

  // Get permissions from user object
  const centerPerms = user.centerPermissions || {};
  const teacherPerms = user.teacherPermissions || {};

  // 3. Check Global Center Override (Absolute Master Toggle)
  // If explicitly set to false, NO ONE in the center has access.
  if (centerPerms[dbColumnName] === false) {
    return false;
  }

  // 4. Special case for Dashboard - usually always allowed if not explicitly disabled
  if (dbColumnName === 'dashboard_access') {
    return centerPerms['dashboard_access'] !== false;
  }

  // 5. Role-based logic
  if (user.role === 'center' || user.role === 'admin') {
    // Center Admin has access to everything unless globally disabled at center level
    return true;
  }

  if (user.role === 'teacher') {
    // Check granular JSONB permissions if available
    if (teacherPerms.permissions) {
      const modulePerms = teacherPerms.permissions[dbColumnName];

      // If the specific module is defined in the JSONB, use it as the source of truth
      if (modulePerms) {
        // A module is accessible only if enabled AND can_view is true
        return modulePerms.enabled === true && modulePerms.can_view === true;
      }

      // If JSONB exists but doesn't have this key, it might be an administrative module
      // not yet granted or a newly added module.
      if (ADMIN_MODULES.includes(dbColumnName)) {
        return false;
      }
    }

    // Fallback to legacy boolean columns if JSONB is not yet loaded or migrated
    if (teacherPerms[dbColumnName] === true) return true;
    if (teacherPerms[dbColumnName] === false) return false;

    // Default behavior for undefined teacher permissions:
    // - Academic/Communication features: True (unless globally disabled at center level)
    // - Administrative features: False
    return !ADMIN_MODULES.includes(dbColumnName);
  }

  // Parents follow center global override
  return true;
};

/**
 * Checks if a teacher has granular permission for a specific action within a module.
 * Actions: 'view', 'edit', 'approve', 'publish'
 */
export const hasActionPermission = (user: any, featureKey: string, action: 'view' | 'edit' | 'approve' | 'publish'): boolean => {
  if (!user) return false;

  if (action === 'view') return hasPermission(user, featureKey);

  // Super Admin/Center Admin bypass
  if (user.role === 'admin' || user.role === 'center') {
    return hasPermission(user, featureKey);
  }

  if (user.role !== 'teacher') return false;

  // Normalize feature key
  const dbColumnName = PERMISSION_MAPPING[featureKey] || featureKey;

  // Basic access check first (must be enabled and can_view)
  if (!hasPermission(user, featureKey)) return false;

  const teacherPerms = user.teacherPermissions || {};
  const isRestricted = user.teacher_scope_mode === 'restricted';

  if (teacherPerms.permissions && teacherPerms.permissions[dbColumnName]) {
    const modulePerms = teacherPerms.permissions[dbColumnName];

    switch (action) {
      case 'edit':
        // If in restricted mode, some administrative modules are forced to read-only
        if (isRestricted && ADMIN_MODULES.includes(dbColumnName)) {
          return false;
        }
        return modulePerms.can_edit === true;
      case 'approve':
        return modulePerms.can_approve === true;
      case 'publish':
        return modulePerms.can_publish === true;
      default:
        return false;
    }
  }

  // Fallback for legacy mode: if the module is enabled, allow editing by default
  // EXCEPT for administrative modules which are strictly guarded
  if (action === 'edit') {
    if (ADMIN_MODULES.includes(dbColumnName)) {
       // For admin modules in legacy mode, check if the legacy boolean is explicitly true
       return teacherPerms[dbColumnName] === true;
    }

    // For academic modules, if we don't have JSONB yet, we assume edit is allowed if view is allowed
    return hasPermission(user, featureKey);
  }

  return false;
};
