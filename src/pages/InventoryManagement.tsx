import React from "react";
import { Package, Book, Archive, Plus, Search, Filter, ArrowUpDown } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
            <CardContent className="p-12 text-center space-y-4">
              <div className="mx-auto w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                <Package className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-black uppercase tracking-tight">Consumables Tracking</h3>
              <p className="text-muted-foreground max-w-md mx-auto">Track school supplies, stationery, and maintenance items. (Module coming soon)</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
