import { Calendar } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { supabase } from "@/integrations/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { toast } from "sonner"

const FEATURES = [
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
  { name: 'students_registration', label: 'Students Registration' },
  { name: 'teacher_management', label: 'Teachers Registration' },
  { name: 'teachers_attendance', label: 'Teachers Attendance' },
  { name: 'hr_management', label: 'HR Management' },
  { name: 'leave_management', label: 'Leave Management' },
  { name: 'student_id_cards', label: 'Student ID Cards' },
  { name: 'inventory_assets', label: 'Inventory & Assets' },
  { name: 'transport_tracking', label: 'Transport & Tracking' },
  { name: 'school_days', label: 'School Days' },
  { name: 'settings_access', label: 'Settings' },
  { name: 'communications_access', label: 'Reports & Communication' },
  { name: 'messaging', label: 'Messages' },
  { name: 'meetings_management', label: 'Meetings' },
  { name: 'calendar_events', label: 'Calendar & Events' },
  { name: 'student_report', label: 'Student Report' },
  { name: 'attendance_summary', label: 'Attendance Summary' },
  { name: 'summary', label: 'Summary' },
  { name: 'teacher_reports', label: 'Teacher Reports' },
  { name: 'chapter_performance', label: 'Chapter Performance' },
  { name: 'view_records', label: 'View Records' },
  { name: 'finance', label: 'Finance' },
  { name: 'about_institution', label: 'About Institution' },
];

const TEACHER_FEATURES = [
  { name: 'dashboard_access', label: 'Dashboard' },
  { name: 'students_registration', label: 'Students Registration' },
  { name: 'teacher_management', label: 'Teachers Registration' },
  { name: 'teachers_attendance', label: 'Teachers Attendance' },
  { name: 'hr_management', label: 'HR Management' },
  { name: 'leave_management', label: 'Leave Management' },
  { name: 'student_id_cards', label: 'Student ID Cards' },
  { name: 'inventory_assets', label: 'Inventory & Assets' },
  { name: 'transport_tracking', label: 'Transport & Tracking' },
  { name: 'school_days', label: 'School Days' },
  { name: 'settings_access', label: 'Settings' },
  { name: 'messaging', label: 'Messages' },
  { name: 'meetings_management', label: 'Meetings' },
  { name: 'finance', label: 'Finance' },
  { name: 'about_institution', label: 'About Institution' },
];

export default function CenterFeaturePermissions() {
  const queryClient = useQueryClient();

  const { data: centers = [], isLoading: centersLoading } = useQuery({
    queryKey: ['admin-centers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('centers')
        .select('*')
        .order('name');
      if (error) throw error;
      return data;
    } });

  const { data: teachers = [] } = useQuery({
    queryKey: ['admin-teachers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('teachers')
        .select('*, centers(name)');
      if (error) throw error;
      return data;
    } });

  const { data: teacherPermissions = [] } = useQuery({
    queryKey: ['teacher-feature-permissions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('teacher_feature_permissions')
        .select('*');
      if (error) throw error;
      return data;
    } });

  const { data: permissions = [], isLoading: permissionsLoading } = useQuery({
    queryKey: ['center-feature-permissions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('center_feature_permissions')
        .select('*');
      if (error) throw error;
      return data;
    } });

  const permissionsByCenter = permissions.reduce((acc, perm) => {
    acc[perm.center_id] = perm;
    return acc;
  }, {} as Record<string, any>);

  const permissionsByTeacher = teacherPermissions.reduce((acc, perm) => {
    acc[perm.teacher_id] = perm;
    return acc;
  }, {} as Record<string, any>);

  const updatePermissionMutation = useMutation({
    mutationFn: async ({ centerId, featureName, isEnabled }: { centerId: string; featureName: string; isEnabled: boolean }) => {
      const existingPerm = permissionsByCenter[centerId];
      
      if (existingPerm) {
        const { error } = await supabase
          .from('center_feature_permissions')
          .update({ [featureName]: isEnabled })
          .eq('center_id', centerId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('center_feature_permissions')
          .insert({ center_id: centerId, [featureName]: isEnabled });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['center-feature-permissions'] });
      toast.success('Feature permission updated successfully!');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update feature permission');
    } });

  const updateTeacherPermissionMutation = useMutation({
    mutationFn: async ({ teacherId, featureName, isEnabled }: { teacherId: string; featureName: string; isEnabled: boolean }) => {
      const existingPerm = permissionsByTeacher[teacherId];

      if (existingPerm) {
        const { error } = await supabase
          .from('teacher_feature_permissions')
          .update({ [featureName]: isEnabled })
          .eq('teacher_id', teacherId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('teacher_feature_permissions')
          .insert({ teacher_id: teacherId, [featureName]: isEnabled });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teacher-feature-permissions'] });
      toast.success('Teacher permission updated successfully!');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update teacher permission');
    } });

  const handleToggle = (centerId: string, featureName: string, currentStatus: boolean) => {
    updatePermissionMutation.mutate({ centerId, featureName, isEnabled: !currentStatus });
  };

  const handleTeacherToggle = (teacherId: string, featureName: string, currentStatus: boolean) => {
    updateTeacherPermissionMutation.mutate({ teacherId, featureName, isEnabled: !currentStatus });
  };

  if (centersLoading || permissionsLoading) {
    return <p>Loading feature permissions...</p>;
  }

  return (
    <div className="space-y-8">
    <Card>
      <CardHeader>
        <CardTitle>Manage Center Feature Permissions</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-auto max-h-[500px]">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="sticky left-0 top-0 bg-background z-20">Center Name</TableHead>
                {FEATURES.map(feature => (
                  <TableHead key={feature.name} className="text-center min-w-[120px] sticky top-0 bg-background z-10">{feature.label}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {centers.map(center => (
                <TableRow key={center.id}>
                  <TableCell className="font-medium sticky left-0 bg-card z-10">{center.name}</TableCell>
                  {FEATURES.map(feature => {
                    const centerPerm = permissionsByCenter[center.id];
                    const isEnabled = centerPerm?.[feature.name] ?? true;
                    return (
                      <TableCell key={feature.name} className="text-center">
                        <Switch
                          checked={isEnabled}
                          onCheckedChange={() => handleToggle(center.id, feature.name, isEnabled)}
                          disabled={updatePermissionMutation.isPending}
                        />
                      </TableCell>
                    );
                  })}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>

    </div>
  );
}