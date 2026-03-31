import { supabase } from "@/integrations/supabase/client";
import { PACKAGE_FEATURES, PackageType } from "@/lib/package-presets";
import { differenceInDays } from "date-fns";

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

  // Final corrected column names for teacher_feature_permissions based on types.ts
  const TEACHER_VALID_FEATURES = [
    'ai_insights', 'attendance_summary', 'calendar_events', 'chapter_performance',
    'class_routine', 'discipline_issues', 'finance', 'homework_management',
    'lesson_plans', 'lesson_tracking', 'meetings_management', 'messaging',
    'parent_portal', 'preschool_activities', 'summary', 'take_attendance',
    'test_management', 'view_records'
  ];

  if (teachers && teachers.length > 0) {
    const teacherUpdates = teachers.map(teacher => {
      const teacherPermissionsUpdate: Record<string, any> = {
        teacher_id: teacher.id
      };

      TEACHER_VALID_FEATURES.forEach(fn => {
        if (features[fn] !== undefined) {
          teacherPermissionsUpdate[fn] = features[fn];
        }
      });

      // Special mappings for fields with slightly different names in teacher table
      if (features['student_report'] !== undefined) {
        teacherPermissionsUpdate['student_report_access'] = features['student_report'];
      }

      return teacherPermissionsUpdate;
    });

    // Bulk upsert to optimize performance
    const { error: bulkError } = await supabase
      .from('teacher_feature_permissions')
      .upsert(teacherUpdates, { onConflict: 'teacher_id' });

    if (bulkError) {
       console.error(`Failed to bulk update teacher permissions:`, bulkError);
    }
  }

  return { success: true, features };
};

/**
 * Calculates the pro-rated amount for a new subscription.
 * (Current Amount / Total Days) * Days Used + New Amount
 */
export const calculateProRatedAmount = (
  currentAmount: number,
  totalDays: number,
  startDate: string,
  newPlanPrice: number
) => {
  const today = new Date();
  const start = new Date(startDate);
  const daysUsed = Math.max(0, differenceInDays(today, start));

  // If we've used more days than the subscription total (expired but not yet processed),
  // we just charge the full new amount.
  if (daysUsed >= totalDays) return newPlanPrice;

  const costPerDay = currentAmount / totalDays;
  const usedCost = costPerDay * daysUsed;

  return parseFloat((usedCost + newPlanPrice).toFixed(2));
};
