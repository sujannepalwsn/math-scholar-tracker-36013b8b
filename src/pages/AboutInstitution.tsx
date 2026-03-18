import React, { useEffect, useState } from "react";
import {
  Building, Edit2, Save, X, Target, Eye, User, Loader2,
  Info, MapPin, Phone, Mail, Globe, Facebook, Twitter,
  Instagram, Linkedin, GraduationCap, Users, BookOpen,
  School, Plus, Trash2, CheckCircle2, ChevronRight, Hash,
  Trophy, Image as ImageIcon, Camera, Upload
} from "lucide-react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

interface Facility {
  id: string;
  name: string;
  description?: string;
}

interface Achievement {
  id: string;
  title: string;
  year: string;
  description?: string;
}

interface GalleryItem {
  id: string;
  url: string;
  caption?: string;
}

interface SocialLinks {
  facebook?: string;
  twitter?: string;
  instagram?: string;
  linkedin?: string;
  website?: string;
}

export default function AboutInstitution() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");

  const [formData, setFormData] = useState({
    name: "",
    about_description: "",
    mission: "",
    vision: "",
    principal_message: "",
    established_date: "",
    academic_info: "",
    facilities: [] as Facility[],
    achievements: [] as Achievement[],
    gallery: [] as GalleryItem[],
    social_links: {} as SocialLinks,
    phone: "",
    email: "",
    address: "",
    principal_name: "",
    website_url: "",
    short_code: "",
    header_bg_url: "",
    institution_type: ""
  });

  const { data: center, isLoading: isCenterLoading } = useQuery({
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

  const { data: stats, isLoading: isStatsLoading } = useQuery({
    queryKey: ["center-stats-summary", user?.center_id],
    queryFn: async () => {
      if (!user?.center_id) return null;

      const [studentsCount, teachersCount, sectionsData] = await Promise.all([
        supabase.from("students").select("id", { count: "exact", head: true }).eq("center_id", user.center_id).eq("is_active", true),
        supabase.from("teachers").select("id", { count: "exact", head: true }).eq("center_id", user.center_id).eq("is_active", true),
        supabase.from("students").select("grade, section").eq("center_id", user.center_id).eq("is_active", true)
      ]);

      const uniqueGrades = new Set(sectionsData.data?.map(s => s.grade).filter(Boolean));
      const uniqueSections = new Set(sectionsData.data?.map(s => `${s.grade}-${s.section}`).filter(Boolean));

      return {
        totalStudents: studentsCount.count || 0,
        totalTeachers: teachersCount.count || 0,
        totalClasses: uniqueGrades.size || 0,
        totalSections: uniqueSections.size || 0
      };
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
        established_date: center.established_date || "",
        academic_info: center.academic_info || "",
        facilities: Array.isArray(center.facilities) ? (center.facilities as any) : [],
        achievements: Array.isArray(center.achievements) ? (center.achievements as any) : [],
        gallery: Array.isArray(center.gallery) ? (center.gallery as any) : [],
        social_links: (center.social_links as any) || {},
        phone: center.phone || "",
        email: center.email || "",
        address: center.address || "",
        principal_name: center.principal_name || "",
        website_url: center.website_url || "",
        short_code: center.short_code || "",
        header_bg_url: center.header_bg_url || "",
        institution_type: (center as any).institution_type || "Co-Educational"
      });
    }
  }, [center, isEditing]); // Re-fetch on isEditing change to ensure fresh data

  const updateAboutMutation = useMutation({
    mutationFn: async () => {
      if (!user?.center_id) throw new Error("Center ID not found");
      const { error } = await supabase
        .from("centers")
        .update({
          name: formData.name,
          about_description: formData.about_description,
          mission: formData.mission,
          vision: formData.vision,
          principal_message: formData.principal_message,
          established_date: formData.established_date || null,
          academic_info: formData.academic_info,
          facilities: formData.facilities as any,
          achievements: formData.achievements as any,
          gallery: formData.gallery as any,
          social_links: formData.social_links as any,
          phone: formData.phone,
          email: formData.email,
          address: formData.address,
          principal_name: formData.principal_name,
          website_url: formData.website_url,
          short_code: formData.short_code,
          header_bg_url: formData.header_bg_url,
          institution_type: (formData as any).institution_type
        })
        .eq("id", user.center_id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["center-about"] });
      toast.success("Institution information updated successfully!");
      setIsEditing(false);
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to update institution information");
    }
  });

  const addFacility = () => {
    const newFacility: Facility = {
      id: Math.random().toString(36).substr(2, 9),
      name: "",
      description: ""
    };
    setFormData(prev => ({ ...prev, facilities: [...(prev.facilities || []), newFacility] }));
  };

  const updateFacility = (id: string, field: keyof Facility, value: string) => {
    const updated = (formData.facilities || []).map(f => f.id === id ? { ...f, [field]: value } : f);
    setFormData(prev => ({ ...prev, facilities: updated }));
  };

  const removeFacility = (id: string) => {
    setFormData(prev => ({ ...prev, facilities: (prev.facilities || []).filter(f => f.id !== id) }));
  };

  const addAchievement = () => {
    const newAchievement: Achievement = {
      id: Math.random().toString(36).substr(2, 9),
      title: "",
      year: new Date().getFullYear().toString(),
      description: ""
    };
    setFormData(prev => ({ ...prev, achievements: [...(prev.achievements || []), newAchievement] }));
  };

  const updateAchievement = (id: string, field: keyof Achievement, value: string) => {
    const updated = (formData.achievements || []).map(a => a.id === id ? { ...a, [field]: value } : a);
    setFormData(prev => ({ ...prev, achievements: updated }));
  };

  const removeAchievement = (id: string) => {
    setFormData(prev => ({ ...prev, achievements: (prev.achievements || []).filter(a => a.id !== id) }));
  };

  const handleGalleryUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    const toastId = toast.loading("Uploading image to gallery...");

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user?.center_id}/gallery-${Date.now()}.${fileExt}`;

      const { data, error: uploadError } = await supabase.storage
        .from('center-backgrounds')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('center-backgrounds')
        .getPublicUrl(fileName);

      const newItem: GalleryItem = {
        id: Math.random().toString(36).substr(2, 9),
        url: publicUrl,
        caption: ""
      };

      setFormData(prev => ({ ...prev, gallery: [...(prev.gallery || []), newItem] }));
      toast.dismiss(toastId);
      toast.success("Image added to gallery!");
    } catch (error: any) {
      toast.dismiss(toastId);
      toast.error("Upload failed: " + error.message);
    }
  };

  const removeGalleryItem = async (id: string) => {
    const itemToRemove = formData.gallery.find(item => item.id === id);
    if (itemToRemove) {
      try {
        const bucket = 'center-backgrounds';
        const path = itemToRemove.url.split(`${bucket}/`)[1];
        if (path) {
          await supabase.storage.from(bucket).remove([path]);
        }
      } catch (err) {
        console.error("Error deleting gallery image from storage:", err);
      }
    }
    setFormData(prev => ({ ...prev, gallery: (prev.gallery || []).filter(item => item.id !== id) }));
  };

  const updateGalleryCaption = (id: string, caption: string) => {
    const updated = (formData.gallery || []).map(item => item.id === id ? { ...item, caption } : item);
    setFormData(prev => ({ ...prev, gallery: updated }));
  };

  const updateSocialLink = (platform: keyof SocialLinks, value: string) => {
    setFormData(prev => ({
      ...prev,
      social_links: { ...(prev.social_links || {}), [platform]: value }
    }));
  };

  if (isCenterLoading) {
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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl md:text-3xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-primary to-violet-600 uppercase">
            About Institution
          </h1>
          <div className="flex items-center gap-2">
            <div className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
            <p className="text-muted-foreground text-[10px] font-bold uppercase tracking-widest opacity-70">Pedagogical Philosophy & Profile</p>
          </div>
        </div>

        {canEdit && (
          <div className="flex gap-3">
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
          </div>
        )}
      </div>

      {/* Stats Section */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-none shadow-soft rounded-3xl bg-primary/5 border border-primary/10">
          <CardContent className="p-6 flex flex-col items-center justify-center text-center space-y-2">
            <div className="p-3 rounded-2xl bg-primary/10 text-primary">
              <Users className="h-6 w-6" />
            </div>
            <div className="space-y-1">
              <p className="text-2xl font-black text-primary">{isStatsLoading ? "..." : stats?.totalStudents}</p>
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Active Students</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-soft rounded-3xl bg-violet-500/5 border border-violet-500/10">
          <CardContent className="p-6 flex flex-col items-center justify-center text-center space-y-2">
            <div className="p-3 rounded-2xl bg-violet-500/10 text-violet-500">
              <User className="h-6 w-6" />
            </div>
            <div className="space-y-1">
              <p className="text-2xl font-black text-violet-500">{isStatsLoading ? "..." : stats?.totalTeachers}</p>
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Active Teachers</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-soft rounded-3xl bg-amber-500/5 border border-amber-500/10">
          <CardContent className="p-6 flex flex-col items-center justify-center text-center space-y-2">
            <div className="p-3 rounded-2xl bg-amber-500/10 text-amber-500">
              <School className="h-6 w-6" />
            </div>
            <div className="space-y-1">
              <p className="text-2xl font-black text-amber-500">{isStatsLoading ? "..." : stats?.totalClasses}</p>
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Total Classes</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-soft rounded-3xl bg-emerald-500/5 border border-emerald-500/10">
          <CardContent className="p-6 flex flex-col items-center justify-center text-center space-y-2">
            <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-500">
              <BookOpen className="h-6 w-6" />
            </div>
            <div className="space-y-1">
              <p className="text-2xl font-black text-emerald-500">{isStatsLoading ? "..." : stats?.totalSections}</p>
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Total Sections</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-8" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-card/40 border border-border/40 p-1.5 rounded-2xl h-14 shadow-soft backdrop-blur-md overflow-x-auto w-full md:w-auto">
          <TabsTrigger value="overview" className="rounded-xl px-8 font-black uppercase text-[10px] tracking-widest data-[state=active]:shadow-soft">Overview</TabsTrigger>
          <TabsTrigger value="academic" className="rounded-xl px-8 font-black uppercase text-[10px] tracking-widest data-[state=active]:shadow-soft">Academic Info</TabsTrigger>
          <TabsTrigger value="facilities" className="rounded-xl px-8 font-black uppercase text-[10px] tracking-widest data-[state=active]:shadow-soft">Facilities</TabsTrigger>
          <TabsTrigger value="achievements" className="rounded-xl px-8 font-black uppercase text-[10px] tracking-widest data-[state=active]:shadow-soft">Achievements</TabsTrigger>
          <TabsTrigger value="gallery" className="rounded-xl px-8 font-black uppercase text-[10px] tracking-widest data-[state=active]:shadow-soft">Gallery</TabsTrigger>
          <TabsTrigger value="contact" className="rounded-xl px-8 font-black uppercase text-[10px] tracking-widest data-[state=active]:shadow-soft">Contact Details</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-8 outline-none animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="grid gap-8 lg:grid-cols-12">
            <div className="lg:col-span-8 space-y-8">
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
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">Institution Name</Label>
                        <Input
                          id="name"
                          className="rounded-2xl bg-card/50 font-bold"
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        />
                      </div>
                    <div className="space-y-2">
                      <Label htmlFor="about_description">Introduction & History</Label>
                      <Textarea
                        id="about_description"
                        className="min-h-[200px] rounded-2xl bg-card/50"
                        placeholder="Tell us about your institution's journey and heritage..."
                        value={formData.about_description}
                        onChange={(e) => setFormData({ ...formData, about_description: e.target.value })}
                      />
                    </div>
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

              <div className="grid md:grid-cols-2 gap-8">
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
                        placeholder="Where do you see the institution in 10 years?"
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

            <div className="lg:col-span-4 space-y-8">
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
                          className="h-6 text-[10px] w-28 bg-white/20 border-none text-white p-1"
                          value={formData.established_date}
                          onChange={(e) => setFormData({ ...formData, established_date: e.target.value })}
                        />
                      ) : (
                        <span className="text-sm font-black">{formData.established_date || "N/A"}</span>
                      )}
                    </div>
                    <div className="flex justify-between items-center border-b border-white/10 pb-2">
                      <span className="text-[10px] font-bold uppercase opacity-70">Institution Type</span>
                      {isEditing ? (
                        <Input
                          className="h-6 text-[10px] w-28 bg-white/20 border-none text-white p-1"
                          value={formData.institution_type}
                          onChange={(e) => setFormData({ ...formData, institution_type: e.target.value })}
                        />
                      ) : (
                        <span className="text-sm font-black">{formData.institution_type || "Co-Educational"}</span>
                      )}
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-bold uppercase opacity-70">Location</span>
                      <span className="text-sm font-black truncate max-w-[150px]">{formData.address || "Nepal"}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="academic" className="space-y-8 outline-none animate-in fade-in slide-in-from-bottom-4 duration-500">
          <Card className="border-none shadow-strong overflow-hidden rounded-3xl bg-card/40 backdrop-blur-md border border-border/20">
            <CardHeader className="border-b border-muted/20 bg-violet-500/5 py-6">
              <CardTitle className="text-xl font-black flex items-center gap-3 text-foreground/90 uppercase tracking-widest">
                <div className="p-2 rounded-xl bg-violet-500/10">
                  <GraduationCap className="h-6 w-6 text-violet-500" />
                </div>
                Academic Information
              </CardTitle>
              <CardDescription className="font-medium">Details about curriculum, teaching methodology, and academic policies.</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              {isEditing ? (
                <Textarea
                  className="min-h-[400px] rounded-2xl bg-card/50"
                  placeholder="Provide detailed academic information..."
                  value={formData.academic_info}
                  onChange={(e) => setFormData({ ...formData, academic_info: e.target.value })}
                />
              ) : (
                <div className="prose prose-slate max-w-none">
                  {formData.academic_info ? (
                    <div className="text-muted-foreground leading-relaxed whitespace-pre-wrap">
                      {formData.academic_info}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-12 text-center space-y-4">
                      <div className="p-4 rounded-full bg-muted/20">
                        <BookOpen className="h-12 w-12 text-muted-foreground/30" />
                      </div>
                      <p className="text-muted-foreground font-medium italic">Academic information has not been populated yet.</p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="facilities" className="space-y-8 outline-none animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="grid gap-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <h3 className="text-xl font-black uppercase tracking-widest text-foreground/80">Campus Facilities</h3>
                <p className="text-sm text-muted-foreground">The infrastructure and resources available to our students.</p>
              </div>
              {isEditing && (
                <Button onClick={addFacility} className="rounded-xl font-black uppercase text-[10px] tracking-widest">
                  <Plus className="h-4 w-4 mr-2" /> ADD FACILITY
                </Button>
              )}
            </div>

            {isEditing ? (
              <div className="grid md:grid-cols-2 gap-6">
                {(Array.isArray(formData.facilities) ? formData.facilities : []).map((facility) => (
                  <Card key={facility.id} className="border-2 border-dashed border-border/50 rounded-3xl p-6 space-y-4 relative group">
                    <button
                      onClick={() => removeFacility(facility.id)}
                      className="absolute top-4 right-4 p-2 rounded-lg bg-rose-500/10 text-rose-500 hover:bg-rose-500 transition-colors hover:text-white"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                    <div className="space-y-2">
                      <Label>Facility Name</Label>
                      <Input
                        value={facility.name}
                        onChange={(e) => updateFacility(facility.id, 'name', e.target.value)}
                        placeholder="e.g., Computer Lab"
                        className="rounded-xl"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Description</Label>
                      <Textarea
                        value={facility.description}
                        onChange={(e) => updateFacility(facility.id, 'description', e.target.value)}
                        placeholder="Describe the facility..."
                        className="rounded-xl min-h-[80px]"
                      />
                    </div>
                  </Card>
                ))}
                {formData.facilities.length === 0 && (
                  <div className="md:col-span-2 py-20 border-2 border-dashed rounded-3xl flex flex-col items-center justify-center text-muted-foreground gap-4">
                    <Building className="h-12 w-12 opacity-20" />
                    <p className="font-bold uppercase tracking-widest text-xs">No facilities added yet</p>
                    <Button variant="outline" onClick={addFacility} className="rounded-xl">Click to add your first facility</Button>
                  </div>
                )}
              </div>
            ) : (
              <div className="grid md:grid-cols-3 gap-6">
                {(Array.isArray(formData.facilities) ? formData.facilities : []).length > 0 ? (
                  (Array.isArray(formData.facilities) ? formData.facilities : []).map((facility) => (
                    <Card key={facility.id} className="border-none shadow-soft rounded-3xl bg-card/40 backdrop-blur-md border border-border/10 hover:shadow-strong transition-all hover:-translate-y-1">
                      <CardContent className="p-6 space-y-3">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-xl bg-primary/10 text-primary">
                            <CheckCircle2 className="h-5 w-5" />
                          </div>
                          <h4 className="font-black uppercase tracking-widest text-sm text-foreground/80">{facility.name}</h4>
                        </div>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          {facility.description}
                        </p>
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <div className="md:col-span-3 py-20 text-center space-y-4">
                    <div className="p-4 rounded-full bg-muted/20 inline-block">
                      <Building className="h-12 w-12 text-muted-foreground/30" />
                    </div>
                    <p className="text-muted-foreground font-medium italic">Facilities information is currently being updated.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="achievements" className="space-y-8 outline-none animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="grid gap-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <h3 className="text-xl font-black uppercase tracking-widest text-foreground/80">Institutional Achievements</h3>
                <p className="text-sm text-muted-foreground">Milestones and accolades earned by our students and faculty.</p>
              </div>
              {isEditing && (
                <Button onClick={addAchievement} className="rounded-xl font-black uppercase text-[10px] tracking-widest">
                  <Plus className="h-4 w-4 mr-2" /> ADD ACHIEVEMENT
                </Button>
              )}
            </div>

            {isEditing ? (
              <div className="grid md:grid-cols-2 gap-6">
                {(Array.isArray(formData.achievements) ? formData.achievements : []).map((achievement) => (
                  <Card key={achievement.id} className="border-2 border-dashed border-border/50 rounded-3xl p-4 space-y-3 relative group">
                    <button
                      onClick={() => removeAchievement(achievement.id)}
                      className="absolute top-4 right-4 p-2 rounded-lg bg-rose-500/10 text-rose-500 hover:bg-rose-500 transition-colors hover:text-white"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                    <div className="grid grid-cols-4 gap-3">
                      <div className="col-span-3 space-y-1.5">
                        <Label className="text-[10px] font-bold uppercase tracking-wider opacity-60">Achievement Title</Label>
                        <Input
                          value={achievement.title || ""}
                          onChange={(e) => updateAchievement(achievement.id, 'title', e.target.value)}
                          placeholder="e.g., National Excellence Award"
                          className="rounded-xl h-9 text-xs"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-[10px] font-bold uppercase tracking-wider opacity-60">Year</Label>
                        <Input
                          value={achievement.year || ""}
                          onChange={(e) => updateAchievement(achievement.id, 'year', e.target.value)}
                          placeholder="2024"
                          className="rounded-xl h-9 text-xs"
                        />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-[10px] font-bold uppercase tracking-wider opacity-60">Description</Label>
                      <Textarea
                        value={achievement.description || ""}
                        onChange={(e) => updateAchievement(achievement.id, 'description', e.target.value)}
                        placeholder="Provide some context..."
                        className="rounded-xl min-h-[60px] text-xs"
                      />
                    </div>
                  </Card>
                ))}
                {formData.achievements.length === 0 && (
                  <div className="md:col-span-2 py-20 border-2 border-dashed rounded-3xl flex flex-col items-center justify-center text-muted-foreground gap-4">
                    <Trophy className="h-12 w-12 opacity-20" />
                    <p className="font-bold uppercase tracking-widest text-xs">No achievements listed</p>
                    <Button variant="outline" onClick={addAchievement} className="rounded-xl">Add institutional milestone</Button>
                  </div>
                )}
              </div>
            ) : (
              <div className="grid md:grid-cols-3 gap-6">
                {(Array.isArray(formData.achievements) ? formData.achievements : []).length > 0 ? (
                  (Array.isArray(formData.achievements) ? formData.achievements : []).map((achievement) => (
                    <Card key={achievement.id} className="border-none shadow-soft rounded-3xl bg-card/40 backdrop-blur-md border border-border/10 hover:shadow-strong transition-all">
                      <CardContent className="p-6 space-y-3">
                        <div className="flex items-start justify-between">
                          <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500">
                            <Trophy className="h-5 w-5" />
                          </div>
                          <Badge variant="secondary" className="bg-amber-500/10 text-amber-600 font-black">{achievement.year}</Badge>
                        </div>
                        <div className="space-y-1">
                          <h4 className="font-black uppercase tracking-widest text-sm text-foreground/80">{achievement.title}</h4>
                          <p className="text-sm text-muted-foreground leading-relaxed">
                            {achievement.description}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <div className="md:col-span-3 py-20 text-center space-y-4">
                    <div className="p-4 rounded-full bg-muted/20 inline-block">
                      <Trophy className="h-12 w-12 text-muted-foreground/30" />
                    </div>
                    <p className="text-muted-foreground font-medium italic">Achievement records are currently being compiled.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="gallery" className="space-y-8 outline-none animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="grid gap-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <h3 className="text-xl font-black uppercase tracking-widest text-foreground/80">Campus Gallery</h3>
                <p className="text-sm text-muted-foreground">A visual journey through our campus and activities.</p>
              </div>
              {isEditing && (
                <div className="relative">
                  <input
                    type="file"
                    id="gallery-upload"
                    className="hidden"
                    accept="image/*"
                    onChange={handleGalleryUpload}
                  />
                  <Label htmlFor="gallery-upload">
                    <Button asChild className="rounded-xl font-black uppercase text-[10px] tracking-widest cursor-pointer">
                      <span><Upload className="h-4 w-4 mr-2" /> UPLOAD PHOTO</span>
                    </Button>
                  </Label>
                </div>
              )}
            </div>

            {isEditing ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {(Array.isArray(formData.gallery) ? formData.gallery : []).map((item) => (
                  <div key={item.id} className="relative group rounded-3xl overflow-hidden aspect-square border shadow-soft">
                    <img src={item.url} alt="" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/60 flex flex-col justify-end p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Input
                        value={item.caption}
                        onChange={(e) => updateGalleryCaption(item.id, e.target.value)}
                        placeholder="Add caption..."
                        className="h-8 text-[10px] bg-white/20 border-none text-white mb-2"
                      />
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => removeGalleryItem(item.id)}
                        className="h-8 text-[10px] font-black uppercase tracking-widest rounded-xl"
                      >
                        <Trash2 className="h-3 w-3 mr-2" /> Remove
                      </Button>
                    </div>
                  </div>
                ))}
                {formData.gallery.length === 0 && (
                  <div className="col-span-full py-20 border-2 border-dashed rounded-[2.5rem] flex flex-col items-center justify-center text-muted-foreground gap-4">
                    <ImageIcon className="h-12 w-12 opacity-20" />
                    <p className="font-bold uppercase tracking-widest text-xs">Gallery is empty</p>
                    <p className="text-[10px] max-w-xs text-center opacity-60">Upload photos of your campus, classrooms, labs, and special events.</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {(Array.isArray(formData.gallery) ? formData.gallery : []).length > 0 ? (
                  (Array.isArray(formData.gallery) ? formData.gallery : []).map((item) => (
                    <Card key={item.id} className="border-none shadow-soft rounded-3xl overflow-hidden group hover:shadow-strong transition-all hover:-translate-y-1">
                      <div className="aspect-square relative overflow-hidden">
                        <img src={item.url} alt={item.caption} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                        {item.caption && (
                          <div className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
                            <p className="text-white text-xs font-medium line-clamp-2">{item.caption}</p>
                          </div>
                        )}
                      </div>
                    </Card>
                  ))
                ) : (
                  <div className="col-span-full py-20 text-center space-y-4">
                    <div className="p-4 rounded-full bg-muted/20 inline-block">
                      <ImageIcon className="h-12 w-12 text-muted-foreground/30" />
                    </div>
                    <p className="text-muted-foreground font-medium italic">No visual assets have been uploaded to the gallery yet.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="contact" className="space-y-8 outline-none animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="grid gap-8 lg:grid-cols-2">
            <Card className="border-none shadow-strong overflow-hidden rounded-3xl bg-card/40 backdrop-blur-md border border-border/20">
              <CardHeader className="border-b border-muted/20 bg-primary/5 py-6">
                <CardTitle className="text-xl font-black flex items-center gap-3 text-foreground/90 uppercase tracking-widest">
                  <div className="p-2 rounded-xl bg-primary/10">
                    <MapPin className="h-6 w-6 text-primary" />
                  </div>
                  Get In Touch
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6 space-y-6">
                <div className="space-y-4">
                  <div className="flex items-start gap-4">
                    <div className="p-2 rounded-xl bg-muted/50 text-primary mt-1">
                      <Phone className="h-4 w-4" />
                    </div>
                    <div className="flex-1 space-y-1">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Phone Number</p>
                      {isEditing ? (
                        <Input
                          value={formData.phone}
                          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                          className="rounded-xl h-10"
                        />
                      ) : (
                        <p className="font-bold text-foreground/80">{formData.phone || "Not specified"}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="p-2 rounded-xl bg-muted/50 text-primary mt-1">
                      <Mail className="h-4 w-4" />
                    </div>
                    <div className="flex-1 space-y-1">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Email Address</p>
                      {isEditing ? (
                        <Input
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          className="rounded-xl h-10"
                        />
                      ) : (
                        <p className="font-bold text-foreground/80">{formData.email || "Not specified"}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="p-2 rounded-xl bg-muted/50 text-primary mt-1">
                      <MapPin className="h-4 w-4" />
                    </div>
                    <div className="flex-1 space-y-1">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Physical Address</p>
                      {isEditing ? (
                        <Input
                          value={formData.address}
                          onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                          className="rounded-xl h-10"
                        />
                      ) : (
                        <p className="font-bold text-foreground/80">{formData.address || "Not specified"}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="p-2 rounded-xl bg-muted/50 text-primary mt-1">
                      <User className="h-4 w-4" />
                    </div>
                    <div className="flex-1 space-y-1">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Principal Name</p>
                      {isEditing ? (
                        <Input
                          value={formData.principal_name}
                          onChange={(e) => setFormData({ ...formData, principal_name: e.target.value })}
                          className="rounded-xl h-10"
                        />
                      ) : (
                        <p className="font-bold text-foreground/80">{formData.principal_name || "Not specified"}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="p-2 rounded-xl bg-muted/50 text-primary mt-1">
                      <Hash className="h-4 w-4" />
                    </div>
                    <div className="flex-1 space-y-1">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">School Code</p>
                      {isEditing ? (
                        <Input
                          value={formData.short_code}
                          onChange={(e) => setFormData({ ...formData, short_code: e.target.value })}
                          className="rounded-xl h-10"
                        />
                      ) : (
                        <p className="font-bold text-foreground/80">{formData.short_code || "Not specified"}</p>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-none shadow-strong overflow-hidden rounded-3xl bg-card/40 backdrop-blur-md border border-border/20">
              <CardHeader className="border-b border-muted/20 bg-primary/5 py-6">
                <CardTitle className="text-xl font-black flex items-center gap-3 text-foreground/90 uppercase tracking-widest">
                  <div className="p-2 rounded-xl bg-primary/10">
                    <Globe className="h-6 w-6 text-primary" />
                  </div>
                  Social Connect
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6 space-y-4">
                <div className="space-y-4">
                  {[
                    { id: 'website', label: 'Website', icon: Globe, color: 'text-primary' },
                    { id: 'facebook', label: 'Facebook', icon: Facebook, color: 'text-blue-600' },
                    { id: 'twitter', label: 'Twitter', icon: Twitter, color: 'text-sky-400' },
                    { id: 'instagram', label: 'Instagram', icon: Instagram, color: 'text-pink-500' },
                    { id: 'linkedin', label: 'LinkedIn', icon: Linkedin, color: 'text-blue-700' }
                  ].map((platform) => (
                    <div key={platform.id} className="flex items-center gap-4">
                      <div className={cn("p-2 rounded-xl bg-muted/50", platform.color)}>
                        <platform.icon className="h-4 w-4" />
                      </div>
                      <div className="flex-1 space-y-1">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{platform.label}</p>
                        {isEditing ? (
                          <Input
                            value={(formData.social_links || {})[platform.id as keyof SocialLinks] || ""}
                            onChange={(e) => updateSocialLink(platform.id as keyof SocialLinks, e.target.value)}
                            className="rounded-xl h-10"
                            placeholder={`URL for ${platform.label}`}
                          />
                        ) : (
                          (formData.social_links || {})[platform.id as keyof SocialLinks] ? (
                            <a
                              href={(formData.social_links || {})[platform.id as keyof SocialLinks]}
                              target="_blank"
                              rel="noreferrer"
                              className="font-bold text-primary hover:underline flex items-center gap-2"
                            >
                              Visit Page <ChevronRight className="h-3 w-3" />
                            </a>
                          ) : (
                            <p className="font-bold text-muted-foreground opacity-50 italic text-xs">Not connected</p>
                          )
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

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
