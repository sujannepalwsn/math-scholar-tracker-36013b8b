import React, { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { MessageSquare, Mail, Bell, Settings } from "lucide-react";

export default function NotificationSettings({ centerId }: { centerId: string }) {
  const [smsKey, setSmsKey] = useState("");
  const [emailKey, setEmailKey] = useState("");

  const saveSettings = () => {
    toast.success("Notification provider credentials saved");
  };

  return (
    <div className="grid md:grid-cols-2 gap-6">
      <Card className="rounded-[2rem] border-none shadow-strong bg-white/50 backdrop-blur-md h-fit">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-primary" />
            Communication Channels
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 bg-blue-50 rounded-2xl space-y-3">
             <div className="flex items-center gap-2 mb-1">
                <MessageSquare className="h-4 w-4 text-blue-600" />
                <span className="font-bold text-blue-800 text-sm">SMS Gateway (Twilio)</span>
             </div>
             <div className="space-y-1">
                <Label className="text-[10px] font-black uppercase text-blue-400">Account SID</Label>
                <Input type="password" value={smsKey} onChange={(e) => setSmsKey(e.target.value)} className="h-10 rounded-xl" />
             </div>
             <Button size="sm" className="bg-blue-600 text-[10px] font-black uppercase">Test Connection</Button>
          </div>

          <div className="p-4 bg-purple-50 rounded-2xl space-y-3">
             <div className="flex items-center gap-2 mb-1">
                <Mail className="h-4 w-4 text-purple-600" />
                <span className="font-bold text-purple-800 text-sm">Email Service (SendGrid)</span>
             </div>
             <div className="space-y-1">
                <Label className="text-[10px] font-black uppercase text-purple-400">API Key</Label>
                <Input type="password" value={emailKey} onChange={(e) => setEmailKey(e.target.value)} className="h-10 rounded-xl" />
             </div>
             <Button size="sm" className="bg-purple-600 text-[10px] font-black uppercase">Verify Domain</Button>
          </div>

          <Button onClick={saveSettings} className="w-full h-11 rounded-xl font-black uppercase text-xs tracking-widest mt-2">
            Save Provider Data
          </Button>
        </CardContent>
      </Card>

      <Card className="rounded-[2rem] border-none shadow-strong bg-white/50 backdrop-blur-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-primary" />
            Push Notification Protocols
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <p className="text-slate-500 font-medium italic">Mobile push notifications are handled via Firebase Cloud Messaging (FCM) by default for the Nexus App environment.</p>
          <div className="space-y-4 pt-4">
             <div className="flex justify-between items-center py-2 border-b">
                <span className="font-bold">Attendance Alerts</span>
                <div className="h-6 w-11 bg-emerald-500 rounded-full flex items-center px-1"><div className="h-4 w-4 bg-white rounded-full ml-auto" /></div>
             </div>
             <div className="flex justify-between items-center py-2 border-b">
                <span className="font-bold">Fee Reminders</span>
                <div className="h-6 w-11 bg-emerald-500 rounded-full flex items-center px-1"><div className="h-4 w-4 bg-white rounded-full ml-auto" /></div>
             </div>
             <div className="flex justify-between items-center py-2 border-b">
                <span className="font-bold">Exam Results</span>
                <div className="h-6 w-11 bg-slate-200 rounded-full flex items-center px-1"><div className="h-4 w-4 bg-white rounded-full" /></div>
             </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
