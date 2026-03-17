import React, { useState, useEffect } from "react";
import { Building, Target, Eye, User, Save, Loader2, Calendar } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";

interface SchoolProfileSettingsProps {
  centerId: string;
}

export default function SchoolProfileSettings({ centerId }: SchoolProfileSettingsProps) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    about_description: "",
    mission: "",
    vision: "",
    principal_message: "",
    established_date: ""
  });

  const { data: center, isLoading } = useQuery({
    queryKey: ["center-about-settings", centerId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("centers")
        .select("*")
        .eq("id", centerId)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!centerId
  });

  useEffect(() => {
    if (center) {
      setFormData({
        about_description: center.about_description || "",
        mission: center.mission || "",
        vision: center.vision || "",
        principal_message: center.principal_message || "",
        established_date: center.established_date || ""
      });
    }
  }, [center]);

  const updateProfileMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("centers")
        .update({
          about_description: formData.about_description,
          mission: formData.mission,
          vision: formData.vision,
          principal_message: formData.principal_message,
          established_date: formData.established_date || null
        } as any)
        .eq("id", centerId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["center-about-settings"] });
      queryClient.invalidateQueries({ queryKey: ["center-about"] });
      toast.success("School profile updated successfully!");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to update school profile");
    }
  });

  if (isLoading) return <div className="p-4 flex items-center gap-2"><Loader2 className="animate-spin" /> Loading profile...</div>;

  return (
    <div className="space-y-8">
      <div className="grid gap-8 lg:grid-cols-2">
        {/* Introduction */}
        <Card className="border-none shadow-soft rounded-2xl bg-card/50">
          <CardHeader className="py-4">
            <CardTitle className="text-sm font-black flex items-center gap-2 uppercase tracking-widest">
              <Building className="h-4 w-4 text-primary" />
              Institutional Profile
            </CardTitle>
            <CardDescription className="text-[10px]">Describe the history and heritage of the school.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>About Us / Introduction</Label>
              <Textarea
                className="min-h-[150px] rounded-xl"
                placeholder="The story of our school..."
                value={formData.about_description}
                onChange={(e) => setFormData({ ...formData, about_description: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Established Date
              </Label>
              <Input
                type="date"
                className="rounded-xl"
                value={formData.established_date}
                onChange={(e) => setFormData({ ...formData, established_date: e.target.value })}
              />
            </div>
          </CardContent>
        </Card>

        {/* Mission & Vision */}
        <div className="space-y-8">
          <Card className="border-none shadow-soft rounded-2xl bg-card/50">
            <CardHeader className="py-4">
              <CardTitle className="text-sm font-black flex items-center gap-2 uppercase tracking-widest">
                <Target className="h-4 w-4 text-amber-500" />
                Mission
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                className="min-h-[80px] rounded-xl"
                placeholder="Our current goals..."
                value={formData.mission}
                onChange={(e) => setFormData({ ...formData, mission: e.target.value })}
              />
            </CardContent>
          </Card>

          <Card className="border-none shadow-soft rounded-2xl bg-card/50">
            <CardHeader className="py-4">
              <CardTitle className="text-sm font-black flex items-center gap-2 uppercase tracking-widest">
                <Eye className="h-4 w-4 text-blue-500" />
                Vision
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                className="min-h-[80px] rounded-xl"
                placeholder="Our future aspiration..."
                value={formData.vision}
                onChange={(e) => setFormData({ ...formData, vision: e.target.value })}
              />
            </CardContent>
          </Card>
        </div>

        {/* Principal Message */}
        <Card className="lg:col-span-2 border-none shadow-soft rounded-2xl bg-card/50">
          <CardHeader className="py-4">
            <CardTitle className="text-sm font-black flex items-center gap-2 uppercase tracking-widest">
              <User className="h-4 w-4 text-indigo-500" />
              Principal's Message
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              className="min-h-[120px] rounded-xl"
              placeholder="Direct word from the institutional head..."
              value={formData.principal_message}
              onChange={(e) => setFormData({ ...formData, principal_message: e.target.value })}
            />
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-end">
        <Button
          onClick={() => updateProfileMutation.mutate()}
          disabled={updateProfileMutation.isPending}
          className="rounded-xl px-8 font-black uppercase text-[10px] tracking-widest shadow-medium bg-gradient-to-r from-primary to-violet-600"
        >
          {updateProfileMutation.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          SYNCHRONIZE PROFILE
        </Button>
      </div>
    </div>
  );
}
