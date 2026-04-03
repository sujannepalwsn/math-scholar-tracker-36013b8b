import { logger } from "@/utils/logger";
import React, { useEffect, useMemo, useState } from "react";
import { UserRole } from "@/types/roles";
import {
  Brain, Activity, ListChecks, Sparkles, Trophy, Star, BookMarked,
  TrendingUp, TrendingDown, Clock, Wallet, CalendarIcon, Book,
  GraduationCap, Search, Calendar, Eye, MessageSquare, ChevronRight,
  Info, AlertTriangle, ClipboardCheck, BarChart3, Bus
} from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { supabase } from "@/integrations/supabase/client"
import { useAuth } from "@/contexts/AuthContext"
import { useNavigate } from "react-router-dom"
import { eachDayOfInterval, format, isPast, subDays } from "date-fns"
import { cn, formatCurrency, safeFormatDate } from "@/lib/utils"
import { KPICard } from "@/components/dashboard/KPICard"
import { AlertList } from "@/components/dashboard/AlertList"
import { ClassSchedule } from "@/components/dashboard/ClassSchedule"
import { AIInsightsWidget } from "@/components/dashboard/AIInsightsWidget"
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import DigitalNoticeBoard from "@/components/center/NoticeBoard";
import SuggestionForm from "@/components/center/SuggestionForm";
import { CommandCenter } from "@/components/dashboard/CommandCenter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Tables } from "@/integrations/supabase/types"

// New Analytics Components
import { PerformanceTrendsChart } from "@/components/parent/PerformanceTrendsChart";
import { EffortOutcomeMatrix } from "@/components/parent/EffortOutcomeMatrix";
import { ActionPlanSection } from "@/components/parent/ActionPlanSection";
import { CelebrationsGrowth } from "@/components/parent/CelebrationsGrowth";
import { HomeworkHealth } from "@/components/parent/HomeworkHealth";

export default function ParentDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const today = new Date().toISOString().split("T")[0];
  
  const [dateRange, setDateRange] = useState({
    from: subDays(new Date(), 30).toISOString().split("T")[0],
    to: today
  });

  const linkedStudents = Array.isArray(user?.linked_students) ? user.linked_students : [];
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(
    user?.student_id || (linkedStudents.length > 0 ? linkedStudents[0].id : null)
  );

  const [selectedChapterDetail, setSelectedChapterDetail] = useState<any>(null);
  const [selectedDisciplineIssue, setSelectedDisciplineIssue] = useState<any>(null);

  useEffect(() => {
    if (!selectedStudentId && linkedStudents.length > 0) {
      setSelectedStudentId(linkedStudents[0].id);
    }
  }, [linkedStudents, selectedStudentId]);

  const activeStudentId = selectedStudentId || user?.student_id;

  // Real data fetching
  const { data: student } = useQuery({
    queryKey: ['student', activeStudentId],
    queryFn: async () => {
      if (!activeStudentId) return null;
      const { data, error } = await supabase.from('students').select('*').eq('id', activeStudentId).single();
      if (error) throw error;
      return data;
    },
    enabled: !!activeStudentId
  });

  // Mocked/Derived data for new Decision Intelligence System
  // In a real scenario, these would come from the new tables or RPCs
  const performanceTrends = useMemo(() => [
    { date: "Oct 01", score: 85, maxScore: 100, percentage: 85, trendStatus: "Improving", riskLevel: "Low" },
    { date: "Oct 10", score: 78, maxScore: 100, percentage: 78, trendStatus: "Declining", riskLevel: "Medium" },
    { date: "Oct 20", score: 82, maxScore: 100, percentage: 82, trendStatus: "Improving", riskLevel: "Low" },
    { date: "Oct 30", score: 65, maxScore: 100, percentage: 65, trendStatus: "Declining", riskLevel: "High" },
  ], []);

  const effortOutcomeData = useMemo(() => [
    { id: activeStudentId || '1', studentName: student?.name || 'Child', effort: 75, outcome: 65 },
    { id: '2', studentName: 'Peer A', effort: 85, outcome: 90 },
    { id: '3', studentName: 'Peer B', effort: 45, outcome: 30 },
  ], [activeStudentId, student]);

  useEffect(() => {
    const handleDiscuss = (e: any) => {
      const { quadrant } = e.detail;
      navigate('/parent-messages', {
        state: {
          attachedContext: {
            title: `Effort vs Outcome: ${quadrant.label}`,
            type: 'matrix',
            data: quadrant
          }
        }
      });
    };

    window.addEventListener('open-discuss-teacher', handleDiscuss);
    return () => window.removeEventListener('open-discuss-teacher', handleDiscuss);
  }, [navigate]);

  const actions = useMemo(() => [
    { id: '1', title: 'Schedule Math Review', description: 'Performance in Algebra has dropped by 15%. Focus on quadratic equations this weekend.', urgency: 'High' as const, actionType: 'Pedagogical' },
    { id: '2', title: 'Celebrate Consistent Effort', description: '3-week streak in homework completion. Great time for positive reinforcement.', urgency: 'Low' as const, actionType: 'Emotional' },
  ], []);

  const milestones = useMemo(() => [
    { id: '1', type: 'streak' as const, title: 'Unstoppable Momentum', description: '21-day homework streak achieved!', date: 'Oct 28', metadata: { days: 21 } },
    { id: '2', type: 'improvement' as const, title: 'Calculus Breakthrough', description: 'Improved from 60% to 85% in advanced calculus.', date: 'Oct 15' },
  ], []);

  const homeworkRecords = useMemo(() => [
    { id: '1', title: 'Algebra Practice', subject: 'Math', dueDate: 'Oct 30', status: 'completed' as const, score: 7, maxScore: 10 },
    { id: '2', title: 'Physics Lab Report', subject: 'Science', dueDate: 'Oct 28', status: 'completed' as const, score: 6, maxScore: 10 },
    { id: '3', title: 'World History Quiz', subject: 'History', dueDate: 'Oct 25', status: 'completed' as const, score: 9, maxScore: 10 },
  ], []);

  // Standard dashboard data
  const { data: attendance = [] } = useQuery({
    queryKey: ['attendance', activeStudentId, dateRange.from, dateRange.to],
    queryFn: async () => {
      if (!activeStudentId) return [];
      const { data, error } = await supabase.from('attendance').select('*').eq('student_id', activeStudentId).gte('date', dateRange.from).lte('date', dateRange.to).order('date', { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: !!activeStudentId
  });

  const { data: invoices = [] } = useQuery({
    queryKey: ['student-invoices-dashboard', activeStudentId],
    queryFn: async () => {
      if (!activeStudentId) return [];
      const { data, error } = await supabase.from('invoices').select('*').eq('student_id', activeStudentId);
      if (error) throw error;
      return data || [];
    },
    enabled: !!activeStudentId
  });

  const attendanceRate = attendance.length > 0 ? Math.round((attendance.filter(a => a.status === 'present').length / attendance.length) * 100) : 0;
  const totalInvoiced = invoices.reduce((acc, inv) => acc + (inv?.total_amount || 0), 0);
  const totalPaid = invoices.reduce((acc, inv) => acc + (inv?.paid_amount || 0), 0);
  const outstandingDues = totalInvoiced - totalPaid;

  if (!user || user.role !== UserRole.PARENT) {
    navigate('/login-parent');
    return null;
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8 space-y-8 pb-24 md:pb-8 page-enter animate-in fade-in duration-1000">
      <DashboardHeader />
      <CommandCenter />

      {/* Hero Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="flex items-center gap-4">
          <div className="p-3.5 rounded-[1.75rem] bg-primary/10 border-2 border-primary/20 shadow-inner">
            <GraduationCap className="h-10 w-10 text-primary" />
          </div>
          <div>
            <h1 className="text-4xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-primary via-indigo-600 to-violet-600">
              Decision Intelligence
            </h1>
            <div className="flex items-center gap-2 mt-1">
               <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
               <p className="text-muted-foreground text-sm font-bold uppercase tracking-widest">Parent Dashboard · {student?.name || "Active Scholar"}</p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-4 items-center">
          <Button
            onClick={() => navigate('/parent-snapshot')}
            className="rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-black uppercase text-[10px] tracking-widest h-12 px-6 shadow-strong transition-all hover:scale-105"
          >
            <Sparkles className="mr-2 h-4 w-4" />
            Daily Snapshot
          </Button>

          {linkedStudents.length > 1 && (
            <Select value={selectedStudentId || ''} onValueChange={setSelectedStudentId}>
              <SelectTrigger className="w-56 bg-card/60 backdrop-blur-md border border-border/40 shadow-soft rounded-[1.25rem] font-black uppercase text-[10px] tracking-widest h-12 px-6">
                <SelectValue placeholder="Select Scholar" />
              </SelectTrigger>
              <SelectContent className="rounded-2xl border-none shadow-strong backdrop-blur-xl bg-card/90">
                {linkedStudents.map((child) => (
                  <SelectItem key={child.id} value={child.id} className="font-black uppercase text-[10px] tracking-widest py-3">{child.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <KPICard title="Attendance Rate" value={`${attendanceRate}%`} description="Presence Index" icon={Clock} color="green" />
        <KPICard title="Avg Performance" value={`82%`} description="Evaluation Synthesis" icon={TrendingUp} color="purple" />
        <KPICard title="Effort Score" value={`75/100`} description="Behavioral Engagement" icon={Activity} color="orange" />
        <KPICard title="Fees Payable" value={formatCurrency(outstandingDues)} description="Outstanding Liability" icon={Wallet} color="rose" />
      </div>

      {/* Intelligence Row 1: Trends and Matrix */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <PerformanceTrendsChart data={performanceTrends} subject="Mathematics" />
        </div>
        <div className="lg:col-span-1">
          <EffortOutcomeMatrix data={effortOutcomeData} activeStudentId={activeStudentId || undefined} />
        </div>
      </div>

      {/* Intelligence Row 2: Action Plan and Homework Health */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <ActionPlanSection actions={actions} />
        </div>
        <div className="lg:col-span-1">
          <HomeworkHealth records={homeworkRecords} />
        </div>
      </div>

      {/* Intelligence Row 3: Celebrations and AI Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1">
           <CelebrationsGrowth milestones={milestones} />
        </div>
        <div className="lg:col-span-2">
           <AIInsightsWidget
             insights={[
               { id: '1', type: 'risk', level: 'High', title: 'Performance Dip in Algebra', description: 'Recent scores show a 15% decline from baseline.', factors: { 'Attendance': '95%', 'Quiz Avg': '65%' } },
               { id: '2', type: 'sentiment', level: 'Low', title: 'Positive Motivation Streak', description: 'Scholar demonstrates high engagement during late evening study sessions.' }
             ]}
             title="Predictive Performance Alerts"
           />
        </div>
      </div>

      {/* Notice Board & Feedback */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <DigitalNoticeBoard centerId={user?.center_id || ""} role="parent" grade={student?.grade || undefined} />
        <div className="space-y-6">
          <div className="p-8 rounded-[2rem] bg-indigo-600 shadow-indigo-200 shadow-2xl text-white relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform">
              <MessageSquare className="h-24 w-24" />
            </div>
            <div className="relative z-10 space-y-4">
              <h2 className="text-2xl font-black">Two-Way Collaboration Hub</h2>
              <p className="text-indigo-100 font-medium">Connect directly with subject teachers to discuss specific performance insights or behavior patterns.</p>
              <Button
                onClick={() => navigate('/parent-messages')}
                className="bg-white text-indigo-600 hover:bg-white/90 rounded-xl font-black uppercase text-[10px] tracking-widest px-8"
              >
                Open Messaging <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
          <SuggestionForm role="parent" />
        </div>
      </div>

      {/* Footer Navigation */}
      <div className="flex justify-center pt-8 border-t border-slate-100">
        <Button
          variant="outline"
          className="rounded-2xl border-2 font-black uppercase tracking-widest text-[10px] h-12 px-8 shadow-soft bg-white hover:bg-slate-50"
          onClick={() => navigate("/parent-student-report")}
        >
          <BarChart3 className="mr-2 h-4 w-4 text-primary" />
          Full Academic Dossier & Historical Reports
        </Button>
      </div>
    </div>
  );
}
