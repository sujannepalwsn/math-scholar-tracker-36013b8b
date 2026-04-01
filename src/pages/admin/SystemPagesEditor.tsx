import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { FileText, Save, Loader2, Shield, HelpCircle } from "lucide-react";

export default function SystemPagesEditor() {
  const queryClient = useQueryClient();
  const [activeSlug, setActiveSlug] = useState("privacy");

  const { data: pages, isLoading } = useQuery({
    queryKey: ["admin-system-pages"],
    queryFn: async () => {
      const { data, error } = await supabase.from("system_pages").select("*");
      if (error) throw error;
      return data;
    },
  });

  const currentPage = pages?.find(p => p.slug === activeSlug) || {
    slug: activeSlug,
    title: activeSlug === 'privacy' ? 'Privacy Policy' : activeSlug === 'terms' ? 'Terms of Service' : 'Support',
    content: ""
  };

  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");

  // Update local state when page changes or loads
  React.useEffect(() => {
    if (currentPage) {
      setEditTitle(currentPage.title);
      setEditContent(currentPage.content);
    }
  }, [activeSlug, pages]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("system_pages")
        .upsert({
          slug: activeSlug,
          title: editTitle,
          content: editContent,
          updated_at: new Date().toISOString()
        }, { onConflict: 'slug' });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-system-pages"] });
      toast.success(`${editTitle} updated successfully`);
    },
    onError: (error: any) => toast.error(error.message),
  });

  if (isLoading) return <div className="flex justify-center p-20"><Loader2 className="animate-spin" /></div>;

  return (
    <div className="space-y-8 animate-in fade-in duration-1000">
      <div className="space-y-1">
        <h1 className="text-4xl font-black tracking-tight text-foreground uppercase">System Pages Editor</h1>
        <p className="text-muted-foreground font-medium">Manage legal and support content for the public landing page.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <Card className="lg:col-span-1 border-none shadow-soft rounded-[2rem] bg-card/40 backdrop-blur-md h-fit">
          <CardHeader>
            <CardTitle className="text-xs font-black uppercase tracking-widest text-slate-400">Navigation</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {[
              { slug: 'privacy', label: 'Privacy Policy', icon: Shield },
              { slug: 'terms', label: 'Terms of Service', icon: FileText },
              { slug: 'support', label: 'Support Info', icon: HelpCircle },
            ].map((item) => (
              <Button
                key={item.slug}
                variant={activeSlug === item.slug ? "default" : "ghost"}
                onClick={() => setActiveSlug(item.slug)}
                className="w-full justify-start rounded-xl font-bold gap-3"
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Button>
            ))}
          </CardContent>
        </Card>

        <Card className="lg:col-span-3 border-none shadow-strong rounded-[2.5rem] overflow-hidden">
          <CardHeader className="border-b bg-muted/30">
            <CardTitle className="text-2xl font-black tracking-tight">Editing: {editTitle}</CardTitle>
            <CardDescription>Updates are reflected immediately on the public site.</CardDescription>
          </CardHeader>
          <CardContent className="p-8 space-y-6">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Page Title</Label>
              <Input
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                className="h-12 rounded-2xl font-bold text-lg"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Content (Plain Text or Markdown)</Label>
              <Textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className="min-h-[500px] rounded-2xl font-medium leading-relaxed resize-none"
                placeholder="Write your page content here..."
              />
            </div>
            <div className="flex justify-end pt-4">
              <Button
                onClick={() => saveMutation.mutate()}
                disabled={saveMutation.isPending}
                className="h-12 px-10 rounded-2xl font-black uppercase text-xs tracking-widest bg-slate-900 text-white shadow-lg"
              >
                {saveMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                Publish Changes
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
