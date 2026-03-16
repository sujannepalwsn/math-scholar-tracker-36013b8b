import React from "react";
import { Megaphone, Bell, Calendar, Info, AlertTriangle, ArrowRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";

export default function DigitalNoticeBoard({ centerId }: { centerId: string }) {
  const navigate = useNavigate();

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

  return (
    <Card className="rounded-[2.5rem] border-none shadow-strong bg-indigo-900 text-white overflow-hidden h-full">
      <CardHeader className="bg-white/10 border-b border-white/10 px-8 py-6">
        <div className="flex justify-between items-center">
          <CardTitle className="flex items-center gap-3 text-xl font-black uppercase tracking-tight">
            <Megaphone className="h-6 w-6 text-indigo-300" />
            Institutional Board
          </CardTitle>
          <Badge className="bg-indigo-500 text-white border-none font-black text-[10px] tracking-widest px-3">LIVE</Badge>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y divide-white/10 max-h-[500px] overflow-y-auto custom-scrollbar">
          {notices.length === 0 ? (
            <div className="p-12 text-center space-y-4">
              <Info className="h-12 w-12 text-indigo-300/30 mx-auto" />
              <p className="text-indigo-200 font-medium italic">The notice board is currently vacant.</p>
            </div>
          ) : (
            notices.map((notice) => (
              <div key={notice.id} className="p-6 hover:bg-white/5 transition-colors cursor-pointer group" onClick={() => navigate("/messages")}>
                <div className="flex justify-between items-start mb-2">
                   <div className="flex items-center gap-2">
                      {notice.is_emergency ? (
                         <div className="p-1.5 rounded-lg bg-rose-500"><AlertTriangle className="h-3.5 w-3.5 text-white" /></div>
                      ) : (
                         <div className="p-1.5 rounded-lg bg-indigo-500/50"><Bell className="h-3.5 w-3.5 text-indigo-100" /></div>
                      )}
                      <span className="text-[10px] font-black uppercase tracking-widest text-indigo-300">
                        {notice.target_audience} Notice
                      </span>
                   </div>
                   <span className="text-[10px] font-bold text-indigo-300/50">{format(new Date(notice.created_at || ""), "MMM d")}</span>
                </div>
                <h4 className={cn(
                  "text-lg font-black uppercase tracking-tight leading-none mb-2 group-hover:text-indigo-300 transition-colors",
                  notice.is_emergency ? "text-rose-300" : "text-white"
                )}>
                  {notice.title}
                </h4>
                <p className="text-sm text-indigo-100/70 line-clamp-2 font-medium">{notice.content}</p>
              </div>
            ))
          )}
        </div>
        <div className="p-6 bg-white/5">
           <Button variant="ghost" className="w-full text-indigo-300 hover:text-white hover:bg-white/10 font-black text-[10px] uppercase tracking-widest gap-2" onClick={() => navigate("/messages")}>
              View Message Archives <ArrowRight className="h-4 w-4" />
           </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function cn(...classes: any[]) {
  return classes.filter(Boolean).join(" ");
}
