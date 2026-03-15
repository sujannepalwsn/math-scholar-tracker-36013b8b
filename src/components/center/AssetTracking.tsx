import React, { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { Package, Plus, Trash2, Search, MapPin, User, Settings } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function AssetTracking({ centerId }: { centerId: string }) {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [showAddAsset, setShowAddAsset] = useState(false);
  const [assetForm, setAssetForm] = useState({ name: "", category: "", location: "", condition: "Good" });

  const { data: assets, isLoading } = useQuery({
    queryKey: ["school-assets", centerId],
    queryFn: async () => {
      const { data, error } = await supabase.from("assets").select("*").eq("center_id", centerId);
      if (error) throw error;
      return data;
    },
    enabled: !!centerId,
  });

  const addAssetMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("assets").insert({
        center_id: centerId,
        name: assetForm.name,
        category: assetForm.category,
        location: assetForm.location,
        condition: assetForm.condition,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["school-assets"] });
      setAssetForm({ name: "", category: "", location: "", condition: "Good" });
      setShowAddAsset(false);
      toast.success("Asset logged in registry");
    }
  });

  const filteredAssets = assets?.filter(a => a.name.toLowerCase().includes(search.toLowerCase()) || a.category?.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search assets (e.g. Projector, Lab Equipment)..."
            className="pl-10 rounded-xl"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Button onClick={() => setShowAddAsset(!showAddAsset)} className="rounded-xl font-bold uppercase text-[10px] tracking-widest ml-4">
          {showAddAsset ? "Cancel" : "Log Asset"}
        </Button>
      </div>

      {showAddAsset && (
        <Card className="rounded-3xl border-none shadow-strong bg-slate-50">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-1">
                <Label className="text-[10px] font-black uppercase text-slate-400">Asset Name</Label>
                <Input value={assetForm.name} onChange={e => setAssetForm({...assetForm, name: e.target.value})} className="h-10 rounded-lg" placeholder="Projector X1" />
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] font-black uppercase text-slate-400">Category</Label>
                <Input value={assetForm.category} onChange={e => setAssetForm({...assetForm, category: e.target.value})} className="h-10 rounded-lg" placeholder="Electronics" />
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] font-black uppercase text-slate-400">Location</Label>
                <Input value={assetForm.location} onChange={e => setAssetForm({...assetForm, location: e.target.value})} className="h-10 rounded-lg" placeholder="Room 204" />
              </div>
              <div className="flex items-end">
                <Button onClick={() => addAssetMutation.mutate()} className="w-full h-10 rounded-lg font-black uppercase text-[10px] tracking-widest bg-slate-900 text-white">Commit Asset</Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="border rounded-2xl overflow-hidden bg-white shadow-soft">
        <Table>
          <TableHeader className="bg-slate-50">
            <TableRow>
              <TableHead className="font-black text-[10px] uppercase tracking-widest px-6">Asset</TableHead>
              <TableHead className="font-black text-[10px] uppercase tracking-widest">Category</TableHead>
              <TableHead className="font-black text-[10px] uppercase tracking-widest">Location</TableHead>
              <TableHead className="font-black text-[10px] uppercase tracking-widest">Condition</TableHead>
              <TableHead className="font-black text-[10px] uppercase tracking-widest text-right px-6">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={5} className="text-center py-12">Loading inventory...</TableCell></TableRow>
            ) : filteredAssets?.map((a: any) => (
              <TableRow key={a.id}>
                <TableCell className="px-6 font-bold">{a.name}</TableCell>
                <TableCell><Badge variant="secondary" className="text-[9px] uppercase font-black">{a.category || "General"}</Badge></TableCell>
                <TableCell>
                   <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
                      <MapPin className="h-3 w-3" /> {a.location || "Unset"}
                   </div>
                </TableCell>
                <TableCell>
                   <Badge variant="outline" className="text-[9px] font-black uppercase border-slate-200">{a.condition}</Badge>
                </TableCell>
                <TableCell className="text-right px-6">
                   <Button variant="ghost" size="icon" className="text-rose-500"><Trash2 className="h-4 w-4" /></Button>
                </TableCell>
              </TableRow>
            ))}
            {filteredAssets?.length === 0 && (
              <TableRow><TableCell colSpan={5} className="text-center py-12 text-slate-400 italic">No assets discovered in inventory.</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
