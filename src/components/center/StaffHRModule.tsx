import React, { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { FileText, Plus, Trash2, Upload, ExternalLink, ShieldCheck, UserCheck } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

export default function StaffHRModule({ teacherId, teacherName }: { teacherId: string, teacherName: string }) {
  const queryClient = useQueryClient();
  const [showAddDoc, setShowAddDoc] = useState(false);
  const [docForm, setDocForm] = useState({ name: "", type: "Contract", url: "" });

  const { data: contracts } = useQuery({
    queryKey: ["staff-contracts", teacherId],
    queryFn: async () => {
      const { data, error } = await supabase.from("staff_contracts").select("*").eq("teacher_id", teacherId);
      if (error) throw error;
      return data;
    },
  });

  const { data: evaluations } = useQuery({
    queryKey: ["staff-evaluations", teacherId],
    queryFn: async () => {
      const { data, error } = await supabase.from("performance_evaluations").select("*").eq("teacher_id", teacherId).order("evaluation_date", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: documents } = useQuery({
    queryKey: ["staff-documents", teacherId],
    queryFn: async () => {
      const { data, error } = await supabase.from("staff_documents").select("*").eq("teacher_id", teacherId);
      if (error) throw error;
      return data;
    },
  });

  const addDocMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("staff_documents").insert({
        teacher_id: teacherId,
        document_name: docForm.name,
        document_type: docForm.type,
        document_url: docForm.url,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["staff-documents"] });
      setDocForm({ name: "", type: "Contract", url: "" });
      setShowAddDoc(false);
      toast.success("Document uploaded successfully");
    }
  });

  return (
    <div className="space-y-6">
      <Tabs defaultValue="overview">
        <TabsList className="bg-slate-100 p-1 rounded-xl h-12">
          <TabsTrigger value="overview" className="rounded-lg px-4 font-bold text-[10px] uppercase tracking-widest">HR Overview</TabsTrigger>
          <TabsTrigger value="contracts" className="rounded-lg px-4 font-bold text-[10px] uppercase tracking-widest">Contracts</TabsTrigger>
          <TabsTrigger value="performance" className="rounded-lg px-4 font-bold text-[10px] uppercase tracking-widest">Performance</TabsTrigger>
          <TabsTrigger value="documents" className="rounded-lg px-4 font-bold text-[10px] uppercase tracking-widest">Documents</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="pt-4 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Card className="rounded-2xl border-none shadow-soft bg-emerald-50/50">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="p-2 bg-emerald-100 rounded-lg text-emerald-600"><ShieldCheck className="h-5 w-5" /></div>
                <div>
                  <p className="text-[10px] font-black uppercase text-emerald-800/60">Current Status</p>
                  <p className="font-black text-emerald-700">Permanent Faculty</p>
                </div>
              </CardContent>
            </Card>
            <Card className="rounded-2xl border-none shadow-soft bg-blue-50/50">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg text-blue-600"><UserCheck className="h-5 w-5" /></div>
                <div>
                  <p className="text-[10px] font-black uppercase text-blue-800/60">Last Evaluation</p>
                  <p className="font-black text-blue-700">{evaluations?.[0]?.rating ? `${evaluations[0].rating}/5 Stars` : "Not Rated"}</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="contracts" className="pt-4">
           <div className="border rounded-2xl overflow-hidden bg-white shadow-soft">
            <Table>
              <TableHeader className="bg-slate-50">
                <TableRow>
                  <TableHead className="font-black text-[10px] uppercase tracking-widest">Type</TableHead>
                  <TableHead className="font-black text-[10px] uppercase tracking-widest">Start Date</TableHead>
                  <TableHead className="font-black text-[10px] uppercase tracking-widest">End Date</TableHead>
                  <TableHead className="font-black text-[10px] uppercase tracking-widest">Salary</TableHead>
                  <TableHead className="font-black text-[10px] uppercase tracking-widest">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {contracts?.map((c: any) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-bold">{c.contract_type}</TableCell>
                    <TableCell className="text-xs">{c.start_date}</TableCell>
                    <TableCell className="text-xs">{c.end_date || 'N/A'}</TableCell>
                    <TableCell className="font-bold text-slate-700">₹{c.salary?.toLocaleString()}</TableCell>
                    <TableCell><Badge variant="outline" className="text-[9px] font-black">{c.status}</Badge></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="performance" className="pt-4">
          <div className="space-y-4">
            {evaluations?.map((e: any) => (
              <Card key={e.id} className="rounded-2xl border-none shadow-soft">
                <CardContent className="p-4">
                  <div className="flex justify-between items-center mb-2">
                    <p className="font-black text-sm text-slate-700">{e.evaluation_date}</p>
                    <div className="flex gap-0.5">
                      {[...Array(5)].map((_, i) => (
                        <div key={i} className={`h-2 w-4 rounded-full ${i < e.rating ? 'bg-amber-400' : 'bg-slate-100'}`} />
                      ))}
                    </div>
                  </div>
                  <p className="text-xs text-slate-500 font-medium italic">"{e.comments}"</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="documents" className="pt-4 space-y-4">
          <div className="flex justify-end">
            <Button size="sm" onClick={() => setShowAddDoc(!showAddDoc)} className="h-8 rounded-lg text-[9px] font-black uppercase">
              <Upload className="h-3 w-3 mr-1" /> Secure Upload
            </Button>
          </div>

          {showAddDoc && (
            <div className="grid grid-cols-3 gap-2 p-3 bg-slate-50 rounded-xl border border-dashed border-slate-200">
              <Input placeholder="Doc Name" value={docForm.name} onChange={(e) => setDocForm({...docForm, name: e.target.value})} className="h-9 text-xs" />
              <Input placeholder="URL" value={docForm.url} onChange={(e) => setDocForm({...docForm, url: e.target.value})} className="h-9 text-xs" />
              <Button onClick={() => addDocMutation.mutate()} className="h-9 text-[9px] font-black uppercase">Save</Button>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            {documents?.map((d: any) => (
              <Card key={d.id} className="rounded-2xl border-none shadow-soft hover:bg-slate-50 transition-colors cursor-pointer group">
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-50 text-blue-600 rounded-lg group-hover:bg-blue-100 transition-colors"><FileText className="h-5 w-5" /></div>
                    <div>
                      <p className="font-black text-xs text-slate-700">{d.document_name}</p>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{d.document_type}</p>
                    </div>
                  </div>
                  <ExternalLink className="h-4 w-4 text-slate-300" />
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
