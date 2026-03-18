import { Calendar } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogDescription } from "@/components/ui/dialog"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { supabase } from "@/integrations/supabase/client"
import { useAuth } from "@/contexts/AuthContext"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { toast } from "sonner"

const TEACHER_FEATURES = [
  { name: 'dashboard_access', label: 'Dashboard' },
  { name: 'academics_access', label: 'Academics' },
  { name: 'take_attendance', label: 'Take Attendance' },
  { name: 'class_routine', label: 'Class Routine' },
  { name: 'lesson_plans', label: 'Lesson Plan Management' },
  { name: 'lesson_tracking', label: 'Lesson Tracking' },
  { name: 'homework_management', label: 'Homework' },
  { name: 'test_management', label: 'Tests' },
  { name: 'exams_results', label: 'Exams & Results' },
  { name: 'published_results', label: 'Published Results' },
  { name: 'preschool_activities', label: 'Activities' },
  { name: 'discipline_issues', label: 'Discipline' },
  { name: 'teachers_attendance', label: 'Teachers Attendance' },
  { name: 'leave_management', label: 'Leave Management' },
  { name: 'inventory_assets', label: 'Inventory & Assets' },
  { name: 'school_days', label: 'School Days' },
  { name: 'communications_access', label: 'Reports & Communication' },
  { name: 'messaging', label: 'Messages' },
  { name: 'meetings_management', label: 'Meetings' },
  { name: 'calendar_events', label: 'Calendar & Events' },
  { name: 'student_report', label: 'Student Report' }, // Aligned with center permissions
  { name: 'attendance_summary', label: 'Attendance Summary' },
  { name: 'summary', label: 'Summary' },
  { name: 'teacher_reports', label: 'Teacher Reports' },
  { name: 'chapter_performance', label: 'Chapter Performance' },
  { name: 'view_records', label: 'View Records' },
  { name: 'about_institution', label: 'About Institution' },
];

export default function TeacherFeaturePermissions({ teacherId, teacherName }: { teacherId: string; teacherName: string }) {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const { data: centerPermissions } = useQuery({
    queryKey: ['center-feature-permissions', user?.center_id],
    queryFn: async () => {
      const { data, error } = await supabase.from('center_feature_permissions').select('*').eq('center_id', user?.center_id).maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!user?.center_id
  });

  const { data: permissions, isLoading: permissionsLoading } = useQuery({
    queryKey: ['teacher-feature-permissions', teacherId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('teacher_feature_permissions')
        .select('*')
        .eq('teacher_id', teacherId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!teacherId });

  const updatePermissionMutation = useMutation({
    mutationFn: async ({ featureName, isEnabled }: { featureName: string; isEnabled: boolean }) => {
      if (permissions) {
        // Update existing record
        const { error } = await supabase
          .from('teacher_feature_permissions')
          .update({ [featureName]: isEnabled })
          .eq('teacher_id', teacherId);
        if (error) throw error;
      } else {
        // Insert new record with this permission set
        const { error } = await supabase
          .from('teacher_feature_permissions')
          .insert({ teacher_id: teacherId, [featureName]: isEnabled });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teacher-feature-permissions', teacherId] });
      toast.success('Teacher feature permission updated successfully!');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update teacher feature permission');
    } });

  const handleToggle = (featureName: string, currentStatus: boolean) => {
    updatePermissionMutation.mutate({ featureName, isEnabled: !currentStatus });
  };

  if (permissionsLoading) {
    return <p>Loading teacher permissions...</p>;
  }

  return (
    <Card className="max-h-[70vh] overflow-hidden flex flex-col">
      <CardHeader>
        <CardTitle id="teacher-permissions-title">Manage Features for {teacherName}</CardTitle>
        <DialogDescription id="teacher-permissions-description">
          Enable or disable specific features for this teacher.
        </DialogDescription>
      </CardHeader>
      <CardContent className="overflow-y-auto flex-1">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Feature</TableHead>
              <TableHead className="text-center">Enabled</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {TEACHER_FEATURES.filter(f => {
              if (!centerPermissions) return true;
              const centerVal = centerPermissions[f.name as keyof typeof centerPermissions];
              return centerVal !== false;
            }).map(feature => {
              // Map student_report to student_report_access for the database update if necessary
              // but for consistency let's use the DB names.
              const dbFieldName = feature.name === 'student_report' ? 'student_report_access' : feature.name;
              const isEnabled = permissions?.[dbFieldName as keyof typeof permissions] ?? true;

              return (
                <TableRow key={feature.name}>
                  <TableCell className="font-medium">{feature.label}</TableCell>
                  <TableCell className="text-center">
                    <Switch
                      checked={Boolean(isEnabled)}
                      onCheckedChange={() => handleToggle(dbFieldName, Boolean(isEnabled))}
                      disabled={updatePermissionMutation.isPending}
                    />
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
