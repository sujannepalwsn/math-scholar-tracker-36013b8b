import React from "react";
import { Package, Book, Archive, Plus, Search, Filter, ArrowUpDown } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import AssetTracking from "@/components/center/AssetTracking";
import LibraryManagement from "@/components/center/LibraryManagement";
import { useAuth } from "@/contexts/AuthContext";

export default function InventoryManagement() {
  const { user } = useAuth();
  const centerId = user?.center_id || "";

  return (
    <div className="space-y-8 animate-in fade-in duration-1000">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-3xl md:text-4xl font-black tracking-tight text-indigo-600">
            Institutional Inventory
          </h1>
          <p className="text-slate-500 text-sm font-medium">Manage school assets, library resources, and stock levels.</p>
        </div>
      </div>

      <Tabs defaultValue="assets" className="space-y-6">
        <TabsList className="bg-white border border-slate-200 p-1.5 rounded-2xl h-14 shadow-soft backdrop-blur-md">
          <TabsTrigger value="assets" className="rounded-xl px-8 font-black uppercase text-[10px] tracking-widest">Fixed Assets</TabsTrigger>
          <TabsTrigger value="library" className="rounded-xl px-8 font-black uppercase text-[10px] tracking-widest">Library Catalog</TabsTrigger>
          <TabsTrigger value="stock" className="rounded-xl px-8 font-black uppercase text-[10px] tracking-widest">Consumables</TabsTrigger>
        </TabsList>

        <TabsContent value="assets" className="outline-none">
          <Card className="rounded-[2.5rem] border border-slate-200 shadow-strong bg-white/80 backdrop-blur-md overflow-hidden">
            <CardHeader className="bg-primary/5 border-b border-border/20 px-8 py-6">
              <CardTitle className="flex items-center gap-3 text-xl font-black uppercase tracking-tight">
                <Archive className="h-6 w-6 text-primary" /> Fixed Assets Registry
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8">
              <AssetTracking centerId={centerId} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="library" className="outline-none">
          <Card className="rounded-[2.5rem] border border-slate-200 shadow-strong bg-white/80 backdrop-blur-md overflow-hidden">
            <CardHeader className="bg-indigo-500/5 border-b border-border/20 px-8 py-6">
              <CardTitle className="flex items-center gap-3 text-xl font-black uppercase tracking-tight">
                <Book className="h-6 w-6 text-indigo-600" /> Library Management
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8">
              <LibraryManagement centerId={centerId} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="stock" className="outline-none">
          <Card className="rounded-[2.5rem] border border-slate-200 shadow-strong bg-white/80 backdrop-blur-md overflow-hidden">
            <CardHeader className="bg-slate-50 border-b border-border/20 px-8 py-6">
              <CardTitle className="flex items-center gap-3 text-xl font-black uppercase tracking-tight">
                <Package className="h-6 w-6 text-slate-600" /> Consumables & Stock
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8 space-y-8">
               <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  {[
                    { item: "A4 Paper Reams", stock: 45, min: 20, unit: "Packs" },
                    { item: "Whiteboard Markers", stock: 12, min: 15, unit: "Units" },
                    { item: "Hand Sanitizer", stock: 8, min: 10, unit: "Liters" },
                    { item: "Cleaning Detergent", stock: 24, min: 5, unit: "Bottles" },
                  ].map((s, idx) => (
                    <Card key={idx} className="rounded-2xl border-none shadow-soft bg-slate-50 p-6">
                       <div className="flex justify-between items-start mb-4">
                          <p className="text-xs font-black uppercase tracking-widest text-slate-500">{s.item}</p>
                          {s.stock < s.min && <Badge className="bg-rose-500 text-white border-none text-[8px]">LOW STOCK</Badge>}
                       </div>
                       <div className="flex items-end gap-2">
                          <span className="text-3xl font-black text-slate-700">{s.stock}</span>
                          <span className="text-[10px] font-bold text-slate-400 uppercase mb-1">{s.unit}</span>
                       </div>
                       <div className="mt-4 h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
                          <div className={cn("h-full", s.stock < s.min ? "bg-rose-500" : "bg-emerald-500")} style={{ width: `${Math.min(100, (s.stock/50)*100)}%` }} />
                       </div>
                    </Card>
                  ))}
               </div>

               <div className="flex justify-center p-8 bg-slate-50/50 rounded-3xl border border-dashed border-slate-200">
                  <div className="text-center space-y-3">
                     <p className="text-sm font-medium text-slate-500 italic">Full inventory procurement workflow (PO generation, GRN entry) is being synchronized.</p>
                     <Button variant="outline" className="rounded-xl font-black text-[10px] uppercase tracking-widest h-10 px-6">Access Global Catalog</Button>
                  </div>
               </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
