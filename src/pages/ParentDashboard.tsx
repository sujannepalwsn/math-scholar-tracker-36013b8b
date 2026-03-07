import React, { useState, useMemo, useEffect } from "react";
import {
  BookOpen,
  CalendarIcon,
  CheckCircle2,
  Clock,
  FileText,
  TrendingUp,
  Users,
  AlertTriangle,
  Book,
  Plus,
  Bell,
  Search,
  ChevronDown,
  Calendar,
  Home,
  MessageSquare,
  Video,
  Wallet,
  Zap,
  GraduationCap,
  LayoutDashboard,
  LogOut,
  ClipboardCheck
} from "lucide-react";
import { useQuery, QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { format, subDays, eachDayOfInterval, isToday, isFuture, startOfDay, isPast } from "date-fns";
import { cn } from "@/lib/utils";
import { KPICard } from "@/components/dashboard/KPICard";
import { AlertList } from "@/components/dashboard/AlertList";
import { ClassSchedule } from "@/components/dashboard/ClassSchedule";
import { QuickAction } from "@/components/dashboard/QuickAction";
import CenterLogo from "@/components/CenterLogo";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tables } from '@/integrations/supabase/types';
import ParentChapterPerformanceTable from '@/components/parent/ParentChapterPerformanceTable';
import ParentChapterDetailModal from '@/components/parent/ParentChapterDetailModal';

// Initialize QueryClient
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60,
      retry: 1,
    },
  },
});

type StudentHomeworkRecord = Tables<'student_homework_records'>;
type LessonPlan = Tables<'lesson_plans'>;
type StudentChapter = Tables<'student_chapters'>;
type Test = Tables<'tests'>;
type Homework = Tables<'homework'>;
type TestResult = Tables<'test_results'>;

interface ChapterPerformanceGroup {
  lessonPlan: LessonPlan;
  studentChapters: (StudentChapter & { recorded_by_teacher?: Tables<'teachers'> })[];
  testResults: (TestResult & { tests: Pick<Test, 'id' | 'name' | 'subject' | 'total_marks' | 'lesson_plan_id' | 'questions'> })[];
  homeworkRecords: (StudentHomeworkRecord & { homework: Pick<Homework, 'id' | 'title' | 'subject' | 'due_date'> })[];
}

const ParentDashboardContent = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const today = new Date().toISOString().split("T")[0];
  
  const [dateRange, setDateRange] = useState({
    from: subDays(new Date(), 30).toISOString().split("T")[0],
    to: today
  });

  const linkedStudents = user?.linked_students || [];
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(
    user?.student_id || linkedStudents[0]?.id || null
  );

  const [showChapterDetailModal, setShowChapterDetailModal] = useState(false);
  const [selectedChapterGroup, setSelectedChapterGroup] = useState<ChapterPerformanceGroup | null>(null);

  const handleViewChapterDetails = (chapterGroup: ChapterPerformanceGroup) => {
    setSelectedChapterGroup(chapterGroup);
    setShowChapterDetailModal(true);
  };

  useEffect(() => {
    if (!selectedStudentId && linkedStudents.length > 0) {
      setSelectedStudentId(linkedStudents[0].id);
    }
  }, [linkedStudents, selectedStudentId]);

  const activeStudentId = selectedStudentId || user?.student_id;

  const { data: student } = useQuery({
    queryKey: ['student', activeStudentId],
    queryFn: async () => {
      if (!activeStudentId) return null;
      const { data, error } = await supabase.from('students').select('*').eq('id', activeStudentId).single();
      if (error) throw error;
      return data;
    },
    enabled: !!activeStudentId,
  });

  const { data: attendance = [] } = useQuery({
    queryKey: ['attendance', activeStudentId],
    queryFn: async () => {
      if (!activeStudentId) return [];
      const { data, error } = await supabase.from('attendance').select('*').eq('student_id', activeStudentId).order('date', { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: !!activeStudentId,
  });

  const { data: testResults = [] } = useQuery({
    queryKey: ['test-results-parent-dashboard', activeStudentId],
    queryFn: async () => {
      if (!activeStudentId) return [];
      const { data, error } = await supabase.from('test_results').select('*, tests(*)').eq('student_id', activeStudentId).order('date_taken', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!activeStudentId,
  });

  const { data: homeworkStatus = [] } = useQuery({
    queryKey: ['student-homework-records', activeStudentId],
    queryFn: async () => {
      if (!activeStudentId) return [];
      const { data, error } = await supabase.from('student_homework_records').select('*, homework(*)').eq('student_id', activeStudentId).order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!activeStudentId,
  });

  const { data: invoices = [] } = useQuery({
    queryKey: ['student-invoices-dashboard', activeStudentId],
    queryFn: async () => {
      if (!activeStudentId) return [];
      const { data, error } = await supabase.from('invoices').select('*').eq('student_id', activeStudentId);
      if (error) throw error;
      return data || [];
    },
    enabled: !!activeStudentId,
  });

  const { data: lessonRecords = [] } = useQuery({
    queryKey: ['student-lesson-records', activeStudentId],
    queryFn: async () => {
      if (!activeStudentId) return [];
      const { data, error } = await supabase.from('student_chapters').select('*, lesson_plans(id, subject, chapter, topic, lesson_date, grade, notes, lesson_file_url)').eq('student_id', activeStudentId).order('completed_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!activeStudentId,
  });

  const attendanceTrend = useMemo(() => {
    const last7Days = eachDayOfInterval({ start: subDays(new Date(), 6), end: new Date() });
    return last7Days.map(day => {
      const dayStr = format(day, "yyyy-MM-dd");
      const record = attendance.find(a => a.date === dayStr);
      return { date: format(day, "MMM d"), value: record ? (record.status === "present" ? 100 : 0) : 0 };
    });
  }, [attendance]);

  const performanceTrend = useMemo(() => {
    return testResults.map(tr => ({
      date: format(new Date(tr.date_taken), "MMM d"),
      value: Math.round((tr.marks_obtained / (tr.tests?.total_marks || 100)) * 100)
    })).reverse().slice(-7);
  }, [testResults]);

  const pendingFees = useMemo(() => invoices.reduce((sum, inv) => sum + (inv.total_amount - (inv.paid_amount || 0)), 0), [invoices]);
  const attendanceRate = attendance.length > 0 ? Math.round((attendance.filter(a => a.status === 'present').length / attendance.length) * 100) : 0;
  const homeworkPendingCount = homeworkStatus.filter(hs => !['completed', 'checked'].includes(hs.status)).length;
  const avgPerformance = performanceTrend.length > 0 ? Math.round(performanceTrend.reduce((a, b) => a + b.value, 0) / performanceTrend.length) : 0;

  const parentAlerts = [
    ...homeworkStatus.filter(hs => hs.homework?.due_date && isPast(new Date(hs.homework.due_date)) && !['completed', 'checked'].includes(hs.status)).map(hs => ({
      id: `hw-${hs.id}`,
      title: `Overdue Homework: ${hs.homework?.title}`,
      type: "error" as const,
      timestamp: hs.homework?.due_date
    })),
    ...attendance.filter(a => a.status === 'absent').slice(0, 2).map(a => ({
      id: `att-${a.id}`,
      title: `Absence recorded for ${format(new Date(a.date), "MMM d")}`,
      type: "warning" as const,
      timestamp: a.date
    }))
  ].slice(0, 5);

  const chapterPerformanceData: ChapterPerformanceGroup[] = useMemo(() => {
    const dataMap = new Map<string, ChapterPerformanceGroup>();
    lessonRecords.forEach((sc: any) => {
      if (sc.lesson_plan_id && sc.lesson_plans && new Date(sc.completed_at) >= new Date(dateRange.from) && new Date(sc.completed_at) <= new Date(dateRange.to)) {
        if (!dataMap.has(sc.lesson_plan_id)) {
          dataMap.set(sc.lesson_plan_id, {
            lessonPlan: sc.lesson_plans,
            studentChapters: [],
            testResults: testResults.filter(tr => tr.tests?.lesson_plan_id === sc.lesson_plan_id),
            homeworkRecords: homeworkStatus.filter(hs => hs.homework?.lesson_plan_id === sc.lesson_plan_id)
          });
        }
        dataMap.get(sc.lesson_plan_id)?.studentChapters.push(sc);
      }
    });
    return Array.from(dataMap.values()).sort((a, b) => new Date(b.lessonPlan.lesson_date).getTime() - new Date(a.lessonPlan.lesson_date).getTime());
  }, [lessonRecords, dateRange, testResults, homeworkStatus]);

  if (!user || user.role !== 'parent') {
    navigate('/login-parent');
    return null;
  }

  return (
    <div className="min-h-screen bg-[#f8faff] p-4 md:p-8 space-y-8 pb-24 md:pb-8">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <CenterLogo size="lg" />
        <div className="flex items-center gap-4">
          {linkedStudents.length > 1 && (
            <Select value={selectedStudentId || ''} onValueChange={setSelectedStudentId}>
              <SelectTrigger className="w-48 bg-white border-none shadow-soft rounded-2xl font-bold h-11">
                <SelectValue placeholder="Select Child" />
              </SelectTrigger>
              <SelectContent className="rounded-2xl border-none shadow-strong">
                {linkedStudents.map((child) => (
                  <SelectItem key={child.id} value={child.id} className="font-bold py-3">{child.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          <Button variant="ghost" size="icon" className="relative bg-white shadow-soft rounded-xl">
            <Bell className="h-5 w-5 text-slate-600" />
            <span className="absolute top-2 right-2 h-2 w-2 bg-rose-500 rounded-full border-2 border-white" />
          </Button>
          <div className="flex items-center gap-3 bg-white p-1.5 pr-4 rounded-2xl shadow-soft">
            <div className="h-9 w-9 bg-indigo-100 rounded-xl flex items-center justify-center overflow-hidden">
               <Users className="h-5 w-5 text-indigo-600" />
            </div>
            <div>
              <p className="text-xs font-black text-slate-800 leading-none">{user?.username?.split('@')[0]}</p>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Parent</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-2 bg-white/60 backdrop-blur-md p-1.5 rounded-xl shadow-sm border border-white/40">
          <div className="p-2 bg-indigo-500 text-white rounded-lg">
            <GraduationCap className="h-4 w-4" />
          </div>
          <Badge variant="ghost" className="text-xs font-black text-indigo-600 tracking-tight uppercase">{student?.name || "Learning Odyssey"}</Badge>
          <div className="flex items-center gap-2 px-3 border-l border-slate-200 ml-2">
             <Calendar className="h-4 w-4 text-slate-400" />
             <span className="text-xs font-bold text-slate-600">{format(new Date(), "eee, MMM d")}</span>
          </div>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard title="Attendance Rate" value={`${attendanceRate}%`} description="Presence Index" icon={Clock} color="green" trendData={attendanceTrend} onClick={() => navigate("/parent/attendance")} />
        <KPICard title="Avg Performance" value={`${avgPerformance}%`} description="Evaluation Synthesis" icon={TrendingUp} color="purple" trendData={performanceTrend} onClick={() => navigate("/parent/student-report")} />
        <KPICard title="Homework Pending" value={homeworkPendingCount} description="Active Assignments" icon={Book} color="orange" onClick={() => navigate("/parent/homework")} />
        <KPICard title="Fees Payable" value={`₹${pendingFees}`} description="Outstanding Liability" icon={Wallet} color="rose" onClick={() => navigate("/parent/finance")} />
      </div>

      {/* Middle Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Card className="lg:col-span-2 border-none shadow-soft bg-white/60 backdrop-blur-md rounded-2xl border border-white/20">
            <CardHeader className="bg-primary/5 border-b border-slate-100 p-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <CardTitle className="text-lg font-black flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-primary/10"><BookOpen className="h-6 w-6 text-primary" /></div>
                  Academic Progress Matrix
                </CardTitle>
                <div className="flex items-center gap-2 bg-white/60 p-1 rounded-xl border border-white/40 shadow-soft">
                   <Input type="date" value={dateRange.from} onChange={e => setDateRange({...dateRange, from: e.target.value})} className="h-8 w-32 border-none bg-transparent text-[10px] font-black uppercase" />
                   <span className="text-[10px] font-black text-slate-300">TO</span>
                   <Input type="date" value={dateRange.to} onChange={e => setDateRange({...dateRange, to: e.target.value})} className="h-8 w-32 border-none bg-transparent text-[10px] font-black uppercase" />
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <ParentChapterPerformanceTable chapterPerformanceData={chapterPerformanceData} onViewDetails={handleViewChapterDetails} />
            </CardContent>
          </Card>
        <AlertList alerts={parentAlerts} />
      </div>

      {/* Bottom Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
         <QuickAction label="View Performance" icon={TrendingUp} onClick={() => navigate("/parent/student-report")} />
         <QuickAction label="Homework Hub" icon={Book} onClick={() => navigate("/parent/homework")} />
         <QuickAction label="Fee Payments" icon={Wallet} onClick={() => navigate("/parent/finance")} />
         <QuickAction label="Messages" icon={MessageSquare} onClick={() => navigate("/parent-messages")} />
      </div>

      <ParentChapterDetailModal open={showChapterDetailModal} onOpenChange={setShowChapterDetailModal} chapterGroup={selectedChapterGroup} />
    </div>
  );
};

const ParentDashboard = () => (
  <QueryClientProvider client={queryClient}>
    <ParentDashboardContent />
  </QueryClientProvider>
);

export default ParentDashboard;
