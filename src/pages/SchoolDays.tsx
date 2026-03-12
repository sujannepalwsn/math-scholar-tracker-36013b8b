import React, { useState } from "react";
import { CalendarIcon, Plus, Trash2, CheckCircle2, XCircle } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { supabase } from "@/integrations/supabase/client"
import { useAuth } from "@/contexts/AuthContext"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { toast } from "sonner"
import { format, startOfMonth, endOfMonth, eachDayOfInterval } from "date-fns"
import { Badge } from "@/components/ui/badge"

export default function SchoolDays() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedMonth, setSelectedMonth] = useState(new Date());

  const { data: schoolDays = [], isLoading } = useQuery({
    queryKey: ["school-days", user?.center_id, format(selectedMonth, "yyyy-MM")],
    queryFn: async () => {
      if (!user?.center_id) return [];
      const start = format(startOfMonth(selectedMonth), "yyyy-MM-dd");
      const end = format(endOfMonth(selectedMonth), "yyyy-MM-dd");
      const { data, error } = await supabase
        .from("school_days")
        .select("*")
        .eq("center_id", user.center_id)
        .gte("date", start)
        .lte("date", end)
        .order("date");
      if (error) throw error;
      return data;
    },
    enabled: !!user?.center_id });

  const toggleDayMutation = useMutation({
    mutationFn: async ({ date, isSchoolDay }: { date: string, isSchoolDay: boolean }) => {
      const { error } = await supabase
        .from("school_days")
        .upsert({
          center_id: user?.center_id!,
          date,
          is_school_day: isSchoolDay,
          updated_at: new Date().toISOString()
        }, { onConflict: 'center_id,date' });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["school-days"] });
      toast.success("School day status updated");
    } });

  const bulkMarkMutation = useMutation({
    mutationFn: async (type: 'all' | 'weekdays') => {
      const days = eachDayOfInterval({
        start: startOfMonth(selectedMonth),
        end: endOfMonth(selectedMonth)
      });

      const entries = days
        .filter(d => type === 'all' || (d.getDay() !== 6)) // exclude Saturday if weekdays
        .map(d => ({
          center_id: user?.center_id!,
          date: format(d, "yyyy-MM-dd"),
          is_school_day: true
        }));

      const { error } = await supabase
        .from("school_days")
        .upsert(entries, { onConflict: 'center_id,date' });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["school-days"] });
      toast.success("Bulk update successful");
    } });

  const days = eachDayOfInterval({
    start: startOfMonth(selectedMonth),
    end: endOfMonth(selectedMonth)
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-1000">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-3xl md:text-4xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-primary to-violet-600">
            School Days Management
          </h1>
          <p className="text-muted-foreground text-sm font-medium">Define active operational days for attendance and academic tracking.</p>
        </div>
      </div>

      <Card className="border-none shadow-medium p-6 bg-card/60 backdrop-blur-md rounded-3xl border border-white/30">
        <div className="flex flex-wrap items-end gap-6">
          <div className="space-y-2">
            <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Select Month</Label>
            <Input
              type="month"
              value={format(selectedMonth, "yyyy-MM")}
              onChange={(e) => {
                const [y, m] = e.target.value.split('-');
                setSelectedMonth(new Date(parseInt(y), parseInt(m) - 1));
              }}
              className="h-11 rounded-xl bg-white border-muted-foreground/10 w-[200px]"
            />
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => bulkMarkMutation.mutate('weekdays')} className="rounded-xl h-11 border-2 font-bold px-4">
              Mark Weekdays (Sun-Fri)
            </Button>
            <Button variant="outline" onClick={() => bulkMarkMutation.mutate('all')} className="rounded-xl h-11 border-2 font-bold px-4">
              Mark All Days
            </Button>
          </div>
        </div>
      </Card>

      <Card className="border-none shadow-strong overflow-hidden rounded-[2rem] bg-card/40 backdrop-blur-md border border-border/20">
        <CardHeader className="bg-primary/5 border-b border-muted/10 py-6 px-8">
           <CardTitle className="text-xl font-black flex items-center gap-3">
              <CalendarIcon className="h-6 w-6 text-primary" />
              Operational Calendar: {format(selectedMonth, "MMMM yyyy")}
           </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-muted/5">
              <TableRow>
                <TableHead className="pl-8 font-black uppercase text-[10px] tracking-widest">Date</TableHead>
                <TableHead className="font-black uppercase text-[10px] tracking-widest">Day</TableHead>
                <TableHead className="font-black uppercase text-[10px] tracking-widest text-center">Status</TableHead>
                <TableHead className="pr-8 font-black uppercase text-[10px] tracking-widest text-right">Toggle</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {days.map((day) => {
                const dateStr = format(day, "yyyy-MM-dd");
                const config = schoolDays.find(sd => sd.date === dateStr);
                const isSchoolDay = config ? config.is_school_day : false;

                return (
                  <TableRow key={dateStr} className="hover:bg-primary/5 transition-colors border-muted/5">
                    <TableCell className="pl-8 py-4 font-bold text-slate-700">{format(day, "MMM d, yyyy")}</TableCell>
                    <TableCell className="font-medium text-slate-500">{format(day, "EEEE")}</TableCell>
                    <TableCell className="text-center">
                      {isSchoolDay ? (
                        <Badge className="bg-green-500 hover:bg-green-600 border-none text-[10px] font-black uppercase px-2 py-0.5">School Day</Badge>
                      ) : (
                        <Badge variant="secondary" className="text-[10px] font-black uppercase px-2 py-0.5">Off Day</Badge>
                      )}
                    </TableCell>
                    <TableCell className="pr-8 text-right">
                      <Switch
                        checked={isSchoolDay}
                        onCheckedChange={(checked) => toggleDayMutation.mutate({ date: dateStr, isSchoolDay: checked })}
                      />
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
