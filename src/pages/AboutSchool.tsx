import React, { useEffect, useState } from "react";
import { Building, Edit2, Save, X, BookOpen, Target, Eye, User, Loader2, Info } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

export default function AboutSchool() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    about_description: "",
    mission: "",
    vision: "",
    principal_message: "",
    established_date: ""
  });

  const { data: center, isLoading } = useQuery({
    queryKey: ["center-about", user?.center_id],
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

  useEffect(() => {
    if (center) {
      setFormData({
        name: center.name || "",
        about_description: center.about_description || "",
        mission: center.mission || "",
        vision: center.vision || "",
        principal_message: center.principal_message || "",
        established_date: center.established_date || ""
      });
    }
  }, [center]);

  const updateAboutMutation = useMutation({
    mutationFn: async () => {
      if (!user?.center_id) throw new Error("Center ID not found");
      const { error } = await supabase
        .from("centers")
        .update({
          about_description: formData.about_description,
          mission: formData.mission,
          vision: formData.vision,
          principal_message: formData.principal_message,
          established_date: formData.established_date || null
        })
        .eq("id", user.center_id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["center-about"] });
      toast.success("School information updated successfully!");
      setIsEditing(false);
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to update school information");
    }
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const canEdit = user?.role === 'center';

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-3xl md:text-4xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-primary to-violet-600">
            About Our School
          </h1>
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
            <p className="text-muted-foreground text-sm font-medium">Institutional profile and pedagogical philosophy.</p>
          </div>
        </div>

        {canEdit && (
          <Button
            onClick={() => setIsEditing(!isEditing)}
            variant={isEditing ? "outline" : "default"}
            className={cn(
              "rounded-2xl h-12 px-6 font-black uppercase text-[10px] tracking-widest shadow-soft transition-all",
              isEditing ? "border-2" : "bg-gradient-to-r from-primary to-violet-600"
            )}
          >
            {isEditing ? (
              <><X className="h-4 w-4 mr-2" /> CANCEL EDITING</>
            ) : (
              <><Edit2 className="h-4 w-4 mr-2" /> EDIT INFORMATION</>
            )}
          </Button>
        )}
      </div>

      <div className="grid gap-8 lg:grid-cols-12">
        {/* Main Content Area */}
        <div className="lg:col-span-8 space-y-8">
          {/* Introduction Card */}
          <Card className="border-none shadow-strong overflow-hidden rounded-3xl bg-card/40 backdrop-blur-md border border-border/20">
            <CardHeader className="border-b border-muted/20 bg-primary/5 py-6">
              <CardTitle className="text-xl font-black flex items-center gap-3 text-foreground/90 uppercase tracking-widest">
                <div className="p-2 rounded-xl bg-primary/10">
                  <Building className="h-6 w-6 text-primary" />
                </div>
                Institutional Profile
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              {isEditing ? (
                <div className="space-y-2">
                  <Label htmlFor="about_description">Introduction & History</Label>
                  <Textarea
                    id="about_description"
                    className="min-h-[200px] rounded-2xl bg-card/50"
                    placeholder="Tell us about your school's journey and heritage..."
                    value={formData.about_description}
                    onChange={(e) => setFormData({ ...formData, about_description: e.target.value })}
                  />
                </div>
              ) : (
                <div className="prose prose-slate max-w-none">
                  <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">
                    {formData.about_description || "Welcome to our institution. We are dedicated to providing excellence in education."}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Mission & Vision Grid */}
          <div className="grid md:grid-cols-2 gap-8">
            {/* Mission */}
            <Card className="border-none shadow-strong overflow-hidden rounded-3xl bg-card/40 backdrop-blur-md border border-border/20">
              <CardHeader className="border-b border-muted/20 bg-amber-500/5 py-6">
                <CardTitle className="text-lg font-black flex items-center gap-3 text-foreground/90 uppercase tracking-widest">
                  <div className="p-2 rounded-xl bg-amber-500/10">
                    <Target className="h-5 w-5 text-amber-500" />
                  </div>
                  Our Mission
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                {isEditing ? (
                  <Textarea
                    className="min-h-[120px] rounded-2xl bg-card/50"
                    placeholder="What is your immediate goal?"
                    value={formData.mission}
                    onChange={(e) => setFormData({ ...formData, mission: e.target.value })}
                  />
                ) : (
                  <p className="text-muted-foreground text-sm italic leading-relaxed whitespace-pre-wrap">
                    {formData.mission || "To empower students with knowledge and character."}
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Vision */}
            <Card className="border-none shadow-strong overflow-hidden rounded-3xl bg-card/40 backdrop-blur-md border border-border/20">
              <CardHeader className="border-b border-muted/20 bg-blue-500/5 py-6">
                <CardTitle className="text-lg font-black flex items-center gap-3 text-foreground/90 uppercase tracking-widest">
                  <div className="p-2 rounded-xl bg-blue-500/10">
                    <Eye className="h-5 w-5 text-blue-500" />
                  </div>
                  Our Vision
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                {isEditing ? (
                  <Textarea
                    className="min-h-[120px] rounded-2xl bg-card/50"
                    placeholder="Where do you see the school in 10 years?"
                    value={formData.vision}
                    onChange={(e) => setFormData({ ...formData, vision: e.target.value })}
                  />
                ) : (
                  <p className="text-muted-foreground text-sm italic leading-relaxed whitespace-pre-wrap">
                    {formData.vision || "To be a global leader in holistic education."}
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Sidebar area */}
        <div className="lg:col-span-4 space-y-8">
          {/* Principal's Message */}
          <Card className="border-none shadow-strong overflow-hidden rounded-3xl bg-card/40 backdrop-blur-md border border-border/20">
            <CardHeader className="border-b border-muted/20 bg-indigo-500/5 py-6">
              <CardTitle className="text-lg font-black flex items-center gap-3 text-foreground/90 uppercase tracking-widest">
                <div className="p-2 rounded-xl bg-indigo-500/10">
                  <User className="h-5 w-5 text-indigo-500" />
                </div>
                Principal's Word
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              {isEditing ? (
                <Textarea
                  className="min-h-[250px] rounded-2xl bg-card/50"
                  placeholder="A message to students and parents..."
                  value={formData.principal_message}
                  onChange={(e) => setFormData({ ...formData, principal_message: e.target.value })}
                />
              ) : (
                <div className="relative">
                  <div className="absolute -top-4 -left-2 text-6xl text-indigo-500/10 font-serif">"</div>
                  <p className="text-muted-foreground text-sm leading-relaxed relative z-10 whitespace-pre-wrap">
                    {formData.principal_message || "Education is the most powerful weapon which you can use to change the world."}
                  </p>
                  <div className="mt-4 pt-4 border-t border-border/50">
                    <p className="font-black text-[10px] uppercase tracking-tighter text-indigo-600">The Principal</p>
                    <p className="text-[10px] text-muted-foreground">{formData.name}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Stats / Info */}
          <Card className="border-none shadow-strong overflow-hidden rounded-3xl bg-primary text-primary-foreground">
            <CardContent className="p-6 space-y-6">
              <div className="flex items-center gap-3">
                <Info className="h-6 w-6" />
                <h3 className="font-black uppercase tracking-widest text-xs">At a Glance</h3>
              </div>
              <div className="space-y-4">
                <div className="flex justify-between items-center border-b border-white/10 pb-2">
                  <span className="text-[10px] font-bold uppercase opacity-70">Established</span>
                  {isEditing ? (
                    <Input
                      type="date"
                      className="h-6 text-[10px] w-24 bg-white/20 border-none text-white"
                      value={formData.established_date}
                      onChange={(e) => setFormData({ ...formData, established_date: e.target.value })}
                    />
                  ) : (
                    <span className="text-sm font-black">{formData.established_date || "N/A"}</span>
                  )}
                </div>
                <div className="flex justify-between items-center border-b border-white/10 pb-2">
                  <span className="text-[10px] font-bold uppercase opacity-70">School Type</span>
                  <span className="text-sm font-black">Co-Educational</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-bold uppercase opacity-70">Location</span>
                  <span className="text-sm font-black truncate max-w-[150px]">{center?.address || "Nepal"}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Save Button for Edit Mode */}
      {isEditing && (
        <div className="fixed bottom-8 right-8 z-50 animate-in slide-in-from-bottom-8">
          <Button
            size="lg"
            onClick={() => updateAboutMutation.mutate()}
            disabled={updateAboutMutation.isPending}
            className="rounded-2xl shadow-elevated h-14 px-10 font-black uppercase text-xs tracking-widest bg-gradient-to-r from-primary to-violet-600 hover:scale-[1.05] transition-all"
          >
            {updateAboutMutation.isPending ? (
              <Loader2 className="h-5 w-5 animate-spin mr-2" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            SYNCHRONIZE CHANGES
          </Button>
        </div>
      )}
    </div>
  );
}
