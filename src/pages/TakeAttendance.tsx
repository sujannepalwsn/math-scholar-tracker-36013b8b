import { CalendarIcon, ChevronDown, Lock, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { format, startOfMonth, endOfMonth, eachDayOfInterval } from "date-fns";
import { cn } from "@/lib/utils";

interface Student {
  id: string;
  name: string;
  grade: string;
}

interface AttendanceRecord {
  studentId: string;
  present: boolean;
  timeIn: string;
  timeOut: string;
}

export default function TakeAttendance() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [attendance, setAttendance] = useState<Record<string, AttendanceRecord>>({});
  const [gradeFilter, setGradeFilter] = useState<string>("all");

  const dateStr = format(selectedDate, "yyyy-MM-dd");

  // Fetch class teacher assignments if teacher role
  const { data: classTeacherGrades = [] } = useQuery({
    queryKey: ["my-class-teacher-grades", user?.teacher_id],
    queryFn: async () => {
      if (!user?.teacher_id) return [];
      const { data, error } = await supabase.from("class_teacher_assignments").select("grade").eq("teacher_id", user.teacher_id);
      if (error) throw error;
      return data.map(d => d.grade);
    },
    enabled: !!user?.teacher_id && user?.role === 'teacher',
  });

  const isTeacher = user?.role === 'teacher';
  const isCenter = user?.role === 'center';

  const { data: students } = useQuery({
    queryKey: ["students", user?.center_id],
    queryFn: async () => {
      let query = supabase.from("students").select("id, name, grade").eq("is_active", true).order("name");
      if (user?.role !== "admin" && user?.center_id) {
        query = query.eq("center_id", user.center_id);
      }
      const { data, error } = await query;
      if (error) throw error;
      return data as Student[];
    },
  });

  const { data: existingAttendance } = useQuery({
    queryKey: ["attendance", dateStr, user?.center_id],
    queryFn: async () => {
      if (!user?.center_id) return [];
      const { data, error } = await supabase
        .from("attendance")
        .select("student_id, status, time_in, time_out, is_locked")
        .eq("date", dateStr)
        .eq("center_id", user.center_id);
      if (error) throw error;
      return data;
    },
    enabled: !!dateStr && !!user?.center_id,
  });

  // Check if attendance is locked for this date
  const isLocked = existingAttendance?.some((a: any) => a.is_locked) || false;
  const canEdit = isCenter; // Only center admin can edit locked attendance

  // For teachers, filter available grades to their assigned grades
  const availableGrades = students ? Array.from(new Set(students.map(s => s.grade))).sort() : [];
  const allowedGrades = isTeacher && classTeacherGrades.length > 0 ? availableGrades.filter(g => classTeacherGrades.includes(g)) : availableGrades;

  // Auto-set grade filter for teachers with only one assigned grade
  useEffect(() => {
    if (isTeacher && classTeacherGrades.length === 1 && gradeFilter === "all") {
      setGradeFilter(classTeacherGrades[0]);
    }
  }, [isTeacher, classTeacherGrades]);

  useEffect(() => {
    if (students) {
      const newAttendance: Record<string, AttendanceRecord> = {};
      students.forEach((student) => {
        const record = existingAttendance?.find((a: any) => a.student_id === student.id);
        newAttendance[student.id] = {
          present: record ? record.status === "present" : false,
          timeIn: record?.time_in || "",
          timeOut: record?.time_out || "",
          studentId: student.id,
        };
      });
      setAttendance(newAttendance);
    }
  }, [students, existingAttendance]);

  // Filter students by grade - for teachers, only show their assigned grades
  const filteredStudents = students?.filter(s => {
    if (isTeacher && classTeacherGrades.length > 0) {
      if (gradeFilter !== "all") return s.grade === gradeFilter;
      return classTeacherGrades.includes(s.grade);
    }
    return gradeFilter === "all" || s.grade === gradeFilter;
  });

  const handleToggle = (studentId: string) => {
    setAttendance((prev) => ({
      ...prev,
      [studentId]: { ...prev[studentId], present: !prev[studentId]?.present },
    }));
  };

  const handleTimeChange = (studentId: string, field: "timeIn" | "timeOut", value: string) => {
    setAttendance((prev) => ({
      ...prev,
      [studentId]: { ...prev[studentId], [field]: value },
    }));
  };

  const markAllPresent = () => {
    if (!filteredStudents) return;
    const updated: Record<string, AttendanceRecord> = { ...attendance };
    filteredStudents.forEach((student) => {
      updated[student.id] = { ...updated[student.id], present: true };
    });
    setAttendance(updated);
  };

  const markAllAbsent = () => {
    if (!filteredStudents) return;
    const updated: Record<string, AttendanceRecord> = { ...attendance };
    filteredStudents.forEach((student) => {
      updated[student.id] = { ...updated[student.id], present: false, timeIn: "", timeOut: "" };
    });
    setAttendance(updated);
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!filteredStudents || !user?.center_id) return;
      // Delete existing records for these students on this date
      await supabase.from("attendance").delete().eq("date", dateStr).in("student_id", filteredStudents.map((s) => s.id));
      // Insert ALL filtered students - present AND absent
      const records = filteredStudents.map((student) => ({
        student_id: student.id,
        center_id: user.center_id!,
        date: dateStr,
        status: attendance[student.id]?.present ? "present" : "absent",
        time_in: attendance[student.id]?.timeIn || null,
        time_out: attendance[student.id]?.timeOut || null,
        is_locked: true, // Lock after submission
      }));
      const { error } = await supabase.from("attendance").insert(records);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["attendance"] });
      toast.success("Attendance saved and locked!");
    },
    onError: () => toast.error("Failed to save attendance"),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isLocked && !canEdit) {
      toast.error("Attendance is locked. Only center admin can edit.");
      return;
    }
    saveMutation.mutate();
  };

  const presentCount = filteredStudents?.filter(s => attendance[s.id]?.present).length || 0;
  const absentCount = (filteredStudents?.length || 0) - presentCount;

  return (
    <div className="space-y-6 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight">Take Attendance</h1>
          <p className="text-muted-foreground text-sm sm:text-lg">Manage daily presence for your students.</p>
        </div>
        <div className="bg-primary/10 px-4 py-2 rounded-2xl border border-primary/20 flex items-center gap-2">
          <CalendarIcon className="h-5 w-5 text-primary" />
          <span className="font-semibold text-primary text-sm">{format(selectedDate, 'PPP')}</span>
        </div>
      </div>

      {isLocked && !canEdit && (
        <div className="flex items-center gap-2 p-3 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 rounded-lg text-orange-700 dark:text-orange-300">
          <Lock className="h-4 w-4" />
          <span className="text-sm font-medium">Attendance is locked for this date. Contact center admin to edit.</span>
        </div>
      )}

      <Card className="border-none shadow-soft">
        <CardHeader className="pb-4"><CardTitle className="text-xl">Settings</CardTitle></CardHeader>
        <CardContent className="flex flex-wrap gap-4 items-end">
          <div className="flex-1 min-w-[180px]">
            <Label className="text-xs">Select Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className={cn("w-full justify-start text-left font-normal mt-1", !selectedDate && "text-muted-foreground")}>
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {selectedDate ? format(selectedDate, "PPP") : "Pick a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar mode="single" selected={selectedDate} onSelect={(date) => date && setSelectedDate(date)} />
              </PopoverContent>
            </Popover>
          </div>
          <div className="flex-1 min-w-[120px]">
            <Label className="text-xs">Filter by Grade</Label>
            <Select value={gradeFilter} onValueChange={setGradeFilter}>
              <SelectTrigger className="mt-1"><SelectValue placeholder="All Grades" /></SelectTrigger>
              <SelectContent>
                {isTeacher && classTeacherGrades.length > 0 ? null : <SelectItem value="all">All Grades</SelectItem>}
                {allowedGrades.map((g) => <SelectItem key={g} value={g}>{g}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-xl font-bold">Student List</CardTitle>
              <CardDescription>
                {filteredStudents?.length || 0} students | Present: {presentCount} | Absent: {absentCount}
              </CardDescription>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" size="sm" onClick={markAllPresent} disabled={isLocked && !canEdit} className="rounded-xl border-2 hover:bg-green-50 hover:border-green-200 hover:text-green-600">Mark All Present</Button>
              <Button variant="outline" size="sm" onClick={markAllAbsent} disabled={isLocked && !canEdit} className="rounded-xl border-2 hover:bg-red-50 hover:border-red-200 hover:text-red-600">Mark All Absent</Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredStudents && filteredStudents.length > 0 ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredStudents.map((student) => (
                  <div key={student.id} className={cn("rounded-2xl border-2 p-4 sm:p-5 transition-all duration-300 group", attendance[student.id]?.present ? "border-primary/20 bg-primary/5 shadow-soft" : "border-transparent bg-muted/30")}>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <div className={cn("p-2 rounded-xl", attendance[student.id]?.present ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground")}><Users className="h-4 w-4" /></div>
                        <div className="flex flex-col">
                          <Label htmlFor={student.id} className="cursor-pointer font-bold text-base leading-tight">{student.name}</Label>
                          <Badge variant="outline" className="w-fit mt-1 h-5 text-[10px]">{student.grade}</Badge>
                        </div>
                      </div>
                      <Checkbox id={student.id} checked={attendance[student.id]?.present || false} onCheckedChange={() => handleToggle(student.id)} disabled={isLocked && !canEdit} className="h-6 w-6 rounded-lg" />
                    </div>
                    <div className="flex gap-4 ml-7">
                      <div className="flex-1"><Label className="text-xs text-muted-foreground">In</Label><Input type="time" value={attendance[student.id]?.timeIn || ""} onChange={(e) => handleTimeChange(student.id, "timeIn", e.target.value)} disabled={isLocked && !canEdit} className="mt-1" /></div>
                      <div className="flex-1"><Label className="text-xs text-muted-foreground">Out</Label><Input type="time" value={attendance[student.id]?.timeOut || ""} onChange={(e) => handleTimeChange(student.id, "timeOut", e.target.value)} disabled={isLocked && !canEdit} className="mt-1" /></div>
                    </div>
                  </div>
                ))}
              </div>
              <Button type="submit" className="w-full h-14 text-lg font-bold shadow-strong rounded-2xl" disabled={saveMutation.isPending || (isLocked && !canEdit)}>
                {saveMutation.isPending ? 'Saving...' : `Save Attendance (${filteredStudents.length} Students: ${presentCount}P / ${absentCount}A)`}
              </Button>
            </form>
          ) : (
            <p className="text-center text-muted-foreground">
              {isTeacher && classTeacherGrades.length === 0 ? "You are not assigned as class teacher for any grade. Contact your center admin." : "No students found for this filter."}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
