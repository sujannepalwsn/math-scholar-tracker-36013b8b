import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { toast } from "sonner";
import { CalendarIcon, Download, Edit, Eye, FileText, Plus, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { Tables } from "@/integrations/supabase/types";
import { Badge } from "@/components/ui/badge";

type LessonPlan = Tables<'lesson_plans'>;

export default function LessonPlans() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [editingLessonPlan, setEditingLessonPlan] = useState<LessonPlan | null>(null);
  const [viewingLessonPlan, setViewingLessonPlan] = useState<LessonPlan | null>(null);
  const [subjectFilter, setSubjectFilter] = useState<string>("all");
  const [gradeFilter, setGradeFilter] = useState<string>("all");

  const [subject, setSubject] = useState("");
  const [chapter, setChapter] = useState("");
  const [topic, setTopic] = useState("");
  const [selectedGrade, setSelectedGrade] = useState<string>("all");
  const [lessonDate, setLessonDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [notes, setNotes] = useState("");
  const [file, setFile] = useState<File | null>(null);

  const { data: students = [] } = useQuery({
    queryKey: ["students-for-grades", user?.center_id],
    queryFn: async () => {
      if (!user?.center_id) return [];
      const { data, error } = await supabase.from("students").select("grade").eq("center_id", user.center_id);
      if (error) throw error;
      return data;
    },
    enabled: !!user?.center_id,
  });
  const uniqueGrades = Array.from(new Set(students.map(s => s.grade).filter(Boolean))).sort();

  const { data: lessonPlans = [], isLoading } = useQuery({
    queryKey: ["lesson-plans-for-tracking", user?.center_id, subjectFilter, gradeFilter],
    queryFn: async () => {
      if (!user?.center_id) return [];
      let query = supabase.from("lesson_plans").select("*").eq("center_id", user.center_id).order("lesson_date", { ascending: false });
      if (subjectFilter !== "all") query = query.eq("subject", subjectFilter);
      if (gradeFilter !== "all") query = query.eq("grade", gradeFilter);
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    enabled: !!user?.center_id,
  });

  const resetForm = () => { setSubject(""); setChapter(""); setTopic(""); setSelectedGrade("all"); setLessonDate(format(new Date(), "yyyy-MM-dd")); setNotes(""); setFile(null); setEditingLessonPlan(null); };

  const uploadFile = async (fileToUpload: File, bucket: string) => {
    const fileExt = fileToUpload.name.split(".").pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
    const { error } = await supabase.storage.from(bucket).upload(fileName, fileToUpload);
    if (error) throw error;
    return fileName;
  };

  const createLessonPlanMutation = useMutation({
    mutationFn: async () => {
      if (!user?.center_id) throw new Error("Center ID not found");
      let fileUrl: string | null = null;
      if (file) fileUrl = await uploadFile(file, "lesson-files");
      const { error } = await supabase.from("lesson_plans").insert({
        center_id: user.center_id,
        teacher_id: user.teacher_id || null,
        subject, chapter, topic,
        class: selectedGrade === "all" ? "General" : selectedGrade,
        grade: selectedGrade === "all" ? null : selectedGrade,
        lesson_date: lessonDate,
        notes: notes || null,
        lesson_file_url: fileUrl,
      });
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["lesson-plans"] }); toast.success("Lesson Plan created!"); setIsDialogOpen(false); resetForm(); },
    onError: (error: any) => toast.error(error.message || "Failed to create"),
  });

  const updateLessonPlanMutation = useMutation({
    mutationFn: async () => {
      if (!editingLessonPlan || !user?.center_id) throw new Error("Missing info");
      let fileUrl: string | null = editingLessonPlan.lesson_file_url;
      if (file) fileUrl = await uploadFile(file, "lesson-files");
      const { error } = await supabase.from("lesson_plans").update({
        subject, chapter, topic, lesson_date: lessonDate, notes: notes || null, lesson_file_url: fileUrl,
        grade: selectedGrade === "all" ? null : selectedGrade,
      }).eq("id", editingLessonPlan.id);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["lesson-plans"] }); toast.success("Updated!"); setIsDialogOpen(false); resetForm(); },
    onError: (error: any) => toast.error(error.message || "Failed to update"),
  });

  const deleteLessonPlanMutation = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from("lesson_plans").delete().eq("id", id); if (error) throw error; },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["lesson-plans"] }); toast.success("Deleted!"); },
    onError: (error: any) => toast.error(error.message || "Failed to delete"),
  });

  const handleEditClick = (lp: LessonPlan) => {
    setEditingLessonPlan(lp); setSubject(lp.subject); setChapter(lp.chapter); setTopic(lp.topic);
    setLessonDate(lp.lesson_date); setNotes(lp.notes || ""); setSelectedGrade(lp.grade || "all");
    setFile(null); setIsDialogOpen(true);
  };

  const handleViewClick = (lp: LessonPlan) => {
    setViewingLessonPlan(lp);
    setIsViewOpen(true);
  };

  const uniqueSubjects = Array.from(new Set(lessonPlans.map(lp => lp.subject))).sort();

  return (
    <div className="space-y-8 animate-in fade-in duration-1000">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-3xl md:text-4xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-primary to-violet-600">
            Curriculum Planner
          </h1>
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
            <p className="text-muted-foreground text-sm font-medium">Design and organize your teaching roadmap.</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-3 items-center">
          <Select value={subjectFilter} onValueChange={setSubjectFilter}>
            <SelectTrigger className="w-[140px] h-10 bg-white/50 border-muted-foreground/10 focus:ring-primary/20 rounded-xl">
              <SelectValue placeholder="Subject" />
            </SelectTrigger>
            <SelectContent className="backdrop-blur-xl bg-white/90 border-muted-foreground/10 rounded-xl">
              <SelectItem value="all">All Subjects</SelectItem>
              {uniqueSubjects.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={gradeFilter} onValueChange={setGradeFilter}>
            <SelectTrigger className="w-[130px] h-10 bg-white/50 border-muted-foreground/10 focus:ring-primary/20 rounded-xl">
              <SelectValue placeholder="Grade" />
            </SelectTrigger>
            <SelectContent className="backdrop-blur-xl bg-white/90 border-muted-foreground/10 rounded-xl">
              <SelectItem value="all">All Grades</SelectItem>
              {uniqueGrades.map(g => <SelectItem key={g} value={g!}>{g}</SelectItem>)}
            </SelectContent>
          </Select>
          <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) resetForm(); }}>
            <DialogTrigger asChild><Button size="sm" className="rounded-xl"><Plus className="h-4 w-4 mr-1" /> Create</Button></DialogTrigger>
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingLessonPlan ? "Edit Lesson Plan" : "New Lesson Plan"}</DialogTitle>
                <DialogDescription>Fill in details below.</DialogDescription>
              </DialogHeader>
              <div className="space-y-3 py-2">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5"><Label>Subject *</Label><Input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Mathematics" /></div>
                  <div className="space-y-1.5"><Label>Chapter *</Label><Input value={chapter} onChange={(e) => setChapter(e.target.value)} placeholder="Algebra" /></div>
                </div>
                <div className="space-y-1.5"><Label>Topic *</Label><Input value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="Linear Equations" /></div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>Grade</Label>
                    <Select value={selectedGrade} onValueChange={setSelectedGrade}>
                      <SelectTrigger><SelectValue placeholder="Grade" /></SelectTrigger>
                      <SelectContent><SelectItem value="all">All Grades</SelectItem>{uniqueGrades.map(g => <SelectItem key={g} value={g!}>{g}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5"><Label>Date *</Label><Input type="date" value={lessonDate} onChange={(e) => setLessonDate(e.target.value)} /></div>
                </div>
                <div className="space-y-1.5"><Label>Notes</Label><Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} placeholder="Key points..." /></div>
                <div className="space-y-1.5">
                  <Label>File (PDF, DOCX)</Label>
                  <Input type="file" accept=".pdf,.doc,.docx" onChange={(e) => { if (e.target.files?.[0]) setFile(e.target.files[0]); }} />
                </div>
                <Button onClick={() => editingLessonPlan ? updateLessonPlanMutation.mutate() : createLessonPlanMutation.mutate()} disabled={!subject || !chapter || !topic || !lessonDate} className="w-full">
                  {editingLessonPlan ? "Update" : "Create"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card className="border-none shadow-strong overflow-hidden rounded-3xl bg-white/40 backdrop-blur-md border border-white/20">
        <CardHeader className="border-b border-muted/20 bg-primary/5 py-6">
          <CardTitle className="text-xl font-black flex items-center gap-3">
            <div className="p-2 rounded-xl bg-primary/10">
              <FileText className="h-6 w-6 text-primary" />
            </div>
            Plan Library
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          {isLoading ? (
            <div className="flex justify-center py-12">
              <div className="h-8 w-8 rounded-full border-4 border-primary/30 border-t-primary animate-spin" />
            </div>
          ) : lessonPlans.length === 0 ? (
            <div className="text-center py-12 space-y-3">
              <div className="mx-auto w-16 h-16 rounded-full bg-muted/20 flex items-center justify-center">
                <FileText className="h-8 w-8 text-muted-foreground/40" />
              </div>
              <p className="text-muted-foreground font-medium">No lesson plans found for selected filters.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {lessonPlans.map((lp) => (
                <div
                  key={lp.id}
                  className="rounded-3xl border border-white/40 bg-white/50 p-6 shadow-medium group relative hover:shadow-strong transition-all duration-300 backdrop-blur-sm"
                >
                  <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full bg-white/80 shadow-soft" onClick={() => handleViewClick(lp)}>
                      <Eye className="h-4 w-4 text-primary" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full bg-white/80 shadow-soft" onClick={() => handleEditClick(lp)}>
                      <Edit className="h-4 w-4 text-primary" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full bg-white/80 shadow-soft hover:bg-destructive/10" onClick={() => deleteLessonPlanMutation.mutate(lp.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex flex-wrap gap-2">
                        <Badge variant="secondary" className="bg-primary/10 text-primary border-none rounded-lg px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider">
                          {lp.subject}
                        </Badge>
                        {lp.grade && (
                          <Badge variant="secondary" className="bg-indigo-500/10 text-indigo-600 border-none rounded-lg px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider">
                            Grade {lp.grade}
                          </Badge>
                        )}
                      </div>
                      <h3 className="font-black text-xl leading-tight text-slate-800">{lp.chapter}</h3>
                      <p className="text-xs font-bold text-muted-foreground uppercase tracking-tighter opacity-70 italic">{lp.topic}</p>
                    </div>

                    <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">{lp.notes || 'Curriculum details pending...'}</p>

                    <div className="flex items-center justify-between pt-2">
                      <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 text-slate-600 font-bold text-xs">
                        <CalendarIcon className="h-3.5 w-3.5" />
                        {format(new Date(lp.lesson_date), "MMM d, yyyy")}
                      </div>

                      {lp.lesson_file_url && (
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-10 w-10 rounded-xl bg-primary/5 border-primary/10 hover:bg-primary hover:text-white transition-all shadow-soft"
                          asChild
                        >
                          <a href={supabase.storage.from("lesson-files").getPublicUrl(lp.lesson_file_url).data.publicUrl} target="_blank" rel="noopener noreferrer">
                            <Download className="h-4 w-4" />
                          </a>
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Lesson Plan Details</DialogTitle>
          </DialogHeader>
          {viewingLessonPlan && (
            <div className="space-y-4 py-2">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-muted-foreground">Subject</Label>
                  <p className="font-semibold">{viewingLessonPlan.subject}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Chapter</Label>
                  <p className="font-semibold">{viewingLessonPlan.chapter}</p>
                </div>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Topic</Label>
                <p className="font-semibold">{viewingLessonPlan.topic}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-muted-foreground">Grade</Label>
                  <p className="font-semibold">{viewingLessonPlan.grade || "All Grades"}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Planned Date</Label>
                  <p className="font-semibold">{format(new Date(viewingLessonPlan.lesson_date), "PPP")}</p>
                </div>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Notes</Label>
                <p className="text-sm whitespace-pre-wrap bg-muted/30 p-3 rounded-lg border">
                  {viewingLessonPlan.notes || "No notes provided."}
                </p>
              </div>
              {viewingLessonPlan.lesson_file_url && (
                <div>
                  <Label className="text-xs text-muted-foreground">Resource</Label>
                  <Button variant="outline" size="sm" className="w-full mt-1" asChild>
                    <a href={supabase.storage.from("lesson-files").getPublicUrl(viewingLessonPlan.lesson_file_url).data.publicUrl} target="_blank" rel="noopener noreferrer">
                      <Download className="h-4 w-4 mr-2" /> Download Attached File
                    </a>
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
