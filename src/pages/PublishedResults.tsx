import React, { useMemo, useState } from "react";
import { Download, Eye, GraduationCap, Printer, Search, BarChart3 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { PageHeader } from "@/components/ui/page-header";
import { cn, safeFormatDate, getGradeFormal } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";

export default function PublishedResults() {
  const { user } = useAuth();
  const centerId = user?.center_id;

  const [selectedExamId, setSelectedExamId] = useState<string>("");
  const [gradeFilter, setGradeFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStudentResult, setSelectedStudentResult] = useState<any>(null);

  // Fetch Published Exams
  const { data: exams = [] } = useQuery({
    queryKey: ["published-exams", centerId, user?.role, user?.teacher_id],
    queryFn: async () => {
      if (!centerId) return [];
      let query = supabase.from("exams")
        .select("*")
        .eq("center_id", centerId)
        .eq("status", "published")
        .order("created_at", { ascending: false });

      if (user?.role === 'teacher' && user?.teacher_id) {
        const { data: assignments } = await supabase.from('class_teacher_assignments').select('grade').eq('teacher_id', user.teacher_id);
        const assignedGrades = assignments?.map(a => a.grade) || [];

        // Also check subjects assigned to the teacher to widen visibility
        const { data: subjectAssignments } = await supabase.from('period_schedules').select('grade').eq('teacher_id', user.teacher_id);
        const subjectGrades = subjectAssignments?.map(a => a.grade) || [];

        const allTeacherGrades = Array.from(new Set([...assignedGrades, ...subjectGrades]));

        if (allTeacherGrades.length > 0) {
          query = query.in('grade', allTeacherGrades);
        } else {
          // If no specific grade assignments, show all for center admin-like experience if center_id matches
          // But usually we should restrict. For now let's keep it restricted to assigned grades.
          return [];
        }
      }

      if (user?.role === 'parent' && user?.linked_students) {
        const parentGrades = Array.from(new Set(user.linked_students.map((s: any) => s.grade).filter(Boolean)));
        query = query.in('grade', parentGrades);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    enabled: !!centerId
  });

  const selectedExam = exams.find((e: any) => e.id === selectedExamId);

  // Fetch Exam Subjects
  const { data: subjects = [] } = useQuery({
    queryKey: ["exam-subjects", selectedExamId],
    queryFn: async () => {
      if (!selectedExamId) return [];
      const { data, error } = await supabase.from("exam_subjects").select("*").eq("exam_id", selectedExamId).order("subject_name");
      if (error) throw error;
      return data;
    },
    enabled: !!selectedExamId
  });

  // Fetch Students
  const { data: students = [] } = useQuery({
    queryKey: ["students-for-results", centerId, selectedExam?.grade, user?.role, user?.id],
    queryFn: async () => {
      if (!centerId) return [];
      let query = supabase.from("students").select("*").eq("center_id", centerId).eq("is_active", true);

      if (selectedExam?.grade) {
        query = query.eq("grade", selectedExam.grade);
      } else {
        // If no exam selected, and user is teacher, filter students by teacher's assigned grades
        if (user?.role === 'teacher' && user?.teacher_id) {
           const { data: assignments } = await supabase.from('class_teacher_assignments').select('grade').eq('teacher_id', user.teacher_id);
           const assignedGrades = assignments?.map(a => a.grade) || [];
           const { data: subjectAssignments } = await supabase.from('period_schedules').select('grade').eq('teacher_id', user.teacher_id);
           const subjectGrades = subjectAssignments?.map(a => a.grade) || [];
           const allGrades = Array.from(new Set([...assignedGrades, ...subjectGrades]));
           if (allGrades.length > 0) {
             query = query.in('grade', allGrades);
           }
        }
      }

      if (user?.role === 'parent' && user?.linked_students) {
        query = query.in('id', user.linked_students.map((s: any) => s.id));
      }

      const { data, error } = await query.order("name");
      if (error) throw error;
      return data;
    },
    enabled: !!centerId
  });

  // Fetch Marks
  const { data: marks = [] } = useQuery({
    queryKey: ["exam-marks", selectedExamId],
    queryFn: async () => {
      if (!selectedExamId) return [];
      const { data, error } = await supabase.from("exam_marks").select("*").eq("exam_id", selectedExamId);
      if (error) throw error;
      return data;
    },
    enabled: !!selectedExamId
  });

  const studentResults = useMemo(() => {
    if (!selectedExamId || subjects.length === 0) return [];

    return students
      .filter(s => gradeFilter === "all" || s.grade === gradeFilter)
      .filter(s =>
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (s.roll_number || "").toLowerCase().includes(searchQuery.toLowerCase())
      )
      .map(student => {
        const studentMarks = marks.filter(m => m.student_id === student.id);
        let totalObtained = 0;
        let totalFull = 0;
        let allPassed = true;
        let hasAnyMarks = studentMarks.length > 0;

        subjects.forEach(subj => {
          const mark = studentMarks.find(m => m.exam_subject_id === subj.id);
          if (mark) {
            totalObtained += (mark.marks_obtained || 0);
            totalFull += subj.full_marks;
            if ((mark.marks_obtained || 0) < subj.pass_marks) allPassed = false;
          } else {
            allPassed = false;
          }
        });

        // Fail if missing subjects
        if (studentMarks.length < subjects.length) allPassed = false;

        const percentage = totalFull > 0 ? (totalObtained / totalFull) * 100 : 0;

        return {
          student,
          totalObtained,
          totalFull,
          percentage,
          allPassed,
          hasAnyMarks,
          marks: studentMarks
        };
      })
      .filter(r => user?.role !== 'parent' || r.hasAnyMarks); // Only show students with marks for parents
  }, [students, marks, subjects, selectedExamId, gradeFilter, searchQuery, user?.role]);

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    const content = document.getElementById('marksheet-content');
    if (printWindow && content) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Marksheet - ${selectedStudentResult?.student.name}</title>
            <style>
              body { font-family: sans-serif; padding: 40px; }
              table { width: 100%; border-collapse: collapse; margin-top: 20px; }
              th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
              th { background-color: #f5f5f5; }
              .text-center { text-align: center; }
              .font-bold { font-weight: bold; }
              .header { text-align: center; margin-bottom: 30px; }
              .student-info { display: grid; grid-template-cols: 1fr 1fr; gap: 20px; margin-bottom: 20px; }
              .summary { display: grid; grid-template-cols: repeat(4, 1fr); gap: 15px; margin-top: 20px; text-align: center; }
              .summary-item { padding: 10px; background: #f9f9f9; border: 1px solid #eee; border-radius: 8px; }
              .footer { margin-top: 60px; display: flex; justify-content: space-between; }
              .sig-line { border-top: 1px solid #000; width: 150px; text-align: center; padding-top: 5px; }
            </style>
          </head>
          <body>
            ${content.innerHTML}
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 500);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Published Results"
        description="View and manage formal examination outcomes"
      />

      <Card className="border-none shadow-soft bg-card/60 backdrop-blur-md">
        <CardContent className="p-6">
          <div className="flex flex-wrap gap-4 items-end">
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Select Exam</label>
              <Select value={selectedExamId} onValueChange={setSelectedExamId}>
                <SelectTrigger className="w-[250px] bg-white/50">
                  <SelectValue placeholder="Select a published exam" />
                </SelectTrigger>
                <SelectContent>
                  {exams.map((e: any) => (
                    <SelectItem key={e.id} value={e.id}>{e.name} - Grade {e.grade}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {user?.role !== 'parent' && (
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Grade</label>
                <Select value={gradeFilter} onValueChange={setGradeFilter}>
                  <SelectTrigger className="w-[150px] bg-white/50">
                    <SelectValue placeholder="All Grades" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Grades</SelectItem>
                    {Array.from(new Set(students.map(s => s.grade))).map(g => (
                      <SelectItem key={g} value={g}>Grade {g}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="flex-1 min-w-[200px] space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Search Student</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Name or Roll Number..."
                  className="pl-9 bg-white/50"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {selectedExamId ? (
        <Card className="border-none shadow-strong overflow-hidden">
          <CardHeader className="bg-primary/5 border-b">
            <CardTitle className="text-lg flex items-center gap-2">
              <GraduationCap className="h-5 w-5 text-primary" />
              Student List: {selectedExam?.name}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {studentResults.length === 0 ? (
              <div className="p-12 text-center text-muted-foreground italic">No results found for the current filters.</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30">
                    <TableHead>Student Name</TableHead>
                    <TableHead>Roll Number</TableHead>
                    <TableHead className="text-center">Total Marks</TableHead>
                    <TableHead className="text-center">Percentage</TableHead>
                    <TableHead className="text-center">Grade</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                    <TableHead className="text-right px-6">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {studentResults.map((result) => (
                    <TableRow key={result.student.id} className="hover:bg-muted/20 transition-colors">
                      <TableCell className="font-medium">{result.student.name}</TableCell>
                      <TableCell>{result.student.roll_number || "-"}</TableCell>
                      <TableCell className="text-center">
                        {result.hasAnyMarks ? `${result.totalObtained}/${result.totalFull}` : "-"}
                      </TableCell>
                      <TableCell className="text-center">
                        {result.hasAnyMarks ? `${result.percentage.toFixed(1)}%` : "-"}
                      </TableCell>
                      <TableCell className="text-center">
                        {result.hasAnyMarks ? (
                          <Badge variant="outline" className="font-bold">{getGradeFormal(result.percentage)}</Badge>
                        ) : "-"}
                      </TableCell>
                      <TableCell className="text-center">
                        {result.hasAnyMarks ? (
                          <Badge variant={result.allPassed ? "success" : "destructive"} className="font-black uppercase text-[10px]">
                            {result.allPassed ? "Pass" : "Fail"}
                          </Badge>
                        ) : (
                          <span className="text-[10px] text-muted-foreground italic">Pending</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right px-6">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-primary hover:text-primary/80 hover:bg-primary/10 rounded-full"
                          disabled={!result.hasAnyMarks}
                          onClick={() => setSelectedStudentResult(result)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="p-20 text-center flex flex-col items-center gap-4 bg-muted/20 rounded-3xl border-2 border-dashed">
          <GraduationCap className="h-12 w-12 text-muted-foreground/40" />
          <p className="text-muted-foreground font-medium">Please select an exam to view published results.</p>
        </div>
      )}

      {/* Marksheet Modal */}
      <Dialog open={!!selectedStudentResult} onOpenChange={() => setSelectedStudentResult(null)}>
        <DialogContent className="max-w-3xl max-h-[95vh] overflow-y-auto rounded-3xl">
          <DialogHeader className="no-print">
            <DialogTitle>Student Marksheet</DialogTitle>
            <DialogDescription>Formal academic record for {selectedExam?.name}</DialogDescription>
          </DialogHeader>

          {selectedStudentResult && (
            <div id="marksheet-content" className="space-y-6">
              <div className="text-center space-y-2 border-b pb-6">
                <h1 className="text-2xl font-black text-primary tracking-tight">OFFICIAL MARKSHEET</h1>
                <h2 className="text-lg font-bold text-foreground/80 uppercase">{selectedExam?.name}</h2>
                <p className="text-sm font-medium text-muted-foreground">Academic Year: {selectedExam?.academic_year}</p>
              </div>

              <div className="grid grid-cols-2 gap-6 bg-muted/30 p-6 rounded-2xl border">
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Student Name</p>
                  <p className="text-lg font-bold">{selectedStudentResult.student.name}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Roll Number</p>
                  <p className="text-lg font-bold">{selectedStudentResult.student.roll_number || "-"}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Grade / Class</p>
                  <p className="text-lg font-bold">Grade {selectedStudentResult.student.grade}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Exam Date</p>
                  <p className="text-lg font-bold">{selectedExam?.exam_date ? safeFormatDate(selectedExam.exam_date, "PPP") : "-"}</p>
                </div>
              </div>

              <div className="rounded-2xl border overflow-hidden">
                <Table>
                  <TableHeader className="bg-muted/50">
                    <TableRow>
                      <TableHead className="font-bold py-4">Subject Name</TableHead>
                      <TableHead className="text-center font-bold">Full Marks</TableHead>
                      <TableHead className="text-center font-bold">Pass Marks</TableHead>
                      <TableHead className="text-center font-bold">Obtained</TableHead>
                      <TableHead className="text-center font-bold">Result</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {subjects.map((subj) => {
                      const mark = selectedStudentResult.marks.find((m: any) => m.exam_subject_id === subj.id);
                      const obtained = mark?.marks_obtained ?? "-";
                      const passed = mark ? mark.marks_obtained >= subj.pass_marks : false;
                      return (
                        <TableRow key={subj.id} className="h-12">
                          <TableCell className="font-semibold">{subj.subject_name}</TableCell>
                          <TableCell className="text-center font-medium">{subj.full_marks}</TableCell>
                          <TableCell className="text-center font-medium">{subj.pass_marks}</TableCell>
                          <TableCell className="text-center font-black text-primary">{obtained}</TableCell>
                          <TableCell className="text-center">
                            {mark ? (
                              <Badge variant={passed ? "success" : "destructive"} className="font-black uppercase text-[9px]">
                                {passed ? "Pass" : "Fail"}
                              </Badge>
                            ) : (
                              <span className="text-xs text-muted-foreground">-</span>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4">
                <div className="p-4 rounded-2xl bg-muted/20 border text-center space-y-1">
                  <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Grand Total</p>
                  <p className="text-xl font-black">{selectedStudentResult.totalObtained}/{selectedStudentResult.totalFull}</p>
                </div>
                <div className="p-4 rounded-2xl bg-muted/20 border text-center space-y-1">
                  <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Percentage</p>
                  <p className="text-xl font-black">{selectedStudentResult.percentage.toFixed(1)}%</p>
                </div>
                <div className="p-4 rounded-2xl bg-muted/20 border text-center space-y-1">
                  <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Grade</p>
                  <p className="text-xl font-black">{getGradeFormal(selectedStudentResult.percentage)}</p>
                </div>
                <div className={cn(
                  "p-4 rounded-2xl border text-center space-y-1",
                  selectedStudentResult.allPassed ? "bg-green-500/10 border-green-500/20" : "bg-red-500/10 border-red-500/20"
                )}>
                  <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Final Status</p>
                  <p className={cn("text-xl font-black", selectedStudentResult.allPassed ? "text-green-600" : "text-red-600")}>
                    {selectedStudentResult.allPassed ? "PASSED" : "FAILED"}
                  </p>
                </div>
              </div>

              <div className="flex justify-between mt-16 px-4 pb-8">
                <div className="text-center space-y-1">
                  <div className="w-32 border-t-2 border-foreground/30 pt-1" />
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Class Teacher</p>
                </div>
                <div className="text-center space-y-1">
                  <div className="w-32 border-t-2 border-foreground/30 pt-1" />
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Principal</p>
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-6 border-t no-print">
            <Button variant="outline" size="sm" className="rounded-xl h-10 px-6" onClick={handlePrint}>
              <Printer className="h-4 w-4 mr-2" /> Print
            </Button>
            <Button variant="outline" size="sm" className="rounded-xl h-10 px-6" onClick={handlePrint}>
              <Download className="h-4 w-4 mr-2" /> Download
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
