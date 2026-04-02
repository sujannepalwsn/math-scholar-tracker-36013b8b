import React, { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Layout, Type, Palette, Eye, Image as ImageIcon, Loader2, Save } from "lucide-react";

export default function HeaderSettings({ centerId }: { centerId: string }) {
  const queryClient = useQueryClient();

  const { data: center, isLoading } = useQuery({
    queryKey: ["center-header-settings", centerId],
    queryFn: async () => {
      const { data, error } = await supabase.from("centers").select("*").eq("id", centerId).single();
      if (error) throw error;
      return data;
    },
    enabled: !!centerId,
  });

  const [settings, setSettings] = useState<any>({
    header_bg_url: "",
    header_overlay_color: "#000000",
    header_overlay_opacity: 90,
    header_height: "400px",
    header_font_family: "Inter",
    header_font_color: "#ffffff",
    header_font_size: "3rem",
    header_text_transform: "none",
    header_title_visible: true,
    header_address_visible: true,
    header_principal_visible: true,
    header_code_visible: true,
    header_year_visible: true,
    header_contact_visible: true,
    header_email_visible: true,
    header_website_visible: true,
  });

  useEffect(() => {
    if (center) {
      setSettings({
        header_bg_url: center.header_bg_url || "",
        header_overlay_color: center.header_overlay_color || "#000000",
        header_overlay_opacity: center.header_overlay_opacity ?? 90,
        header_height: center.header_height || "400px",
        header_font_family: center.header_font_family || "Inter",
        header_font_color: center.header_font_color || "#ffffff",
        header_font_size: center.header_font_size || "3rem",
        header_text_transform: center.header_text_transform || "none",
        header_title_visible: center.header_title_visible ?? true,
        header_address_visible: center.header_address_visible ?? true,
        header_principal_visible: center.header_principal_visible ?? true,
        header_code_visible: center.header_code_visible ?? true,
        header_year_visible: center.header_year_visible ?? true,
        header_contact_visible: center.header_contact_visible ?? true,
        header_email_visible: center.header_email_visible ?? true,
        header_website_visible: center.header_website_visible ?? true,
      });
    }
  }, [center]);

  const updateMutation = useMutation({
    mutationFn: async (newSettings: any) => {
      const { error } = await supabase
        .from("centers")
        .update(newSettings)
        .eq("id", centerId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["center-header-settings"] });
      queryClient.invalidateQueries({ queryKey: ["center-about"] });
      toast.success("Header configuration synchronized");
    },
    onError: (error: any) => toast.error(error.message),
  });

  const handleSave = () => {
    updateMutation.mutate(settings);
  };

  if (isLoading) return <div className="flex justify-center p-12"><Loader2 className="animate-spin" /></div>;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Visual Identity */}
        <Card className="rounded-3xl border-none shadow-strong bg-card/40 backdrop-blur-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg font-black uppercase tracking-widest">
              <ImageIcon className="h-5 w-5 text-primary" />
              Atmospheric Control
            </CardTitle>
            <CardDescription>Configure background and overlay dynamics</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label>Background Image URL</Label>
              <Input
                value={settings.header_bg_url}
                onChange={(e) => setSettings({...settings, header_bg_url: e.target.value})}
                placeholder="https://images.unsplash.com/..."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Overlay Color</Label>
                <div className="flex gap-2">
                  <Input
                    type="color"
                    value={settings.header_overlay_color}
                    onChange={(e) => setSettings({...settings, header_overlay_color: e.target.value})}
                    className="w-12 h-10 p-1 rounded-xl"
                  />
                  <Input
                    value={settings.header_overlay_color}
                    onChange={(e) => setSettings({...settings, header_overlay_color: e.target.value})}
                    className="flex-1 font-mono text-xs"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Header Height</Label>
                <Select
                  value={settings.header_height}
                  onValueChange={(v) => setSettings({...settings, header_height: v})}
                >
                  <SelectTrigger className="rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="300px">Compact (300px)</SelectItem>
                    <SelectItem value="400px">Standard (400px)</SelectItem>
                    <SelectItem value="500px">Enhanced (500px)</SelectItem>
                    <SelectItem value="600px">Cinematic (600px)</SelectItem>
                    <SelectItem value="100vh">Full Screen</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between">
                <Label>Overlay Opacity ({settings.header_overlay_opacity}%)</Label>
              </div>
              <Slider
                value={[settings.header_overlay_opacity]}
                onValueChange={(v) => setSettings({...settings, header_overlay_opacity: v[0]})}
                max={100}
                step={1}
                />
                <Input
                  type="number"
                  value={settings.header_overlay_opacity}
                  onChange={(e) => setSettings({...settings, header_overlay_opacity: parseInt(e.target.value) || 0})}
                  min="0" max="100" step="1"
                  className="h-8 w-20 text-xs"
              />
            </div>
          </CardContent>
        </Card>

        {/* Typography */}
        <Card className="rounded-3xl border-none shadow-strong bg-card/40 backdrop-blur-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg font-black uppercase tracking-widest">
              <Type className="h-5 w-5 text-primary" />
              Typography Matrix
            </CardTitle>
            <CardDescription>Customize font styles and characteristics</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label>Font Family</Label>
              <Select
                value={settings.header_font_family}
                onValueChange={(v) => setSettings({...settings, header_font_family: v})}
              >
                <SelectTrigger className="rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Inter">Modern Sans (Inter)</SelectItem>
                  <SelectItem value="'Space Grotesk'">Space Grotesk</SelectItem>
                  <SelectItem value="Algerian, 'Cinzel', serif">Algerian / Cinzel (Decorative)</SelectItem>
                  <SelectItem value="'Almendra', serif">Almendra (Medieval)</SelectItem>
                  <SelectItem value="serif">Classic Serif</SelectItem>
                  <SelectItem value="cursive">Script / Cursive</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Font Color</Label>
                <div className="flex gap-2">
                  <Input
                    type="color"
                    value={settings.header_font_color}
                    onChange={(e) => setSettings({...settings, header_font_color: e.target.value})}
                    className="w-12 h-10 p-1 rounded-xl"
                  />
                  <Input
                    value={settings.header_font_color}
                    onChange={(e) => setSettings({...settings, header_font_color: e.target.value})}
                    className="flex-1 font-mono text-xs"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Text Transform</Label>
                <Select
                  value={settings.header_text_transform}
                  onValueChange={(v) => setSettings({...settings, header_text_transform: v})}
                >
                  <SelectTrigger className="rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    <SelectItem value="uppercase">UPPERCASE</SelectItem>
                    <SelectItem value="capitalize">Capitalize</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Font Size (rem/px)</Label>
              <Input
                value={settings.header_font_size}
                onChange={(e) => setSettings({...settings, header_font_size: e.target.value})}
                placeholder="e.g. 3rem or 48px"
              />
            </div>
          </CardContent>
        </Card>

        {/* Visibility Toggles */}
        <Card className="lg:col-span-2 rounded-3xl border-none shadow-strong bg-card/40 backdrop-blur-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg font-black uppercase tracking-widest">
              <Eye className="h-5 w-5 text-primary" />
              Element Visibility
            </CardTitle>
            <CardDescription>Toggle specific information blocks on the dashboard header</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {[
                { label: "Institution Name", key: "header_title_visible" },
                { label: "Physical Address", key: "header_address_visible" },
                { label: "Principal Name", key: "header_principal_visible" },
                { label: "School Code", key: "header_code_visible" },
                { label: "Established Year", key: "header_year_visible" },
                { label: "Contact Phone", key: "header_contact_visible" },
                { label: "Email Address", key: "header_email_visible" },
                { label: "Website Link", key: "header_website_visible" },
              ].map((item) => (
                <div key={item.key} className="flex items-center justify-between p-3 rounded-2xl bg-white/50 border border-border/10">
                  <span className="text-[10px] font-black uppercase tracking-tighter text-slate-600">{item.label}</span>
                  <Switch
                    checked={settings[item.key]}
                    onCheckedChange={(checked) => setSettings({...settings, [item.key]: checked})}
                  />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Real-time Preview Synthesis */}
        <Card className="lg:col-span-2 rounded-3xl border-none shadow-strong bg-slate-900 overflow-hidden relative" style={{ minHeight: "300px" }}>
            <div className="absolute inset-0 z-0">
               <img
                 src={settings.header_bg_url || "https://images.unsplash.com/photo-1523050853063-915894374ef7?q=80&w=2070&auto=format&fit=crop"}
                 className="w-full h-full object-cover opacity-60"
                 alt=""
               />
               <div
                 className="absolute inset-0"
                 style={{
                   backgroundColor: settings.header_overlay_color,
                   opacity: settings.header_overlay_opacity
                 }}
               />
            </div>
            <div className="relative z-10 p-12 flex flex-col items-center justify-center text-center h-full min-h-[300px]">
                <p className="text-white/40 font-black uppercase tracking-[0.4em] text-[10px] mb-4">Header Real-time Preview</p>
                <div className="relative h-28 w-28 md:h-36 md:w-36 rounded-full overflow-hidden flex items-center justify-center border-4 border-white/50 shadow-soft backdrop-blur-md bg-white/20 mb-6">
                  {center?.logo_url ? (
                    <img src={center.logo_url} alt="Logo" className="h-full w-full object-cover" />
                  ) : (
                    <ImageIcon className="h-14 w-14 text-white/40" />
                  )}
                </div>
                {settings.header_title_visible && (
                  <h1
                    style={{
                      fontFamily: settings.header_font_family,
                      color: settings.header_font_color,
                      fontSize: settings.header_font_size,
                      textTransform: settings.header_text_transform as any
                    }}
                    className="font-black leading-tight drop-shadow-2xl mb-4 transition-all"
                  >
                    {center?.name || "Institution Name"}
                  </h1>
                )}
                <div className="flex flex-wrap justify-center gap-4 text-white/70 text-[10px] font-bold uppercase tracking-widest">
                   {settings.header_address_visible && <span>{center?.address || "Location Address"}</span>}
                   {settings.header_contact_visible && <span>• {center?.phone || "Contact Info"}</span>}
                </div>
            </div>
        </Card>
      </div>

      <div className="flex justify-end pt-4">
        <Button
          size="lg"
          onClick={handleSave}
          disabled={updateMutation.isPending}
          className="rounded-2xl h-14 px-12 font-black uppercase text-xs tracking-widest bg-gradient-to-r from-primary to-violet-600 shadow-xl shadow-primary/20 hover:scale-[1.02] transition-all"
        >
          {updateMutation.isPending ? (
            <Loader2 className="h-5 w-5 animate-spin mr-2" />
          ) : (
            <Save className="h-5 w-5 mr-2" />
          )}
          SYNCHRONIZE HEADER PROFILE
        </Button>
      </div>

    </div>
  );
}
