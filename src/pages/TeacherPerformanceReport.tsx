"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, subDays } from "date-fns";
import { BarChart3, BookOpen, CheckCircle, ClipboardCheck, Users } from "lucide-react";
import { Progress } from "@/components/ui/progress";

export default function TeacherPerformanceReport() {
  const { user } = useAuth();
  const [selectedTeacher, setSelectedTeacher] = useState("all");
  const [dateRange, setDateRange] = useState<"daily" | "weekly" | "monthly" | "overall">("monthly");

  const today = new Date();
  const getDateRange = () => {
    switch (dateRange) {
      case "daily": return { start: format(today, "yyyy-MM-dd"), end: format(today, "yyyy-MM-dd") };
      case "weekly": return { start: format(startOfWeek(today), "yyyy-MM-dd"), end: format(endOfWeek(today), "yyyy-MM-dd") };
      case "monthly": return { start: format(startOfMonth(today), "yyyy-MM-dd"), end: format(endOfMonth(today), "yyyy-MM-dd") };
      case "overall": return { start: "2020-01-01", end: format(today, "yyyy-MM-dd") };
    }
  };
  const range = getDateRange();

  const { data: teachers = [] } = useQuery({
    queryKey: ["teachers-for-report", user?.center_id],
    queryFn: async () => {
      if (!user?.center_id) return [];
      const { data, error } = await supabase.from("teachers").select("id, name").eq("center_id", user.center_id).eq("is_active", true).order("name");
      if (error) throw error;
      return data;
    },
    enabled: !!user?.center_id,
  });

  // Teacher attendance
  const { data: teacherAttendance = [] } = useQuery({
    queryKey: ["teacher-attendance-report", user?.center_id, range.start, range.end, selectedTeacher],
    queryFn: async () => {
      if (!user?.center_id) return [];
      let query = supabase.from("teacher_attendance").select("*").eq("center_id", user.center_id).gte("date", range.start).lte("date", range.end);
      if (selectedTeacher !== "all") query = query.eq("teacher_id", selectedTeacher);
      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.center_id,
  });

  // Lesson plans created
  const { data: lessonPlans = [] } = useQuery({
    queryKey: ["lesson-plans-report", user?.center_id, range.start, range.end, selectedTeacher],
    queryFn: async () => {
      if (!user?.center_id) return [];
      let query = supabase.from("lesson_plans").select("*").eq("center_id", user.center_id).gte("lesson_date", range.start).lte("lesson_date", range.end);
      if (selectedTeacher !== "all") query = query.eq("teacher_id", selectedTeacher);
      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.center_id,
  });

  // Homework assigned
  const { data: homework = [] } = useQuery({
    queryKey: ["homework-report", user?.center_id, range.start, range.end, selectedTeacher],
    queryFn: async () => {
      if (!user?.center_id) return [];
      let query = supabase.from("homework").select("*").eq("center_id", user.center_id).gte("due_date", range.start).lte("due_date", range.end);
      if (selectedTeacher !== "all") query = query.eq("teacher_id", selectedTeacher);
      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.center_id,
  });

  // Student chapters (evaluations)
  const { data: evaluations = [] } = useQuery({
    queryKey: ["evaluations-report", user?.center_id, range.start, range.end, selectedTeacher],
    queryFn: async () => {
      if (!user?.center_id) return [];
      let query = supabase.from("student_chapters").select("*").gte("completed_at", range.start).lte("completed_at", range.end);
      if (selectedTeacher !== "all") query = query.eq("recorded_by_teacher_id", selectedTeacher);
      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.center_id,
  });

  // Build per-teacher stats
  const teacherStats = teachers.map(t => {
    const att = teacherAttendance.filter(a => a.teacher_id === t.id);
    const presentDays = att.filter(a => a.status === "present").length;
    const totalAttDays = att.length;
    const lps = lessonPlans.filter(lp => lp.teacher_id === t.id);
    const hws = homework.filter(hw => hw.teacher_id === t.id);
    const evals = evaluations.filter(e => e.recorded_by_teacher_id === t.id);

    return {
      id: t.id,
      name: t.name,
      attendancePresent: presentDays,
      attendanceTotal: totalAttDays,
      attendancePct: totalAttDays > 0 ? Math.round((presentDays / totalAttDays) * 100) : 0,
      lessonPlans: lps.length,
      homework: hws.length,
      evaluations: evals.length,
    };
  }).filter(t => selectedTeacher === "all" || t.id === selectedTeacher);

  return (
    <div className="space-y-6 animate-in fade-in duration-700">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight flex items-center gap-2">
          <BarChart3 className="h-6 w-6 text-primary" /> Teacher Performance Reports
        </h1>
        <p className="text-muted-foreground text-sm">Evaluate teacher performance and consistency.</p>
      </div>

      <Card>
        <CardContent className="pt-6 flex flex-wrap gap-4">
          <div className="flex-1 min-w-[150px]">
            <Label className="text-xs">Teacher</Label>
            <Select value={selectedTeacher} onValueChange={setSelectedTeacher}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Teachers</SelectItem>
                {teachers.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="flex-1 min-w-[150px]">
            <Label className="text-xs">Period</Label>
            <Select value={dateRange} onValueChange={(v: any) => setDateRange(v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="daily">Today</SelectItem>
                <SelectItem value="weekly">This Week</SelectItem>
                <SelectItem value="monthly">This Month</SelectItem>
                <SelectItem value="overall">Overall</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
        {[
          { title: "Attendance", value: `${teacherStats.reduce((s, t) => s + t.attendancePct, 0) / (teacherStats.length || 1)}%`, icon: Users, color: "text-green-600" },
          { title: "Lesson Plans", value: teacherStats.reduce((s, t) => s + t.lessonPlans, 0), icon: BookOpen, color: "text-primary" },
          { title: "Homework Given", value: teacherStats.reduce((s, t) => s + t.homework, 0), icon: ClipboardCheck, color: "text-orange-600" },
          { title: "Evaluations Done", value: teacherStats.reduce((s, t) => s + t.evaluations, 0), icon: CheckCircle, color: "text-blue-600" },
        ].map(s => (
          <Card key={s.title}>
            <CardHeader className="pb-2"><CardTitle className="text-xs uppercase text-muted-foreground">{s.title}</CardTitle></CardHeader>
            <CardContent><div className="text-2xl font-bold">{typeof s.value === 'number' ? s.value : Math.round(parseFloat(s.value))}</div></CardContent>
          </Card>
        ))}
      </div>

      {/* Detailed Table */}
      <Card>
        <CardHeader><CardTitle className="text-lg">Detailed Breakdown</CardTitle></CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Teacher</TableHead>
                  <TableHead>Attendance</TableHead>
                  <TableHead>Lesson Plans</TableHead>
                  <TableHead>Homework</TableHead>
                  <TableHead>Evaluations</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {teacherStats.length === 0 ? (
                  <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground">No data available</TableCell></TableRow>
                ) : teacherStats.map(t => (
                  <TableRow key={t.id}>
                    <TableCell className="font-medium">{t.name}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Progress value={t.attendancePct} className="w-16 h-2" />
                        <span className="text-sm">{t.attendancePct}% ({t.attendancePresent}/{t.attendanceTotal})</span>
                      </div>
                    </TableCell>
                    <TableCell>{t.lessonPlans}</TableCell>
                    <TableCell>{t.homework}</TableCell>
                    <TableCell>{t.evaluations}</TableCell>
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
