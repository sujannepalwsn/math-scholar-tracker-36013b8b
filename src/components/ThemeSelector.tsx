import React, { useEffect, useState } from "react";
import { Check, Moon, Monitor, Smartphone, Sun } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export interface ThemePreset {
  name: string;
  primary: string;
  secondary: string;
  background: string;
  primaryHsl: string;
  secondaryHsl: string;
  backgroundHsl: string;
}

const themePresets: ThemePreset[] = [
  { name: "Modern Blue", primary: "#2563EB", secondary: "#3B82F6", background: "#F8FAFC", primaryHsl: "217 91% 53%", secondaryHsl: "217 91% 60%", backgroundHsl: "210 40% 98%" },
  { name: "Emerald School", primary: "#059669", secondary: "#10B981", background: "#F0FDF4", primaryHsl: "160 84% 31%", secondaryHsl: "160 67% 40%", backgroundHsl: "138 76% 97%" },
  { name: "Indigo Pro", primary: "#4F46E5", secondary: "#6366F1", background: "#EEF2FF", primaryHsl: "243 75% 59%", secondaryHsl: "243 75% 67%", backgroundHsl: "226 100% 97%" },
  { name: "Dark Academic", primary: "#111827", secondary: "#374151", background: "#F9FAFB", primaryHsl: "222 47% 11%", secondaryHsl: "215 25% 27%", backgroundHsl: "210 20% 98%" },
  { name: "Royal Purple", primary: "#7C3AED", secondary: "#8B5CF6", background: "#F5F3FF", primaryHsl: "263 70% 58%", secondaryHsl: "258 90% 66%", backgroundHsl: "250 100% 98%" },
  { name: "Warm Orange", primary: "#EA580C", secondary: "#FB923C", background: "#FFF7ED", primaryHsl: "21 90% 48%", secondaryHsl: "27 96% 61%", backgroundHsl: "36 100% 96%" },
  { name: "Teal Modern", primary: "#0F766E", secondary: "#14B8A6", background: "#F0FDFA", primaryHsl: "175 84% 26%", secondaryHsl: "173 80% 40%", backgroundHsl: "166 76% 97%" },
  { name: "Navy School", primary: "#1E3A8A", secondary: "#3B82F6", background: "#EFF6FF", primaryHsl: "224 71% 33%", secondaryHsl: "217 91% 60%", backgroundHsl: "214 100% 97%" },
  { name: "Graphite Dark", primary: "#1F2937", secondary: "#4B5563", background: "#111827", primaryHsl: "215 28% 17%", secondaryHsl: "220 13% 33%", backgroundHsl: "222 47% 11%" },
  { name: "Rose Elegant", primary: "#BE185D", secondary: "#F43F5E", background: "#FFF1F2", primaryHsl: "335 78% 42%", secondaryHsl: "350 89% 60%", backgroundHsl: "356 100% 97%" },
];

interface ThemeSelectorProps {
  onThemeChange?: () => void;
}

export default function ThemeSelector({ onThemeChange }: ThemeSelectorProps) {
  const [selectedTheme, setSelectedTheme] = useState<string>(() => {
    return localStorage.getItem("app-theme-name") || "Indigo Pro";
  });
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    return localStorage.getItem("app-dark-mode") === "true";
  });
  const [compactMode, setCompactMode] = useState<boolean>(() => {
    return localStorage.getItem("app-compact-mode") === "true";
  });

  const applyTheme = (preset: ThemePreset, dark: boolean) => {
    const root = document.documentElement;

    if (dark) {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }

    // Apply theme colors as CSS variables
    root.style.setProperty("--primary", preset.primaryHsl);
    root.style.setProperty("--ring", preset.primaryHsl);
    root.style.setProperty("--accent", preset.primaryHsl);
    root.style.setProperty("--accent-foreground", "0 0% 100%");

    if (!dark) {
      root.style.setProperty("--background", preset.backgroundHsl);
      root.style.setProperty("--card", "0 0% 100%");
      root.style.setProperty("--popover", "0 0% 100%");
    }

    // Sidebar
    root.style.setProperty("--sidebar-primary", preset.primaryHsl);
    root.style.setProperty("--sidebar-ring", preset.primaryHsl);
  };

  const handleSelectTheme = (preset: ThemePreset) => {
    setSelectedTheme(preset.name);
    localStorage.setItem("app-theme-name", preset.name);
    localStorage.setItem("app-theme-primary", preset.primaryHsl);
    localStorage.setItem("app-theme-secondary", preset.secondaryHsl);
    localStorage.setItem("app-theme-background", preset.backgroundHsl);
    applyTheme(preset, darkMode);
    onThemeChange?.();
    toast.success(`Theme changed to ${preset.name}`);
  };

  const handleDarkMode = (enabled: boolean) => {
    setDarkMode(enabled);
    localStorage.setItem("app-dark-mode", String(enabled));
    const preset = themePresets.find((p) => p.name === selectedTheme) || themePresets[2];
    applyTheme(preset, enabled);
  };

  const handleCompactMode = (enabled: boolean) => {
    setCompactMode(enabled);
    localStorage.setItem("app-compact-mode", String(enabled));
    if (enabled) {
      document.documentElement.classList.add("compact");
    } else {
      document.documentElement.classList.remove("compact");
    }
  };

  // Apply saved theme on mount
  useEffect(() => {
    const preset = themePresets.find((p) => p.name === selectedTheme) || themePresets[2];
    applyTheme(preset, darkMode);
    if (compactMode) {
      document.documentElement.classList.add("compact");
    }
  }, []);

  return (
    <div className="space-y-8">
      {/* Theme Presets */}
      <div>
        <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground mb-4">Color Theme</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          {themePresets.map((preset) => (
            <button
              key={preset.name}
              onClick={() => handleSelectTheme(preset)}
              className={cn(
                "relative group rounded-xl border-2 p-3 transition-all duration-200 hover:shadow-medium",
                selectedTheme === preset.name
                  ? "border-primary shadow-soft ring-2 ring-primary/20"
                  : "border-border hover:border-primary/40"
              )}
            >
              <div className="flex gap-1.5 mb-2">
                <div className="h-6 w-6 rounded-full border" style={{ backgroundColor: preset.primary }} />
                <div className="h-6 w-6 rounded-full border" style={{ backgroundColor: preset.secondary }} />
                <div className="h-6 w-6 rounded-full border" style={{ backgroundColor: preset.background }} />
              </div>
              <p className="text-xs font-semibold text-left truncate">{preset.name}</p>
              {selectedTheme === preset.name && (
                <div className="absolute top-1.5 right-1.5 h-5 w-5 rounded-full bg-primary flex items-center justify-center">
                  <Check className="h-3 w-3 text-primary-foreground" />
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Toggles */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card className="border shadow-soft">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              {darkMode ? <Moon className="h-5 w-5 text-primary" /> : <Sun className="h-5 w-5 text-primary" />}
              <div>
                <Label className="font-semibold">Dark Mode</Label>
                <p className="text-xs text-muted-foreground">Switch to dark appearance</p>
              </div>
            </div>
            <Switch checked={darkMode} onCheckedChange={handleDarkMode} />
          </CardContent>
        </Card>

        <Card className="border shadow-soft">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Smartphone className="h-5 w-5 text-primary" />
              <div>
                <Label className="font-semibold">Compact Mode</Label>
                <p className="text-xs text-muted-foreground">Tighter spacing for mobile</p>
              </div>
            </div>
            <Switch checked={compactMode} onCheckedChange={handleCompactMode} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Initialize theme from localStorage on app load
export function initializeTheme() {
  const themeName = localStorage.getItem("app-theme-name");
  const primaryHsl = localStorage.getItem("app-theme-primary");
  const backgroundHsl = localStorage.getItem("app-theme-background");
  const darkMode = localStorage.getItem("app-dark-mode") === "true";
  const compactMode = localStorage.getItem("app-compact-mode") === "true";

  const root = document.documentElement;

  if (darkMode) root.classList.add("dark");
  if (compactMode) root.classList.add("compact");

  if (primaryHsl) {
    root.style.setProperty("--primary", primaryHsl);
    root.style.setProperty("--ring", primaryHsl);
    root.style.setProperty("--accent", primaryHsl);
    root.style.setProperty("--sidebar-primary", primaryHsl);
    root.style.setProperty("--sidebar-ring", primaryHsl);
  }
  if (backgroundHsl && !darkMode) {
    root.style.setProperty("--background", backgroundHsl);
  }
}
