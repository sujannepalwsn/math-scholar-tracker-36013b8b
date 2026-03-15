import React, { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { Megaphone, Plus, Trash2, Send, AlertTriangle, Info } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function NoticeBoard({ centerId }: { centerId: string }) {
  const queryClient = useQueryClient();
  const [showAddNotice, setShowAddNotice] = useState(false);
  const [noticeForm, setNoticeForm] = useState({ title: "", content: "", audience: "All", grade: "all", isEmergency: false });

  const { data: notices } = useQuery({
    queryKey: ["center-notices", centerId],
    queryFn: async () => {
      const { data, error } = await supabase.from("notices").select("*").eq("center_id", centerId).order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const addNoticeMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("notices").insert({
        center_id: centerId,
        title: noticeForm.title,
        content: noticeForm.content,
        target_audience: noticeForm.audience,
        target_grade: noticeForm.grade === "all" ? null : noticeForm.grade,
        is_emergency: noticeForm.isEmergency
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["center-notices"] });
      setNoticeForm({ title: "", content: "", audience: "All", grade: "all", isEmergency: false });
      setShowAddNotice(false);
      toast.success("Notice published to digital board");
    }
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-black uppercase tracking-tight text-slate-700 flex items-center gap-2">
          <Megaphone className="h-5 w-5 text-primary" /> Digital Notice Board
        </h3>
        <Button onClick={() => setShowAddNotice(!showAddNotice)} className="rounded-xl font-bold uppercase text-[10px] tracking-widest">
          {showAddNotice ? "Cancel" : "Post Notice"}
        </Button>
      </div>

      {showAddNotice && (
        <Card className="rounded-3xl border-none shadow-strong bg-white/50 backdrop-blur-md overflow-hidden">
          <CardContent className="p-8 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Notice Title</Label>
                <Input value={noticeForm.title} onChange={(e) => setNoticeForm({...noticeForm, title: e.target.value})} className="h-12 rounded-2xl" placeholder="e.g. Annual Sports Meet" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Audience</Label>
                  <select
                    value={noticeForm.audience}
                    onChange={(e) => setNoticeForm({...noticeForm, audience: e.target.value})}
                    className="w-full h-12 px-3 rounded-2xl border bg-white text-sm"
                  >
                    <option value="All">Everyone</option>
                    <option value="Teachers">Teachers Only</option>
                    <option value="Parents">Parents Only</option>
                    <option value="Grade">Specific Grade</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Priority</Label>
                  <div className="flex items-center h-12 px-4 bg-white border rounded-2xl">
                     <input
                      type="checkbox"
                      id="emergency"
                      checked={noticeForm.isEmergency}
                      onChange={(e) => setNoticeForm({...noticeForm, isEmergency: e.target.checked})}
                      className="mr-2 h-4 w-4 accent-rose-500"
                    />
                    <label htmlFor="emergency" className="text-xs font-bold text-slate-700">Emergency</label>
                  </div>
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Message Content</Label>
              <Textarea
                value={noticeForm.content}
                onChange={(e) => setNoticeForm({...noticeForm, content: e.target.value})}
                className="rounded-2xl min-h-[120px]"
                placeholder="Write the full announcement details here..."
              />
            </div>
            <Button onClick={() => addNoticeMutation.mutate()} className="w-full h-12 rounded-2xl font-black uppercase text-xs tracking-widest shadow-lg shadow-primary/20 bg-primary">
               Publish Announcement <Send className="ml-2 h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {notices?.map((n: any) => (
          <Card key={n.id} className={cn("rounded-3xl border-none shadow-soft hover:shadow-medium transition-all group overflow-hidden", n.is_emergency ? "bg-rose-50" : "bg-white")}>
            <CardContent className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div className={cn("p-2.5 rounded-xl", n.is_emergency ? "bg-rose-100 text-rose-600" : "bg-blue-50 text-blue-600")}>
                  {n.is_emergency ? <AlertTriangle className="h-5 w-5" /> : <Info className="h-5 w-5" />}
                </div>
                <Badge variant="outline" className="text-[9px] font-black uppercase tracking-widest border-slate-200">
                  To: {n.target_audience} {n.target_grade ? `(Grade ${n.target_grade})` : ''}
                </Badge>
              </div>
              <h4 className={cn("font-black uppercase tracking-tight text-lg mb-2", n.is_emergency ? "text-rose-900" : "text-slate-800")}>{n.title}</h4>
              <p className="text-sm text-slate-600 font-medium mb-4 line-clamp-3">{n.content}</p>
              <div className="pt-4 border-t border-slate-100 flex justify-between items-center">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Posted on {new Date(n.created_at).toLocaleDateString()}</span>
                <Button variant="ghost" size="sm" className="h-8 text-[9px] font-black uppercase text-rose-500">Delete</Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function cn(...classes: any[]) {
  return classes.filter(Boolean).join(" ");
}
