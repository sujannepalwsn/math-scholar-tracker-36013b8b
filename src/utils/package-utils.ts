import { supabase } from "@/integrations/supabase/client";
import { PACKAGE_FEATURES, PackageType } from "@/lib/package-presets";

export const applyPackagePreset = async (centerId: string, packageType: PackageType) => {
  const features = PACKAGE_FEATURES[packageType];

  // 1. Update center package type
  const { error: centerError } = await supabase
    .from('centers')
    .update({ package_type: packageType })
    .eq('id', centerId);
  if (centerError) throw centerError;

  // 2. Update center permissions
  const { data: existingPerm } = await supabase
    .from('center_feature_permissions')
    .select('*')
    .eq('center_id', centerId)
    .maybeSingle();

  if (existingPerm) {
    const { error } = await supabase
      .from('center_feature_permissions')
      .update(features)
      .eq('center_id', centerId);
    if (error) throw error;
  } else {
    const { error } = await supabase
      .from('center_feature_permissions')
      .insert({ center_id: centerId, ...features });
    if (error) throw error;
  }

  // 3. Update all teachers in this center
  const { data: teachers, error: teachersError } = await supabase
    .from('teachers')
    .select('id')
    .eq('center_id', centerId);

  if (teachersError) throw teachersError;

  // Filter features to only those present in teacher_feature_permissions table
  // This prevents "column does not exist" errors
  const TEACHER_VALID_FEATURES = [
    'ai_insights', 'attendance_summary', 'calendar_events', 'chapter_performance',
    'class_routine', 'discipline_issues', 'finance', 'homework_management',
    'lesson_plans', 'lesson_tracking', 'meetings_management', 'messaging',
    'parent_portal', 'preschool_activities', 'summary', 'take_attendance',
    'test_management', 'view_records'
  ];

  // Optimization: We could use upsert with a list of objects but since we need to match existing IDs,
  // we do a mapped update. To avoid N+1 queries being too slow, we prepare the data first.

  for (const teacher of teachers || []) {
    const teacherPermissionsUpdate: Record<string, boolean> = {};
    TEACHER_VALID_FEATURES.forEach(fn => {
      // Map 'preschool_activities' to 'activities' if needed, but the table has both?
      // Actually checking the types output above: it has 'activities' and 'preschool_activities'.
      if (features[fn] !== undefined) {
        teacherPermissionsUpdate[fn] = features[fn];
      }
    });

    // Special mapping for field naming differences if any
    if (features['preschool_activities'] !== undefined) {
      teacherPermissionsUpdate['activities'] = features['preschool_activities'];
    }
    if (features['student_report'] !== undefined) {
      teacherPermissionsUpdate['student_report_access'] = features['student_report'];
    }

    const { error } = await supabase
      .from('teacher_feature_permissions')
      .upsert({
        teacher_id: teacher.id,
        ...teacherPermissionsUpdate
      }, { onConflict: 'teacher_id' });

    if (error) {
       console.error(`Failed to update permissions for teacher ${teacher.id}:`, error);
    }
  }

  return { success: true, features };
};
