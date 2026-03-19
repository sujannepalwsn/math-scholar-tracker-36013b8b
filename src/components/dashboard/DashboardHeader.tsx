import React, { useState, useEffect } from "react";
import {
  Building, Edit2, Save, X, MapPin, Phone, Mail, Globe,
  User, Hash, Calendar, Loader2, Camera, Image as ImageIcon,
  Eye, EyeOff
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

  useEffect(() => {
    if (center && !isEditMode) {
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
        header_overlay_opacity: (center as any).header_overlay_opacity || 90,
        header_font_family: (center as any).header_font_family || "Inter",
        header_font_color: (center as any).header_font_color || "#1e293b",
        header_font_size: (center as any).header_font_size || "normal",
        header_text_transform: (center as any).header_text_transform || "none",
        header_title_visible: (center as any).header_title_visible !== false,
        header_address_visible: (center as any).header_address_visible !== false,
        header_principal_visible: (center as any).header_principal_visible !== false,
        header_code_visible: (center as any).header_code_visible !== false,
        header_year_visible: (center as any).header_year_visible !== false,
        header_contact_visible: (center as any).header_contact_visible !== false,
        header_email_visible: (center as any).header_email_visible !== false,
        header_website_visible: (center as any).header_website_visible !== false
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
          header_overlay_opacity: formData.header_overlay_opacity,
          header_font_family: formData.header_font_family,
          header_font_color: formData.header_font_color,
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
        .eq("id", user.center_id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["center-details"] });
      queryClient.invalidateQueries({ queryKey: ["center-branding"] });
      queryClient.invalidateQueries({ queryKey: ["center-logo"] });
      toast.success("School details updated successfully!");
      setIsEditMode(false);
    },
    onError: (error: any) => {
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
    } catch (error: any) {
      toast.dismiss(toastId);
      toast.error(`Upload failed: ${error.message}`);
    }
  };

  if (isCenterLoading) {
    return (
      <div className="w-full h-32 flex items-center justify-center bg-card rounded-3xl animate-pulse">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  const canEdit = user?.role === 'center' || (user?.role === 'teacher' && user.teacherPermissions?.settings_access === true);

  return (
    <Card className="border-none shadow-elevated overflow-hidden rounded-[2.5rem] md:rounded-[3.5rem] bg-white mb-8 relative">
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

      <CardContent
        className="p-6 md:p-10 relative z-10 space-y-6 md:space-y-8"
        style={{
          fontFamily: formData.header_font_family || 'inherit',
          color: formData.header_font_color || 'inherit'
        }}
      >
        {/* Centered Name and Address */}
        <div className="flex flex-col items-center text-center space-y-2 relative">
          {(isEditMode || formData.header_title_visible) && (
            <div className="w-full relative group/item">
              {isEditMode ? (
                <div className="relative max-w-2xl mx-auto">
                  <Input
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="text-xl md:text-3xl font-black h-auto py-1 px-3 bg-slate-50 border-primary/20 rounded-xl text-center pr-10"
                    style={{
                      fontSize: formData.header_font_size === 'large' ? '2.5rem' : formData.header_font_size === 'small' ? '1.5rem' : '2rem',
                      color: formData.header_font_color || 'inherit',
                      fontFamily: formData.header_font_family || 'inherit',
                      textTransform: formData.header_text_transform as any,
                      opacity: formData.header_title_visible ? 1 : 0.5
                    }}
                    placeholder="School Name"
                  />
                  <button
                    onClick={() => setFormData(prev => ({ ...prev, header_title_visible: !prev.header_title_visible }))}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-md hover:bg-slate-200 transition-colors"
                  >
                    {formData.header_title_visible ? <Eye className="h-4 w-4 text-primary" /> : <EyeOff className="h-4 w-4 text-slate-400" />}
                  </button>
                </div>
              ) : (
                <h1
                  className="text-2xl md:text-4xl font-black tracking-tight break-words max-w-4xl mx-auto"
                  style={{
                    fontSize: formData.header_font_size === 'large' ? '3rem' : formData.header_font_size === 'small' ? '1.5rem' : '2.25rem',
                    color: formData.header_font_color || '#1e293b',
                    fontFamily: formData.header_font_family || 'inherit',
                    textTransform: formData.header_text_transform as any
                  }}
                >
                  {formData.name || "School Name"}
                </h1>
              )}
            </div>
          )}

          {(isEditMode || formData.header_address_visible) && (
            <div className="flex flex-col items-center gap-1 w-full" style={{ color: formData.header_font_color || '#4285f4' }}>
              {isEditMode ? (
                <div className="flex items-center gap-2 max-w-xl mx-auto w-full relative group/item">
                  <MapPin className="h-4 w-4 shrink-0" />
                  <Input
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    className="h-8 md:h-10 text-xs md:text-sm bg-slate-50 border-primary/20 rounded-xl text-center pr-10"
                    style={{
                      color: formData.header_font_color || 'inherit',
                      opacity: formData.header_address_visible ? 1 : 0.5
                    }}
                    placeholder="Address"
                  />
                  <button
                    onClick={() => setFormData(prev => ({ ...prev, header_address_visible: !prev.header_address_visible }))}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-md hover:bg-slate-200 transition-colors"
                  >
                    {formData.header_address_visible ? <Eye className="h-4 w-4 text-primary" /> : <EyeOff className="h-4 w-4 text-slate-400" />}
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-center gap-2 max-w-3xl mx-auto">
                  <MapPin className="h-4 w-4 md:h-5 md:w-5 shrink-0" />
                  <span className="text-xs md:text-lg font-bold opacity-80 break-words">{formData.address || "Address not specified"}</span>
                </div>
              )}
            </div>
          )}

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
        <div className="flex flex-row gap-3 md:gap-10 items-start">
          {/* Logo Section - Shifted Slightly Left */}
          <div className="relative group shrink-0 -ml-1 md:-ml-4">
            <div className="relative h-16 w-16 sm:h-32 sm:w-32 md:h-52 md:w-52 rounded-xl sm:rounded-[2.5rem] overflow-hidden flex items-center justify-center p-1.5 sm:p-6 border-2 sm:border-4 border-white/40 shadow-soft backdrop-blur-sm bg-white/10">
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
                <label className="p-2 w-full rounded-xl bg-white shadow-soft border border-slate-100 cursor-pointer flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest text-primary hover:bg-primary hover:text-white transition-all">
                  <ImageIcon className="h-4 w-4" />
                  Background
                  <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, 'bg')} />
                </label>

                <div className="flex flex-col gap-2 p-3 bg-white/80 backdrop-blur-sm rounded-2xl border border-slate-100 shadow-soft w-full max-w-[200px] max-h-[300px] overflow-y-auto custom-scrollbar">
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

                  <div className="space-y-1 pt-1 border-t border-slate-100">
                    <Label className="text-[8px] font-black uppercase tracking-widest text-slate-400">Font Family</Label>
                    <select
                      value={formData.header_font_family}
                      onChange={(e) => setFormData(prev => ({ ...prev, header_font_family: e.target.value }))}
                      className="w-full h-6 text-[8px] font-bold bg-slate-50 border-none rounded-md px-1 outline-none"
                    >
                      <option value="Inter">Inter</option>
                      <option value="Algerian">Algerian</option>
                      <option value="Roboto">Roboto</option>
                      <option value="Poppins">Poppins</option>
                      <option value="Montserrat">Montserrat</option>
                      <option value="Open Sans">Open Sans</option>
                      <option value="Playfair Display">Playfair Display</option>
                      <option value="Georgia">Georgia</option>
                      <option value="Times New Roman">Times New Roman</option>
                      <option value="Arial">Arial</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-[8px] font-black uppercase tracking-widest text-slate-400">Font Color</Label>
                    <div className="flex gap-1.5 items-center">
                      <input
                        type="color"
                        value={formData.header_font_color}
                        onChange={(e) => setFormData(prev => ({ ...prev, header_font_color: e.target.value }))}
                        className="w-5 h-5 rounded-full border-none cursor-pointer overflow-hidden"
                      />
                      <Input
                        value={formData.header_font_color}
                        onChange={(e) => setFormData(prev => ({ ...prev, header_font_color: e.target.value }))}
                        className="h-5 text-[8px] px-1 font-bold bg-transparent border-none focus-visible:ring-0"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-[8px] font-black uppercase tracking-widest text-slate-400">Font Size</Label>
                    <div className="flex gap-1 bg-slate-50 p-0.5 rounded-md">
                      {['small', 'normal', 'large'].map((size) => (
                        <button
                          key={size}
                          onClick={() => setFormData(prev => ({ ...prev, header_font_size: size }))}
                          className={cn(
                            "flex-1 h-5 text-[7px] font-black uppercase rounded-sm transition-all",
                            formData.header_font_size === size ? "bg-white shadow-sm text-primary" : "text-slate-400"
                          )}
                        >
                          {size}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-[8px] font-black uppercase tracking-widest text-slate-400">Text Case</Label>
                    <div className="flex gap-1 bg-slate-50 p-0.5 rounded-md">
                      {[
                        { id: 'none', label: 'Default' },
                        { id: 'uppercase', label: 'UPPER' },
                        { id: 'lowercase', label: 'lower' },
                        { id: 'capitalize', label: 'Title' }
                      ].map((transform) => (
                        <button
                          key={transform.id}
                          onClick={() => setFormData(prev => ({ ...prev, header_text_transform: transform.id }))}
                          className={cn(
                            "flex-1 h-5 text-[6px] font-black uppercase rounded-sm transition-all",
                            formData.header_text_transform === transform.id ? "bg-white shadow-sm text-primary" : "text-slate-400"
                          )}
                        >
                          {transform.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Details Grid - Ensuring full visibility with 2-column horizontal layout on mobile */}
          <div className="flex-1 min-w-0">
            <div className="grid grid-cols-2 gap-y-3 md:gap-y-10 gap-x-2 md:gap-x-14">
              {(isEditMode || formData.header_principal_visible) && (
                <DetailItem
                  icon={User}
                  label="Principal"
                  name="principal_name"
                  value={formData.principal_name}
                  isEdit={isEditMode}
                  onChange={handleInputChange}
                  isVisible={formData.header_principal_visible}
                  onToggleVisibility={() => setFormData(prev => ({ ...prev, header_principal_visible: !prev.header_principal_visible }))}
                />
              )}
              {(isEditMode || formData.header_code_visible) && (
                <DetailItem
                  icon={Hash}
                  label="School Code"
                  name="short_code"
                  value={formData.short_code}
                  isEdit={isEditMode}
                  onChange={handleInputChange}
                  isVisible={formData.header_code_visible}
                  onToggleVisibility={() => setFormData(prev => ({ ...prev, header_code_visible: !prev.header_code_visible }))}
                />
              )}
              {(isEditMode || formData.header_year_visible) && (
                <DetailItem
                  icon={Calendar}
                  label="Academic Year"
                  value={currentYear?.name || "Not Set"}
                  isEdit={false}
                  isVisible={formData.header_year_visible}
                  onToggleVisibility={() => setFormData(prev => ({ ...prev, header_year_visible: !prev.header_year_visible }))}
                />
              )}
              {(isEditMode || formData.header_contact_visible) && (
                <DetailItem
                  icon={Phone}
                  label="Contact"
                  name="phone"
                  value={formData.phone}
                  isEdit={isEditMode}
                  onChange={handleInputChange}
                  isVisible={formData.header_contact_visible}
                  onToggleVisibility={() => setFormData(prev => ({ ...prev, header_contact_visible: !prev.header_contact_visible }))}
                />
              )}
              {(isEditMode || formData.header_email_visible) && (
                <DetailItem
                  icon={Mail}
                  label="Email"
                  name="email"
                  value={formData.email}
                  isEdit={isEditMode}
                  onChange={handleInputChange}
                  isVisible={formData.header_email_visible}
                  onToggleVisibility={() => setFormData(prev => ({ ...prev, header_email_visible: !prev.header_email_visible }))}
                />
              )}
              {(isEditMode || formData.header_website_visible) && (
                <DetailItem
                  icon={Globe}
                  label="Website"
                  name="website_url"
                  value={formData.website_url}
                  isEdit={isEditMode}
                  onChange={handleInputChange}
                  isVisible={formData.header_website_visible}
                  onToggleVisibility={() => setFormData(prev => ({ ...prev, header_website_visible: !prev.header_website_visible }))}
                />
              )}
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
  isVisible?: boolean;
  onToggleVisibility?: () => void;
}

function DetailItem({ icon: Icon, label, value, isEdit, name, onChange, isVisible, onToggleVisibility }: DetailItemProps) {
  return (
    <div className={cn(
      "flex items-center gap-1.5 md:gap-5 group relative",
      isEdit && !isVisible && "opacity-50"
    )}>
      <div className="p-1.5 md:p-3.5 rounded-full bg-[#f0f7ff] text-[#4285f4] group-hover:bg-[#4285f4] group-hover:text-white transition-all duration-300 shadow-soft shrink-0">
        <Icon className="h-3 w-3 md:h-5 md:w-5" />
      </div>
      <div className="space-y-0.5 flex-1 min-w-0 pr-6">
        <p className="text-[7px] md:text-[11px] font-black uppercase tracking-widest text-slate-400 leading-none">{label}</p>
        {isEdit ? (
          <Input
            name={name}
            value={value}
            onChange={onChange}
            className="h-6 md:h-11 text-[9px] md:text-sm px-1.5 mt-0.5 bg-slate-50 border-primary/10 rounded-md md:rounded-xl focus-visible:ring-primary/20"
          />
        ) : (
          <p className="text-[9px] md:text-lg font-black text-slate-700 break-words tracking-tight mt-0.5 leading-tight">{value || "---"}</p>
        )}
      </div>
      {isEdit && (
        <button
          onClick={onToggleVisibility}
          className="absolute right-0 top-1/2 -translate-y-1/2 p-1 rounded-md hover:bg-slate-100 transition-colors"
        >
          {isVisible ? <Eye className="h-3 w-3 md:h-4 md:w-4 text-primary" /> : <EyeOff className="h-3 w-3 md:h-4 md:w-4 text-slate-400" />}
        </button>
      )}
    </div>
  );
}
