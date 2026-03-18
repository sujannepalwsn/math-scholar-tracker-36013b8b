import React, { useState, useEffect } from "react";
import {
  Building, Edit2, Save, X, MapPin, Phone, Mail, Globe,
  User, Hash, Calendar, Loader2, Camera, Image as ImageIcon
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
    header_overlay_opacity: 90
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

  useEffect(() => {
    if (center) {
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
        header_overlay_color: (center as any).header_overlay_color || "rgba(255, 255, 255, 0.9)",
        header_overlay_opacity: (center as any).header_overlay_opacity || 90
      });
    }
  }, [center]);

  const updateCenterMutation = useMutation({
    mutationFn: async () => {
      if (!user?.center_id) throw new Error("Center ID not found");
      const { error } = await supabase
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
          header_overlay_opacity: formData.header_overlay_opacity
        })
        .eq("id", user.center_id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["center-details"] });
      queryClient.invalidateQueries({ queryKey: ["center-logo"] });
      toast.success("School details updated successfully!");
      setIsEditMode(false);
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to update school details");
    }
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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
      const oldUrl = type === 'logo' ? formData.logo_url : formData.header_bg_url;

      const fileExt = file.name.split('.').pop();
      const bucket = type === 'logo' ? 'center-logos' : 'center-backgrounds';
      const filePath = `${user.center_id}/${type}-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(filePath, file, { cacheControl: '3600', upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage.from(bucket).getPublicUrl(filePath);

      // Delete old file if it exists
      if (oldUrl) {
        try {
          const oldPath = oldUrl.split(`${bucket}/`)[1];
          if (oldPath) {
            await supabase.storage.from(bucket).remove([oldPath]);
          }
        } catch (err) {
          console.error("Error deleting old file:", err);
        }
      }

      setFormData(prev => ({ ...prev, [type === 'logo' ? 'logo_url' : 'header_bg_url']: publicUrl }));
      toast.dismiss(toastId);
      toast.success(`${type === 'logo' ? 'Logo' : 'Background'} ready!`);
    } catch (error: any) {
      toast.dismiss(toastId);
      toast.error(`Upload failed: ${error.message}`);
    }
  };

  const removeBackground = async () => {
    if (!formData.header_bg_url) return;
    const toastId = toast.loading("Removing background...");
    try {
      const bucket = 'center-backgrounds';
      const oldPath = formData.header_bg_url.split(`${bucket}/`)[1];
      if (oldPath) {
        await supabase.storage.from(bucket).remove([oldPath]);
      }
      setFormData(prev => ({ ...prev, header_bg_url: "" }));
      toast.dismiss(toastId);
      toast.success("Background removed!");
    } catch (error: any) {
      toast.dismiss(toastId);
      toast.error("Failed to remove background");
    }
  };

  if (isCenterLoading) {
    return (
      <div className="w-full h-32 flex items-center justify-center bg-card rounded-3xl animate-pulse">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  const canEdit = user?.role === 'center';

  return (
    <Card className="border-none shadow-elevated overflow-hidden rounded-[2rem] md:rounded-[2.5rem] bg-white mb-6 relative max-w-5xl mx-auto">
      {/* Background Image */}
      {formData.header_bg_url && (
        <div
          className="absolute inset-0 z-0 pointer-events-none bg-cover bg-center"
          style={{ backgroundImage: `url(${formData.header_bg_url})` }}
        />
      )}

      {/* Dynamic Overlay */}
      <div
        className="absolute inset-0 z-[1] pointer-events-none"
        style={{
          backgroundColor: formData.header_overlay_color || "rgba(255, 255, 255, 0.9)",
          opacity: (formData.header_overlay_opacity || 90) / 100
        }}
      />

      <CardContent className="p-4 md:p-6 relative z-10 space-y-4 md:space-y-6">
        {/* Centered Name and Address */}
        <div className="flex flex-col items-center text-center space-y-1 relative">
          <div className="w-full">
            {isEditMode ? (
              <Input
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className="text-lg md:text-2xl font-black h-auto py-1 px-3 bg-slate-50 border-primary/20 rounded-xl text-center max-w-xl mx-auto"
                placeholder="School Name"
              />
            ) : (
              <h1 className="text-xl md:text-3xl font-black tracking-tight text-slate-800 break-words max-w-3xl mx-auto">
                {formData.name || "School Name"}
              </h1>
            )}
          </div>

          <div className="flex flex-col items-center gap-1 text-[#4285f4] w-full">
            {isEditMode ? (
              <div className="flex items-center gap-2 max-w-lg mx-auto w-full">
                <MapPin className="h-3 w-3 shrink-0" />
                <Input
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  className="h-7 md:h-8 text-[10px] md:text-xs bg-slate-50 border-primary/20 rounded-xl text-center"
                  placeholder="Address"
                />
              </div>
            ) : (
              <div className="flex items-center justify-center gap-1.5 max-w-2xl mx-auto">
                <MapPin className="h-3.5 w-3.5 md:h-4 md:w-4 shrink-0" />
                <span className="text-[10px] md:text-sm font-bold opacity-80 break-words">{formData.address || "Address not specified"}</span>
              </div>
            )}
          </div>

          {/* Icon-only Edit/Cancel Button at top-right of the card content area */}
          {canEdit && (
            <div className="absolute top-0 right-0">
              <Button
                onClick={() => isEditMode ? setIsEditMode(false) : setIsEditMode(true)}
                variant="ghost"
                className={cn(
                  "rounded-full p-2 h-10 w-10 md:h-12 md:w-12 shadow-sm transition-all active:scale-95",
                  isEditMode
                    ? "bg-rose-100 text-rose-600 hover:bg-rose-200"
                    : "bg-[#dbeafe] text-[#3b82f6] hover:bg-[#bfdbfe]"
                )}
                title={isEditMode ? "Cancel" : "Edit Info"}
              >
                {isEditMode ? <X className="h-5 w-5 md:h-6 md:w-6" /> : <Edit2 className="h-5 w-5 md:h-6 md:w-6" />}
              </Button>
            </div>
          )}
        </div>

        {/* Content Row: Logo (shifted left) and Details Grid (fully visible text) */}
        <div className="flex flex-row gap-3 md:gap-8 items-start">
          {/* Logo Section - Shifted Slightly Left */}
          <div className="relative group shrink-0 -ml-1 md:-ml-2">
            <div className="relative h-14 w-14 sm:h-24 sm:w-24 md:h-32 md:w-32 rounded-full overflow-hidden flex items-center justify-center p-1 sm:p-3 border-2 md:border-4 border-white shadow-soft backdrop-blur-sm bg-white/10">
              {formData.logo_url ? (
                <img src={formData.logo_url} alt="School Logo" className="h-full w-full object-contain drop-shadow-md" />
              ) : (
                <div className="flex flex-col items-center gap-2 opacity-20">
                  <Building className="h-12 w-12 text-primary" />
                  {isEditMode && <span className="text-[10px] font-black uppercase">Upload Logo</span>}
                </div>
              )}
              {isEditMode && (
                <label className="absolute inset-0 bg-black/40 flex items-center justify-center cursor-pointer opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity">
                  <Camera className="h-8 w-8 text-white" />
                  <input
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={(e) => handleFileUpload(e, 'logo')}
                  />
                </label>
              )}
            </div>
            {isEditMode && (
              <div className="mt-3 flex flex-col gap-2 items-center">
                <div className="flex gap-1 w-full">
                  <label className="flex-1 p-1.5 rounded-xl bg-white shadow-soft border border-slate-100 cursor-pointer flex items-center justify-center gap-1 text-[8px] font-black uppercase tracking-tighter text-primary hover:bg-primary hover:text-white transition-all">
                    <ImageIcon className="h-3 w-3" />
                    BG
                    <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, 'bg')} />
                  </label>
                  {formData.header_bg_url && (
                    <Button
                      variant="ghost"
                      onClick={removeBackground}
                      className="p-1.5 h-auto rounded-xl bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-100 shadow-soft"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  )}
                </div>

                <div className="flex flex-col gap-1.5 p-2 bg-white/80 backdrop-blur-sm rounded-2xl border border-slate-100 shadow-soft w-full">
                  <div className="space-y-1">
                    <Label className="text-[8px] font-black uppercase tracking-widest text-slate-400">Overlay Color</Label>
                    <div className="flex gap-1.5 items-center">
                      <input
                        type="color"
                        value={formData.header_overlay_color.startsWith('rgba') ? '#ffffff' : formData.header_overlay_color}
                        onChange={(e) => setFormData(prev => ({ ...prev, header_overlay_color: e.target.value }))}
                        className="w-5 h-5 rounded-full border-none cursor-pointer overflow-hidden"
                      />
                      <Input
                        value={formData.header_overlay_color}
                        onChange={(e) => setFormData(prev => ({ ...prev, header_overlay_color: e.target.value }))}
                        className="h-5 text-[8px] px-1 font-bold bg-transparent border-none focus-visible:ring-0"
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between items-center">
                      <Label className="text-[8px] font-black uppercase tracking-widest text-slate-400">Opacity</Label>
                      <span className="text-[8px] font-black text-primary">{formData.header_overlay_opacity}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={formData.header_overlay_opacity}
                      onChange={(e) => setFormData(prev => ({ ...prev, header_overlay_opacity: parseInt(e.target.value) }))}
                      className="w-full h-1 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-primary"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Details Grid - Ensuring full visibility with 2-column horizontal layout on mobile */}
          <div className="flex-1 min-w-0 mt-2">
            <div className="grid grid-cols-2 gap-y-4 md:gap-y-6 gap-x-2 md:gap-x-10">
              <DetailItem
                icon={User}
                label="Principal"
                name="principal_name"
                value={formData.principal_name}
                isEdit={isEditMode}
                onChange={handleInputChange}
              />
              <DetailItem
                icon={Hash}
                label="School Code"
                name="short_code"
                value={formData.short_code}
                isEdit={isEditMode}
                onChange={handleInputChange}
              />
              <DetailItem
                icon={Calendar}
                label="Academic Year"
                value={currentYear?.name || "Not Set"}
                isEdit={false}
              />
              <DetailItem
                icon={Phone}
                label="Contact"
                name="phone"
                value={formData.phone}
                isEdit={isEditMode}
                onChange={handleInputChange}
              />
              <DetailItem
                icon={Mail}
                label="Email"
                name="email"
                value={formData.email}
                isEdit={isEditMode}
                onChange={handleInputChange}
              />
              <DetailItem
                icon={Globe}
                label="Website"
                name="website_url"
                value={formData.website_url}
                isEdit={isEditMode}
                onChange={handleInputChange}
              />
            </div>
          </div>
        </div>

        {/* Action Bar for Edit Mode */}
        {isEditMode && (
          <div className="bg-primary/5 p-4 flex justify-end gap-4 border-t border-border/10 rounded-b-[2rem]">
            <Button
              onClick={() => updateCenterMutation.mutate()}
              disabled={updateCenterMutation.isPending}
              className="rounded-full h-12 w-12 p-0 font-black uppercase text-xs tracking-widest bg-gradient-to-r from-primary to-violet-600 shadow-soft"
              title="Save Changes"
            >
              {updateCenterMutation.isPending ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Save className="h-5 w-5" />
              )}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface DetailItemProps {
  icon: React.ElementType;
  label: string;
  value: string;
  isEdit?: boolean;
  name?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

function DetailItem({ icon: Icon, label, value, isEdit, name, onChange }: DetailItemProps) {
  return (
    <div className="flex items-center gap-1.5 md:gap-3 group">
      <div className="p-1.5 md:p-2.5 rounded-full bg-[#f0f7ff] text-[#4285f4] group-hover:bg-[#4285f4] group-hover:text-white transition-all duration-300 shadow-soft shrink-0">
        <Icon className="h-3 w-3 md:h-4 md:w-4" />
      </div>
      <div className="space-y-0 flex-1 min-w-0">
        <p className="text-[6px] md:text-[10px] font-black uppercase tracking-widest text-slate-400 leading-none">{label}</p>
        {isEdit ? (
          <Input
            name={name}
            value={value}
            onChange={onChange}
            className="h-6 md:h-9 text-[9px] md:text-xs px-1.5 mt-0.5 bg-slate-50 border-primary/10 rounded-md md:rounded-xl focus-visible:ring-primary/20"
          />
        ) : (
          <p className="text-[9px] md:text-sm font-black text-slate-700 break-words tracking-tight mt-0.5 leading-tight">{value || "---"}</p>
        )}
      </div>
    </div>
  );
}
