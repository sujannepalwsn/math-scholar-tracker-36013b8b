import { BookOpen, CalendarIcon, CheckCircle2, Clock, FileText, TrendingUp, Users, XCircle, AlertTriangle, Book } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

export default function Dashboard() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const today = new Date().toISOString().split("T")[0];
  const centerId = user?.center_id;
  const role = user?.role;

  const [gradeFilter, setGradeFilter] = useState<string>("all");
  const [selectedStudent, setSelectedStudent] = useState<any>(null);

  const { data: students = [] } = useQuery({
    queryKey: ["students", centerId],
    queryFn: async () => {
      let query = supabase.from("students").select("*").eq("is_active", true).order("name");
      if (role !== "admin" && centerId) query = query.eq("center_id", centerId);
      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
    enabled: !!user && !loading,
  });

  const grades = [...new Set(students.map((s) => s.grade))];

  const { data: allAttendance = [] } = useQuery({
    queryKey: ["attendance-today", centerId, today],
    queryFn: async () => {
      if (!centerId) return [];
      const { data, error } = await supabase.from("attendance").select("student_id, status, date").eq("center_id", centerId).eq("date", today);
      if (error) throw error;
      return data || [];
    },
    enabled: !!centerId,
  });

  const { data: recentTestResults = [] } = useQuery({
    queryKey: ["recent-test-results-dashboard", centerId],
    queryFn: async () => {
      if (!centerId) return [];
      const { data, error } = await supabase.from("test_results").select("*, students(name, grade), tests(name, total_marks, subject)").order("date_taken", { ascending: false }).limit(20);
      if (error) throw error;
      return data || [];
    },
    enabled: !!centerId,
  });

  const { data: homeworkDefaulters = [] } = useQuery({
    queryKey: ["homework-defaulters-dashboard", centerId],
    queryFn: async () => {
      if (!centerId) return [];
      const { data, error } = await supabase.from("student_homework_records").select("*, students(name, grade), homework(title, subject, due_date)").eq("status", "assigned").order("created_at", { ascending: false }).limit(15);
      if (error) throw error;
      return data || [];
    },
    enabled: !!centerId,
  });

  const { data: recentDiscipline = [] } = useQuery({
    queryKey: ["recent-discipline-dashboard", centerId],
    queryFn: async () => {
      if (!centerId) return [];
      const { data, error } = await supabase.from("discipline_issues").select("*, students(name, grade)").eq("center_id", centerId).eq("status", "open").order("issue_date", { ascending: false }).limit(10);
      if (error) throw error;
      return data || [];
    },
    enabled: !!centerId,
  });

  const { data: upcomingLessons = [] } = useQuery({
    queryKey: ["upcoming-lessons-dashboard", centerId],
    queryFn: async () => {
      if (!centerId) return [];
      const { data, error } = await supabase.from("lesson_plans").select("*").eq("center_id", centerId).gte("lesson_date", today).order("lesson_date").limit(8);
      if (error) throw error;
      return data || [];
    },
    enabled: !!centerId,
  });

  const totalStudents = students.length;
  const presentCount = allAttendance.filter(a => a.status === "present").length;
  const absentCount = allAttendance.filter(a => a.status === "absent").length;
  const unmarkedCount = totalStudents - presentCount - absentCount;
  const absentRate = totalStudents ? Math.round((absentCount / totalStudents) * 100) : 0;

  const absentToday = students.filter((s) => allAttendance.some((a) => a.student_id === s.id && a.status === "absent"));

  const lowPerformers = recentTestResults.filter((r: any) => {
    const total = r.tests?.total_marks || 100;
    return r.marks_obtained < total * 0.4;
  }).slice(0, 10);

  const topPerformers = [...recentTestResults].sort((a: any, b: any) => {
    const aP = (a.marks_obtained / (a.tests?.total_marks || 100)) * 100;
    const bP = (b.marks_obtained / (b.tests?.total_marks || 100)) * 100;
    return bP - aP;
  }).slice(0, 5);

  const studentId = selectedStudent?.id;
  const { data: attendanceData = [] } = useQuery({
    queryKey: ["student-attendance", studentId], queryFn: async () => { if (!studentId) return []; const { data } = await supabase.from("attendance").select("*").eq("student_id", studentId).order("date"); return data || []; }, enabled: !!studentId,
  });
  const { data: chapterProgress = [] } = useQuery({
    queryKey: ["student-chapters", studentId], queryFn: async () => { if (!studentId) return []; const { data } = await supabase.from("student_chapters").select("*, lesson_plans(*)").eq("student_id", studentId).order("completed_at", { ascending: false }); return data || []; }, enabled: !!studentId,
  });
  const { data: testResults = [] } = useQuery({
    queryKey: ["student-test-results", studentId], queryFn: async () => { if (!studentId) return []; const { data } = await supabase.from("test_results").select("*, tests(*)").eq("student_id", studentId).order("date_taken", { ascending: false }); return data || []; }, enabled: !!studentId,
  });

  const totalDays = attendanceData.length;
  const presentDays = attendanceData.filter((a) => a.status === "present").length;
  const attendancePercentage = totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 0;
  const completedChaptersCount = chapterProgress.filter((c) => c.completed).length;

  // Clickable card handler
  const handleCardClick = (path: string) => navigate(path);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Dashboard</h2>
        <p className="text-muted-foreground text-sm">Overview of today's attendance and center performance.</p>
      </div>

      <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
        {[
          { title: "Total Students", value: totalStudents, icon: Users, color: "text-primary", bg: "bg-primary/10", path: "/register" },
          { title: "Present Today", value: presentCount, icon: CheckCircle2, color: "text-green-600", bg: "bg-green-100 dark:bg-green-900/30", path: "/attendance-summary" },
          { title: "Absent Today", value: absentCount, icon: XCircle, color: "text-destructive", bg: "bg-destructive/10", path: "/attendance-summary" },
          { title: "Unmarked", value: unmarkedCount, icon: Clock, color: "text-orange-600", bg: "bg-orange-100 dark:bg-orange-900/30", path: "/attendance" },
        ].map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title} className="overflow-hidden cursor-pointer hover:shadow-md transition-shadow" onClick={() => handleCardClick(stat.path)}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{stat.title}</CardTitle>
                <div className={cn("rounded-lg p-2", stat.bg)}><Icon className={cn("h-4 w-4", stat.color)} /></div>
              </CardHeader>
              <CardContent><div className="text-2xl font-bold">{stat.value}</div></CardContent>
            </Card>
          );
        })}
      </div>

      <Select value={gradeFilter} onValueChange={setGradeFilter}>
        <SelectTrigger className="w-[140px]"><SelectValue placeholder="All Grades" /></SelectTrigger>
        <SelectContent><SelectItem value="all">All Grades</SelectItem>{grades.map((g) => <SelectItem key={g} value={g}>{g}</SelectItem>)}</SelectContent>
      </Select>

      <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => handleCardClick("/attendance-summary")}>
          <CardHeader className="pb-3"><CardTitle className="text-base">Absent Today</CardTitle></CardHeader>
          <CardContent className="max-h-[300px] overflow-y-auto">
            <Table><TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Grade</TableHead></TableRow></TableHeader>
              <TableBody>{absentToday.filter(s => gradeFilter === "all" || s.grade === gradeFilter).map((s) => (
                <TableRow key={s.id} className="cursor-pointer hover:bg-muted" onClick={(e) => { e.stopPropagation(); setSelectedStudent(s); }}><TableCell className="text-sm">{s.name}</TableCell><TableCell className="text-sm">{s.grade}</TableCell></TableRow>
              ))}</TableBody></Table>
          </CardContent>
        </Card>

        {/* Pending Homework - clicks to homework page */}
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => handleCardClick("/homework")}>
          <CardHeader className="pb-3"><CardTitle className="text-base flex items-center gap-2"><Book className="h-4 w-4 text-orange-600" /> Pending Homework ({homeworkDefaulters.length})</CardTitle></CardHeader>
          <CardContent className="max-h-[300px] overflow-y-auto">
            {homeworkDefaulters.length === 0 ? <p className="text-sm text-muted-foreground text-center py-4">All caught up!</p> : (
              <Table><TableHeader><TableRow><TableHead>Student</TableHead><TableHead>Homework</TableHead><TableHead>Due</TableHead></TableRow></TableHeader>
                <TableBody>{homeworkDefaulters.map((h: any) => (
                  <TableRow key={h.id}><TableCell className="text-sm">{h.students?.name}</TableCell><TableCell className="text-sm">{h.homework?.title}</TableCell><TableCell className="text-sm">{h.homework?.due_date ? format(new Date(h.homework.due_date), "MMM d") : "-"}</TableCell></TableRow>
                ))}</TableBody></Table>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => handleCardClick("/tests")}>
          <CardHeader className="pb-3"><CardTitle className="text-base flex items-center gap-2"><TrendingUp className="h-4 w-4 text-destructive" /> Low Performers</CardTitle></CardHeader>
          <CardContent className="max-h-[280px] overflow-y-auto">
            {lowPerformers.length === 0 ? <p className="text-sm text-muted-foreground text-center py-4">No low performers.</p> : (
              <Table><TableHeader><TableRow><TableHead>Student</TableHead><TableHead>Test</TableHead><TableHead className="text-right">Score</TableHead></TableRow></TableHeader>
                <TableBody>{lowPerformers.map((r: any) => (
                  <TableRow key={r.id}><TableCell className="text-sm">{r.students?.name}</TableCell><TableCell className="text-sm">{r.tests?.name}</TableCell><TableCell className="text-right text-sm font-medium text-destructive">{r.marks_obtained}/{r.tests?.total_marks}</TableCell></TableRow>
                ))}</TableBody></Table>
            )}
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => handleCardClick("/discipline")}>
          <CardHeader className="pb-3"><CardTitle className="text-base flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-destructive" /> Open Discipline Issues ({recentDiscipline.length})</CardTitle></CardHeader>
          <CardContent className="max-h-[280px] overflow-y-auto">
            {recentDiscipline.length === 0 ? <p className="text-sm text-muted-foreground text-center py-4">No open issues.</p> : (
              <Table><TableHeader><TableRow><TableHead>Student</TableHead><TableHead>Issue</TableHead><TableHead>Severity</TableHead></TableRow></TableHeader>
                <TableBody>{recentDiscipline.map((d: any) => (
                  <TableRow key={d.id}><TableCell className="text-sm">{d.students?.name}</TableCell><TableCell className="text-sm truncate max-w-[150px]">{d.description}</TableCell><TableCell><Badge variant={d.severity === 'high' ? 'destructive' : 'secondary'} className="text-[10px]">{d.severity}</Badge></TableCell></TableRow>
                ))}</TableBody></Table>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => handleCardClick("/lesson-plans")}>
        <CardHeader className="pb-3"><CardTitle className="text-base flex items-center gap-2"><BookOpen className="h-4 w-4 text-primary" /> Upcoming Lesson Plans</CardTitle></CardHeader>
        <CardContent>
          {upcomingLessons.length === 0 ? <p className="text-sm text-muted-foreground text-center py-4">No upcoming lessons.</p> : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
              {upcomingLessons.map((lp: any) => (
                <div key={lp.id} className="rounded-lg border p-3 space-y-1">
                  <div className="font-medium text-sm">{lp.subject}: {lp.chapter}</div>
                  <div className="text-xs text-muted-foreground">{lp.topic}</div>
                  <div className="text-xs text-primary font-medium flex items-center gap-1"><CalendarIcon className="h-3 w-3" />{lp.lesson_date && format(new Date(lp.lesson_date), "MMM d")}</div>
                  {lp.grade && <Badge variant="outline" className="text-[10px]">Grade {lp.grade}</Badge>}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {selectedStudent && (
        <Dialog open={!!selectedStudent} onOpenChange={() => setSelectedStudent(null)}>
          <DialogContent className="max-w-2xl w-full max-h-[85vh] overflow-auto">
            <DialogHeader><DialogTitle>{selectedStudent.name} - Grade {selectedStudent.grade}</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-base flex items-center gap-2"><CalendarIcon className="h-4 w-4" />Attendance</CardTitle></CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-3 mb-3">
                    <div><p className="text-xs text-muted-foreground">Present</p><p className="text-xl font-bold text-green-600">{presentDays}</p></div>
                    <div><p className="text-xs text-muted-foreground">Absent</p><p className="text-xl font-bold text-destructive">{totalDays - presentDays}</p></div>
                    <div><p className="text-xs text-muted-foreground">%</p><p className="text-xl font-bold">{attendancePercentage}%</p></div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-base flex items-center gap-2"><BookOpen className="h-4 w-4" />Chapters ({completedChaptersCount}/{chapterProgress.length})</CardTitle></CardHeader>
                <CardContent><div className="max-h-40 overflow-y-auto space-y-1">{chapterProgress.map((cp: any) => (
                  <div key={cp.id} className="flex items-center justify-between text-sm py-1 border-b last:border-0"><span>{cp.lesson_plans?.chapter} ({cp.lesson_plans?.subject})</span><Badge variant={cp.completed ? "default" : "secondary"} className="text-[10px]">{cp.completed ? "Done" : "In Progress"}</Badge></div>
                ))}</div></CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-base flex items-center gap-2"><FileText className="h-4 w-4" />Test Results</CardTitle></CardHeader>
                <CardContent><div className="max-h-40 overflow-y-auto space-y-1">{testResults.map((tr: any) => (
                  <div key={tr.id} className="flex items-center justify-between text-sm py-1 border-b last:border-0"><span>{tr.tests?.name} ({tr.tests?.subject})</span><span className="font-semibold">{tr.marks_obtained}/{tr.tests?.total_marks}</span></div>
                ))}</div></CardContent>
              </Card>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
