import { supabase } from "@/integrations/supabase/client";
import { PACKAGE_FEATURES, PackageType } from "@/lib/package-presets";
import { differenceInDays } from "date-fns";

/**
 * Applies a package preset to a center and all its teachers.
 * This is the core logic that synchronizes features across the platform.
 */
export const applyPackagePreset = async (centerId: string, packageType: PackageType) => {
  console.log(`Applying package ${packageType} to center ${centerId}`);
  const features = PACKAGE_FEATURES[packageType];

  // 1. Update center package type
  const { error: centerError } = await supabase
    .from('centers')
    .update({ package_type: packageType })
    .eq('id', centerId);
  if (centerError) {
    console.error('Error updating center package type:', centerError);
    throw centerError;
  }

  // 2. Update center permissions
  const { data: existingPerm, error: fetchError } = await supabase
    .from('center_feature_permissions')
    .select('id')
    .eq('center_id', centerId)
    .maybeSingle();

  if (fetchError) {
     console.error('Error fetching center permissions:', fetchError);
     throw fetchError;
  }

  if (existingPerm) {
    const { error: updateError } = await supabase
      .from('center_feature_permissions')
      .update(features)
      .eq('center_id', centerId);
    if (updateError) {
        console.error('Error updating center permissions:', updateError);
        throw updateError;
    }
  } else {
    const { error: insertError } = await supabase
      .from('center_feature_permissions')
      .insert({ center_id: centerId, ...features });
    if (insertError) {
        console.error('Error inserting center permissions:', insertError);
        throw insertError;
    }
  }

  // 3. Update all teachers in this center
  const { data: teachers, error: teachersError } = await supabase
    .from('teachers')
    .select('id')
    .eq('center_id', centerId);

  if (teachersError) {
    console.error('Error fetching teachers:', teachersError);
    throw teachersError;
  }

  // Valid features that exist as columns in teacher_feature_permissions
  const TEACHER_VALID_FEATURES = [
    'ai_insights', 'attendance_summary', 'calendar_events', 'chapter_performance',
    'class_routine', 'discipline_issues', 'finance', 'homework_management',
    'lesson_plans', 'lesson_tracking', 'meetings_management', 'messaging',
    'parent_portal', 'preschool_activities', 'summary', 'take_attendance',
    'test_management', 'view_records', 'hr_management', 'leave_management'
  ];

  if (teachers && teachers.length > 0) {
    const teacherUpdates = teachers.map(teacher => {
      const teacherPermissionsUpdate: Record<string, any> = {
        teacher_id: teacher.id
      };

      const granularPermissions: Record<string, any> = {};

      TEACHER_VALID_FEATURES.forEach(fn => {
        if (features[fn] !== undefined) {
          const isEnabled = features[fn];
          teacherPermissionsUpdate[fn] = isEnabled;

          granularPermissions[fn] = {
            enabled: isEnabled,
            can_view: isEnabled,
            can_edit: isEnabled,
            can_approve: (fn === 'lesson_plans' || fn === 'leave_management') ? isEnabled : false,
            can_publish: (fn === 'exams_results' || fn === 'published_results') ? isEnabled : false
          };
        }
      });

      // Special mappings
      if (features['student_report'] !== undefined) {
        const isEnabled = features['student_report'];
        teacherPermissionsUpdate['student_report_access'] = isEnabled;
        granularPermissions['student_report'] = {
           enabled: isEnabled,
           can_view: isEnabled,
           can_edit: isEnabled,
           can_approve: false,
           can_publish: false
        };
      }

      if (features['preschool_activities'] !== undefined) {
          teacherPermissionsUpdate['activities'] = features['preschool_activities'];
      }

      teacherPermissionsUpdate['permissions'] = granularPermissions;
      return teacherPermissionsUpdate;
    });

    // Bulk upsert teacher permissions
    const { error: bulkError } = await supabase
      .from('teacher_feature_permissions')
      .upsert(teacherUpdates, { onConflict: 'teacher_id' });

    if (bulkError) {
       console.error(`Failed to bulk update teacher permissions:`, bulkError);
       // We don't throw here to avoid failing the whole process if one teacher update fails
    }
  }

  console.log(`Package ${packageType} successfully applied to center ${centerId}`);
  return { success: true, features };
};

/**
 * Calculates the pro-rated amount for a new subscription.
 * Formula: (Current Amount / Total Days) * Days Used + New Amount
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

  if (daysUsed >= totalDays) return newPlanPrice;

  const costPerDay = currentAmount / totalDays;
  const usedCost = costPerDay * daysUsed;

  return parseFloat((usedCost + newPlanPrice).toFixed(2));
};
