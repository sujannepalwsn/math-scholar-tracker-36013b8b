import React, { useState } from "react";
import { Users, FileText, DollarSign, Award, Briefcase, FileCheck, ShieldCheck } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import StaffHRModule from "@/components/center/StaffHRModule";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function HRManagement() {
  const { user } = useAuth();
  const centerId = user?.center_id || "";
  const [selectedTeacherId, setSelectedTeacherId] = useState<string | null>(null);

  const { data: teachers = [], isLoading } = useQuery({
    queryKey: ["teachers-hr", centerId],
    queryFn: async () => {
      const { data, error } = await supabase.from("teachers").select("*").eq("center_id", centerId).order("name");
      if (error) throw error;
      return data;
    },
    enabled: !!centerId,
  });

  const selectedTeacher = teachers.find(t => t.id === selectedTeacherId);

  return (
    <div className="space-y-8 animate-in fade-in duration-1000">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-3xl md:text-4xl font-black tracking-tight text-blue-600">
            Human Resources
          </h1>
          <p className="text-slate-500 text-sm font-medium">Manage faculty contracts, payroll, documents, and performance.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <Card className="lg:col-span-4 rounded-[2.5rem] border border-slate-200 shadow-strong bg-white/80 backdrop-blur-md overflow-hidden h-fit">
          <CardHeader className="bg-blue-500/5 border-b border-border/20 px-8 py-6">
            <CardTitle className="flex items-center gap-3 text-lg font-black uppercase tracking-tight">
              <Users className="h-5 w-5 text-blue-600" /> Faculty Roster
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y max-h-[600px] overflow-y-auto">
              {isLoading ? (
                <div className="p-12 text-center flex flex-col items-center gap-3">
                   <div className="h-6 w-6 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                   <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Synchronizing Roster...</p>
                </div>
              ) : teachers.length === 0 ? (
                <div className="p-12 text-center space-y-4">
                   <Users className="h-12 w-12 text-slate-200 mx-auto" />
                   <p className="text-sm font-medium text-slate-400 italic px-6">No faculty members identified in the current center directory.</p>
                </div>
              ) : (
                teachers.map((teacher) => (
                  <div
                    key={teacher.id}
                    className={cn(
                      "p-4 hover:bg-blue-50/50 cursor-pointer transition-colors border-l-4",
                      selectedTeacherId === teacher.id ? "border-blue-600 bg-blue-50/30" : "border-transparent"
                    )}
                    onClick={() => setSelectedTeacherId(teacher.id)}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-black text-slate-700 leading-none">{teacher.name}</p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase mt-1">{teacher.subject || "Instructor"}</p>
                      </div>
                      <Badge variant={teacher.is_active ? "success" : "secondary"} className="text-[8px] px-1.5 py-0">
                        {teacher.is_active ? "ACTIVE" : "INACTIVE"}
                      </Badge>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        <div className="lg:col-span-8">
          {selectedTeacherId ? (
            <div className="space-y-6">
              <Card className="rounded-[2.5rem] border border-slate-200 shadow-strong bg-white/80 backdrop-blur-md overflow-hidden">
                <CardHeader className="bg-primary/5 border-b border-border/20 px-8 py-6">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                        <Briefcase className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-xl font-black uppercase tracking-tight">{selectedTeacher?.name}</CardTitle>
                        <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">{selectedTeacher?.email}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                       <Badge className="bg-blue-100 text-blue-700 border-none font-black text-[10px] tracking-tight">ID: {selectedTeacherId.slice(0, 8)}</Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-8">
                  <StaffHRModule teacherId={selectedTeacherId} teacherName={selectedTeacher?.name || ""} />
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card className="rounded-[2.5rem] border border-slate-200 shadow-strong bg-white/80 backdrop-blur-md overflow-hidden h-[500px] flex items-center justify-center">
              <div className="text-center space-y-4 px-12">
                <div className="mx-auto w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center">
                  <ShieldCheck className="h-8 w-8 text-blue-400" />
                </div>
                <h3 className="text-xl font-black uppercase tracking-tight text-slate-700">Select a faculty member</h3>
                <p className="text-muted-foreground font-medium italic">Choose a profile from the roster to manage their human resource records, payroll, and contracts.</p>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
