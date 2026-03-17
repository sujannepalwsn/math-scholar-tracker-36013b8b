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
      const { data, error } = await supabase
        .from("academic_years")
        .select("name")
        .eq("center_id", user.center_id)
        .eq("is_current", true)
        .maybeSingle();

      // Try school_id if center_id fails (legacy compatibility)
      if (error || !data) {
         const { data: legacyData } = await supabase
          .from("academic_years")
          .select("name")
          .eq("school_id", user.center_id)
          .eq("is_current", true)
          .maybeSingle();
         return legacyData;
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
    if (!file || !user?.center_id) return;

    try {
      const fileExt = file.name.split('.').pop();
      const bucket = type === 'logo' ? 'center-logos' : 'center-backgrounds';
      const filePath = `${user.center_id}/${type}-${Math.random()}.${fileExt}`;

      // Check if bucket exists, if not we might need to handle it or assume it exists
      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(filePath);

      setFormData(prev => ({ ...prev, [type === 'logo' ? 'logo_url' : 'header_bg_url']: publicUrl }));
      toast.success(`${type === 'logo' ? 'Logo' : 'Background'} uploaded! Remember to save changes.`);
    } catch (error: any) {
      toast.error(`Error uploading ${type}: ` + error.message);
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
    <Card className="border-none shadow-strong overflow-hidden rounded-[2.5rem] bg-card/40 backdrop-blur-md border border-border/20 mb-8 relative">
      {/* Background Image Overlay */}
      {formData.header_bg_url && (
        <div
          className="absolute inset-0 z-0 opacity-20 pointer-events-none bg-cover bg-center"
          style={{ backgroundImage: `url(${formData.header_bg_url})` }}
        />
      )}

      <CardContent className="p-0 relative z-10">
        {isEditMode && (
          <div className="absolute top-4 left-4 z-20">
            <label className="p-2 rounded-xl bg-white/80 backdrop-blur-sm shadow-soft border border-border/50 cursor-pointer flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-primary hover:bg-primary hover:text-white transition-all">
              <ImageIcon className="h-4 w-4" />
              Change Background
              <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, 'bg')} />
            </label>
          </div>
        )}

        <div className="flex flex-row items-center lg:items-stretch">
          {/* Logo Section */}
          <div className="relative group w-24 md:w-32 lg:w-48 bg-primary/5 flex items-center justify-center p-4 md:p-6 lg:p-8 border-r border-border/10">
            <div className="relative h-16 w-16 md:h-24 md:w-24 lg:h-32 lg:w-32 rounded-2xl md:rounded-3xl overflow-hidden bg-white shadow-soft flex items-center justify-center border-2 md:border-4 border-white">
              {formData.logo_url ? (
                <img src={formData.logo_url} alt="School Logo" className="h-full w-full object-contain" />
              ) : (
                <div className="flex flex-col items-center gap-1 opacity-20">
                  <Building className="h-8 w-8 text-primary" />
                  {isEditMode && <span className="text-[8px] font-black uppercase">Upload Logo</span>}
                </div>
              )}
              {isEditMode && (
                <label className="absolute inset-0 bg-black/40 flex items-center justify-center cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity">
                  <Camera className="h-6 w-6 md:h-8 md:w-8 text-white" />
                  <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, 'logo')} />
                </label>
              )}
            </div>
          </div>

          {/* Details Section */}
          <div className="flex-1 p-4 md:p-6 lg:p-8 space-y-4 md:space-y-6 overflow-hidden">
            <div className="flex flex-row justify-between items-center md:items-start gap-4">
              <div className="space-y-1 md:space-y-2 flex-1 min-w-0">
                {isEditMode ? (
                  <Input
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="text-lg md:text-2xl lg:text-3xl font-black h-auto py-1 px-2 -ml-2 bg-white/50 border-primary/20"
                    placeholder="School Name"
                  />
                ) : (
                  <h1 className="text-lg md:text-2xl lg:text-4xl font-black tracking-tight text-foreground/90 truncate">
                    {formData.name || "School Name"}
                  </h1>
                )}

                <div className="flex items-center gap-2 text-muted-foreground">
                  <MapPin className="h-3 w-3 md:h-4 md:w-4 shrink-0 text-primary" />
                  {isEditMode ? (
                    <Input
                      name="address"
                      value={formData.address}
                      onChange={handleInputChange}
                      className="h-7 md:h-8 text-[10px] md:text-sm bg-white/50 border-primary/20"
                      placeholder="Address"
                    />
                  ) : (
                    <span className="text-[10px] md:text-sm font-medium truncate">{formData.address || "Address not specified"}</span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 md:gap-3">
                <div className="hidden md:flex flex-col items-end mr-2">
                  <p className="text-xs font-black text-foreground/90 leading-none">{user?.username?.split('@')[0]}</p>
                  <Badge variant="outline" className="mt-1 text-[9px] font-black uppercase tracking-widest border-primary/20 text-primary bg-primary/5">
                    {user?.role}
                  </Badge>
                </div>
                <NotificationBell />
                {canEdit && (
                  <Button
                    onClick={() => isEditMode ? setIsEditMode(false) : setIsEditMode(true)}
                    variant={isEditMode ? "outline" : "ghost"}
                    size="sm"
                    className={cn(
                      "rounded-xl font-black uppercase text-[10px] tracking-widest h-10 px-4",
                      isEditMode ? "border-2 border-rose-500 text-rose-500 hover:bg-rose-50" : "bg-primary/10 text-primary hover:bg-primary/20"
                    )}
                  >
                    {isEditMode ? <><X className="h-3.5 w-3.5 mr-2" /> Cancel</> : <><Edit2 className="h-3.5 w-3.5 mr-2" /> Edit Info</>}
                  </Button>
                )}
              </div>
            </div>

            {/* Grid of details */}
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-y-3 gap-x-4 md:gap-x-8 pt-3 md:pt-4 border-t border-border/10">
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

function DetailItem({ icon: Icon, label, value, isEdit, name, onChange }: any) {
  return (
    <div className="flex items-start gap-3 group">
      <div className="p-2 rounded-xl bg-muted/50 text-primary group-hover:bg-primary group-hover:text-white transition-colors duration-300">
        <Icon className="h-3.5 w-3.5" />
      </div>
      <div className="space-y-0.5 flex-1 min-w-0">
        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{label}</p>
        {isEdit ? (
          <Input
            name={name}
            value={value}
            onChange={onChange}
            className="h-7 text-xs px-2 bg-white/50 border-primary/10 rounded-lg focus-visible:ring-primary/20"
          />
        ) : (
          <p className="text-sm font-bold text-foreground/80 truncate">{value || "---"}</p>
        )}
      </div>
    </div>
  );
}
