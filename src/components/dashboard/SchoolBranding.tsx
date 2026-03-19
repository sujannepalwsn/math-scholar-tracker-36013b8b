import React from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Building, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";

interface SchoolBrandingProps {
  className?: string;
}

export default function SchoolBranding({ className }: SchoolBrandingProps) {
  const { user } = useAuth();

  const { data: center } = useQuery({
    queryKey: ["center-branding", user?.center_id],
    queryFn: async () => {
      if (!user?.center_id) return null;
      const { data, error } = await supabase
        .from("centers")
        .select("name, logo_url, address, header_font_family, header_font_color, header_text_transform")
        .eq("id", user.center_id)
        .single();
      if (error) return null;
      return data;
    },
    enabled: !!user?.center_id,
    staleTime: 1000 * 60 * 5,
  });

  if (!center && !user?.center_name) return null;

  return (
    <div className={cn("flex flex-col items-center text-center px-2 py-1", className)}>
      <div className="flex items-center gap-3">
        <div className="h-8 w-8 rounded-full overflow-hidden bg-primary/5 flex items-center justify-center border border-primary/10 shrink-0 shadow-sm">
          {center?.logo_url ? (
            <img
              src={center.logo_url}
              alt="Logo"
              className="h-full w-full object-contain"
            />
          ) : (
            <Building className="h-4 w-4 text-primary" />
          )}
        </div>
        <div className="flex flex-col items-start min-w-0">
          <h2
            className="text-sm font-black truncate max-w-[200px] md:max-w-[300px] leading-tight"
            style={{
              fontFamily: center?.header_font_family || 'inherit',
              color: center?.header_font_color || 'inherit',
              textTransform: (center as any)?.header_text_transform as any || 'none'
            }}
          >
            {center?.name || user?.center_name}
          </h2>
          {center?.address && (
            <div className="flex items-center gap-1 opacity-70">
              <MapPin className="h-2.5 w-2.5 shrink-0" />
              <p className="text-[10px] font-bold truncate max-w-[180px] md:max-w-[250px]">
                {center.address}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
