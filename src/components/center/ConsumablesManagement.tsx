import React, { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { Package, Plus, Trash2, Search, Filter } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";

export default function ConsumablesManagement({ centerId }: { centerId: string }) {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ name: "", category: "Stationery", unit: "Packs", stock: "0", min: "5", price: "0" });

  const { data: consumables, isLoading } = useQuery({
    queryKey: ["consumables", centerId],
    queryFn: async () => {
      const { data, error } = await supabase.from("consumables").select("*").eq("center_id", centerId);
      if (error) throw error;
      return data;
    },
    enabled: !!centerId,
  });

  const addMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("consumables").insert({
        center_id: centerId,
        name: form.name,
        category: form.category,
        unit: form.unit,
        current_stock: parseFloat(form.stock),
        min_stock_level: parseFloat(form.min),
        unit_price: parseFloat(form.price),
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["consumables"] });
      setForm({ name: "", category: "Stationery", unit: "Packs", stock: "0", min: "5", price: "0" });
      setShowAdd(false);
      toast.success("Consumable added");
    }
  });

  const filtered = consumables?.filter(c => c.name.toLowerCase().includes(search.toLowerCase()) || c.category.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search consumables..."
            className="pl-10 rounded-xl"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Button onClick={() => setShowAdd(!showAdd)} className="rounded-xl font-bold uppercase text-[10px] tracking-widest ml-4">
          {showAdd ? "Cancel" : "Add Item"}
        </Button>
      </div>

      {showAdd && (
        <Card className="rounded-3xl border-none shadow-strong bg-slate-50 overflow-hidden">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
              <div className="space-y-1">
                <Label className="text-[10px] font-black uppercase text-slate-400">Name</Label>
                <Input value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="h-10 rounded-lg" />
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] font-black uppercase text-slate-400">Category</Label>
                <Input value={form.category} onChange={e => setForm({...form, category: e.target.value})} className="h-10 rounded-lg" />
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] font-black uppercase text-slate-400">Unit</Label>
                <Input value={form.unit} onChange={e => setForm({...form, unit: e.target.value})} className="h-10 rounded-lg" />
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] font-black uppercase text-slate-400">Stock</Label>
                <Input type="number" value={form.stock} onChange={e => setForm({...form, stock: e.target.value})} className="h-10 rounded-lg" />
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] font-black uppercase text-slate-400">Min Level</Label>
                <Input type="number" value={form.min} onChange={e => setForm({...form, min: e.target.value})} className="h-10 rounded-lg" />
              </div>
              <div className="flex items-end">
                <Button onClick={() => addMutation.mutate()} className="w-full h-10 rounded-lg font-black uppercase text-[10px]">Save</Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="border rounded-2xl overflow-hidden bg-white shadow-soft">
        <Table>
          <TableHeader className="bg-slate-50">
            <TableRow>
              <TableHead className="font-black text-[10px] uppercase tracking-widest px-6">Item</TableHead>
              <TableHead className="font-black text-[10px] uppercase tracking-widest">Category</TableHead>
              <TableHead className="font-black text-[10px] uppercase tracking-widest">Stock Level</TableHead>
              <TableHead className="font-black text-[10px] uppercase tracking-widest">Unit Price</TableHead>
              <TableHead className="font-black text-[10px] uppercase tracking-widest text-right px-6">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={5} className="text-center py-12">Loading...</TableCell></TableRow>
            ) : filtered?.map((c: any) => (
              <TableRow key={c.id}>
                <TableCell className="px-6 py-4 font-bold">{c.name}</TableCell>
                <TableCell><Badge variant="secondary" className="text-[9px] uppercase font-black">{c.category}</Badge></TableCell>
                <TableCell>
                   <div className="flex items-center gap-2">
                      <span className={cn("font-black", c.current_stock <= c.min_stock_level ? "text-rose-600" : "text-slate-700")}>
                        {c.current_stock} {c.unit}
                      </span>
                      {c.current_stock <= c.min_stock_level && <Badge className="bg-rose-500 text-white text-[7px]">LOW</Badge>}
                   </div>
                </TableCell>
                <TableCell className="text-xs font-bold text-slate-500">₹{c.unit_price}</TableCell>
                <TableCell className="text-right px-6">
                   <Button variant="ghost" size="icon" className="text-rose-500"><Trash2 className="h-4 w-4" /></Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
