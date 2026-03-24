import React, { useState, useEffect } from "react";
import {
  Building, Edit2, Save, X, MapPin, Phone, Mail, Globe,
  User, Hash, Calendar, Loader2, Camera, Image as ImageIcon,
  Eye, EyeOff, Sparkles
} from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { compressImage } from "@/lib/image-utils";
import { hasPermission, hasActionPermission } from "@/utils/permissions";

export default function DashboardHeader() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isEditMode, setIsEditMode] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    address: "",
    phone: "",
    email: "",
    principal_name: "",
    short_code: "",
    website_url: "",
    logo_url: "",
    header_bg_url: "",
    header_overlay_color: "rgba(255, 255, 255, 0.9)",
    header_overlay_opacity: 90,
    header_font_family: "Inter",
    header_font_color: "#1e293b",
    details_font_color: "#64748b",
    header_font_size: "normal",
    header_text_transform: "none",
    header_title_visible: true,
    header_address_visible: true,
    header_principal_visible: true,
    header_code_visible: true,
    header_year_visible: true,
    header_contact_visible: true,
    header_email_visible: true,
    header_website_visible: true
  });

  const { data: center, isLoading: isCenterLoading } = useQuery({
    queryKey: ["center-details", user?.center_id],
    queryFn: async () => {
      if (!user?.center_id) return null;
      const { data, error } = await supabase
        .from("centers")
        .select("*")
        .eq("id", user.center_id)
        .single();
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
      if (error) console.error("Error fetching academic year:", error);
      return data;
    },
    enabled: !!user?.center_id
  });

  // Keep track of when we last saved to prevent immediate re-syncing while refetching
  const [lastSaved, setLastSaved] = useState<number>(0);

  useEffect(() => {
    // Only sync from DB if NOT editing AND we aren't in the middle of a post-save refetch
    const isRecentlySaved = Date.now() - lastSaved < 2000;

    if (center && !isEditMode && !isRecentlySaved) {
      setFormData({
        name: center.name || "",
        address: center.address || "",
        phone: center.phone || "",
        email: center.email || "",
        principal_name: center.principal_name || "",
        short_code: center.short_code || "",
        website_url: center.website_url || "",
        logo_url: center.logo_url || "",
        header_bg_url: center.header_bg_url || "",
        header_overlay_color: center.header_overlay_color || "rgba(255, 255, 255, 0.9)",
        header_overlay_opacity: center.header_overlay_opacity || 90,
        header_font_family: center.header_font_family || "Inter",
        header_font_color: center.header_font_color || "#1e293b",
        details_font_color: (center.theme as any)?.details_font_color || "#64748b",
        header_font_size: center.header_font_size || "normal",
        header_text_transform: center.header_text_transform || "none",
        header_title_visible: center.header_title_visible !== false,
        header_address_visible: center.header_address_visible !== false,
        header_principal_visible: center.header_principal_visible !== false,
        header_code_visible: center.header_code_visible !== false,
        header_year_visible: center.header_year_visible !== false,
        header_contact_visible: center.header_contact_visible !== false,
        header_email_visible: center.header_email_visible !== false,
        header_website_visible: center.header_website_visible !== false
      });
    }
  }, [center, isEditMode, lastSaved]);

  const updateCenterMutation = useMutation({
    mutationFn: async () => {
      if (!user?.center_id) throw new Error("Center ID not found");
      const { data, error } = await supabase
        .from("centers")
        .update({
          name: formData.name,
          address: formData.address,
          phone: formData.phone,
          email: formData.email,
          principal_name: formData.principal_name,
          short_code: formData.short_code,
          website_url: formData.website_url,
          logo_url: formData.logo_url,
          header_bg_url: formData.header_bg_url,
          header_overlay_color: formData.header_overlay_color,
          header_overlay_opacity: formData.header_overlay_opacity,
          header_font_family: formData.header_font_family,
          header_font_color: formData.header_font_color,
          theme: { ...(center?.theme as any || {}), details_font_color: formData.details_font_color },
          header_font_size: formData.header_font_size,
          header_text_transform: formData.header_text_transform,
          header_title_visible: formData.header_title_visible,
          header_address_visible: formData.header_address_visible,
          header_principal_visible: formData.header_principal_visible,
          header_code_visible: formData.header_code_visible,
          header_year_visible: formData.header_year_visible,
          header_contact_visible: formData.header_contact_visible,
          header_email_visible: formData.header_email_visible,
          header_website_visible: formData.header_website_visible
        })
        .eq("id", user.center_id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (updatedData) => {
      setLastSaved(Date.now());

      // Update the query cache with the ACTUAL data returned from the server
      queryClient.setQueryData(["center-details", user?.center_id], updatedData);

      queryClient.invalidateQueries({ queryKey: ["center-details"] });
      queryClient.invalidateQueries({ queryKey: ["center-about"] }); // Cross-invalidate AboutInstitution
      queryClient.invalidateQueries({ queryKey: ["center-branding"] });
      queryClient.invalidateQueries({ queryKey: ["center-logo"] });
      toast.success("School details updated successfully!");
      setIsEditMode(false);
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to update school details");
    }
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'logo' | 'bg') => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!user?.center_id) {
      toast.error("Center ID not found.");
      return;
    }
    const toastId = toast.loading(`Uploading institutional ${type}...`);
    try {
      // Compress image before upload
      const compressedFile = await compressImage(file, 100);

      const fileExt = file.name.split('.').pop();
      const bucket = type === 'logo' ? 'center-logos' : 'center-backgrounds';
      const filePath = `${user.center_id}/${type}-${Date.now()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(filePath, compressedFile, { cacheControl: '3600', upsert: true });
      if (uploadError) throw uploadError;
      const { data: { publicUrl } } = supabase.storage.from(bucket).getPublicUrl(filePath);
      setFormData(prev => ({ ...prev, [type === 'logo' ? 'logo_url' : 'header_bg_url']: publicUrl }));
      toast.dismiss(toastId);
      toast.success(`${type === 'logo' ? 'Logo' : 'Background'} ready!`);
    } catch (error) {
      toast.dismiss(toastId);
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
      toast.error(`Upload failed: ${errorMessage}`);
    }
  };

  if (isCenterLoading) {
    return (
      <div className="w-full h-32 flex items-center justify-center bg-card rounded-3xl animate-pulse">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  const canEdit = hasActionPermission(user, 'settings_access', 'edit');

  return (
    <Card className="border-none shadow-glass overflow-hidden rounded-[2.5rem] md:rounded-[4rem] bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl mb-8 relative group/header border border-white/20">
      {/* Premium Scholarly Mathematical Pattern Overlay - Subtle dots and symbols */}
      <div className="absolute inset-0 z-0 opacity-[0.015] dark:opacity-[0.03] pointer-events-none"
           style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23000000' fill-rule='evenodd'%3E%3Ccircle cx='50' cy='50' r='1'/%3E%3Cpath d='M10 10h1v1h-1zM90 10h1v1h-1zM10 90h1v1h-1zM90 90h1v1h-1z'/%3E%3Ctext x='45' y='15' font-family='serif' font-size='8' opacity='0.5'%3Eπ%3E%3C/text%3E%3Ctext x='85' y='45' font-family='serif' font-size='8' opacity='0.5'%3EΣ%3E%3C/text%3E%3Ctext x='15' y='85' font-family='serif' font-size='8' opacity='0.5'%3EΔ%3E%3C/text%3E%3Ctext x='75' y='85' font-family='serif' font-size='8' opacity='0.5'%3E∞%3E%3C/text%3E%3C/g%3E%3C/svg%3E")` }}
      />

      {/* Background Image */}
      {center?.header_bg_url && (
        <div
          className="absolute inset-0 z-0 pointer-events-none bg-cover bg-center"
          style={{ backgroundImage: `url(${center?.header_bg_url})` }}
        />
      )}

      {/* Dynamic Overlay */}
      <div
        className="absolute inset-0 z-[1] pointer-events-none"
        style={{
          backgroundColor: center?.header_overlay_color || "rgba(255, 255, 255, 0.9)",
          opacity: (center?.header_overlay_opacity || 90) / 100
        }}
      />

      <CardContent
        className="p-5 md:p-12 relative z-10 space-y-6 md:space-y-12"
        style={{
          fontFamily: center?.header_font_family || 'inherit',
          color: center?.header_font_color || 'inherit'
        }}
      >
        {/* Header Top Section: Branding & Modern KPIs */}
        <div className="flex flex-col lg:flex-row items-center lg:items-start justify-center lg:justify-between gap-6 md:gap-8">
          {/* School Branding Section */}
          <div className="flex flex-col md:flex-row items-center gap-4 md:gap-6 group/brand text-center md:text-left">
             <div className="relative shrink-0">
                <div className="relative h-20 w-20 md:h-28 md:w-28 rounded-full overflow-hidden flex items-center justify-center p-2 md:p-4 border-4 border-white/50 shadow-soft backdrop-blur-md bg-white/20 group-hover/brand:scale-105 transition-transform duration-500">
                  {formData.logo_url ? (
                    <img src={formData.logo_url} alt="School Logo" className="h-full w-full object-contain drop-shadow-lg" />
                  ) : (
                    <Building className="h-10 w-10 text-primary/40" />
                  )}
                  {isEditMode && (
                    <label className="absolute inset-0 bg-black/40 flex items-center justify-center cursor-pointer opacity-100 transition-opacity">
                      <Camera className="h-6 w-6 text-white" />
                      <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, 'logo')} />
                    </label>
                  )}
                </div>
                <div className="absolute bottom-0 right-0 h-6 w-6 md:h-8 md:w-8 rounded-full bg-primary text-white flex items-center justify-center shadow-lg border-2 border-white">
                  <Sparkles className="h-3 w-3 md:h-4 md:w-4" />
                </div>
             </div>

             <div className="space-y-1 md:space-y-2">
                {(isEditMode || formData.header_title_visible) && (
                  <div className="relative">
                    {isEditMode ? (
                      <Input
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        className="text-lg md:text-2xl font-black h-auto py-1 px-3 bg-white/50 border-primary/20 rounded-xl text-center md:text-left"
                        style={{
                          textTransform: (center?.header_text_transform as "none" | "uppercase" | "lowercase" | "capitalize") || 'none'
                        }}
                      />
                    ) : (
                      <h1
                        className="text-xl md:text-5xl font-black tracking-tight leading-none whitespace-nowrap overflow-hidden text-ellipsis max-w-[85vw] md:max-w-none"
                        style={{
                          textTransform: (center?.header_text_transform as "none" | "uppercase" | "lowercase" | "capitalize") || 'none',
                          // Responsive font resizing logic for mobile one-line display
                          fontSize: center?.header_font_size === 'large' ? 'clamp(1.5rem, 6vw, 3.5rem)' :
                                    center?.header_font_size === 'small' ? 'clamp(1rem, 4vw, 2rem)' :
                                    'clamp(1.25rem, 5vw, 2.75rem)'
                        }}
                      >
                        {center?.name || "School Name"}
                      </h1>
                    )}
                  </div>
                )}

                {(isEditMode || formData.header_address_visible) && (
                  <div className="flex items-center justify-center md:justify-start gap-2 text-muted-foreground">
                    <MapPin className="h-3 w-3 md:h-4 md:w-4 text-primary" />
                    {isEditMode ? (
                      <Input
                        name="address"
                        value={formData.address}
                        onChange={handleInputChange}
                        className="h-8 text-xs bg-white/50 border-primary/10 rounded-lg"
                      />
                    ) : (
                      <span className="text-xs md:text-lg font-bold opacity-70">{center?.address || "Address not specified"}</span>
                    )}
                  </div>
                )}
             </div>
          </div>
        </div>

        {/* Detailed Information Row */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 md:gap-8 pt-6 md:pt-8 border-t border-black/5 dark:border-white/5">
              {(isEditMode || formData.header_principal_visible) && (
                <CompactDetail
                  icon={User}
                  label="Principal"
                  name="principal_name"
                  value={formData.principal_name}
                  isEdit={isEditMode}
                  onChange={handleInputChange}
                  isVisible={formData.header_principal_visible}
                  onToggleVisibility={() => setFormData(prev => ({ ...prev, header_principal_visible: !prev.header_principal_visible }))}
                  customColor={formData.details_font_color}
                />
              )}
              {(isEditMode || formData.header_code_visible) && (
                <CompactDetail
                  icon={Hash}
                  label="School Code"
                  name="short_code"
                  value={formData.short_code}
                  isEdit={isEditMode}
                  onChange={handleInputChange}
                  isVisible={formData.header_code_visible}
                  onToggleVisibility={() => setFormData(prev => ({ ...prev, header_code_visible: !prev.header_code_visible }))}
                  customColor={formData.details_font_color}
                />
              )}
              {(isEditMode || formData.header_year_visible) && (
                <CompactDetail
                  icon={Calendar}
                  label="Academic Year"
                  value={currentYear?.name || "Not Set"}
                  isEdit={false}
                  isVisible={formData.header_year_visible}
                  onToggleVisibility={() => setFormData(prev => ({ ...prev, header_year_visible: !prev.header_year_visible }))}
                  customColor={formData.details_font_color}
                />
              )}
              {(isEditMode || formData.header_contact_visible) && (
                <CompactDetail
                  icon={Phone}
                  label="Contact"
                  name="phone"
                  value={formData.phone}
                  isEdit={isEditMode}
                  onChange={handleInputChange}
                  isVisible={formData.header_contact_visible}
                  onToggleVisibility={() => setFormData(prev => ({ ...prev, header_contact_visible: !prev.header_contact_visible }))}
                  customColor={formData.details_font_color}
                />
              )}
              {(isEditMode || formData.header_email_visible) && (
                <CompactDetail
                  icon={Mail}
                  label="Email"
                  name="email"
                  value={formData.email}
                  isEdit={isEditMode}
                  onChange={handleInputChange}
                  isVisible={formData.header_email_visible}
                  onToggleVisibility={() => setFormData(prev => ({ ...prev, header_email_visible: !prev.header_email_visible }))}
                  customColor={formData.details_font_color}
                />
              )}
              {(isEditMode || formData.header_website_visible) && (
                <CompactDetail
                  icon={Globe}
                  label="Website"
                  name="website_url"
                  value={formData.website_url}
                  isEdit={isEditMode}
                  onChange={handleInputChange}
                  isVisible={formData.header_website_visible}
                  onToggleVisibility={() => setFormData(prev => ({ ...prev, header_website_visible: !prev.header_website_visible }))}
                  customColor={formData.details_font_color}
                />
              )}
        </div>

        {/* Floating Action Buttons */}
        <div className="absolute top-6 right-6 flex items-center gap-2">
          {isEditMode && (
            <Button
              onClick={() => updateCenterMutation.mutate()}
              disabled={updateCenterMutation.isPending}
              size="icon"
              className="rounded-2xl h-10 w-10 md:h-12 md:w-12 bg-emerald-500 hover:bg-emerald-600 shadow-lg text-white transition-all scale-in"
            >
              {updateCenterMutation.isPending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
            </Button>
          )}

          {canEdit && (
            <Button
              onClick={() => setIsEditMode(!isEditMode)}
              variant="ghost"
              size="icon"
              className={cn(
                "rounded-2xl h-10 w-10 md:h-12 md:w-12 shadow-sm transition-all",
                isEditMode ? "bg-rose-100 text-rose-600" : "bg-primary/10 text-primary hover:bg-primary/20"
              )}
            >
              {isEditMode ? <X className="h-5 w-5" /> : <Edit2 className="h-5 w-5" />}
            </Button>
          )}
        </div>

        {/* Edit Mode Customization Panel (Optional Background Trigger) */}
        {isEditMode && (
          <div className="absolute bottom-6 left-12 flex items-center gap-6 bg-white/90 backdrop-blur-md p-3 rounded-2xl shadow-xl border border-primary/10 animate-in slide-in-from-bottom-4 overflow-x-auto max-w-[80vw]">
             <Label className="cursor-pointer flex items-center gap-2 text-[10px] font-black uppercase tracking-widest px-3 py-1.5 hover:bg-primary/10 rounded-xl transition-colors shrink-0">
                <ImageIcon className="h-4 w-4" /> Change Background
                <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, 'bg')} />
             </Label>

             <div className="flex items-center gap-4 border-l pl-4 border-primary/10 shrink-0">
                <div className="flex flex-col gap-1">
                  <span className="text-[8px] font-black uppercase text-slate-400">Main Font</span>
                  <input
                    type="color"
                    value={formData.header_font_color}
                    onChange={(e) => setFormData(prev => ({ ...prev, header_font_color: e.target.value }))}
                    className="h-6 w-10 cursor-pointer rounded bg-transparent"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-[8px] font-black uppercase text-slate-400">Details Font</span>
                  <input
                    type="color"
                    value={formData.details_font_color}
                    onChange={(e) => setFormData(prev => ({ ...prev, details_font_color: e.target.value }))}
                    className="h-6 w-10 cursor-pointer rounded bg-transparent"
                  />
                </div>
             </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface CompactDetailProps {
  icon: React.ElementType;
  label: string;
  value: string;
  isEdit: boolean;
  name?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  isVisible: boolean;
  onToggleVisibility: () => void;
  customColor?: string;
}

function CompactDetail({ icon: Icon, label, value, isEdit, name, onChange, isVisible, onToggleVisibility, customColor }: CompactDetailProps) {
  return (
    <div className={cn(
      "flex flex-col gap-1.5 md:gap-2 group/item relative",
      isEdit && !isVisible && "opacity-40"
    )}>
      <div className="flex items-center gap-2">
        <div className="p-1 md:p-1.5 rounded-lg bg-primary/5 text-primary group-hover/item:bg-primary group-hover/item:text-white transition-colors">
          <Icon className="h-3 w-3 md:h-3.5 md:w-3.5" />
        </div>
        <span className="text-[8px] md:text-[9px] font-black uppercase tracking-[0.15em] text-slate-400 leading-none">{label}</span>
      </div>

      {isEdit ? (
        <div className="relative">
          <Input
            name={name}
            value={value}
            onChange={onChange}
            className="h-7 md:h-8 text-[10px] md:text-xs bg-white/40 border-primary/10 rounded-lg pr-8 focus-visible:ring-primary/20"
          />
          <button
            onClick={onToggleVisibility}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-primary/40 hover:text-primary transition-colors"
          >
            {isVisible ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
          </button>
        </div>
      ) : (
        <span
          className="text-[11px] md:text-sm font-black truncate leading-tight"
          style={{ color: customColor || 'inherit' }}
        >
          {value || "---"}
        </span>
      )}
    </div>
  );
}
