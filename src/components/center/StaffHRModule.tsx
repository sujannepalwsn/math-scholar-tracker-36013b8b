import React, { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { FileText, Plus, Trash2, Upload, ExternalLink, ShieldCheck, UserCheck, DollarSign, PieChart, Calendar, AlertCircle } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

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
          <TabsTrigger value="overview" className="rounded-lg px-4 font-bold text-[10px] uppercase tracking-widest">Global Overview</TabsTrigger>
          <TabsTrigger value="contracts" className="rounded-lg px-4 font-bold text-[10px] uppercase tracking-widest">Tenure & Salary</TabsTrigger>
          <TabsTrigger value="payroll" className="rounded-lg px-4 font-bold text-[10px] uppercase tracking-widest">Payroll Logs</TabsTrigger>
          <TabsTrigger value="performance" className="rounded-lg px-4 font-bold text-[10px] uppercase tracking-widest">KPIs</TabsTrigger>
          <TabsTrigger value="documents" className="rounded-lg px-4 font-bold text-[10px] uppercase tracking-widest">Digital Vault</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="pt-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="rounded-3xl border-none shadow-soft bg-emerald-500/5">
              <CardContent className="p-6 flex items-center gap-4">
                <div className="p-3 bg-emerald-500/10 rounded-2xl text-emerald-600"><ShieldCheck className="h-6 w-6" /></div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600/60 leading-none mb-1">Employement Status</p>
                  <p className="text-xl font-black text-emerald-700">Permanent</p>
                </div>
              </CardContent>
            </Card>
            <Card className="rounded-3xl border-none shadow-soft bg-blue-500/5">
              <CardContent className="p-6 flex items-center gap-4">
                <div className="p-3 bg-blue-500/10 rounded-2xl text-blue-600"><Award className="h-6 w-6" /></div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-blue-600/60 leading-none mb-1">Performance Index</p>
                  <p className="text-xl font-black text-blue-700">{evaluations?.[0]?.rating ? `${evaluations[0].rating}.0/5.0` : "PENDING"}</p>
                </div>
              </CardContent>
            </Card>
            <Card className="rounded-3xl border-none shadow-soft bg-indigo-500/5">
              <CardContent className="p-6 flex items-center gap-4">
                <div className="p-3 bg-indigo-500/10 rounded-2xl text-indigo-600"><Calendar className="h-6 w-6" /></div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-indigo-600/60 leading-none mb-1">Current Tenure</p>
                  <p className="text-xl font-black text-indigo-700">1.4 Years</p>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             <Card className="rounded-[2.5rem] border border-slate-100 bg-white shadow-soft">
                <CardHeader className="pb-2">
                   <CardTitle className="text-xs font-black uppercase tracking-widest text-slate-400">Payroll Health</CardTitle>
                </CardHeader>
                <CardContent className="p-8 flex flex-col items-center justify-center space-y-4">
                   <div className="relative h-32 w-32">
                      <svg className="h-full w-full" viewBox="0 0 36 36">
                         <path className="stroke-slate-100 fill-none" strokeWidth="3" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                         <path className="stroke-emerald-500 fill-none" strokeWidth="3" strokeDasharray="85, 100" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                         <span className="text-xl font-black text-slate-700">85%</span>
                         <span className="text-[8px] font-bold text-slate-400 uppercase">Paid</span>
                      </div>
                   </div>
                   <p className="text-xs font-medium text-slate-500 text-center">85% of fiscal year commitments have been successfully disbursed.</p>
                </CardContent>
             </Card>

             <Card className="rounded-[2.5rem] border border-slate-100 bg-white shadow-soft">
                <CardHeader className="pb-2">
                   <CardTitle className="text-xs font-black uppercase tracking-widest text-slate-400">Contract Compliance</CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                   <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50">
                      <div className="flex items-center gap-3">
                         <FileCheck className="h-5 w-5 text-emerald-500" />
                         <span className="text-xs font-bold text-slate-600">Signed Contract</span>
                      </div>
                      <Badge variant="success" className="text-[8px] font-black uppercase">Verified</Badge>
                   </div>
                   <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50">
                      <div className="flex items-center gap-3">
                         <ShieldCheck className="h-5 w-5 text-emerald-500" />
                         <span className="text-xs font-bold text-slate-600">Police Verification</span>
                      </div>
                      <Badge variant="success" className="text-[8px] font-black uppercase">Verified</Badge>
                   </div>
                   <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50">
                      <div className="flex items-center gap-3">
                         <AlertCircle className="h-5 w-5 text-amber-500" />
                         <span className="text-xs font-bold text-slate-600">Medical Certificate</span>
                      </div>
                      <Badge variant="warning" className="text-[8px] font-black uppercase">Expiring</Badge>
                   </div>
                </CardContent>
             </Card>
          </div>
        </TabsContent>

        <TabsContent value="payroll" className="pt-6">
           <div className="border rounded-[2rem] overflow-hidden bg-white shadow-soft">
            <Table>
              <TableHeader className="bg-slate-50">
                <TableRow>
                  <TableHead className="font-black text-[10px] uppercase tracking-widest px-6">Month / Year</TableHead>
                  <TableHead className="font-black text-[10px] uppercase tracking-widest">Basic Pay</TableHead>
                  <TableHead className="font-black text-[10px] uppercase tracking-widest">Allowances</TableHead>
                  <TableHead className="font-black text-[10px] uppercase tracking-widest">Deductions</TableHead>
                  <TableHead className="font-black text-[10px] uppercase tracking-widest">Net Payable</TableHead>
                  <TableHead className="font-black text-[10px] uppercase tracking-widest text-right px-6">Slip</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {[
                  { month: "March 2026", basic: 45000, allowance: 5000, deduction: 2000, status: "Paid" },
                  { month: "February 2026", basic: 45000, allowance: 5000, deduction: 2000, status: "Paid" },
                  { month: "January 2026", basic: 45000, allowance: 5000, deduction: 2000, status: "Paid" },
                ].map((p, idx) => (
                  <TableRow key={idx}>
                    <TableCell className="px-6 py-4">
                       <div className="flex items-center gap-3">
                          <div className="h-2 w-2 rounded-full bg-emerald-500" />
                          <span className="font-bold text-slate-700">{p.month}</span>
                       </div>
                    </TableCell>
                    <TableCell className="text-xs font-medium text-slate-500">₹{p.basic.toLocaleString()}</TableCell>
                    <TableCell className="text-xs font-medium text-emerald-600">+ ₹{p.allowance.toLocaleString()}</TableCell>
                    <TableCell className="text-xs font-medium text-rose-500">- ₹{p.deduction.toLocaleString()}</TableCell>
                    <TableCell className="font-black text-slate-700">₹{(p.basic + p.allowance - p.deduction).toLocaleString()}</TableCell>
                    <TableCell className="text-right px-6">
                       <Button variant="ghost" size="sm" className="h-8 rounded-lg text-blue-600 hover:bg-blue-50 font-black text-[10px] uppercase">
                          <FileText className="h-3.5 w-3.5 mr-1" /> PDF
                       </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
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
