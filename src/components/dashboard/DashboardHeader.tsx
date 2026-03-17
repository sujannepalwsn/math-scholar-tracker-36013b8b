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
import { format } from "date-fns";
import NotificationBell from "@/components/NotificationBell";
import { Badge } from "@/components/ui/badge";

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
    header_bg_url: ""
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

      // We only use center_id as the primary filter to avoid 400 errors if columns don't exist
      const { data, error } = await supabase
        .from("academic_years")
        .select("name")
        .eq("center_id", user.center_id)
        .eq("is_current", true)
        .maybeSingle();

      if (error) {
        console.error("Error fetching academic year with center_id:", error);
        // Fallback or retry logic if needed, but avoid sending invalid column names
      }

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
        header_bg_url: center.header_bg_url || ""
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
          header_bg_url: formData.header_bg_url
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
      toast.error("Center ID not found. Please log in again.");
      return;
    }

    const toastId = toast.loading(`Uploading institutional ${type}...`);

    try {
      console.log(`Starting upload for ${type}:`, { name: file.name, size: file.size, type: file.type });

      const fileExt = file.name.split('.').pop();
      const bucket = type === 'logo' ? 'center-logos' : 'center-backgrounds';
      const filePath = `${user.center_id}/${type}-${Date.now()}.${fileExt}`;

      const { data, error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true
        });

      if (uploadError) {
        console.error("Supabase Storage Error:", uploadError);
        throw new Error(uploadError.message || "Upload to storage failed");
      }

      console.log("Upload successful, fetching public URL...", data);

      const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(filePath);

      setFormData(prev => ({ ...prev, [type === 'logo' ? 'logo_url' : 'header_bg_url']: publicUrl }));
      toast.dismiss(toastId);
      toast.success(`${type === 'logo' ? 'Logo' : 'Background'} ready! Click "Save Changes" to apply.`);
    } catch (error: any) {
      console.error("Institutional File Upload Detail:", error);
      toast.dismiss(toastId);
      toast.error(`Upload failed: ${error.message || "Unknown error"}. Please check file permissions.`);
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
    <Card className="border-none shadow-elevated overflow-hidden rounded-[3.5rem] bg-white mb-8 relative">
      {/* Background Image Overlay */}
      {formData.header_bg_url && (
        <div
          className="absolute inset-0 z-0 opacity-10 pointer-events-none bg-cover bg-center"
          style={{ backgroundImage: `url(${formData.header_bg_url})` }}
        />
      )}

      <CardContent className="p-6 md:p-10 relative z-10 space-y-6 md:space-y-8">
        {/* Top Navigation Row: Name, Bell, Edit */}
        <div className="flex flex-row justify-between items-start gap-4">
          <div className="space-y-1.5 flex-1 min-w-0">
            {isEditMode ? (
              <Input
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className="text-xl md:text-3xl font-black h-auto py-1 px-3 -ml-3 bg-slate-50 border-primary/20 rounded-xl"
                placeholder="School Name"
              />
            ) : (
              <h1 className="text-2xl md:text-4xl font-black tracking-tight text-slate-800 truncate">
                {formData.name || "School Name"}
              </h1>
            )}

            <div className="flex items-center gap-2 text-[#4285f4]">
              <MapPin className="h-4 w-4 md:h-5 md:w-5 shrink-0" />
              {isEditMode ? (
                <Input
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  className="h-8 md:h-10 text-xs md:text-sm bg-slate-50 border-primary/20 rounded-xl"
                  placeholder="Address"
                />
              ) : (
                <span className="text-xs md:text-base font-bold truncate opacity-80">{formData.address || "Address not specified"}</span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 md:gap-4 shrink-0">
            <div className="p-1 rounded-full bg-white shadow-soft border border-slate-100">
              <NotificationBell />
            </div>
            {canEdit && (
              <Button
                onClick={() => isEditMode ? setIsEditMode(false) : setIsEditMode(true)}
                variant="ghost"
                className={cn(
                  "rounded-2xl font-black uppercase text-[10px] md:text-xs tracking-widest h-12 md:h-14 px-4 md:px-8 shadow-sm transition-all active:scale-95",
                  isEditMode
                    ? "bg-rose-100 text-rose-600 hover:bg-rose-200"
                    : "bg-[#dbeafe] text-[#3b82f6] hover:bg-[#bfdbfe]"
                )}
              >
                {isEditMode ? (
                  <><X className="h-4 w-4 md:mr-2" /> <span className="hidden md:inline">Cancel</span></>
                ) : (
                  <><Edit2 className="h-4 w-4 md:mr-2" /> <span>EDIT INFO</span></>
                )}
              </Button>
            )}
          </div>
        </div>

        {/* Content Row: Logo and Details Grid */}
        <div className="flex flex-row gap-3 md:gap-12 items-start">
          {/* Logo Section */}
          <div className="relative group shrink-0">
            <div className="relative h-20 w-20 sm:h-32 sm:w-32 md:h-48 md:w-48 rounded-2xl sm:rounded-[2.5rem] overflow-hidden flex items-center justify-center p-2 sm:p-6 border-2 sm:border-4 border-white/40 shadow-soft backdrop-blur-sm">
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
              <div className="mt-3 flex justify-center">
                <label className="p-2 rounded-xl bg-white shadow-soft border border-slate-100 cursor-pointer flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-primary hover:bg-primary hover:text-white transition-all">
                  <ImageIcon className="h-4 w-4" />
                  Background
                  <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, 'bg')} />
                </label>
              </div>
            )}
          </div>

          {/* Details Grid */}
          <div className="flex-1 min-w-0">
            <div className="grid grid-cols-2 gap-y-3 md:gap-y-8 gap-x-2 md:gap-x-12">
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
          <div className="bg-primary/5 p-4 flex justify-end gap-4 border-t border-border/10">
            <Button
              onClick={() => updateCenterMutation.mutate()}
              disabled={updateCenterMutation.isPending}
              className="rounded-2xl h-12 px-8 font-black uppercase text-xs tracking-widest bg-gradient-to-r from-primary to-violet-600 shadow-soft"
            >
              {updateCenterMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Save Changes
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
    <div className="flex items-center gap-1.5 md:gap-4 group">
      <div className="p-1.5 md:p-3 rounded-full bg-[#f0f7ff] text-[#4285f4] group-hover:bg-[#4285f4] group-hover:text-white transition-all duration-300 shadow-soft shrink-0">
        <Icon className="h-3 w-3 md:h-5 md:w-5" />
      </div>
      <div className="space-y-0 flex-1 min-w-0">
        <p className="text-[7px] md:text-[11px] font-black uppercase tracking-widest text-slate-400 leading-none">{label}</p>
        {isEdit ? (
          <Input
            name={name}
            value={value}
            onChange={onChange}
            className="h-6 md:h-10 text-[9px] md:text-sm px-1.5 mt-0.5 bg-slate-50 border-primary/10 rounded-md md:rounded-xl focus-visible:ring-primary/20"
          />
        ) : (
          <p className="text-[9px] md:text-lg font-black text-slate-700 truncate tracking-tight mt-0.5 leading-tight">{value || "---"}</p>
        )}
      </div>
    </div>
  );
}
