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
import { cn } from "@/lib/utils";

export default function AssetTracking({ centerId, canEdit }: { centerId: string, canEdit?: boolean }) {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [showAddAsset, setShowAddAsset] = useState(false);
  const [assetForm, setAssetForm] = useState({ name: "", category: "", location: "", condition: "Good", serial_number: "", purchase_price: "", purchase_date: "", warranty_expiry: "" });

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
      if (!centerId) throw new Error("Security Context: Center ID not verified. Operation aborted.");
      if (!canEdit) throw new Error("Access Denied: You do not have permission to add assets.");
      const payload: any = {
        center_id: centerId,
        name: assetForm.name,
        category: assetForm.category,
        location: assetForm.location,
        condition: assetForm.condition,
      };

      if (assetForm.serial_number) payload.asset_tag = assetForm.serial_number;
      if (assetForm.purchase_date) payload.purchase_date = assetForm.purchase_date;
      if (assetForm.purchase_price) payload.purchase_price = parseFloat(assetForm.purchase_price);
      if (assetForm.warranty_expiry) payload.warranty_expiry = assetForm.warranty_expiry;

      const { error } = await supabase.from("assets").insert(payload);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["school-assets"] });
      setAssetForm({ name: "", category: "", location: "", condition: "Good", serial_number: "", purchase_price: "", purchase_date: "", warranty_expiry: "" });
      setShowAddAsset(false);
      toast.success("Asset logged in registry");
    }
  });

  const filteredAssets = assets?.filter(a => a.name.toLowerCase().includes(search.toLowerCase()) || a.category?.toLowerCase().includes(search.toLowerCase()));

  const totalValuation = assets?.reduce((acc, curr) => acc + (curr.purchase_price || 0), 0) || 0;

  const updateAssetStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string, status: string }) => {
      if (!canEdit) throw new Error("Access Denied: You do not have permission to update asset status.");
      const { error } = await supabase.from('assets').update({ status }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["school-assets"] });
      toast.success("Asset status updated");
    },
    onError: (error: any) => toast.error(error.message)
  });

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="rounded-3xl border-none shadow-soft bg-blue-50 p-6">
           <p className="text-[10px] font-black uppercase text-blue-600 tracking-widest mb-1">Total Assets</p>
           <p className="text-3xl font-black text-blue-700">{assets?.length || 0}</p>
        </Card>
        <Card className="rounded-3xl border-none shadow-soft bg-emerald-50 p-6">
           <p className="text-[10px] font-black uppercase text-emerald-600 tracking-widest mb-1">Registry Valuation</p>
           <p className="text-3xl font-black text-emerald-700">₹{totalValuation.toLocaleString()}</p>
        </Card>
        <Card className="rounded-3xl border-none shadow-soft bg-amber-50 p-6">
           <p className="text-[10px] font-black uppercase text-amber-600 tracking-widest mb-1">Avg. Condition</p>
           <p className="text-3xl font-black text-amber-700">Good</p>
        </Card>
      </div>

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
        {canEdit && (
          <Button onClick={() => setShowAddAsset(!showAddAsset)} className="rounded-xl font-bold uppercase text-[10px] tracking-widest ml-4">
            {showAddAsset ? "Cancel" : "Log Asset"}
          </Button>
        )}
      </div>

      {showAddAsset && (
        <Card className="rounded-3xl border-none shadow-strong bg-slate-50 overflow-hidden">
          <CardHeader className="bg-slate-100/50 py-4 px-6 border-b">
            <CardTitle className="text-xs font-black uppercase tracking-widest text-slate-500">New Asset Procurement</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="space-y-1">
                <Label className="text-[10px] font-black uppercase text-slate-400">Asset Name *</Label>
                <Input value={assetForm.name} onChange={e => setAssetForm({...assetForm, name: e.target.value})} className="h-10 rounded-lg bg-white" placeholder="e.g. Dell Latitude 5420" />
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] font-black uppercase text-slate-400">Category</Label>
                <Input value={assetForm.category} onChange={e => setAssetForm({...assetForm, category: e.target.value})} className="h-10 rounded-lg bg-white" placeholder="e.g. IT Equipment" />
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] font-black uppercase text-slate-400">Serial / Asset Tag</Label>
                <Input value={assetForm.serial_number} onChange={e => setAssetForm({...assetForm, serial_number: e.target.value})} className="h-10 rounded-lg bg-white" placeholder="TAG-12345" />
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] font-black uppercase text-slate-400">Location</Label>
                <Input value={assetForm.location} onChange={e => setAssetForm({...assetForm, location: e.target.value})} className="h-10 rounded-lg bg-white" placeholder="e.g. IT Lab 1" />
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] font-black uppercase text-slate-400">Purchase Date</Label>
                <Input type="date" value={assetForm.purchase_date} onChange={e => setAssetForm({...assetForm, purchase_date: e.target.value})} className="h-10 rounded-lg bg-white" />
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] font-black uppercase text-slate-400">Cost (₹)</Label>
                <Input type="number" value={assetForm.purchase_price} onChange={e => setAssetForm({...assetForm, purchase_price: e.target.value})} className="h-10 rounded-lg bg-white" placeholder="0.00" />
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] font-black uppercase text-slate-400">Warranty Expiry</Label>
                <Input type="date" value={assetForm.warranty_expiry} onChange={e => setAssetForm({...assetForm, warranty_expiry: e.target.value})} className="h-10 rounded-lg bg-white" />
              </div>
              <div className="flex items-end">
                <Button
                  onClick={() => addAssetMutation.mutate()}
                  disabled={!assetForm.name || addAssetMutation.isPending}
                  className="w-full h-10 rounded-lg font-black uppercase text-[10px] tracking-widest bg-primary text-white shadow-strong hover:scale-[1.02] transition-all"
                >
                  {addAssetMutation.isPending ? "Syncing..." : "Commit Asset"}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="border rounded-2xl overflow-hidden bg-white shadow-soft">
        <div className="overflow-x-auto">
  <Table>
          <TableHeader className="bg-slate-50">
            <TableRow>
              <TableHead className="font-black text-[10px] uppercase tracking-widest px-6">Asset Details</TableHead>
              <TableHead className="font-black text-[10px] uppercase tracking-widest">Identification</TableHead>
              <TableHead className="font-black text-[10px] uppercase tracking-widest">Procurement</TableHead>
              <TableHead className="font-black text-[10px] uppercase tracking-widest">Lifecycle</TableHead>
              <TableHead className="font-black text-[10px] uppercase tracking-widest text-right px-6">Operations</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={5} className="text-center py-12">Loading inventory...</TableCell></TableRow>
            ) : filteredAssets?.map((a: any) => (
              <TableRow key={a.id} className="group hover:bg-slate-50/50 transition-colors">
                <TableCell className="px-6 py-4">
                  <div className="flex flex-col">
                    <span className="font-black text-slate-700 leading-tight">{a.name}</span>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter mt-0.5">{a.category || "UNCATEGORIZED"}</span>
                  </div>
                </TableCell>
                <TableCell>
                   <div className="flex flex-col gap-1">
                      <Badge variant="secondary" className="w-fit text-[9px] font-black tracking-widest bg-indigo-50 text-indigo-700 border-none">
                        TAG: {a.asset_tag || "N/A"}
                      </Badge>
                      <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500">
                         <MapPin className="h-3 w-3" /> {a.location || "UNASSIGNED"}
                      </div>
                   </div>
                </TableCell>
                <TableCell>
                   <div className="flex flex-col">
                      <span className="text-xs font-black text-slate-600">₹{a.purchase_price || "0.00"}</span>
                      <span className="text-[9px] font-medium text-slate-400 uppercase">{a.purchase_date ? new Date(a.purchase_date).toLocaleDateString() : "DATE UNSET"}</span>
                   </div>
                </TableCell>
                <TableCell>
                   <div className="flex flex-col gap-1.5">
                      <div className="flex gap-1">
                        <Badge variant="outline" className={cn(
                          "w-fit text-[9px] font-black uppercase px-2 py-0",
                          a.condition === 'Excellent' ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                          a.condition === 'Good' ? "bg-blue-50 text-blue-700 border-blue-200" :
                          "bg-amber-50 text-amber-700 border-amber-200"
                        )}>{a.condition}</Badge>
                        {a.status !== 'Active' && (
                           <Badge className="bg-rose-500 text-white text-[9px] font-black uppercase px-2 py-0 border-none">{a.status}</Badge>
                        )}
                      </div>
                      {a.warranty_expiry && (
                         <span className="text-[9px] font-bold text-rose-500 uppercase tracking-tighter">
                            WARRANTY EXPIRES: {new Date(a.warranty_expiry).toLocaleDateString()}
                         </span>
                      )}
                   </div>
                </TableCell>
                <TableCell className="text-right px-6">
                   <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      {canEdit && a.status === 'Active' && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 rounded-lg text-[9px] font-black uppercase text-rose-600 border-rose-200 hover:bg-rose-50"
                          onClick={() => {
                            if (window.confirm("Are you sure you want to dispose/dump this fixed asset? This action is recorded in history.")) {
                              updateAssetStatusMutation.mutate({ id: a.id, status: 'Disposed' });
                            }
                          }}
                        >
                           Dump Asset
                        </Button>
                      )}
                      {canEdit && (
                        <>
                          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg hover:bg-slate-100"><Settings className="h-3.5 w-3.5 text-slate-400" /></Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg hover:bg-rose-50 text-rose-500"><Trash2 className="h-3.5 w-3.5" /></Button>
                        </>
                      )}
                   </div>
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
    </div>
  );
}
