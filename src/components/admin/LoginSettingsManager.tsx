import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Loader2, Upload, Trash2, Image as ImageIcon } from "lucide-react";

const PAGE_TYPES = [
  { id: 'center', label: 'Center Portal' },
  { id: 'admin', label: 'Admin Portal' },
  { id: 'parent', label: 'Parent Portal' },
  { id: 'teacher', label: 'Teacher Portal' },
];

const LoginSettingsManager = () => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('center');

  const { data: settings, isLoading } = useQuery({
    queryKey: ['login_page_settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('login_page_settings')
        .select('*');
      if (error) throw error;
      return data;
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (updatedSettings: any) => {
      const { error } = await supabase
        .from('login_page_settings')
        .update(updatedSettings)
        .eq('page_type', updatedSettings.page_type);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['login_page_settings'] });
      toast.success("Settings updated successfully");
    },
    onError: (error) => {
      toast.error(`Error updating settings: ${error.message}`);
    },
  });

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>, field: 'logo_url' | 'background_url', pageType: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const fileExt = file.name.split('.').pop();
      const filePath = `${pageType}-${field}-${Math.random()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('login-assets')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('login-assets')
        .getPublicUrl(filePath);

      updateMutation.mutate({ page_type: pageType, [field]: publicUrl });
    } catch (error: any) {
      toast.error(`Upload failed: ${error.message}`);
    }
  };

  if (isLoading) return <div className="flex justify-center p-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <Card className="border-none shadow-strong rounded-3xl bg-card/40 backdrop-blur-md border border-border/20 overflow-hidden">
      <CardHeader className="border-b border-muted/20 bg-primary/5 py-6">
        <CardTitle className="text-xl font-black flex items-center gap-3">
          <div className="p-2 rounded-xl bg-primary/10">
            <ImageIcon className="h-6 w-6 text-primary" />
          </div>
          Login Page Customization
        </CardTitle>
        <CardDescription>Configure the appearance and content of various login portals.</CardDescription>
      </CardHeader>
      <CardContent className="p-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="bg-muted/50 p-1 rounded-xl">
            {PAGE_TYPES.map((type) => (
              <TabsTrigger key={type.id} value={type.id} className="rounded-lg px-4 py-2 data-[state=active]:bg-white data-[state=active]:shadow-sm">
                {type.label}
              </TabsTrigger>
            ))}
          </TabsList>

          {PAGE_TYPES.map((type) => {
            const pageSettings = settings?.find(s => s.page_type === type.id);
            if (!pageSettings) return null;

            return (
              <TabsContent key={type.id} value={type.id} className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <Label className="text-sm font-bold">Portal Title</Label>
                      <Input
                        defaultValue={pageSettings.title}
                        onBlur={(e) => updateMutation.mutate({ page_type: type.id, title: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-bold">Subtitle / Description</Label>
                      <Input
                        defaultValue={pageSettings.subtitle || ''}
                        onBlur={(e) => updateMutation.mutate({ page_type: type.id, subtitle: e.target.value })}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-sm font-bold">Username Label</Label>
                        <Input
                          defaultValue={pageSettings.username_label || ''}
                          onBlur={(e) => updateMutation.mutate({ page_type: type.id, username_label: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm font-bold">Username Placeholder</Label>
                        <Input
                          defaultValue={pageSettings.username_placeholder || ''}
                          onBlur={(e) => updateMutation.mutate({ page_type: type.id, username_placeholder: e.target.value })}
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-sm font-bold">Password Label</Label>
                        <Input
                          defaultValue={pageSettings.password_label || ''}
                          onBlur={(e) => updateMutation.mutate({ page_type: type.id, password_label: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm font-bold">Password Placeholder</Label>
                        <Input
                          defaultValue={pageSettings.password_placeholder || ''}
                          onBlur={(e) => updateMutation.mutate({ page_type: type.id, password_placeholder: e.target.value })}
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-sm font-bold">Login Button Text</Label>
                        <Input
                          defaultValue={pageSettings.button_text || ''}
                          onBlur={(e) => updateMutation.mutate({ page_type: type.id, button_text: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm font-bold">Primary Theme Color</Label>
                        <div className="flex gap-2">
                          <Input
                            type="color"
                            className="w-12 p-1 h-10"
                            defaultValue={pageSettings.primary_color || '#4f46e5'}
                            onChange={(e) => updateMutation.mutate({ page_type: type.id, primary_color: e.target.value })}
                          />
                          <Input
                            defaultValue={pageSettings.primary_color || ''}
                            onBlur={(e) => updateMutation.mutate({ page_type: type.id, primary_color: e.target.value })}
                          />
                        </div>
                      </div>
                    </div>
                    <div className="space-y-2">
                        <Label className="text-sm font-bold">Background Color</Label>
                        <div className="flex gap-2">
                          <Input
                            type="color"
                            className="w-12 p-1 h-10"
                            defaultValue={pageSettings.background_color || '#f8fafc'}
                            onChange={(e) => updateMutation.mutate({ page_type: type.id, background_color: e.target.value })}
                          />
                          <Input
                            defaultValue={pageSettings.background_color || ''}
                            onBlur={(e) => updateMutation.mutate({ page_type: type.id, background_color: e.target.value })}
                          />
                        </div>
                      </div>
                  </div>

                  <div className="space-y-6">
                    <div className="space-y-4">
                      <Label className="text-sm font-bold">Portal Logo</Label>
                      <div className="flex flex-col items-center justify-center border-2 border-dashed border-muted rounded-2xl p-6 bg-muted/20">
                        {pageSettings.logo_url ? (
                          <div className="relative group">
                            <img src={pageSettings.logo_url} alt="Logo" className="h-24 object-contain rounded-lg" />
                            <button
                              onClick={() => updateMutation.mutate({ page_type: type.id, logo_url: null })}
                              className="absolute -top-2 -right-2 p-1 bg-destructive text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center gap-2">
                            <Upload className="h-8 w-8 text-muted-foreground" />
                            <p className="text-xs text-muted-foreground">Upload custom logo (PNG/SVG recommended)</p>
                          </div>
                        )}
                        <Input
                          type="file"
                          accept="image/*"
                          className="mt-4"
                          onChange={(e) => handleUpload(e, 'logo_url', type.id)}
                        />
                      </div>
                    </div>

                    <div className="space-y-4">
                      <Label className="text-sm font-bold">Background Image</Label>
                      <div className="flex flex-col items-center justify-center border-2 border-dashed border-muted rounded-2xl p-6 bg-muted/20">
                        {pageSettings.background_url ? (
                          <div className="relative group w-full h-24">
                            <img src={pageSettings.background_url} alt="Background" className="w-full h-full object-cover rounded-lg" />
                            <button
                              onClick={() => updateMutation.mutate({ page_type: type.id, background_url: null })}
                              className="absolute -top-2 -right-2 p-1 bg-destructive text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center gap-2">
                            <Upload className="h-8 w-8 text-muted-foreground" />
                            <p className="text-xs text-muted-foreground">Upload background image</p>
                          </div>
                        )}
                        <Input
                          type="file"
                          accept="image/*"
                          className="mt-4"
                          onChange={(e) => handleUpload(e, 'background_url', type.id)}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>
            );
          })}
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default LoginSettingsManager;
