import React, { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { Bus, Plus, Trash2, MapPin, Navigation, User, Users } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

export default function TransportManagement({ centerId }: { centerId: string }) {
  const queryClient = useQueryClient();
  const [showAddRoute, setShowAddRoute] = useState(false);
  const [showAddVehicle, setShowAddVehicle] = useState(false);
  const [showAddAssignment, setShowAddAssignment] = useState(false);
  const [routeForm, setRouteForm] = useState({ name: "", start: "", end: "" });
  const [vehicleForm, setVehicleForm] = useState({ number: "", capacity: "32", driver: "", phone: "" });
  const [assignForm, setAssignForm] = useState({ studentId: "", routeId: "", vehicleId: "" });

  const { data: students } = useQuery({
    queryKey: ["students", centerId],
    queryFn: async () => {
      const { data, error } = await supabase.from("students").select("*").eq("center_id", centerId).eq("is_active", true);
      if (error) throw error;
      return data;
    },
  });

  const { data: routes } = useQuery({
    queryKey: ["transport-routes", centerId],
    queryFn: async () => {
      const { data, error } = await supabase.from("bus_routes").select("*").eq("center_id", centerId);
      if (error) throw error;
      return data;
    },
  });

  const { data: vehicles } = useQuery({
    queryKey: ["transport-vehicles", centerId],
    queryFn: async () => {
      const { data, error } = await supabase.from("vehicles").select("*").eq("center_id", centerId);
      if (error) throw error;
      return data;
    },
  });

  const { data: assignments } = useQuery({
    queryKey: ["transport-assignments", centerId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("transport_assignments")
        .select("*, students(name, grade), bus_routes(route_name), vehicles(vehicle_number)");
      if (error) throw error;
      return data;
    },
  });

  const addRouteMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("bus_routes").insert({
        center_id: centerId,
        route_name: routeForm.name,
        start_point: routeForm.start,
        end_point: routeForm.end,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transport-routes"] });
      setRouteForm({ name: "", start: "", end: "" });
      setShowAddRoute(false);
      toast.success("Bus route added");
    }
  });

  const addVehicleMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("vehicles").insert({
        center_id: centerId,
        vehicle_number: vehicleForm.number,
        capacity: parseInt(vehicleForm.capacity),
        driver_name: vehicleForm.driver,
        driver_phone: vehicleForm.phone,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transport-vehicles"] });
      setVehicleForm({ number: "", capacity: "32", driver: "", phone: "" });
      setShowAddVehicle(false);
      toast.success("Vehicle added to fleet");
    }
  });

  const assignTransportMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("transport_assignments").insert({
        student_id: assignForm.studentId,
        route_id: assignForm.routeId,
        vehicle_id: assignForm.vehicleId,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transport-assignments"] });
      setAssignForm({ studentId: "", routeId: "", vehicleId: "" });
      setShowAddAssignment(false);
      toast.success("Transport assigned to student");
    }
  });

  return (
    <div className="space-y-6">
      <Tabs defaultValue="routes">
        <TabsList className="bg-slate-100 p-1 rounded-xl h-12">
          <TabsTrigger value="routes" className="rounded-lg px-6 font-bold text-xs uppercase tracking-widest">Bus Routes</TabsTrigger>
          <TabsTrigger value="vehicles" className="rounded-lg px-6 font-bold text-xs uppercase tracking-widest">Fleet Management</TabsTrigger>
          <TabsTrigger value="assignments" className="rounded-lg px-6 font-bold text-xs uppercase tracking-widest">Assignments</TabsTrigger>
        </TabsList>

        <TabsContent value="routes" className="space-y-4 pt-4">
          <div className="flex justify-end">
            <Button onClick={() => setShowAddRoute(!showAddRoute)} className="rounded-xl font-bold uppercase text-[10px] tracking-widest">
              {showAddRoute ? "Cancel" : "Add New Route"}
            </Button>
          </div>

          {showAddRoute && (
            <Card className="rounded-2xl border-none shadow-soft bg-blue-50">
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="space-y-1">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-blue-800/60">Route Name</Label>
                    <Input value={routeForm.name} onChange={(e) => setRouteForm({...routeForm, name: e.target.value})} className="h-10 rounded-lg" placeholder="Route A" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-blue-800/60">Start Point</Label>
                    <Input value={routeForm.start} onChange={(e) => setRouteForm({...routeForm, start: e.target.value})} className="h-10 rounded-lg" placeholder="Main Station" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-blue-800/60">End Point</Label>
                    <Input value={routeForm.end} onChange={(e) => setRouteForm({...routeForm, end: e.target.value})} className="h-10 rounded-lg" placeholder="School Campus" />
                  </div>
                  <div className="flex items-end">
                    <Button onClick={() => addRouteMutation.mutate()} className="w-full h-10 rounded-lg font-black uppercase text-[10px] tracking-widest bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-200">Save Route</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {routes?.map((r: any) => (
              <Card key={r.id} className="rounded-2xl border-none shadow-soft hover:shadow-medium transition-all group overflow-hidden">
                <div className="h-1.5 bg-blue-500 w-full" />
                <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600">
                      <Navigation className="h-5 w-5" />
                    </div>
                    <Badge variant="secondary" className="text-[9px] font-black uppercase tracking-widest">Active</Badge>
                  </div>
                  <h4 className="font-black text-slate-800 uppercase tracking-tight text-lg mb-4">{r.route_name}</h4>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <MapPin className="h-3.5 w-3.5 text-slate-400" />
                      <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                        From: <span className="text-slate-800">{r.start_point}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <MapPin className="h-3.5 w-3.5 text-slate-400" />
                      <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                        To: <span className="text-slate-800">{r.end_point}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="vehicles" className="space-y-4 pt-4">
          <div className="flex justify-end">
            <Button onClick={() => setShowAddVehicle(!showAddVehicle)} className="rounded-xl font-bold uppercase text-[10px] tracking-widest">
              {showAddVehicle ? "Cancel" : "Add Vehicle"}
            </Button>
          </div>

          {showAddVehicle && (
            <Card className="rounded-2xl border-none shadow-soft bg-emerald-50">
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                  <div className="space-y-1">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-emerald-800/60">Vehicle No</Label>
                    <Input value={vehicleForm.number} onChange={(e) => setVehicleForm({...vehicleForm, number: e.target.value})} className="h-10 rounded-lg" placeholder="BA-1-KA-1234" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-emerald-800/60">Capacity</Label>
                    <Input type="number" value={vehicleForm.capacity} onChange={(e) => setVehicleForm({...vehicleForm, capacity: e.target.value})} className="h-10 rounded-lg" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-emerald-800/60">Driver Name</Label>
                    <Input value={vehicleForm.driver} onChange={(e) => setVehicleForm({...vehicleForm, driver: e.target.value})} className="h-10 rounded-lg" placeholder="John Doe" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-emerald-800/60">Contact No</Label>
                    <Input value={vehicleForm.phone} onChange={(e) => setVehicleForm({...vehicleForm, phone: e.target.value})} className="h-10 rounded-lg" placeholder="98XXXXXXXX" />
                  </div>
                  <div className="flex items-end">
                    <Button onClick={() => addVehicleMutation.mutate()} className="w-full h-10 rounded-lg font-black uppercase text-[10px] tracking-widest bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-200">Commit</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="border rounded-2xl overflow-hidden bg-white shadow-soft">
            <Table>
              <TableHeader className="bg-slate-50">
                <TableRow>
                  <TableHead className="font-black text-[10px] uppercase tracking-widest">Vehicle No</TableHead>
                  <TableHead className="font-black text-[10px] uppercase tracking-widest">Capacity</TableHead>
                  <TableHead className="font-black text-[10px] uppercase tracking-widest">Driver</TableHead>
                  <TableHead className="font-black text-[10px] uppercase tracking-widest">Contact</TableHead>
                  <TableHead className="font-black text-[10px] uppercase tracking-widest text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {vehicles?.map((v: any) => (
                  <TableRow key={v.id}>
                    <TableCell className="font-bold uppercase tracking-widest text-sm">{v.vehicle_number}</TableCell>
                    <TableCell><Badge variant="outline" className="font-black text-[9px]">{v.capacity} Seats</Badge></TableCell>
                    <TableCell className="font-bold text-slate-700">{v.driver_name}</TableCell>
                    <TableCell className="text-blue-600 font-bold">{v.driver_phone}</TableCell>
                    <TableCell className="text-right">
                       <Button variant="ghost" size="icon" className="text-rose-500"><Trash2 className="h-4 w-4" /></Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="assignments" className="space-y-4 pt-4">
          <div className="flex justify-end">
            <Button onClick={() => setShowAddAssignment(!showAddAssignment)} className="rounded-xl font-bold uppercase text-[10px] tracking-widest">
              {showAddAssignment ? "Cancel" : "New Assignment"}
            </Button>
          </div>

          {showAddAssignment && (
            <Card className="rounded-2xl border-none shadow-soft bg-indigo-50">
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="space-y-1">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-indigo-800/60">Student</Label>
                    <select
                      value={assignForm.studentId}
                      onChange={(e) => setAssignForm({...assignForm, studentId: e.target.value})}
                      className="w-full h-10 rounded-lg border border-input bg-background px-3 py-2 text-sm"
                    >
                      <option value="">Select Student</option>
                      {students?.map((s: any) => <option key={s.id} value={s.id}>{s.name} (Grade {s.grade})</option>)}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-indigo-800/60">Route</Label>
                    <select
                      value={assignForm.routeId}
                      onChange={(e) => setAssignForm({...assignForm, routeId: e.target.value})}
                      className="w-full h-10 rounded-lg border border-input bg-background px-3 py-2 text-sm"
                    >
                      <option value="">Select Route</option>
                      {routes?.map((r: any) => <option key={r.id} value={r.id}>{r.route_name}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-indigo-800/60">Vehicle</Label>
                    <select
                      value={assignForm.vehicleId}
                      onChange={(e) => setAssignForm({...assignForm, vehicleId: e.target.value})}
                      className="w-full h-10 rounded-lg border border-input bg-background px-3 py-2 text-sm"
                    >
                      <option value="">Select Vehicle</option>
                      {vehicles?.map((v: any) => <option key={v.id} value={v.id}>{v.vehicle_number}</option>)}
                    </select>
                  </div>
                  <div className="flex items-end">
                    <Button onClick={() => assignTransportMutation.mutate()} className="w-full h-10 rounded-lg font-black uppercase text-[10px] tracking-widest bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-200">Assign Student</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="border rounded-2xl overflow-hidden bg-white shadow-soft">
            <Table>
              <TableHeader className="bg-slate-50">
                <TableRow>
                  <TableHead className="font-black text-[10px] uppercase tracking-widest">Student</TableHead>
                  <TableHead className="font-black text-[10px] uppercase tracking-widest">Grade</TableHead>
                  <TableHead className="font-black text-[10px] uppercase tracking-widest">Route</TableHead>
                  <TableHead className="font-black text-[10px] uppercase tracking-widest">Vehicle</TableHead>
                  <TableHead className="font-black text-[10px] uppercase tracking-widest text-right">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {assignments?.map((a: any) => (
                  <TableRow key={a.id}>
                    <TableCell className="font-bold">{a.students?.name}</TableCell>
                    <TableCell className="text-xs">Grade {a.students?.grade}</TableCell>
                    <TableCell className="text-xs font-bold text-blue-600">{a.bus_routes?.route_name}</TableCell>
                    <TableCell className="text-xs font-black">{a.vehicles?.vehicle_number}</TableCell>
                    <TableCell className="text-right">
                       <Badge variant="success" className="text-[9px] uppercase font-black">Assigned</Badge>
                    </TableCell>
                  </TableRow>
                ))}
                {assignments?.length === 0 && (
                   <TableRow>
                     <TableCell colSpan={5} className="text-center py-12 text-slate-400 italic">No transport assignments discovered.</TableCell>
                   </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
