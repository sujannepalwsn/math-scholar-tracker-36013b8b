import React from "react";
import { Palette, Settings as SettingsIcon } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import ThemeSelector from "@/components/ThemeSelector";

export default function GeneralSettings() {
  return (
    <div className="space-y-8 animate-in fade-in duration-1000">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-3xl md:text-4xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-primary to-violet-600">
            System Preferences
          </h1>
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
            <p className="text-muted-foreground text-sm font-medium">Configure your personal workspace and visual parameters.</p>
          </div>
        </div>
      </div>

      <div className="grid gap-8">
        {/* Theme Settings */}
        <Card className="border-none shadow-strong overflow-hidden rounded-3xl bg-white/40 backdrop-blur-md border border-white/20">
          <CardHeader className="border-b border-muted/20 bg-primary/5 py-6">
            <CardTitle className="text-xl font-black flex items-center gap-3 text-slate-800 uppercase tracking-widest">
              <div className="p-2 rounded-xl bg-primary/10">
                <Palette className="h-6 w-6 text-primary" />
              </div>
              Appearance Matrix
            </CardTitle>
            <CardDescription className="font-medium text-slate-500">Customize your interface theme, colors, and density</CardDescription>
          </CardHeader>
          <CardContent className="p-6 md:p-8">
            <ThemeSelector />
          </CardContent>
        </Card>

        {/* Other settings can go here in the future */}
        <Card className="border-none shadow-soft overflow-hidden rounded-3xl bg-slate-50/50 border border-dashed border-slate-200">
          <CardContent className="p-12 flex flex-col items-center justify-center text-center space-y-4">
             <div className="p-4 rounded-2xl bg-white shadow-sm text-slate-300">
               <SettingsIcon className="h-8 w-8" />
             </div>
             <div className="space-y-1">
               <h3 className="font-black text-slate-400 uppercase tracking-widest text-sm">More modules pending</h3>
               <p className="text-xs text-slate-400 font-medium max-w-xs">Additional personal configuration parameters are currently being synthesized.</p>
             </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
