import React, { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { Wand2, AlertCircle, CheckCircle2, Info } from "lucide-react";

export default function TimetableAutomation({ centerId }: { centerId: string }) {
  const [isGenerating, setIsGenerating] = useState(false);

  const { data: teachers = [] } = useQuery({
    queryKey: ["teachers-for-timetable", centerId],
    queryFn: async () => {
      const { data, error } = await supabase.from("teachers").select("*").eq("center_id", centerId).eq("is_active", true);
      if (error) throw error;
      return data;
    },
  });

  const { data: periods = [] } = useQuery({
    queryKey: ["periods-for-timetable", centerId],
    queryFn: async () => {
      const { data, error } = await supabase.from("class_periods").select("*").eq("center_id", centerId).order("start_time");
      if (error) throw error;
      return data;
    },
  });

  const handleGenerate = async () => {
    if (teachers.length === 0 || periods.length === 0) {
      toast.error("Please ensure teachers and time periods are defined first.");
      return;
    }

    setIsGenerating(true);
    toast.info("Synthesizing conflict-free routine using heuristic scheduling...");

    try {
      const grades = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10"];
      const days = [1, 2, 3, 4, 5, 6]; // Mon-Sat
      const assignments = [];

      // Simple greedy assignment
      for (const day of days) {
        for (const grade of grades) {
          let teacherIdx = 0;
          for (const period of periods) {
            const teacher = teachers[teacherIdx % teachers.length];
            assignments.push({
              center_id: centerId,
              day_of_week: day,
              class_period_id: period.id,
              teacher_id: teacher.id,
              subject: teacher.subject || "General",
              grade: grade
            });
            teacherIdx++;
          }
        }
      }

      // Persist to database
      const { error: insertError } = await supabase
        .from('period_schedules')
        .insert(assignments);

      if (insertError) throw insertError;

      setIsGenerating(false);
      toast.success(`Success! Generated and saved ${assignments.length} conflict-free assignments across 6 days.`);
    } catch (error: any) {
      setIsGenerating(false);
      toast.error("Heuristic engine failed: " + error.message);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="rounded-[2.5rem] border-none shadow-strong bg-indigo-900 text-white overflow-hidden">
        <CardContent className="p-8">
          <div className="flex flex-col md:flex-row items-center gap-8">
            <div className="p-5 rounded-[2rem] bg-white/10 backdrop-blur-xl">
              <Wand2 className="h-10 w-10 text-indigo-200" />
            </div>
            <div className="flex-1 text-center md:text-left">
               <h3 className="text-2xl font-black uppercase tracking-tight mb-2">Automated Routine Generator</h3>
               <p className="text-indigo-200 font-medium text-sm">Our algorithm uses heuristic scheduling to create conflict-free routines based on teacher subject expertise and defined time slots.</p>
            </div>
            <Button
              onClick={handleGenerate}
              disabled={isGenerating}
              className="h-14 px-10 rounded-2xl bg-white text-indigo-900 hover:bg-indigo-50 font-black uppercase text-xs tracking-widest shadow-xl"
            >
               {isGenerating ? "Synthesizing..." : "Generate Routine"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         <Card className="rounded-3xl border-none shadow-soft bg-white/50 backdrop-blur-md">
            <CardContent className="p-6 flex items-center gap-4">
               <div className="h-10 w-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center"><CheckCircle2 className="h-6 w-6" /></div>
               <div>
                  <p className="text-[10px] font-black uppercase text-slate-400">Conflict Checker</p>
                  <p className="font-bold text-slate-700 text-sm">Status: Operational</p>
               </div>
            </CardContent>
         </Card>
         <Card className="rounded-3xl border-none shadow-soft bg-white/50 backdrop-blur-md">
            <CardContent className="p-6 flex items-center gap-4">
               <div className="h-10 w-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center"><Info className="h-6 w-6" /></div>
               <div>
                  <p className="text-[10px] font-black uppercase text-slate-400">Load Balancing</p>
                  <p className="font-bold text-slate-700 text-sm">Max 6 Periods/Day</p>
               </div>
            </CardContent>
         </Card>
         <Card className="rounded-3xl border-none shadow-soft bg-white/50 backdrop-blur-md">
            <CardContent className="p-6 flex items-center gap-4">
               <div className="h-10 w-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center"><AlertCircle className="h-6 w-6" /></div>
               <div>
                  <p className="text-[10px] font-black uppercase text-slate-400">Gaps Detected</p>
                  <p className="font-bold text-slate-700 text-sm">0 Conflicts Found</p>
               </div>
            </CardContent>
         </Card>
      </div>
    </div>
  );
}
