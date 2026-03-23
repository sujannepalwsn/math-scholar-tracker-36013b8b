import React, { useState } from "react";
import { Loader2, Upload, Scan, X } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { compressImage } from "@/lib/image-utils";

interface LessonPlanOCRProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onExtracted: (data: any) => void;
}

export default function LessonPlanOCR({ open, onOpenChange, onExtracted }: LessonPlanOCRProps) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);

      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(selectedFile);
    }
  };

  const handleProcess = async () => {
    if (!file) {
      toast.error("Please select a lesson plan image");
      return;
    }

    setIsProcessing(true);
    try {
      // 1. Compress image to ensure it's within size limits for the AI
      const compressedBlob = await compressImage(file, 200); // 200KB is plenty for Gemini
      const base64 = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(compressedBlob);
      });

      // 2. Call the AI OCR Edge Function
      const { data, error } = await supabase.functions.invoke("lesson-plan-ocr", {
        body: { image: base64 }
      });

      if (error) throw error;

      // 3. Pass extracted data back
      toast.success("Handwritten data extracted successfully!");
      onExtracted(data);
      handleClose();
    } catch (error: any) {
      console.error("OCR Processing Error:", error);
      toast.error(error.message || "Failed to process image with AI");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClose = () => {
    setFile(null);
    setPreview(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl rounded-3xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-black flex items-center gap-2">
            <Scan className="h-6 w-6 text-primary" />
            AI Lesson Plan Scanner
          </DialogTitle>
          <DialogDescription className="font-medium">
            Upload a photo of your handwritten lesson plan. Our AI will automatically fill out the digital form for you.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {!preview ? (
            <div className="border-2 border-dashed border-muted-foreground/20 rounded-3xl p-12 text-center space-y-4 hover:border-primary/50 transition-colors bg-muted/5">
              <div className="p-4 bg-primary/10 rounded-full w-fit mx-auto">
                <Upload className="h-8 w-8 text-primary" />
              </div>
              <div>
                <p className="text-sm font-bold text-foreground">Click to upload or drag and drop</p>
                <p className="text-xs text-muted-foreground mt-1">PNG, JPG up to 10MB</p>
              </div>
              <Input
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                id="ocr-upload"
                onChange={handleFileChange}
              />
              <Button asChild variant="outline" className="rounded-xl font-bold">
                <label htmlFor="ocr-upload">SELECT PHOTO</label>
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="relative aspect-[3/4] max-h-[400px] mx-auto rounded-2xl overflow-hidden border shadow-soft">
                <img src={preview} alt="Lesson Plan Preview" className="w-full h-full object-contain bg-slate-50" />
                <Button
                  variant="destructive"
                  size="icon"
                  className="absolute top-2 right-2 rounded-full h-8 w-8 shadow-strong"
                  onClick={() => { setFile(null); setPreview(null); }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <Button
                onClick={handleProcess}
                disabled={isProcessing}
                className="w-full h-12 rounded-2xl font-black uppercase tracking-widest bg-gradient-to-r from-primary to-violet-600 shadow-strong hover:scale-[1.02] transition-all"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    ANALYZING HANDWRITING...
                  </>
                ) : (
                  <>
                    <Scan className="mr-2 h-5 w-5" />
                    EXTRACT DATA
                  </>
                )}
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
