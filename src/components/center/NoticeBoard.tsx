import React from "react";
import { Megaphone, Bell, Calendar, Info, AlertTriangle, ArrowRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

export default function DigitalNoticeBoard({ centerId }: { centerId: string }) {
  const navigate = useNavigate();

  const { data: notifications = [] } = useQuery({
    queryKey: ["center-notifications-board", centerId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("center_id", centerId)
        .order("created_at", { ascending: false })
        .limit(10);
      if (error) throw error;
      return data;
    },
    enabled: !!centerId,
  });

  const { data: notices = [] } = useQuery({
    queryKey: ["digital-board-notices", centerId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("notices")
        .select("*")
        .eq("center_id", centerId)
        .order("created_at", { ascending: false })
        .limit(10);
      if (error) throw error;
      return data;
    },
    enabled: !!centerId,
  });

  const combinedEvents = [
    ...notices.map(n => ({ ...n, itemType: 'notice' })),
    ...notifications.map(n => ({ ...n, itemType: 'notification' }))
  ].sort((a, b) => new Date(b.created_at || "").getTime() - new Date(a.created_at || "").getTime())
   .slice(0, 15);

  return (
    <Card className="rounded-[2.5rem] border-none shadow-strong bg-indigo-900 text-white overflow-hidden h-fit">
      <CardHeader className="bg-white/10 border-b border-white/10 px-8 py-6">
        <div className="flex justify-between items-center">
          <CardTitle className="flex items-center gap-3 text-lg font-black uppercase tracking-tight">
            <Megaphone className="h-5 w-5 text-indigo-300" />
            Institutional Board
          </CardTitle>
          <Badge className="bg-indigo-500 text-white border-none font-black text-[8px] tracking-widest px-2">LIVE</Badge>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y divide-white/10 max-h-[400px] overflow-y-auto custom-scrollbar">
          {combinedEvents.length === 0 ? (
            <div className="p-12 text-center space-y-4">
              <Info className="h-10 w-10 text-indigo-300/30 mx-auto" />
              <p className="text-indigo-200 text-sm font-medium italic">The board is currently vacant.</p>
            </div>
          ) : (
            combinedEvents.map((item: any, idx) => (
              <div key={item.id || idx} className="p-5 hover:bg-white/5 transition-colors cursor-pointer group" onClick={() => item.link ? navigate(item.link) : navigate("/messages")}>
                <div className="flex justify-between items-start mb-2">
                   <div className="flex items-center gap-2">
                      {item.is_emergency || item.type === 'emergency' ? (
                         <div className="p-1 rounded-lg bg-rose-500"><AlertTriangle className="h-3 w-3 text-white" /></div>
                      ) : (
                         <div className="p-1 rounded-lg bg-indigo-500/50"><Bell className="h-3 w-3 text-indigo-100" /></div>
                      )}
                      <span className="text-[9px] font-black uppercase tracking-widest text-indigo-300">
                        {item.itemType === 'notice' ? `${item.target_audience} Notice` : item.type || 'System Alert'}
                      </span>
                   </div>
                   <span className="text-[9px] font-bold text-indigo-300/50">{format(new Date(item.created_at || ""), "MMM d")}</span>
                </div>
                <h4 className={cn(
                  "text-base font-black uppercase tracking-tight leading-tight mb-1 group-hover:text-indigo-300 transition-colors",
                  (item.is_emergency || item.type === 'emergency') ? "text-rose-300" : "text-white"
                )}>
                  {item.title}
                </h4>
                <p className="text-xs text-indigo-100/70 line-clamp-2 font-medium">{item.content || item.message}</p>
              </div>
            ))
          )}
        </div>
        <div className="p-4 bg-white/5 border-t border-white/10">
           <Button variant="ghost" className="w-full h-8 text-indigo-300 hover:text-white hover:bg-white/10 font-black text-[9px] uppercase tracking-widest gap-2" onClick={() => navigate("/notifications")}>
              Central Notification Archive <ArrowRight className="h-3 w-3" />
           </Button>
        </div>
      </CardContent>
    </Card>
  );
}
