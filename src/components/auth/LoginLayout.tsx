import React from "react";
import { Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tables } from "@/integrations/supabase/types";

interface LoginLayoutProps {
  settings: Tables<'login_page_settings'> | null;
  username: string;
  setUsername: (val: string) => void;
  password: string;
  setPassword: (val: string) => void;
  loading: boolean;
  onSubmit: (e: React.FormEvent) => void;
  extraFooter?: React.ReactNode;
}

const LoginLayout: React.FC<LoginLayoutProps> = ({
  settings,
  username,
  setUsername,
  password,
  setPassword,
  loading,
  onSubmit,
  extraFooter
}) => {
  const primaryColor = settings?.primary_color || '#4f46e5';
  const bgColor = settings?.background_color || '#f8fafc';

  return (
    <div
      className="min-h-screen flex items-center justify-center relative overflow-hidden p-4"
      style={{
        backgroundColor: bgColor,
        backgroundImage: settings?.background_url ? `url(${settings.background_url})` : 'none',
        backgroundSize: 'cover',
        backgroundPosition: 'center'
      }}
    >
      {/* Background Decor (only if no background image) */}
      {!settings?.background_url && (
        <div className="absolute top-0 left-0 w-full h-full -z-10">
          <div
            className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] rounded-full blur-[120px] animate-pulse"
            style={{ backgroundColor: `${primaryColor}10` }}
          />
          <div
            className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] rounded-full blur-[120px] animate-pulse"
            style={{ backgroundColor: `${primaryColor}10`, animationDelay: '2s' }}
          />
        </div>
      )}

      <Card className="w-full max-w-md border-none shadow-strong bg-white/70 backdrop-blur-3xl animate-in zoom-in-95 duration-500 rounded-[2.5rem]">
        <CardHeader className="space-y-6 pt-12 pb-8">
          <div className="mx-auto relative">
             <div
               className="absolute -inset-1 rounded-2xl blur opacity-25"
               style={{ backgroundColor: primaryColor }}
             />
             <div className="relative bg-white shadow-soft p-4 rounded-2xl flex items-center justify-center min-w-[64px] min-h-[64px]">
                {settings?.logo_url ? (
                  <img src={settings.logo_url} alt="Logo" className="h-10 w-10 object-contain" />
                ) : (
                  <Shield className="h-8 w-8" style={{ color: primaryColor }} />
                )}
             </div>
          </div>
          <div className="space-y-2">
            <CardTitle className="text-3xl font-black text-center tracking-tight text-slate-900">
              {settings?.title || 'Login'}
            </CardTitle>
            {settings?.subtitle && (
              <p className="text-center text-sm font-medium text-slate-500 max-w-[280px] mx-auto">
                {settings.subtitle}
              </p>
            )}
          </div>
        </CardHeader>
        <CardContent className="pb-12 px-10">
          <form onSubmit={onSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="username" className="text-sm font-bold text-slate-700 ml-1">
                {settings?.username_label || 'Username'}
              </Label>
              <Input
                id="username"
                type="text"
                placeholder={settings?.username_placeholder || 'Enter username'}
                className="h-14 rounded-2xl border-border/40 bg-white/50 px-6 font-medium focus-visible:ring-offset-0 transition-all"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-bold text-slate-700 ml-1">
                {settings?.password_label || 'Password'}
              </Label>
              <Input
                id="password"
                type="password"
                placeholder={settings?.password_placeholder || '••••••••'}
                className="h-14 rounded-2xl border-border/40 bg-white/50 px-6 font-medium focus-visible:ring-offset-0 transition-all"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
              />
            </div>
            <Button
              type="submit"
              className="w-full h-14 text-base font-bold rounded-2xl shadow-strong hover:scale-[1.02] active:scale-[0.98] transition-all"
              style={{ backgroundColor: primaryColor, color: '#fff' }}
              disabled={loading}
            >
              {loading ? (
                <div className="flex items-center gap-3">
                   <div className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                   <span>Authenticating...</span>
                </div>
              ) : (settings?.button_text || 'Sign In')}
            </Button>
            {extraFooter}
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default LoginLayout;
