import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Bell, LucideIcon } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface AlertItem {
  id: string;
  title: string;
  description?: string;
  type: "success" | "warning" | "info" | "error";
  timestamp: string;
}

interface AlertListProps {
  alerts: AlertItem[];
  title?: string;
  className?: string;
  onItemClick?: (alert: AlertItem) => void;
}

export const AlertList = ({
  alerts,
  title = "Recent Alerts",
  className,
  onItemClick
}: AlertListProps) => {
  const typeIcons: Record<string, LucideIcon> = {
    success: Bell,
    warning: Bell,
    info: Bell,
    error: Bell,
  };

  const typeStyles: Record<string, string> = {
    success: "bg-green-500/10 text-green-600 border-green-600/20",
    warning: "bg-amber-500/10 text-amber-600 border-amber-600/20",
    info: "bg-blue-500/10 text-blue-600 border-blue-600/20",
    error: "bg-rose-500/10 text-rose-600 border-rose-600/20",
  };

  return (
    <Card className={cn("overflow-hidden border-none shadow-soft bg-white/60 backdrop-blur-md rounded-2xl border border-white/20", className)}>
      <CardHeader className="py-4 border-b border-muted/20">
        <CardTitle className="text-lg font-bold flex items-center gap-2">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {alerts.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground italic text-sm">
            No recent alerts.
          </div>
        ) : (
          <div className="divide-y divide-muted/10">
            {alerts.map((alert) => (
              <div
                key={alert.id}
                onClick={() => onItemClick?.(alert)}
                className={cn(
                  "p-4 flex gap-4 hover:bg-muted/5 transition-colors",
                  onItemClick && "cursor-pointer"
                )}
              >
                <div className={cn("p-2 rounded-full shrink-0 h-fit", typeStyles[alert.type])}>
                  <Bell className="h-4 w-4" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-slate-800 leading-none">{alert.title}</h4>
                  {alert.description && (
                    <p className="text-xs text-muted-foreground leading-tight">{alert.description}</p>
                  )}
                  <p className="text-[10px] font-medium text-muted-foreground/60 uppercase">
                    {formatDistanceToNow(new Date(alert.timestamp), { addSuffix: true })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
