import React, { useState, useEffect, useRef } from "react";
import {
  Building, MapPin, Phone, Mail, Globe,
  User, Hash, Calendar, Loader2
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { logger } from "@/utils/logger";
import { HeaderConfig, HeaderElement } from "../center/header-builder/types";
import { HeaderElementRenderer } from "../center/header-builder/HeaderElementRenderer";

export default function DashboardHeader() {
  const { user } = useAuth();
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  const { data: center, isLoading: isCenterLoading } = useQuery({
    queryKey: ["center-details", user?.center_id],
    queryFn: async () => {
      if (!user?.center_id) return null;
      const { data, error } = await supabase
        .from("centers")
        .select("*")
        .eq("id", user.center_id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!user?.center_id
  });

  const { data: currentYear } = useQuery({
    queryKey: ["current-academic-year", user?.center_id],
    queryFn: async () => {
      if (!user?.center_id) return null;
      const { data, error } = await supabase
        .from("academic_years")
        .select("name")
        .eq("center_id", user.center_id)
        .eq("is_current", true)
        .maybeSingle();
      if (error) logger.error("Error fetching academic year:", error);
      return data;
    },
    enabled: !!user?.center_id
  });

  const headerConfig = center?.header_config as unknown as HeaderConfig;

  // Calculate scale for responsive design
  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current && headerConfig?.designWidth) {
        const containerWidth = containerRef.current.offsetWidth;
        const newScale = containerWidth / headerConfig.designWidth;
        setScale(newScale);
      }
    };

    if (headerConfig) {
        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }
  }, [headerConfig]);

  if (isCenterLoading) {
    return (
      <div className="w-full h-32 flex items-center justify-center bg-card rounded-3xl animate-pulse">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  // Render Dynamic Header Builder Layout
  if (headerConfig && headerConfig.elements && headerConfig.elements.length > 0) {
    const baseHeight = parseInt(headerConfig.height) || 400;
    const responsiveHeight = baseHeight * scale;

    return (
      <Card
        ref={containerRef}
        className="border-none shadow-glass overflow-hidden rounded-[2.5rem] md:rounded-[4rem] mb-8 relative group/header transition-all duration-500"
        style={{
            height: `${responsiveHeight}px`,
            width: "100%",
            backgroundColor: headerConfig.backgroundColor || "white"
        }}
      >
        {/* Background Image Layer */}
        {headerConfig.backgroundUrl && (
          <div className="absolute inset-0 z-0">
            <img
              src={headerConfig.backgroundUrl}
              alt=""
              className="w-full h-full object-cover"
            />
            <div
              className="absolute inset-0"
              style={{
                backgroundColor: headerConfig.overlayColor || "black",
                opacity: (headerConfig.overlayOpacity ?? 0) / 100
              }}
            />
          </div>
        )}

        {/* Dynamic Elements Layer with Scaling */}
        <div
            className="absolute top-0 left-0 origin-top-left"
            style={{
                transform: `scale(${scale})`,
                width: `${headerConfig.designWidth}px`,
                height: headerConfig.height
            }}
        >
          {headerConfig.elements.map((el: HeaderElement) => (
            <HeaderElementRenderer key={el.id} element={el} />
          ))}
        </div>
      </Card>
    );
  }

  // Fallback to Legacy Template
  const header_overlay_opacity = (center?.header_overlay_opacity ?? 90) / 100;
  const details_font_color = (center?.theme as any)?.details_font_color || "#64748b";

  return (
    <Card
      className="border-none shadow-glass overflow-hidden rounded-[2.5rem] md:rounded-[4rem] bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl mb-8 relative group/header border border-white/20 transition-all duration-500"
      style={{ minHeight: center?.header_height || 'auto' }}
    >
      <div className="absolute inset-0 z-0 opacity-[0.015] dark:opacity-[0.03] pointer-events-none"
           style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23000000' fill-rule='evenodd'%3E%3Ccircle cx='50' cy='50' r='1'/%3E%3Cpath d='M10 10h1v1h-1zM90 10h1v1h-1zM10 90h1v1h-1zM90 90h1v1h-1z'/%3E%3Ctext x='45' y='15' font-family='serif' font-size='8' opacity='0.5'%3Eπ%3E%3C/text%3E%3Ctext x='85' y='45' font-family='serif' font-size='8' opacity='0.5'%3EΣ%3E%3C/text%3E%3Ctext x='15' y='85' font-family='serif' font-size='8' opacity='0.5'%3EΔ%3E%3C/text%3E%3Ctext x='75' y='85' font-family='serif' font-size='8' opacity='0.5'%3E∞%3E%3C/text%3E%3C/g%3E%3C/svg%3E")` }}
      />

      {center?.header_bg_url && (
        <div
          className="absolute inset-0 z-0 pointer-events-none bg-cover bg-center"
          style={{ backgroundImage: `url(${center?.header_bg_url})` }}
        />
      )}

      <div
        className="absolute inset-0 z-[1] pointer-events-none"
        style={{
          backgroundColor: center?.header_overlay_color || "rgba(255, 255, 255, 0.9)",
          opacity: header_overlay_opacity
        }}
      />

      <CardContent
        className="py-12 px-5 md:p-12 relative z-10 space-y-8 h-full flex flex-col justify-center"
        style={{
          fontFamily: center?.header_font_family || 'inherit',
          color: center?.header_font_color || 'inherit'
        }}
      >
        <div className="flex flex-col items-center justify-center gap-6">
          <div className="flex flex-col md:flex-row items-center gap-6 group/brand text-center">
             <div className="relative shrink-0">
                <div className="relative h-28 w-28 md:h-36 md:w-36 rounded-full overflow-hidden flex items-center justify-center border-4 border-white/50 shadow-soft backdrop-blur-md bg-white/20 transition-transform duration-500">
                  {center?.logo_url ? (
                    <img src={center.logo_url} alt="School Logo" className="h-full w-full object-cover drop-shadow-lg" />
                  ) : (
                    <Building className="h-14 w-14 text-primary/40" />
                  )}
                </div>
             </div>

             <div className="space-y-3">
                {center?.header_title_visible !== false && (
                  <h1
                    className="font-black tracking-tight leading-tight drop-shadow-lg"
                    style={{
                      textTransform: (center?.header_text_transform as "none" | "uppercase" | "lowercase" | "capitalize") || 'none',
                      fontSize: center?.header_font_size || 'clamp(1.5rem, 5vw, 4rem)',
                      fontFamily: center?.header_font_family || 'inherit'
                    }}
                  >
                    {center?.name || "Institution Name"}
                  </h1>
                )}

                {center?.header_address_visible !== false && (
                  <div className="flex items-center justify-center gap-2">
                    <MapPin className="h-4 w-4 text-primary" />
                    <span className="text-sm md:text-xl font-bold opacity-80">{center?.address || "Address not specified"}</span>
                  </div>
                )}
             </div>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6 pt-10 border-t border-black/5 dark:border-white/5">
              {center?.header_principal_visible !== false && (
                <CompactDetail
                  icon={User}
                  label="Principal"
                  value={center?.principal_name}
                  customColor={details_font_color}
                />
              )}
              {center?.header_code_visible !== false && (
                <CompactDetail
                  icon={Hash}
                  label="School Code"
                  value={center?.short_code}
                  customColor={details_font_color}
                />
              )}
              {center?.header_year_visible !== false && (
                <CompactDetail
                  icon={Calendar}
                  label="Academic Year"
                  value={currentYear?.name || "Not Set"}
                  customColor={details_font_color}
                />
              )}
              {center?.header_contact_visible !== false && (
                <CompactDetail
                  icon={Phone}
                  label="Contact"
                  value={center?.phone}
                  customColor={details_font_color}
                />
              )}
              {center?.header_email_visible !== false && (
                <CompactDetail
                  icon={Mail}
                  label="Email"
                  value={center?.email}
                  customColor={details_font_color}
                />
              )}
              {center?.header_website_visible !== false && (
                <CompactDetail
                  icon={Globe}
                  label="Website"
                  value={center?.website_url}
                  customColor={details_font_color}
                />
              )}
        </div>
      </CardContent>
    </Card>
  );
}

interface CompactDetailProps {
  icon: React.ElementType;
  label: string;
  value: string | undefined | null;
  customColor?: string;
}

function CompactDetail({ icon: Icon, label, value, customColor }: CompactDetailProps) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <div className="p-1.5 rounded-lg bg-primary/5 text-primary">
          <Icon className="h-4 w-4" />
        </div>
        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 leading-none">{label}</span>
      </div>
      <span
        className="text-xs md:text-sm font-black truncate leading-tight"
        style={{ color: customColor || 'inherit' }}
      >
        {value || "---"}
      </span>
    </div>
  );
}
