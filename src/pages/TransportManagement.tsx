import React from "react";
import { Bus, MapPin, Shield, Route, Users, Navigation, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/AuthContext";
import TransportManagement from "@/components/center/TransportManagement";

export default function TransportManagementPage() {
  const { user } = useAuth();
  const centerId = user?.center_id || "";

  return (
    <div className="space-y-8 animate-in fade-in duration-1000">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-3xl md:text-4xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-emerald-600 to-teal-500">
            Fleet & Logistics
          </h1>
          <p className="text-muted-foreground text-sm font-medium">Manage school transport routes, vehicle tracking, and driver compliance.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="rounded-3xl border-none shadow-soft bg-emerald-500/5 overflow-hidden">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-3 rounded-2xl bg-emerald-500/10">
              <Bus className="h-6 w-6 text-emerald-600" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600/60 leading-none mb-1">Total Fleet</p>
              <p className="text-2xl font-black text-emerald-700">12 Vehicles</p>
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-3xl border-none shadow-soft bg-blue-500/5 overflow-hidden">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-3 rounded-2xl bg-blue-500/10">
              <Route className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-blue-600/60 leading-none mb-1">Active Routes</p>
              <p className="text-2xl font-black text-blue-700">8 Paths</p>
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-3xl border-none shadow-soft bg-amber-500/5 overflow-hidden">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-3 rounded-2xl bg-amber-500/10">
              <Shield className="h-6 w-6 text-amber-600" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-amber-600/60 leading-none mb-1">Safety Index</p>
              <p className="text-2xl font-black text-amber-700">98% Secure</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="tracking" className="space-y-6">
        <TabsList className="bg-card/40 border border-border/40 p-1.5 rounded-2xl h-14 shadow-soft backdrop-blur-md">
          <TabsTrigger value="tracking" className="rounded-xl px-8 font-black uppercase text-[10px] tracking-widest">Live Tracking</TabsTrigger>
          <TabsTrigger value="management" className="rounded-xl px-8 font-black uppercase text-[10px] tracking-widest">Fleet & Routes</TabsTrigger>
          <TabsTrigger value="compliance" className="rounded-xl px-8 font-black uppercase text-[10px] tracking-widest">Compliance</TabsTrigger>
        </TabsList>

        <TabsContent value="tracking" className="outline-none">
          <Card className="rounded-[2.5rem] border-none shadow-strong bg-slate-900 overflow-hidden relative min-h-[500px]">
            <div className="absolute inset-0 opacity-20 bg-[url('https://api.mapbox.com/styles/v1/mapbox/dark-v10/static/0,0,1,0,0/800x600?access_token=none')] bg-cover"></div>
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent"></div>
            <div className="relative p-12 flex flex-col items-center justify-center h-full text-center space-y-6">
               <div className="p-4 rounded-full bg-emerald-500/20 animate-pulse">
                  <Navigation className="h-12 w-12 text-emerald-400" />
               </div>
               <h2 className="text-3xl font-black text-white uppercase tracking-tighter">Live Fleet Radar</h2>
               <p className="text-slate-400 max-w-lg font-medium">Real-time GPS telemetry integration. All vehicles currently on established routes are being monitored for speed, location, and idle time.</p>
               <div className="flex gap-4">
                  <div className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 backdrop-blur-md">
                     <p className="text-[8px] font-black text-emerald-400 uppercase tracking-widest">Active Now</p>
                     <p className="text-xl font-black text-white">4 Buses</p>
                  </div>
                  <div className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 backdrop-blur-md">
                     <p className="text-[8px] font-black text-amber-400 uppercase tracking-widest">In Depot</p>
                     <p className="text-xl font-black text-white">8 Buses</p>
                  </div>
               </div>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="management" className="outline-none">
          <Card className="rounded-[2.5rem] border-none shadow-strong bg-card/40 backdrop-blur-md overflow-hidden">
            <CardHeader className="bg-emerald-500/5 border-b border-border/20 px-8 py-6">
              <CardTitle className="flex items-center gap-3 text-xl font-black uppercase tracking-tight">
                <Route className="h-6 w-6 text-emerald-600" /> Transport Network Control
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8">
              <TransportManagement centerId={centerId} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="compliance" className="outline-none">
          <Card className="rounded-[2.5rem] border-none shadow-strong bg-card/40 backdrop-blur-md overflow-hidden">
             <CardContent className="p-12 text-center space-y-4">
                <AlertCircle className="h-12 w-12 text-amber-500 mx-auto" />
                <h3 className="text-xl font-black uppercase tracking-tight">Maintenance & Licensing</h3>
                <p className="text-muted-foreground font-medium">Track vehicle insurance, fitness certificates, pollution checks, and driver licenses. (Coming in next release)</p>
             </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
